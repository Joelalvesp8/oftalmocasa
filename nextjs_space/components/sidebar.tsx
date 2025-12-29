// Sidebar navigation component
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Users, User, X, FileText } from 'lucide-react'
import { isAdmin } from '@/lib/rbac'

interface SidebarProps {
  userRole?: string
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  title: string
  href: string
  icon: any
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Início',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Gestão de Usuários',
    href: '/admin',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Notas Fiscais',
    href: '/invoices',
    icon: FileText,
    adminOnly: true,
  },
  {
    title: 'Meu Perfil',
    href: '/profile',
    icon: User,
  },
]

export function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const hasAdminAccess = userRole ? isAdmin(userRole) : false

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || hasAdminAccess
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 border-r bg-white transition-transform duration-300 lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between border-b p-4 lg:hidden">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'hover:bg-gray-100'
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
