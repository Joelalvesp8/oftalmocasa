/**
 * API para Médico Visualizar Sua Própria Produção
 * Retorna apenas as produções do médico logado com filtros de aprovação
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isSessionUser, convertDecimalFields } from '@/lib/types'
import { z } from 'zod'
import { startOfMonth, endOfMonth } from 'date-fns'

const myProductionQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  doctorApprovalStatus: z
    .enum([
      'PENDING_DOCTOR_APPROVAL',
      'APPROVED_BY_DOCTOR',
      'CONTESTED',
      'CONTEST_RESOLVED',
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o cadastro do médico associado ao usuário
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true, name: true },
    })

    if (!doctor) {
      return NextResponse.json(
        { error: 'Cadastro médico não encontrado para este usuário' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)

    const queryValidation = myProductionQuerySchema.safeParse({
      month: searchParams.get('month'),
      year: searchParams.get('year'),
      doctorApprovalStatus: searchParams.get('doctorApprovalStatus'),
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

    const { month, year, doctorApprovalStatus, page, limit } = queryValidation.data
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {
      doctorId: doctor.id, // Apenas produções do médico logado
    }

    if (doctorApprovalStatus) {
      where.doctorApprovalStatus = doctorApprovalStatus
    }

    if (month && year) {
      const startDate = startOfMonth(new Date(year, month - 1))
      const endDate = endOfMonth(startDate)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Buscar produções com paginação
    const [productions, total] = await Promise.all([
      prisma.production.findMany({
        where,
        select: {
          id: true,
          date: true,
          scheduleCode: true,
          scheduleName: true,
          scheduledHours: true,
          workedHours: true,
          scheduledPatients: true,
          attendedPatients: true,
          exceededPatients: true,
          hourlyRate: true,
          baseValue: true,
          exceedValue: true,
          totalValue: true,
          status: true,
          doctorApprovalStatus: true,
          doctorApprovedAt: true,
          contestReason: true,
          contestedAt: true,
          contestResolvedAt: true,
          contestResolution: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ date: 'desc' }, { scheduleCode: 'asc' }],
        take: limit,
        skip,
      }),
      prisma.production.count({ where }),
    ])

    // Converter Decimal para number
    const productionsConverted = productions.map((p) => convertDecimalFields(p))

    // Calcular resumo
    const summary = productionsConverted.reduce(
      (acc, prod) => {
        acc.totalHours += prod.workedHours
        acc.totalPatients += prod.attendedPatients
        acc.totalValue += prod.totalValue
        return acc
      },
      {
        totalHours: 0,
        totalPatients: 0,
        totalValue: 0,
      }
    )

    // Contar por status de aprovação
    const statusCounts = await prisma.production.groupBy({
      by: ['doctorApprovalStatus'],
      where: { doctorId: doctor.id },
      _count: true,
    })

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        name: doctor.name,
      },
      productions: productionsConverted,
      summary,
      statusCounts: statusCounts.map((sc) => ({
        status: sc.doctorApprovalStatus,
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
    console.error('Erro ao buscar produções do médico:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar suas produções' },
      { status: 500 }
    )
  }
}
