/**
 * API de Upload de Nota Fiscal
 * Permite que médico faça upload da NF após aprovar produção
 * Realiza OCR automático e validação cruzada
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isSessionUser } from '@/lib/types'
import { extractInvoiceData, validateCNPJ, validateValue } from '@/lib/ocr'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const productionId = params.id

    // Buscar produção com médico
    const production = await prisma.production.findUnique({
      where: { id: productionId },
      include: {
        doctor: {
          select: {
            id: true,
            userId: true,
            name: true,
            cnpj: true,
          },
        },
        invoice: true, // Verificar se já tem NF
      },
    })

    if (!production) {
      return NextResponse.json(
        { error: 'Produção não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se é o próprio médico
    if (production.doctor.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Você só pode fazer upload de NF para sua própria produção' },
        { status: 403 }
      )
    }

    // Verificar se produção foi aprovada pelo médico
    if (production.doctorApprovalStatus !== 'APPROVED_BY_DOCTOR') {
      return NextResponse.json(
        {
          error: 'Produção precisa ser aprovada antes de fazer upload da Nota Fiscal',
          currentStatus: production.doctorApprovalStatus,
        },
        { status: 400 }
      )
    }

    // Verificar se já tem NF
    if (production.invoice) {
      return NextResponse.json(
        { error: 'Esta produção já possui uma Nota Fiscal cadastrada' },
        { status: 400 }
      )
    }

    // Processar FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      )
    }

    // Validar tipo e tamanho do arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo inválido. Permitido: PDF, JPEG, PNG' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo: 10MB' },
        { status: 400 }
      )
    }

    // Converter para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // TODO: Upload para S3
    // const s3Path = await uploadToS3(buffer, file.name, file.type)
    const s3Path = `invoices/${production.doctor.id}/${Date.now()}_${file.name}`

    // Processar OCR
    let ocrData
    let ocrStatus: 'COMPLETED' | 'FAILED' = 'COMPLETED'
    let ocrErrorMessage: string | null = null

    try {
      ocrData = await extractInvoiceData(buffer, file.type)
    } catch (error) {
      console.error('Erro no OCR:', error)
      ocrStatus = 'FAILED'
      ocrErrorMessage = error instanceof Error ? error.message : 'Erro desconhecido no OCR'
      // Continuar mesmo com falha no OCR - admin pode inserir manualmente
    }

    // Validações cruzadas
    let cnpjMatches: boolean | null = null
    let valueMatches: boolean | null = null
    let validationStatus: 'VALID' | 'CNPJ_MISMATCH' | 'VALUE_MISMATCH' | 'PENDING_VALIDATION' =
      'PENDING_VALIDATION'

    if (ocrData && ocrStatus === 'COMPLETED') {
      // Validar CNPJ
      if (ocrData.cnpj && production.doctor.cnpj) {
        cnpjMatches = validateCNPJ(ocrData.cnpj, production.doctor.cnpj)
      }

      // Validar valor
      if (ocrData.totalValue) {
        valueMatches = validateValue(ocrData.totalValue, production.totalValue)
      }

      // Determinar status de validação
      if (cnpjMatches === false) {
        validationStatus = 'CNPJ_MISMATCH'
      } else if (valueMatches === false) {
        validationStatus = 'VALUE_MISMATCH'
      } else if (cnpjMatches === true && valueMatches === true) {
        validationStatus = 'VALID'
      }
    }

    // Salvar Invoice no banco
    const invoice = await prisma.invoice.create({
      data: {
        productionId: production.id,
        doctorId: production.doctor.id,
        fileName: file.name,
        cloudStoragePath: s3Path,
        fileSize: file.size,
        mimeType: file.type,

        // Dados OCR
        invoiceNumber: ocrData?.invoiceNumber || null,
        issueDate: ocrData?.issueDate || null,
        totalValue: ocrData?.totalValue || null,
        cnpj: ocrData?.cnpj || null,

        ocrStatus,
        ocrProcessedAt: new Date(),
        ocrErrorMessage,

        // Validação
        cnpjMatches,
        valueMatches,
        validationStatus,

        uploadedBy: session.user.id,
      },
      include: {
        production: {
          select: {
            id: true,
            date: true,
            totalValue: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            cnpj: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Nota Fiscal enviada com sucesso!',
      invoice: {
        id: invoice.id,
        fileName: invoice.fileName,
        ocrStatus: invoice.ocrStatus,
        validationStatus: invoice.validationStatus,
        extractedData: ocrData
          ? {
              invoiceNumber: ocrData.invoiceNumber,
              issueDate: ocrData.issueDate,
              totalValue: ocrData.totalValue,
              cnpj: ocrData.cnpj,
              confidence: ocrData.confidence,
            }
          : null,
        validation: {
          cnpjMatches,
          valueMatches,
          status: validationStatus,
        },
      },
      nextSteps:
        validationStatus === 'VALID'
          ? 'Validação OK! Aguarde aprovação do administrativo.'
          : validationStatus === 'CNPJ_MISMATCH'
            ? 'CNPJ da NF não confere com seu cadastro. Verifique os dados.'
            : validationStatus === 'VALUE_MISMATCH'
              ? 'Valor da NF não confere com valor da produção. Verifique os dados.'
              : 'Nota Fiscal em análise. Aguarde processamento.',
    })
  } catch (error) {
    console.error('Erro ao fazer upload de Nota Fiscal:', error)
    return NextResponse.json(
      { error: 'Erro ao processar upload da Nota Fiscal' },
      { status: 500 }
    )
  }
}
