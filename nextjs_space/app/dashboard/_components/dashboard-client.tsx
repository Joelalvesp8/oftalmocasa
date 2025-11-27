'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { ToolCard } from '@/components/tool-card'
import { Tool } from '@/lib/types'

interface DashboardClientProps {
  user: {
    name: string
    email: string
    image: string | null
    role: string
    sector: string | null
  }
  tools: Tool[]
  hasAdminAccess: boolean
}

export function DashboardClient({
  user,
  tools,
  hasAdminAccess,
}: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar
          userRole={user.role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Welcome Section */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Bem-vindo, {user.name.split(' ')[0] ?? 'Usuário'}!
              </h1>
              <p className="text-gray-600">
                Acesse as ferramentas disponíveis para gerenciar suas atividades
              </p>
            </div>

            {/* Tools Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} />
              ))}
            </div>

            {/* Info Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* User Info */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Seu Perfil
                </h3>
                <p className="text-lg font-semibold text-gray-900">{user.role}</p>
                {user.sector && (
                  <p className="mt-1 text-sm text-gray-600">Setor: {user.sector}</p>
                )}
              </div>

              {/* Access Level */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Nível de Acesso
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {hasAdminAccess ? 'Administrativo' : 'Operacional'}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {tools.length} ferramentas disponíveis
                </p>
              </div>

              {/* System Status */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Status do Sistema
                </h3>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <p className="text-lg font-semibold text-gray-900">Online</p>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Todos os serviços operacionais
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
