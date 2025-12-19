'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { InfoIcon } from 'lucide-react'
import { DoctorPaymentFormData, DoctorScheduleFormData } from '@/lib/types'

interface PaymentFormProps {
  data: DoctorPaymentFormData
  schedules: DoctorScheduleFormData[]
  onChange: (data: DoctorPaymentFormData) => void
}

const PAYMENT_CLASSES = [
  { value: 'CLASS_1', label: 'Classe 1', rate: 125, description: 'R$ 125/hora + excedentes' },
  { value: 'CLASS_2', label: 'Classe 2', rate: 160, description: 'R$ 160/hora + excedentes' },
  { value: 'CLASS_3', label: 'Classe 3', rate: 200, description: 'R$ 200/hora + excedentes' },
  { value: 'CLASS_4', label: 'Classe 4', rate: 500, description: 'R$ 500/mês (fixo)' },
  { value: 'CLASS_5', label: 'Classe 5', rate: 125, description: 'R$ 125/hora (apenas MAPA)' }
]

export default function DoctorPaymentForm({ data, schedules, onChange }: PaymentFormProps) {
  const handleChange = <K extends keyof DoctorPaymentFormData>(
    field: K,
    value: DoctorPaymentFormData[K]
  ) => {
    onChange({ ...data, [field]: value })
  }

  const selectedClass = PAYMENT_CLASSES.find(c => c.value === data.paymentClass)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Classificação de Pagamento</CardTitle>
          <CardDescription>Defina como o médico será remunerado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Classe de Pagamento *</Label>
            <Select
              value={data.paymentClass || 'CLASS_1'}
              onValueChange={(value) => {
                handleChange('paymentClass', value)
                // Atualizar tipo de pagamento baseado na classe
                if (value === 'CLASS_4') {
                  handleChange('paymentType', 'FIXED')
                } else {
                  handleChange('paymentType', 'VARIABLE')
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_CLASSES.map(cls => (
                  <SelectItem key={cls.value} value={cls.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{cls.label}</span>
                      <span className="text-xs text-muted-foreground ml-4">
                        {cls.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">{selectedClass.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedClass.description}
                  </div>
                  
                  {data.paymentClass === 'CLASS_4' && (
                    <div className="mt-4 space-y-2">
                      <Label>Valor Mensal Fixo</Label>
                      <Input
                        type="number"
                        value={data.monthlyFixedValue || 500}
                        onChange={(e) => handleChange('monthlyFixedValue', parseFloat(e.target.value))}
                        placeholder="500.00"
                        step="0.01"
                      />
                    </div>
                  )}

                  {data.paymentClass === 'CLASS_5' && (
                    <div className="mt-2 text-sm text-amber-600">
                      <strong>Atenção:</strong> Médico Classe 5 recebe apenas por atendimentos MAPA.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo das agendas */}
      {schedules && schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo das Agendas Configuradas</CardTitle>
            <CardDescription>
              Validação das agendas com a classificação de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules.map((schedule, index) => {
                const isMapaOnly = data.paymentClass === 'CLASS_5'
                const isValid = !isMapaOnly || schedule.scheduleCode === 'MAPA'
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      !isValid ? 'border-amber-500 bg-amber-50' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium">{schedule.scheduleName}</div>
                      <div className="text-sm text-muted-foreground">
                        R$ {schedule.hourlyRate}/hora
                      </div>
                    </div>
                    {!isValid && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        Não será remunerado
                      </Badge>
                    )}
                    {isValid && data.paymentClass !== 'CLASS_4' && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Ativo
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>

            {data.paymentClass === 'CLASS_5' && !schedules.some(s => s.scheduleCode === 'MAPA') && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>Atenção:</strong> Médico Classe 5 precisa ter pelo menos uma agenda MAPA configurada.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
