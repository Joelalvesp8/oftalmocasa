'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import AttendanceControl from './_components/attendance-control'
import ProductionDashboard from './_components/production-dashboard'

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
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Módulo Ambulatório</h1>
          <p className="text-sm text-muted-foreground">
            Controle de atendimentos e produção médica
          </p>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="attendance">Atendimento</TabsTrigger>
          <TabsTrigger value="production">Produção</TabsTrigger>
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
