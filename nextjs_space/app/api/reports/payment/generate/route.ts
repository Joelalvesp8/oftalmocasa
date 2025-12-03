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

    const { month, year, doctorId } = await request.json()

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Mês e ano são obrigatórios' },
        { status: 400 }
      )
    }

    // Se não especificar médico, gerar para todos
    const doctors = doctorId 
      ? [await prisma.doctor.findUnique({ where: { id: doctorId } })]
      : await prisma.doctor.findMany({ where: { isActive: true } })

    const reports = []

    for (const doctor of doctors) {
      if (!doctor) continue

      const reportData = await ProductionCalculator.generateMonthlyPaymentReport(
        doctor.id,
        month,
        year
      )

      // Salvar no banco
      const saved = await prisma.paymentReport.upsert({
        where: {
          doctorId_month_year: {
            doctorId: doctor.id,
            month,
            year
          }
        },
        update: reportData,
        create: reportData
      })

      reports.push(saved)
    }

    return NextResponse.json({
      success: true,
      reports,
      summary: {
        month,
        year,
        totalReports: reports.length,
        totalValue: reports.reduce((sum, r) => sum + r.grossValue, 0)
      }
    })
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatórios' },
      { status: 500 }
    )
  }
}
