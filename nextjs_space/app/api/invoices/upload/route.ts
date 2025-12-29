import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { parseInvoiceXml, isValidInvoiceXml } from '@/lib/invoice-parser'
import { uploadInvoiceXmlSchema } from '@/lib/validations'
import { s3Client } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

/**
 * POST /api/invoices/upload
 * Upload e processamento de XML de Nota Fiscal
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // 2. Parse do body
    const body = await request.json()

    // 3. Validação
    const validation = uploadInvoiceXmlSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { xmlContent, fileName } = validation.data

    // 4. Valida se é um XML válido de nota fiscal
    if (!isValidInvoiceXml(xmlContent)) {
      return NextResponse.json(
        { error: 'O arquivo XML não é uma nota fiscal válida' },
        { status: 400 }
      )
    }

    // 5. Faz o parsing do XML
    let parsedInvoice
    try {
      parsedInvoice = await parseInvoiceXml(xmlContent)
    } catch (error) {
      console.error('Erro ao fazer parse do XML:', error)
      return NextResponse.json(
        { error: 'Erro ao processar o XML da nota fiscal. Verifique se o arquivo está correto.' },
        { status: 400 }
      )
    }

    // 6. Verifica se a nota já existe (pela chave de acesso ou número + fornecedor)
    const existingInvoice = parsedInvoice.accessKey
      ? await prisma.invoice.findUnique({
          where: { accessKey: parsedInvoice.accessKey }
        })
      : await prisma.invoice.findFirst({
          where: {
            number: parsedInvoice.number,
            supplierCnpj: parsedInvoice.supplierCnpj,
          }
        })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Esta nota fiscal já foi cadastrada no sistema' },
        { status: 409 }
      )
    }

    // 7. Upload do XML para S3 (se configurado)
    let xmlPath = null
    if (process.env.AWS_S3_BUCKET_NAME && s3Client) {
      try {
        const timestamp = Date.now()
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
        const s3Key = `invoices/${parsedInvoice.supplierCnpj}/${timestamp}_${sanitizedFileName}`

        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: s3Key,
          Body: Buffer.from(xmlContent, 'utf-8'),
          ContentType: 'application/xml',
        }))

        xmlPath = s3Key
      } catch (error) {
        console.error('Erro ao fazer upload do XML para S3:', error)
        // Continua mesmo se falhar o upload para S3
      }
    }

    // 8. Cria a nota fiscal no banco de dados
    const invoice = await prisma.invoice.create({
      data: {
        // Identificação
        number: parsedInvoice.number,
        series: parsedInvoice.series,
        accessKey: parsedInvoice.accessKey,
        invoiceType: parsedInvoice.invoiceType,

        // Fornecedor
        supplierCnpj: parsedInvoice.supplierCnpj,
        supplierName: parsedInvoice.supplierName,
        supplierIe: parsedInvoice.supplierIe,
        supplierAddress: parsedInvoice.supplierAddress,

        // Datas
        emissionDate: parsedInvoice.emissionDate,
        competenceDate: parsedInvoice.competenceDate,

        // Valores
        subtotal: parsedInvoice.subtotal,
        discountValue: parsedInvoice.discountValue,
        taxValue: parsedInvoice.taxValue,
        freightValue: parsedInvoice.freightValue,
        insuranceValue: parsedInvoice.insuranceValue,
        otherExpenses: parsedInvoice.otherExpenses,
        totalValue: parsedInvoice.totalValue,

        // Status
        status: 'PROCESSED',

        // Armazenamento
        xmlPath,
        xmlFileName: fileName,

        // Usuário
        uploadedBy: session.user.id,

        // Itens
        items: {
          create: parsedInvoice.items.map(item => ({
            code: item.code,
            description: item.description,
            ncm: item.ncm,
            cfop: item.cfop,
            unit: item.unit,
            quantity: item.quantity,
            unitValue: item.unitValue,
            totalValue: item.totalValue,
            discountValue: item.discountValue,
            icmsValue: item.icmsValue,
            ipiValue: item.ipiValue,
            pisValue: item.pisValue,
            cofinsValue: item.cofinsValue,
            issValue: item.issValue,
          }))
        },

        // Pagamentos
        payments: {
          create: parsedInvoice.payments.map(payment => ({
            paymentMethod: payment.paymentMethod,
            installmentNumber: payment.installmentNumber,
            totalInstallments: payment.totalInstallments,
            amount: payment.amount,
            dueDate: payment.dueDate,
            paymentDate: payment.status === 'PAID' ? payment.dueDate : null,
            competenceDate: payment.competenceDate,
            status: payment.status,
          }))
        }
      },
      include: {
        items: true,
        payments: true,
      }
    })

    // 9. Retorna a nota fiscal criada
    return NextResponse.json({
      success: true,
      message: 'Nota fiscal processada com sucesso',
      invoice,
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao processar upload de nota fiscal:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar a nota fiscal' },
      { status: 500 }
    )
  }
}
