'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'

// Dynamic imports para componentes pesados (lazy loading)
const AttendanceControl = dynamic(() => import('./_components/attendance-control'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
})

const ProductionDashboard = dynamic(() => import('./_components/production-dashboard'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
  ssr: false, // Não renderizar no servidor (tem gráficos)
})

export default function AmbulatorioPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/')}
          aria-label="Voltar para página inicial"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Módulo Ambulatório</h1>
          <p className="text-sm text-muted-foreground">
            Controle de atendimentos e produção médica
          </p>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md" role="tablist" aria-label="Abas do módulo ambulatório">
          <TabsTrigger value="attendance" aria-label="Aba de controle de atendimento">Atendimento</TabsTrigger>
          <TabsTrigger value="production" aria-label="Aba de relatório de produção">Produção</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <AttendanceControl date={selectedDate} onDateChange={setSelectedDate} />
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <ProductionDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
