/**
 * API para Download de Documentos
 * Gera URL assinada para download seguro
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { getFileUrl } from '@/lib/s3';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'ID do documento não fornecido' },
        { status: 400 }
      );
    }

    const document = await prisma.doctorDocument.findUnique({
      where: { id: documentId },
      include: { doctor: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Verifica permissão
    if (user) {
      const isAdmin = ['Diretoria', 'Diretoria Médica', 'Administrador'].includes((user as any).role);
      const isOwnDoctor = document.doctor.userId === (user as any).id;

      if (!isAdmin && !isOwnDoctor) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    // Gerar URL assinada para download
    const downloadUrl = await getFileUrl(document.cloudStoragePath, document.isPublic);

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de download:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar URL de download' },
      { status: 500 }
    );
  }
}
