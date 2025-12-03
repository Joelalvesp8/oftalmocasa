'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Clock, 
  CheckCircle, 
  User,
  Calendar as CalendarIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface AttendanceControlProps {
  date: Date
  onDateChange: (date: Date) => void
}

export default function AttendanceControl({ date, onDateChange }: AttendanceControlProps) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [statistics, setStatistics] = useState({
    scheduled: 0,
    waiting: 0,
    inProgress: 0,
    completed: 0,
    noShow: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [date])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/ambulatorio/appointments?date=${date.toISOString()}`
      )
      const data = await response.json()
      setAppointments(data.appointments || [])
      setStatistics(data.statistics || {
        scheduled: 0,
        waiting: 0,
        inProgress: 0,
        completed: 0,
        noShow: 0
      })
    } catch (error) {
      toast.error('Erro ao carregar atendimentos')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const response = await fetch(`/api/ambulatorio/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        fetchAppointments()
        toast.success('Status atualizado!')
      }
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-gray-500',
      CONFIRMED: 'bg-blue-500',
      WAITING: 'bg-yellow-500',
      IN_PROGRESS: 'bg-green-500',
      COMPLETED: 'bg-green-700',
      CANCELLED: 'bg-red-500',
      NO_SHOW: 'bg-red-700'
    }
    return colors[status] || 'bg-gray-400'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      SCHEDULED: 'Agendado',
      CONFIRMED: 'Confirmado',
      WAITING: 'Aguardando',
      IN_PROGRESS: 'Em Atendimento',
      COMPLETED: 'Finalizado',
      CANCELLED: 'Cancelado',
      NO_SHOW: 'Faltou'
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      {/* Controle de Data */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && onDateChange(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={fetchAppointments}>
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Aguardando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.waiting}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">
              Em Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">
              Finalizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">
              Faltosos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.noShow}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Atendimentos */}
      <Card>
        <CardHeader>
          <CardTitle>Atendimentos do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum atendimento para esta data
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment: any) => (
                <div 
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded ${getStatusColor(appointment.status)}`} />
                    
                    <div>
                      <div className="font-medium">{appointment.patientName}</div>
                      <div className="text-sm text-gray-500">
                        {appointment.time} - Dr(a). {appointment.doctor?.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {appointment.scheduleCode} | {appointment.healthPlan || 'Particular'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {appointment.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAppointmentStatus(appointment.id, 'WAITING')}
                      >
                        <User className="mr-1 h-3 w-3" />
                        Chegou
                      </Button>
                    )}

                    {appointment.status === 'WAITING' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateAppointmentStatus(appointment.id, 'IN_PROGRESS')}
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        Atender
                      </Button>
                    )}

                    {appointment.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateAppointmentStatus(appointment.id, 'COMPLETED')}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Finalizar
                      </Button>
                    )}

                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
