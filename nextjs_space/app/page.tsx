// Root page - Main home with tools
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { HomeClient } from './_components/home-client'
import { AVAILABLE_TOOLS } from '@/lib/types'
import { isAdmin } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getCurrentUser()

  // Se não estiver logado, redireciona para login
  if (!user) {
    redirect('/login')
  }

  // Filtrar ferramentas baseado na role do usuário
  const userRole = user.role ?? ''
  const hasAdminAccess = isAdmin(userRole)

  const availableTools = AVAILABLE_TOOLS.filter((tool) => {
    if (!tool.requiredRoles || tool.requiredRoles.length === 0) {
      return true
    }
    return tool.requiredRoles.includes(userRole)
  })

  return (
    <HomeClient
      user={{
        name: user.name ?? '',
        email: user.email ?? '',
        image: user.image ?? null,
        role: user.role ?? '',
        sector: user.sector ?? null,
      }}
      tools={availableTools}
      hasAdminAccess={hasAdminAccess}
    />
  )
}
