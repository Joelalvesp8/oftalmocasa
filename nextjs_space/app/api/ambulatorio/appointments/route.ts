import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { startOfDay, endOfDay } from 'date-fns'
import { appointmentQuerySchema, createAppointmentSchema } from '@/lib/validations'
import { AppointmentWhereInput, AppointmentStatistics } from '@/lib/types'
import { Prisma, AppointmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Validar query parameters
    const queryValidation = appointmentQuerySchema.safeParse({
      date: searchParams.get('date'),
      doctorId: searchParams.get('doctorId'),
      status: searchParams.get('status'),
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

    const { date: dateStr, doctorId, status, page, limit } = queryValidation.data
    const skip = (page - 1) * limit

    const where: AppointmentWhereInput = {}

    if (dateStr) {
      const date = new Date(dateStr)
      where.date = {
        gte: startOfDay(date),
        lte: endOfDay(date),
      }
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (status) {
      where.status = status as AppointmentStatus
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              councilType: true,
              councilNumber: true,
            },
          },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
        take: limit,
        skip,
      }),
      prisma.appointment.count({ where }),
    ])

    // Calcular estatísticas
    const statistics: AppointmentStatistics = {
      scheduled: appointments.filter((a) => a.status === 'SCHEDULED').length,
      confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
      waiting: appointments.filter((a) => a.status === 'WAITING').length,
      inProgress: appointments.filter((a) => a.status === 'IN_PROGRESS').length,
      completed: appointments.filter((a) => a.status === 'COMPLETED').length,
      noShow: appointments.filter((a) => a.status === 'NO_SHOW').length,
    }

    return NextResponse.json({
      appointments,
      statistics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
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

    const body = await request.json()

    // Validar com Zod
    const validation = createAppointmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verificar se o médico existe e tem a agenda
    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      include: {
        schedules: {
          where: { scheduleCode: data.scheduleCode },
        },
      },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 })
    }

    if (!doctor.schedules || doctor.schedules.length === 0) {
      return NextResponse.json({ error: 'Agenda não encontrada' }, { status: 404 })
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
        status: 'SCHEDULED',
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            councilType: true,
            councilNumber: true,
          },
        },
      },
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    // Tratar erros específicos do Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Médico ou agenda inválidos' },
          { status: 400 }
        )
      }
    }

    console.error('Erro ao criar agendamento:', error)
    return NextResponse.json(
      { error: 'Erro ao criar agendamento' },
      { status: 500 }
    )
  }
}
