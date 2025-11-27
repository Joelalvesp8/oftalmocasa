'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { UsersTable } from './users-table'
import { CreateUserDialog } from './create-user-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface AdminClientProps {
  currentUser: {
    name: string
    email: string
    image: string | null
    role: string
    sector: string | null
  }
  users: Array<{
    id: string
    name: string
    email: string
    image: string | null
    role: string
    sector: string | null
    isActive: boolean
    createdAt: string
  }>
  roles: Array<{
    id: string
    name: string
    description: string | null
    level: number
  }>
  sectors: Array<{
    id: string
    name: string
    description: string | null
  }>
}

export function AdminClient({
  currentUser,
  users,
  roles,
  sectors,
}: AdminClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={currentUser}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        <Sidebar
          userRole={currentUser.role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestão de Usuários
                </h1>
                <p className="text-gray-600">
                  Gerencie usuários, roles e permissões do sistema
                </p>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Total de Usuários
                </h3>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Usuários Ativos
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter((u) => u.isActive).length}
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Roles Disponíveis
                </h3>
                <p className="text-3xl font-bold text-blue-600">{roles.length}</p>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Setores
                </h3>
                <p className="text-3xl font-bold text-teal-600">{sectors.length}</p>
              </div>
            </div>

            {/* Users Table */}
            <UsersTable users={users} roles={roles} sectors={sectors} />

            {/* Create User Dialog */}
            <CreateUserDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              roles={roles}
              sectors={sectors}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
