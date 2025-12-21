/**
 * API de Contestação de Produção pelo Médico
 * Permite que o médico conteste sua própria produção informando o motivo
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { contestProductionSchema } from '@/lib/validations'
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
    const validation = contestProductionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { reason } = validation.data
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
        { error: 'Você só pode contestar sua própria produção' },
        { status: 403 }
      )
    }

    // Verificar se já foi aprovada
    if (production.doctorApprovalStatus === 'APPROVED_BY_DOCTOR') {
      return NextResponse.json(
        { error: 'Não é possível contestar uma produção já aprovada' },
        { status: 400 }
      )
    }

    // Verificar se já foi contestada
    if (production.doctorApprovalStatus === 'CONTESTED') {
      return NextResponse.json(
        { error: 'Esta produção já foi contestada. Aguarde resolução do administrativo.' },
        { status: 400 }
      )
    }

    // Contestar produção
    const updatedProduction = await prisma.production.update({
      where: { id: productionId },
      data: {
        doctorApprovalStatus: 'CONTESTED',
        contestReason: reason,
        contestedAt: new Date(),
        doctorApprovedAt: null, // Remover aprovação se existir
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
      message:
        'Contestação registrada com sucesso! O setor administrativo irá analisar e responder.',
      production: updatedProduction,
    })
  } catch (error) {
    console.error('Erro ao contestar produção:', error)
    return NextResponse.json(
      { error: 'Erro ao contestar produção' },
      { status: 500 }
    )
  }
}
