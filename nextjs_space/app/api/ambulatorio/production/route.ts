import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { startOfMonth, endOfMonth } from 'date-fns'
import { productionQuerySchema } from '@/lib/validations'
import { isSessionUser, convertDecimalFields } from '@/lib/types'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const queryValidation = productionQuerySchema.safeParse({
      month: searchParams.get('month'),
      year: searchParams.get('year'),
      doctorId: searchParams.get('doctorId'),
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

    const { month, year, doctorId, page, limit } = queryValidation.data
    const skip = (page - 1) * limit

    const where: Prisma.ProductionWhereInput = {}

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (month && year) {
      const startDate = startOfMonth(new Date(year, month - 1))
      const endDate = endOfMonth(startDate)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    const [productions, total] = await Promise.all([
      prisma.production.findMany({
        where,
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              paymentType: true,
              paymentClass: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { doctorId: 'asc' }],
        take: limit,
        skip,
      }),
      prisma.production.count({ where }),
    ])

    // Converter Decimal para number
    const productionsConverted = productions.map((p) => convertDecimalFields(p))

    // Calcular totais
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

    return NextResponse.json({
      productions: productionsConverted,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar produções:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produções' },
      { status: 500 }
    )
  }
}
