/**
 * API de Resolução de Contestação pelo Admin/Analista
 * Permite que admin analise e resolva contestações de médicos
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { resolveContestSchema } from '@/lib/validations'
import { isSessionUser, hasRole, isAdminRole } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin ou analista
    if (!hasRole(session.user) || !isAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Apenas administradores e analistas podem resolver contestações' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = resolveContestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { resolution, action } = validation.data
    const productionId = params.id

    // Buscar produção
    const production = await prisma.production.findUnique({
      where: { id: productionId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // Verificar se está contestada
    if (production.doctorApprovalStatus !== 'CONTESTED') {
      return NextResponse.json(
        { error: 'Esta produção não está contestada' },
        { status: 400 }
      )
    }

    // Resolver contestação
    let newStatus: 'CONTEST_RESOLVED' | 'PENDING_DOCTOR_APPROVAL' = 'CONTEST_RESOLVED'
    let message = ''

    if (action === 'accept_contest') {
      // Admin acatou a contestação - médico precisa aprovar novamente após correção
      newStatus = 'PENDING_DOCTOR_APPROVAL'
      message =
        'Contestação acatada! A produção foi ajustada conforme solicitado. O médico será notificado para nova aprovação.'
    } else {
      // Admin rejeitou a contestação - contestação resolvida
      newStatus = 'CONTEST_RESOLVED'
      message =
        'Contestação analisada e respondida. O médico será notificado da resolução.'
    }

    const updatedProduction = await prisma.production.update({
      where: { id: productionId },
      data: {
        doctorApprovalStatus: newStatus,
        contestResolution: resolution,
        contestResolvedAt: new Date(),
        contestResolvedBy: session.user.id,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // TODO: Enviar notificação/email para o médico sobre a resolução
    // await sendEmailToDoctor(production.doctor.email, { ... })

    return NextResponse.json({
      success: true,
      message,
      production: updatedProduction,
      nextAction:
        action === 'accept_contest'
          ? 'Médico precisa aprovar novamente'
          : 'Contestação encerrada',
    })
  } catch (error) {
    console.error('Erro ao resolver contestação:', error)
    return NextResponse.json(
      { error: 'Erro ao resolver contestação' },
      { status: 500 }
    )
  }
}
