import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
      include: {
        schedules: true,
        _count: {
          select: {
            appointments: true,
            productions: true,
            paymentReports: true
          }
        }
      }
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ doctor })
  } catch (error) {
    console.error('Erro ao buscar médico:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar médico' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()

    const doctor = await prisma.doctor.update({
      where: { id: params.id },
      data,
      include: {
        schedules: true
      }
    })

    return NextResponse.json({ doctor })
  } catch (error) {
    console.error('Erro ao atualizar médico:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar médico' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Soft delete - apenas desativa
    const doctor = await prisma.doctor.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({ doctor })
  } catch (error) {
    console.error('Erro ao deletar médico:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar médico' },
      { status: 500 }
    )
  }
}
