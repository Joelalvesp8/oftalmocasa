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
import { Eye, LogOut, User, Settings, ArrowLeft } from 'lucide-react'
import { ProfileForm } from './profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, MapPin, Shield, CheckCircle, XCircle } from 'lucide-react'
import { isAdmin } from '@/lib/rbac'

interface ProfileClientProps {
  user: {
    id: string
    name: string
    email: string
    image: string | null
    role: string
    sector: string | null
    isActive: boolean
    createdAt: string
  }
}

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)

  const hasAdminAccess = isAdmin(currentUser.role)

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

  const handleAdminClick = () => {
    router.push('/admin')
  }

  const handleBackClick = () => {
    router.push('/')
  }

  const userInitials = currentUser.name
    ?.split(' ')
    ?.map((n) => n?.[0])
    ?.join('')
    ?.toUpperCase() ?? 'U'

  const createdDate = new Date(currentUser.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

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

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-600">
                Visualize e edite suas informações pessoais
              </p>
            </div>

            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Detalhes da sua conta no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={currentUser.image ?? ''} alt={currentUser.name} />
                    <AvatarFallback className="bg-blue-100 text-2xl text-blue-600">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                    <p className="text-gray-600">{currentUser.email}</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <Shield className="mr-1 h-3 w-3" />
                        {currentUser.role}
                      </Badge>
                      {currentUser.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-4">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Setor</p>
                      <p className="font-semibold">
                        {currentUser.sector ?? 'Não definido'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-4">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Membro desde
                      </p>
                      <p className="font-semibold">{createdDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Profile Form */}
            <ProfileForm
              user={currentUser}
              onSuccess={(updatedData) => {
                setCurrentUser({ ...currentUser, ...updatedData })
              }}
            />
          </div>
        </main>
      </div>
  )
}