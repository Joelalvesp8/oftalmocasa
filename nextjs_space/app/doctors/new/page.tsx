'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'
import DoctorPersonalForm from './_components/personal-form'
import DoctorBankForm from './_components/bank-form'
import DoctorScheduleForm from './_components/schedule-form'
import DoctorPaymentForm from './_components/payment-form'
import { toast } from 'sonner'

export default function NewDoctorPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('personal')
  const [doctorData, setDoctorData] = useState<any>({
    personal: {},
    bank: {},
    schedules: [],
    payment: {}
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validar dados pessoais
      if (!doctorData.personal?.name || !doctorData.personal?.cpf || !doctorData.personal?.email) {
        toast.error('Preencha todos os campos obrigatórios dos dados pessoais')
        setActiveTab('personal')
        return
      }

      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar')
      }

      toast.success('Médico cadastrado com sucesso!')
      router.push('/doctors')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar médico')
    } finally {
      setSaving(false)
    }
  }

  const updateData = (section: string, data: any) => {
    setDoctorData((prev: any) => ({
      ...prev,
      [section]: data
    }))
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/doctors')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Cadastrar Novo Médico</h1>
        </div>
        
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Cadastro'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">
            1. Dados Pessoais
          </TabsTrigger>
          <TabsTrigger value="bank">
            2. Dados Bancários
          </TabsTrigger>
          <TabsTrigger value="schedule">
            3. Agendas
          </TabsTrigger>
          <TabsTrigger value="payment">
            4. Pagamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <DoctorPersonalForm 
            data={doctorData.personal}
            onChange={(data) => updateData('personal', data)}
          />
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <DoctorBankForm 
            data={doctorData.bank}
            onChange={(data) => updateData('bank', data)}
          />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <DoctorScheduleForm 
            data={doctorData.schedules}
            onChange={(data) => updateData('schedules', data)}
          />
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <DoctorPaymentForm 
            data={doctorData.payment}
            schedules={doctorData.schedules}
            onChange={(data) => updateData('payment', data)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
