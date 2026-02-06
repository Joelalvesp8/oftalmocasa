/**
 * API para Médico Visualizar Suas Notas Fiscais
 * Retorna todas as NFs do médico logado com status de validação
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isSessionUser, convertDecimalFields } from '@/lib/types'
import { z } from 'zod'

const myInvoicesQuerySchema = z.object({
  validationStatus: z
    .enum(['PENDING_VALIDATION', 'VALID', 'CNPJ_MISMATCH', 'VALUE_MISMATCH', 'MANUAL_VALIDATION', 'APPROVED', 'REJECTED'])
    .optional(),
  ocrStatus: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'MANUAL_REVIEW']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar médico
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true, name: true, cnpj: true },
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Cadastro médico não encontrado' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)

    const queryValidation = myInvoicesQuerySchema.safeParse({
      validationStatus: searchParams.get('validationStatus'),
      ocrStatus: searchParams.get('ocrStatus'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos',
          details: queryValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { validationStatus, ocrStatus, page, limit } = queryValidation.data
    const skip = (page - 1) * limit

    // Filtros
    const where: any = {
      doctorId: doctor.id,
    }

    if (validationStatus) {
      where.validationStatus = validationStatus
    }

    if (ocrStatus) {
      where.ocrStatus = ocrStatus
    }

    // Buscar invoices
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          invoiceNumber: true,
          issueDate: true,
          totalValue: true,
          cnpj: true,
          ocrStatus: true,
          ocrProcessedAt: true,
          ocrErrorMessage: true,
          cnpjMatches: true,
          valueMatches: true,
          validationStatus: true,
          validationNotes: true,
          approvedBy: true,
          approvedAt: true,
          rejectedReason: true,
          createdAt: true,
          updatedAt: true,
          production: {
            select: {
              id: true,
              date: true,
              scheduleName: true,
              totalValue: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.invoice.count({ where }),
    ])

    // Converter Decimals
    const invoicesConverted = invoices.map((inv) => convertDecimalFields(inv))

    // Contar por status
    const statusCounts = await prisma.invoice.groupBy({
      by: ['validationStatus'],
      where: { doctorId: doctor.id },
      _count: true,
    })

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        name: doctor.name,
        cnpj: doctor.cnpj,
      },
      invoices: invoicesConverted,
      statusCounts: statusCounts.map((sc) => ({
        status: sc.validationStatus,
        count: sc._count,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar Notas Fiscais:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar suas Notas Fiscais' },
      { status: 500 }
    )
  }
}
