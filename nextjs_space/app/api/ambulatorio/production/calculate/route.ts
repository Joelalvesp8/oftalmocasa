import { NextRequest, NextResponse } from 'next/server'
import { ProductionCalculator } from '@/lib/production-calculator'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { date, doctorId } = await request.json()

    // Se não especificar médico, calcular para todos
    const doctors = doctorId 
      ? [await prisma.doctor.findUnique({ where: { id: doctorId } })]
      : await prisma.doctor.findMany({ where: { isActive: true } })

    const productions = []

    for (const doctor of doctors) {
      if (!doctor) continue

      const dailyProduction = await ProductionCalculator.calculateDailyProduction(
        doctor.id,
        new Date(date)
      )

      // Salvar no banco
      for (const prod of dailyProduction) {
        const saved = await prisma.production.upsert({
          where: {
            doctorId_date_scheduleCode: {
              doctorId: prod.doctorId,
              date: prod.date,
              scheduleCode: prod.scheduleCode
            }
          },
          update: prod,
          create: prod
        })
        productions.push(saved)
      }
    }

    return NextResponse.json({
      success: true,
      productions,
      summary: {
        date,
        totalDoctors: doctors.filter(d => d).length,
        totalProductions: productions.length,
        totalValue: productions.reduce((sum, p) => sum + p.totalValue, 0)
      }
    })
  } catch (error) {
    console.error('Erro ao calcular produção:', error)
    return NextResponse.json(
      { error: 'Erro ao calcular produção' },
      { status: 500 }
    )
  }
}
