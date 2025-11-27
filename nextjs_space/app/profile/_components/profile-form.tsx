'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'

interface ProfileFormProps {
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
  onSuccess?: (updatedData: Partial<{ name: string; image: string | null }>) => void
}

export function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
    },
  })

  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? 'Erro ao atualizar perfil')
      }

      toast({
        title: 'Perfil atualizado com sucesso!',
        description: 'Suas informações foram salvas.',
      })

      // Reset password fields
      reset({
        name: data.name,
        currentPassword: '',
        newPassword: '',
      })

      // Call success callback
      if (onSuccess) {
        onSuccess({
          name: result.user?.name ?? data.name,
        })
      }

      router.refresh()
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      toast({
        title: 'Erro ao atualizar perfil',
        description: error?.message ?? 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Perfil</CardTitle>
        <CardDescription>
          Atualize suas informações pessoais e senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              {...register('name')}
              disabled={isLoading}
              placeholder="Seu nome completo"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-500">
              O email não pode ser alterado
            </p>
          </div>

          {/* Password Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Alterar Senha</h3>
            <p className="text-sm text-gray-600">
              Deixe em branco se não desejar alterar
            </p>

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                {...register('currentPassword')}
                disabled={isLoading}
                placeholder="Digite sua senha atual"
              />
              {errors.currentPassword && (
                <p className="text-sm text-red-600">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                {...register('newPassword')}
                disabled={isLoading}
                placeholder="Digite a nova senha"
              />
              {errors.newPassword && (
                <p className="text-sm text-red-600">
                  {errors.newPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
