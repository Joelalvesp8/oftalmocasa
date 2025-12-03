import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const doctorId = searchParams.get('doctorId')
    const status = searchParams.get('status')

    const where: any = {}

    if (dateStr) {
      const date = new Date(dateStr)
      where.date = {
        gte: startOfDay(date),
        lte: endOfDay(date)
      }
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (status) {
      where.status = status
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            councilType: true,
            councilNumber: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    })

    // Calcular estatísticas
    const statistics = {
      scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
      confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
      waiting: appointments.filter(a => a.status === 'WAITING').length,
      inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      noShow: appointments.filter(a => a.status === 'NO_SHOW').length
    }

    return NextResponse.json({ appointments, statistics })
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()

    // Verificar se o médico existe e tem a agenda
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      include: {
        schedules: {
          where: { scheduleCode: data.scheduleCode }
        }
      }
    })

    if (!doctor || doctor.schedules.length === 0) {
      return NextResponse.json(
        { error: 'Médico ou agenda não encontrado' },
        { status: 404 }
      )
    }

    const appointment = await prisma.appointment.create({
      data: {
        doctorId: data.doctorId,
        scheduleCode: data.scheduleCode,
        date: new Date(data.date),
        time: data.time,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail,
        healthPlan: data.healthPlan,
        status: 'SCHEDULED'
      },
      include: {
        doctor: true
      }
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar agendamento:', error)
    return NextResponse.json(
      { error: 'Erro ao criar agendamento' },
      { status: 500 }
    )
  }
}
