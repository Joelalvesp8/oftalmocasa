/**
 * API de Aprovação de Produção pelo Médico
 * Permite que o médico aprove sua própria produção
 * Após aprovação, médico pode subir Nota Fiscal
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { approveProductionSchema } from '@/lib/validations'
import { isSessionUser } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = approveProductionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const productionId = params.id

    // Buscar produção
    const production = await prisma.production.findUnique({
      where: { id: productionId },
      include: {
        doctor: {
          select: {
            id: true,
            userId: true,
            name: true,
          },
        },
      },
    })

    if (!production) {
      return NextResponse.json(
        { error: 'Produção não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se é o próprio médico
    if (production.doctor.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Você só pode aprovar sua própria produção' },
        { status: 403 }
      )
    }

    // Verificar se já foi aprovada ou contestada
    if (production.doctorApprovalStatus === 'APPROVED_BY_DOCTOR') {
      return NextResponse.json(
        { error: 'Esta produção já foi aprovada por você' },
        { status: 400 }
      )
    }

    if (production.doctorApprovalStatus === 'CONTESTED') {
      return NextResponse.json(
        { error: 'Esta produção já foi contestada. Aguarde resolução do administrativo.' },
        { status: 400 }
      )
    }

    // Aprovar produção
    const updatedProduction = await prisma.production.update({
      where: { id: productionId },
      data: {
        doctorApprovalStatus: 'APPROVED_BY_DOCTOR',
        doctorApprovedAt: new Date(),
        contestReason: null, // Limpar qualquer contestação anterior
        contestedAt: null,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Produção aprovada com sucesso! Agora você pode fazer o upload da Nota Fiscal.',
      production: updatedProduction,
    })
  } catch (error) {
    console.error('Erro ao aprovar produção:', error)
    return NextResponse.json(
      { error: 'Erro ao aprovar produção' },
      { status: 500 }
    )
  }
}
