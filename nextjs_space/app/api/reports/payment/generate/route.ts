import { NextRequest, NextResponse } from 'next/server'
import { ProductionCalculator } from '@/lib/production-calculator'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { generatePaymentReportSchema } from '@/lib/validations'
import { isSessionUser, convertDecimalFields } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = generatePaymentReportSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { month, year, doctorId } = validation.data

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

    // Converter Decimal para number
    const reportsConverted = reports.map((r) => convertDecimalFields(r))

    return NextResponse.json({
      success: true,
      reports: reportsConverted,
      summary: {
        month,
        year,
        totalReports: reportsConverted.length,
        totalValue: reportsConverted.reduce((sum, r) => sum + r.grossValue, 0),
      },
    })
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatórios' },
      { status: 500 }
    )
  }
}
