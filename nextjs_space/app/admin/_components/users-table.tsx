'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react'
import { EditUserDialog } from './edit-user-dialog'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  sector: string | null
  isActive: boolean
  createdAt: string
}

interface UsersTableProps {
  users: User[]
  roles: Array<{ id: string; name: string; description: string | null; level: number }>
  sectors: Array<{ id: string; name: string; description: string | null }>
}

export function UsersTable({ users, roles, sectors }: UsersTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false) ||
      (user.email?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false) ||
      (user.role?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false)
  )

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? 'Erro ao deletar usuário')
      }

      toast({
        title: 'Usuário deletado com sucesso!',
        description: `${userToDelete.name} foi removido do sistema.`,
      })

      router.refresh()
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error)
      toast({
        title: 'Erro ao deletar usuário',
        description: error?.message ?? 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
          <Input
            placeholder="Buscar usuários por nome, email ou role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Buscar usuários por nome, email ou role"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <caption className="sr-only">
              Lista de usuários do sistema com informações de nome, email, role, setor e status
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Usuário</TableHead>
                <TableHead scope="col">Email</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Setor</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const userInitials = user.name
                    ?.split(' ')
                    ?.map((n) => n?.[0])
                    ?.join('')
                    ?.toUpperCase() ?? 'U'

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image ?? ''} alt={user.name} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.sector ?? '-'}
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <XCircle className="mr-1 h-3 w-3" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Ações para ${user.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEdit(user)}
                              aria-label={`Editar usuário ${user.name}`}
                            >
                              <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(user)}
                              className="text-red-600 focus:text-red-600"
                              aria-label={`Deletar usuário ${user.name}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Exibindo {filteredUsers.length} de {users.length} usuários
        </div>
      </div>

      {/* Edit Dialog */}
      {selectedUser && (
        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
          roles={roles}
          sectors={sectors}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário{' '}
              <strong>{userToDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
