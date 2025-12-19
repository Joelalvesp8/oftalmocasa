import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isSessionUser } from '@/lib/types'
import { z } from 'zod'

const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    'SCHEDULED',
    'CONFIRMED',
    'WAITING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]),
  timestamp: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateAppointmentStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { status, timestamp } = validation.data

    const updateData: {
      status: typeof status
      arrivedAt?: Date
      attendedAt?: Date
      completedAt?: Date
    } = { status }

    // Atualizar timestamps baseado no status
    if (status === 'WAITING') {
      updateData.arrivedAt = new Date(timestamp)
    } else if (status === 'IN_PROGRESS') {
      updateData.attendedAt = new Date(timestamp)
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date(timestamp)
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        doctor: true
      }
    })

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento' },
      { status: 500 }
    )
  }
}
