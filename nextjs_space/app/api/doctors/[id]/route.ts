import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { updateDoctorSchema } from '@/lib/validations'
import { isSessionUser, hasRole, isAdminRole } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isSessionUser(session.user)) {
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
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateDoctorSchema.safeParse(body)

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

    // Verificar se é admin
    const isAdmin = hasRole(session.user) && isAdminRole(session.user.role)

    // Verificar se é o próprio médico
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id: params.id },
    })

    if (!existingDoctor) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 })
    }

    const userId = session.user.id
    const isOwnDoctor = existingDoctor.userId === userId
    
    // Se não é admin nem o próprio médico, nega acesso
    if (!isAdmin && !isOwnDoctor) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    // Campos que APENAS ADMINS podem editar (dados internos)
    const adminOnlyFields = [
      'paymentType',
      'paymentClass',
      'monthlyFixedValue',
      'status',
      'approvedAt',
      'approvedBy',
      'rejectedReason',
      'isActive'
    ]
    
    // Se não é admin, remove campos restritos dos dados
    if (!isAdmin) {
      adminOnlyFields.forEach(field => {
        delete data[field]
      })
    }

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
    if (!session?.user || !isSessionUser(session.user)) {
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
