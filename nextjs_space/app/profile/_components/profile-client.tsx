'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { ProfileForm } from './profile-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, MapPin, Shield, CheckCircle, XCircle } from 'lucide-react'

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)

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
    <div className="min-h-screen bg-gray-50">
      <Header
        user={{
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image,
          role: currentUser.role,
          sector: currentUser.sector,
        }}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        <Sidebar
          userRole={currentUser.role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-6 lg:p-8">
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
    </div>
  )
}
