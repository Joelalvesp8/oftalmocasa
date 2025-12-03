import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { status, timestamp } = await request.json()

    const updateData: any = { status }

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
