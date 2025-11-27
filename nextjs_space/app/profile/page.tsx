// Profile page
import { getCurrentUser } from '@/lib/session'
import { ProfileClient } from './_components/profile-client'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Buscar dados completos do usuário
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
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
  })

  if (!fullUser) {
    return null
  }

  return (
    <ProfileClient
      user={{
        id: fullUser.id,
        name: fullUser.name ?? '',
        email: fullUser.email,
        image: fullUser.image ?? null,
        role: fullUser.role,
        sector: fullUser.sector ?? null,
        isActive: fullUser.isActive,
        createdAt: fullUser.createdAt.toISOString(),
      }}
    />
  )
}
