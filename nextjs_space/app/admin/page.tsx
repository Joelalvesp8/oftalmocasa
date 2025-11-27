// Admin panel page
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/rbac'
import { AdminClient } from './_components/admin-client'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const userRole = user.role ?? ''
  if (!isAdmin(userRole)) {
    redirect('/dashboard')
  }

  // Buscar todos os usuários
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      sector: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Buscar roles e setores
  const roles = await prisma.role.findMany({
    orderBy: { level: 'asc' },
  })

  const sectors = await prisma.sector.findMany({
    orderBy: { name: 'asc' },
  })

  return (
    <AdminClient
      currentUser={{
        name: user.name ?? '',
        email: user.email ?? '',
        image: user.image ?? null,
        role: user.role ?? '',
        sector: user.sector ?? null,
      }}
      users={users.map((u) => ({
        ...u,
        name: u.name ?? '',
        image: u.image ?? null,
        sector: u.sector ?? null,
        createdAt: u.createdAt.toISOString(),
      }))}
      roles={roles.map((r) => ({
        ...r,
        description: r.description ?? null,
      }))}
      sectors={sectors.map((s) => ({
        ...s,
        description: s.description ?? null,
      }))}
    />
  )
}
