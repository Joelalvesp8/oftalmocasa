/**
 * API de Aprovação de Médicos
 * Apenas administradores podem aprovar/rejeitar cadastros
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verifica se é admin
    const isAdmin = session.user && 'role' in session.user && 
      ['Diretoria', 'Diretoria Médica', 'Administrador'].includes((session.user as any).role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { action, rejectedReason } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "approve" ou "reject"' },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 });
    }

    const userId = session.user && 'id' in session.user ? (session.user as any).id : null;

    // Atualizar status do médico
    const updatedDoctor = await prisma.doctor.update({
      where: { id: params.id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedAt: action === 'approve' ? new Date() : null,
        approvedBy: action === 'approve' ? userId : null,
        rejectedReason: action === 'reject' ? rejectedReason : null,
        isActive: action === 'approve',
      },
    });

    // Se aprovado e tem userId, ativar usuário
    if (action === 'approve' && updatedDoctor.userId) {
      await prisma.user.update({
        where: { id: updatedDoctor.userId },
        data: { isActive: true },
      });
    }

    return NextResponse.json({
      success: true,
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error('Erro ao processar aprovação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar aprovação' },
      { status: 500 }
    );
  }
}
