/**
 * API de Auto-Cadastro Público para Médicos
 * Permite que médicos se cadastrem externamente sem autenticação
 * Apenas dados pessoais e bancários - classificação interna feita por admin
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      // Dados Pessoais
      name,
      birthDate,
      graduationDate,
      councilType,
      councilNumber,
      councilState,
      cpf,
      phone,
      email,
      password, // Senha para criar conta de acesso
      
      // Dados Empresariais
      companyName,
      cnpj,
      taxRegime,
      
      // Dados Bancários
      bankNumber,
      bankName,
      bankAgency,
      bankAccount,
      pixKeyType,
      pixKey,
    } = body;

    // Validações básicas
    if (!name || !cpf || !email || !phone || !councilType || !councilNumber) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Verifica se CPF já existe
    const existingDoctorByCpf = await prisma.doctor.findUnique({
      where: { cpf },
    });

    if (existingDoctorByCpf) {
      return NextResponse.json(
        { error: 'CPF já cadastrado no sistema' },
        { status: 409 }
      );
    }

    // Verifica se email já existe
    const existingDoctorByEmail = await prisma.doctor.findUnique({
      where: { email },
    });

    if (existingDoctorByEmail) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado no sistema' },
        { status: 409 }
      );
    }

    // Verifica se CNPJ já existe (se fornecido)
    if (cnpj) {
      const existingDoctorByCnpj = await prisma.doctor.findUnique({
        where: { cnpj },
      });

      if (existingDoctorByCnpj) {
        return NextResponse.json(
          { error: 'CNPJ já cadastrado no sistema' },
          { status: 409 }
        );
      }
    }

    // Criar conta de usuário se senha fornecida
    let userId = null;
    if (password) {
      // Verifica se email já existe como usuário
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'E-mail já cadastrado como usuário' },
          { status: 409 }
        );
      }

      // Criar usuário
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'Médico', // Role padrão para médicos
          isActive: false, // Inativo até aprovação
        },
      });
      userId = user.id;
    }

    // Criar cadastro de médico com status PENDING
    const doctor = await prisma.doctor.create({
      data: {
        // Dados Pessoais
        name,
        birthDate: birthDate ? new Date(birthDate) : null,
        graduationDate: graduationDate ? new Date(graduationDate) : null,
        councilType,
        councilNumber,
        councilState,
        cpf,
        phone,
        email,
        
        // Dados Empresariais
        companyName,
        cnpj,
        taxRegime,
        
        // Dados Bancários
        bankNumber,
        bankName,
        bankAgency,
        bankAccount,
        pixKeyType,
        pixKey,
        
        // Status inicial: PENDING (aguardando aprovação)
        status: 'PENDING',
        
        // Relacionar com usuário criado
        userId,
        
        // Classificação padrão (será ajustada por admin)
        paymentType: 'VARIABLE',
        paymentClass: 'CLASS_1',
        
        isActive: false, // Inativo até aprovação
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Cadastro realizado com sucesso! Aguarde aprovação da administração.',
        doctorId: doctor.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao registrar médico:', error);
    return NextResponse.json(
      { error: 'Erro ao processar cadastro' },
      { status: 500 }
    );
  }
}
