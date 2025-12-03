'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ScheduleFormProps {
  data: any[]
  onChange: (data: any[]) => void
}

const SCHEDULE_TYPES = [
  { code: 'GERAL', name: 'Geral', patientsPerHour: 4 },
  { code: 'ESPECIALISTA', name: 'Especialista', patientsPerHour: 3 },
  { code: 'MAPA', name: 'Mapa', patientsPerHour: 6 }
]

const SECTORS = [
  { value: 'AMBULATORIO', label: 'Ambulatório' },
  { value: 'EMERGENCIA', label: 'Emergência' },
  { value: 'CENTRO_CIRURGICO', label: 'Centro Cirúrgico' }
]

const WEEKDAYS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' }
]

export default function DoctorScheduleForm({ data, onChange }: ScheduleFormProps) {
  const [newSchedule, setNewSchedule] = useState<any>({
    scheduleCode: '',
    scheduleName: '',
    sector: '',
    patientsPerHour: 4,
    hourlyRate: 0,
    exceedBonus: 40,
    weekDays: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '12:00'
  })

  const handleAddSchedule = () => {
    if (!newSchedule.scheduleCode || !newSchedule.sector || newSchedule.hourlyRate <= 0) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Verificar se já existe uma agenda com o mesmo código
    if (data.some(s => s.scheduleCode === newSchedule.scheduleCode)) {
      toast.error('Já existe uma agenda com este código')
      return
    }

    onChange([...data, { ...newSchedule }])
    
    // Reset form
    setNewSchedule({
      scheduleCode: '',
      scheduleName: '',
      sector: '',
      patientsPerHour: 4,
      hourlyRate: 0,
      exceedBonus: 40,
      weekDays: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '12:00'
    })
    
    toast.success('Agenda adicionada')
  }

  const handleRemoveSchedule = (index: number) => {
    onChange(data.filter((_, i) => i !== index))
    toast.success('Agenda removida')
  }

  const toggleWeekday = (day: number) => {
    const weekDays = [...newSchedule.weekDays]
    const index = weekDays.indexOf(day)
    if (index > -1) {
      weekDays.splice(index, 1)
    } else {
      weekDays.push(day)
    }
    setNewSchedule({ ...newSchedule, weekDays: weekDays.sort() })
  }

  const handleScheduleTypeChange = (code: string) => {
    const type = SCHEDULE_TYPES.find(t => t.code === code)
    if (type) {
      setNewSchedule({
        ...newSchedule,
        scheduleCode: type.code,
        scheduleName: type.name,
        patientsPerHour: type.patientsPerHour,
        exceedBonus: type.code === 'MAPA' ? 0 : 40
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Lista de agendas cadastradas */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agendas Cadastradas ({data.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{schedule.scheduleName} ({schedule.scheduleCode})</div>
                    <div className="text-sm text-muted-foreground">
                      {SECTORS.find(s => s.value === schedule.sector)?.label} • 
                      {schedule.patientsPerHour} pac/hora • 
                      R$ {schedule.hourlyRate}/hora • 
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSchedule(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de nova agenda */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Agenda</CardTitle>
          <CardDescription>Configure os horários e valores de atendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Agenda *</Label>
              <Select
                value={newSchedule.scheduleCode}
                onValueChange={handleScheduleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TYPES.map(type => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.name} ({type.patientsPerHour} pac/h)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Setor *</Label>
              <Select
                value={newSchedule.sector}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, sector: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map(sector => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor Hora *</Label>
              <Input
                type="number"
                value={newSchedule.hourlyRate}
                onChange={(e) => setNewSchedule({ ...newSchedule, hourlyRate: parseFloat(e.target.value) || 0 })}
                placeholder="125.00"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário Início</Label>
              <Input
                type="time"
                value={newSchedule.startTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Horário Fim</Label>
              <Input
                type="time"
                value={newSchedule.endTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dias da Semana</Label>
            <div className="flex gap-2">
              {WEEKDAYS.map(day => (
                <Button
                  key={day.value}
                  type="button"
                  variant={newSchedule.weekDays.includes(day.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleWeekday(day.value)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleAddSchedule} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Agenda
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
