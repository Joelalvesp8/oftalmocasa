import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const doctorId = searchParams.get('doctorId')

    const where: any = {}

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (month && year) {
      const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1))
      const endDate = endOfMonth(startDate)
      where.date = {
        gte: startDate,
        lte: endDate
      }
    }

    const productions = await prisma.production.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            paymentType: true,
            paymentClass: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { doctorId: 'asc' }
      ]
    })

    // Calcular totais
    const summary = productions.reduce((acc, prod) => {
      acc.totalHours += prod.workedHours
      acc.totalPatients += prod.attendedPatients
      acc.totalValue += prod.totalValue
      return acc
    }, {
      totalHours: 0,
      totalPatients: 0,
      totalValue: 0
    })

    return NextResponse.json({ productions, summary })
  } catch (error) {
    console.error('Erro ao buscar produções:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produções' },
      { status: 500 }
    )
  }
}
