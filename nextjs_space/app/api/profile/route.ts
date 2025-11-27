// Profile update API route
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { updateProfileSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { name, currentPassword, newPassword } = validation.data
    const userId = (session.user as any).id

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (name) {
      updateData.name = name
    }

    // Se está tentando alterar a senha
    if (newPassword && currentPassword) {
      if (!user.password) {
        return NextResponse.json(
          { error: 'Usuário autenticado via SSO não pode alterar senha' },
          { status: 400 }
        )
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Senha atual incorreta' },
          { status: 400 }
        )
      }

      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        sector: true,
      },
    })

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}
