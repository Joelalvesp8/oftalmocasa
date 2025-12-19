/**
 * API de Aprovação de Médicos
 * Apenas administradores podem aprovar/rejeitar cadastros
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { approveDoctorSchema } from '@/lib/validations';
import { isSessionUser, hasRole, isAdminRole } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verifica se é admin
    if (!hasRole(session.user) || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const validation = approveDoctorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { action, rejectedReason } = validation.data;

    const doctor = await prisma.doctor.findUnique({
      where: { id: params.id },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 });
    }

    const userId = session.user.id;

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
