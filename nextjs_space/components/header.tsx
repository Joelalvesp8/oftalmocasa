// Main header component
'use client'

import { useState } from 'react'
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
import { Eye, LogOut, User, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    sector?: string | null
  }
  onMenuToggle?: () => void
}

export function Header({ user, onMenuToggle }: HeaderProps) {
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

  const userInitials = user?.name
    ?.split(' ')
    ?.map((n) => n?.[0])
    ?.join('')
    ?.toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo e Menu Mobile */}
        <div className="flex items-center gap-4">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMenuToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              <span className="text-blue-600">Oftalmo</span>casa
            </h1>
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden flex-col items-end md:flex">
              <p className="text-sm font-medium">{user.name ?? 'Usuário'}</p>
              <p className="text-xs text-gray-500">{user.role ?? ''}</p>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
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
  )
}
