'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Eye, LogOut, User, ArrowLeft } from 'lucide-react'
import { UsersTable } from './users-table'
import { CreateUserDialog } from './create-user-dialog'
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
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      await signOut({ callbackUrl: '/login' })
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileClick = () => {
    router.push('/profile')
  }

  const handleBackClick = () => {
    router.push('/')
  }

  const userInitials = currentUser?.name
    ?.split(' ')
    ?.map((n) => n?.[0])
    ?.join('')
    ?.toUpperCase() ?? 'U'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header Simplificado */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo e Botão Voltar - Esquerda */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div className="flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                <span className="text-blue-600">Sistema</span> Oftalmocasa
              </h1>
            </div>
          </div>

          {/* Perfil - Direita */}
          <div className="flex items-center gap-3">
            {/* Dropdown de Perfil */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full"
                  aria-label="Menu do usuário"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser?.image ?? ''} alt={currentUser?.name ?? ''} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{currentUser?.name ?? 'Usuário'}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email ?? ''}</p>
                    {currentUser?.role && (
                      <p className="text-xs font-medium text-blue-600">{currentUser.role}</p>
                    )}
                    {currentUser?.sector && (
                      <p className="text-xs text-gray-500">Setor: {currentUser.sector}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBackClick}>
                  <User className="mr-2 h-4 w-4" />
                  Início
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoading ? 'Saindo...' : 'Sair'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-7xl px-4 py-8">
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
  )
}