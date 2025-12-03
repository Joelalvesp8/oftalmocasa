/**
 * API de Gerenciamento de Documentos Médicos
 * Upload, listagem e exclusão de documentos
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { uploadFile, deleteFile } from '@/lib/s3';

/**
 * GET - Listar documentos de um médico
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json(
        { error: 'ID do médico não fornecido' },
        { status: 400 }
      );
    }

    // Verifica permissão: admin ou o próprio médico
    if (user) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: 'Médico não encontrado' },
          { status: 404 }
        );
      }

      const isAdmin = ['Diretoria', 'Diretoria Médica', 'Administrador'].includes((user as any).role);
      const isOwnDoctor = doctor.userId === (user as any).id;

      if (!isAdmin && !isOwnDoctor) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    const documents = await prisma.doctorDocument.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar documentos' },
      { status: 500 }
    );
  }
}

/**
 * POST - Upload de novo documento
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const doctorId = formData.get('doctorId') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string | null;

    if (!file || !doctorId || !type) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Verifica permissão: admin ou o próprio médico
    if (user) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: 'Médico não encontrado' },
          { status: 404 }
        );
      }

      const isAdmin = ['Diretoria', 'Diretoria Médica', 'Administrador'].includes((user as any).role);
      const isOwnDoctor = doctor.userId === (user as any).id;

      if (!isAdmin && !isOwnDoctor) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    // Converter arquivo para buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload para S3 (documentos médicos são privados)
    const cloudStoragePath = await uploadFile(buffer, file.name, false);

    // Salvar informações no banco
    const document = await prisma.doctorDocument.create({
      data: {
        doctorId,
        name: file.name,
        description,
        type,
        cloudStoragePath,
        isPublic: false,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: user && 'id' in user ? (user as any).id : null,
      },
    });

    return NextResponse.json(
      { success: true, document },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao fazer upload de documento:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload de documento' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Excluir documento
 */
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

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
    const isAdmin = ['Diretoria', 'Diretoria Médica', 'Administrador'].includes((user as any).role);
    const isOwnDoctor = document.doctor.userId === (user as any).id;

    if (!isAdmin && !isOwnDoctor) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Deletar do S3
    await deleteFile(document.cloudStoragePath);

    // Deletar do banco
    await prisma.doctorDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar documento' },
      { status: 500 }
    );
  }
}
