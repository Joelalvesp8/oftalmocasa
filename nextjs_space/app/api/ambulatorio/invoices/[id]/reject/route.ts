/**
 * API de Rejeição de Nota Fiscal pelo Admin
 * Permite que admin rejeite NF informando o motivo
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { rejectInvoiceSchema } from '@/lib/validations'
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

    // Verificar se é admin
    if (!hasRole(session.user) || !isAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Apenas administradores podem rejeitar Notas Fiscais' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = rejectInvoiceSchema.safeParse(body)

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
    const invoiceId = params.id

    // Buscar invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
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

    if (!invoice) {
      return NextResponse.json(
        { error: 'Nota Fiscal não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já foi aprovada ou rejeitada
    if (invoice.validationStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Não é possível rejeitar uma Nota Fiscal já aprovada' },
        { status: 400 }
      )
    }

    if (invoice.validationStatus === 'REJECTED') {
      return NextResponse.json(
        { error: 'Esta Nota Fiscal já foi rejeitada' },
        { status: 400 }
      )
    }

    // Rejeitar NF
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        validationStatus: 'REJECTED',
        rejectedReason: reason,
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

    // TODO: Enviar notificação/email para o médico
    // await sendEmailToDoctor(invoice.doctor.email, { reason, ... })

    return NextResponse.json({
      success: true,
      message: 'Nota Fiscal rejeitada. O médico será notificado para enviar uma nova NF.',
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error('Erro ao rejeitar Nota Fiscal:', error)
    return NextResponse.json(
      { error: 'Erro ao rejeitar Nota Fiscal' },
      { status: 500 }
    )
  }
}
