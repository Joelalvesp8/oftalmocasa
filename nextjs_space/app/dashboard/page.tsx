// Dashboard page
import { getCurrentUser } from '@/lib/session'
import { DashboardClient } from './_components/dashboard-client'
import { AVAILABLE_TOOLS } from '@/lib/types'
import { isAdmin } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
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
    <DashboardClient
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
