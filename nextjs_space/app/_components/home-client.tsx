'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Eye, LogOut, User, Settings } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { ToolCard } from '@/components/tool-card'
import { Tool } from '@/lib/types'

interface HomeClientProps {
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

export function HomeClient({ user, tools, hasAdminAccess }: HomeClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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

  const handleAdminClick = () => {
    router.push('/admin')
  }

  const userInitials = user?.name
    ?.split(' ')
    ?.map((n) => n?.[0])
    ?.join('')
    ?.toUpperCase() ?? 'U'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header Simplificado */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo - Esquerda */}
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              <span className="text-blue-600">Sistema</span> Oftalmocasa
            </h1>
          </div>

          {/* Perfil e Admin - Direita */}
          <div className="flex items-center gap-3">
            {/* Botão Painel Admin - Apenas para Admins */}
            {hasAdminAccess && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdminClick}
                className="hidden items-center gap-2 md:flex"
              >
                <Settings className="h-4 w-4" />
                Painel Admin
              </Button>
            )}

            {/* Dropdown de Perfil */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full"
                  aria-label="Menu do usuário"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.image ?? ''} alt={user?.name ?? ''} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name ?? 'Usuário'}</p>
                    <p className="text-xs text-gray-500">{user?.email ?? ''}</p>
                    {user?.role && (
                      <p className="text-xs font-medium text-blue-600">{user.role}</p>
                    )}
                    {user?.sector && (
                      <p className="text-xs text-gray-500">Setor: {user.sector}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                {hasAdminAccess && (
                  <DropdownMenuItem onClick={handleAdminClick} className="md:hidden">
                    <Settings className="mr-2 h-4 w-4" />
                    Painel Admin
                  </DropdownMenuItem>
                )}
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

      {/* Main Content - Cards das Ferramentas */}
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">
              Bem-vindo, {user.name.split(' ')[0] ?? 'Usuário'}!
            </h2>
            <p className="text-gray-600">
              Escolha uma ferramenta para começar
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
