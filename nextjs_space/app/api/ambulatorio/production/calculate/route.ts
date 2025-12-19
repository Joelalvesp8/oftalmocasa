import { NextRequest, NextResponse } from 'next/server'
import { ProductionCalculator } from '@/lib/production-calculator'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isSessionUser } from '@/lib/types'
import { z } from 'zod'

const calculateProductionDailySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data inválida',
  }),
  doctorId: z.string().uuid('ID do médico inválido').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = calculateProductionDailySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { date, doctorId } = validation.data

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
