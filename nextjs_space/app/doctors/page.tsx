'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  CheckCircle, 
  XCircle, 
  FileText,
  Clock,
  UserCheck,
  UserX
} from 'lucide-react'
import { toast } from 'sonner'

export default function DoctorsPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors')
      const data = await response.json()
      setDoctors(data.doctors || [])
    } catch (error) {
      toast.error('Erro ao carregar médicos')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (doctorId: string) => {
    setProcessingId(doctorId)
    try {
      const response = await fetch(`/api/doctors/${doctorId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aprovar médico')
      }

      toast.success('Médico aprovado com sucesso!')
      fetchDoctors()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (doctorId: string) => {
    const reason = prompt('Motivo da rejeição:')
    if (!reason) return

    setProcessingId(doctorId)
    try {
      const response = await fetch(`/api/doctors/${doctorId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectedReason: reason }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao rejeitar médico')
      }

      toast.success('Médico rejeitado')
      fetchDoctors()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcessingId(null)
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(search.toLowerCase()) ||
    doctor.email.toLowerCase().includes(search.toLowerCase()) ||
    doctor.cpf.includes(search)
  )

  const pendingDoctors = filteredDoctors.filter(d => d.status === 'PENDING')
  const approvedDoctors = filteredDoctors.filter(d => d.status === 'APPROVED')
  const rejectedDoctors = filteredDoctors.filter(d => d.status === 'REJECTED')

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gestão de Médicos</h1>
            <p className="text-sm text-muted-foreground">
              Cadastro e gerenciamento de médicos
            </p>
          </div>
        </div>
        
        <Button onClick={() => router.push('/doctors/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Médico
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Doctors Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="pending">
            <Clock className="mr-2 h-4 w-4" />
            Pendentes ({pendingDoctors.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            <UserCheck className="mr-2 h-4 w-4" />
            Aprovados ({approvedDoctors.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <UserX className="mr-2 h-4 w-4" />
            Rejeitados ({rejectedDoctors.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Médicos Aguardando Aprovação</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : pendingDoctors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum médico pendente
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Conselho</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDoctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">{doctor.name}</TableCell>
                        <TableCell>
                          {doctor.councilType} {doctor.councilNumber}
                        </TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>{doctor.phone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/doctors/${doctor.id}`)}
                              title="Ver documentos e detalhes"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(doctor.id)}
                              disabled={processingId === doctor.id}
                              title="Aprovar cadastro"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(doctor.id)}
                              disabled={processingId === doctor.id}
                              title="Rejeitar cadastro"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Médicos Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : approvedDoctors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum médico aprovado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Conselho</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Classificação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedDoctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">{doctor.name}</TableCell>
                        <TableCell>
                          {doctor.councilType} {doctor.councilNumber}
                        </TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>{doctor.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {doctor.paymentClass.replace('CLASS_', 'Classe ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={doctor.isActive ? 'default' : 'secondary'} className={doctor.isActive ? 'bg-green-600' : ''}>
                            {doctor.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/doctors/${doctor.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Médicos Rejeitados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : rejectedDoctors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum médico rejeitado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Conselho</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedDoctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">{doctor.name}</TableCell>
                        <TableCell>
                          {doctor.councilType} {doctor.councilNumber}
                        </TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doctor.rejectedReason || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/doctors/${doctor.id}`)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(doctor.id)}
                              disabled={processingId === doctor.id}
                              title="Aprovar cadastro"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
