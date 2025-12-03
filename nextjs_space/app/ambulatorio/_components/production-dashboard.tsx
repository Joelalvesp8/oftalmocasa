'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Calculator, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

export default function ProductionDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [productions, setProductions] = useState<any[]>([])
  const [summary, setSummary] = useState({
    totalHours: 0,
    totalPatients: 0,
    totalValue: 0
  })
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    fetchProductions()
  }, [selectedMonth, selectedYear])

  const fetchProductions = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/ambulatorio/production?month=${selectedMonth}&year=${selectedYear}`
      )
      const data = await response.json()
      setProductions(data.productions || [])
      setSummary(data.summary || { totalHours: 0, totalPatients: 0, totalValue: 0 })
    } catch (error) {
      toast.error('Erro ao carregar produções')
    } finally {
      setLoading(false)
    }
  }

  const calculateProduction = async () => {
    try {
      setCalculating(true)
      
      // Gerar relatórios de pagamento
      const generateResponse = await fetch('/api/reports/payment/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          month: selectedMonth, 
          year: selectedYear 
        })
      })
      
      if (!generateResponse.ok) throw new Error('Erro ao gerar relatórios')
      
      const data = await generateResponse.json()
      toast.success(`${data.summary.totalReports} relatórios gerados com sucesso!`)
      
      // Recarregar dados
      fetchProductions()
    } catch (error) {
      toast.error('Erro ao calcular produção')
    } finally {
      setCalculating(false)
    }
  }

  const exportToExcel = async () => {
    try {
      window.open(
        `/api/reports/payment/export?month=${selectedMonth}&year=${selectedYear}`,
        '_blank'
      )
      toast.success('Exportando relatório...')
    } catch (error) {
      toast.error('Erro ao exportar relatório')
    }
  }

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  // Agrupar produções por médico
  const productionsByDoctor = productions.reduce((acc, prod) => {
    if (!acc[prod.doctorId]) {
      acc[prod.doctorId] = {
        doctor: prod.doctor,
        productions: [],
        totalHours: 0,
        totalPatients: 0,
        totalValue: 0
      }
    }
    acc[prod.doctorId].productions.push(prod)
    acc[prod.doctorId].totalHours += prod.workedHours
    acc[prod.doctorId].totalPatients += prod.attendedPatients
    acc[prod.doctorId].totalValue += prod.totalValue
    return acc
  }, {} as any)

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex gap-2 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mês</label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ano</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={calculateProduction}
                disabled={calculating}
              >
                <Calculator className="mr-2 h-4 w-4" />
                {calculating ? 'Calculando...' : 'Calcular Produção'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={exportToExcel}
                disabled={productions.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {summary.totalValue.toFixed(2).replace('.', ',')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Produções por Médico */}
      <Card>
        <CardHeader>
          <CardTitle>Produção por Médico</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : Object.keys(productionsByDoctor).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma produção encontrada para este período
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead className="text-center">Horas</TableHead>
                  <TableHead className="text-center">Pacientes</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(productionsByDoctor).map((item: any) => (
                  <TableRow key={item.doctor.id}>
                    <TableCell className="font-medium">{item.doctor.name}</TableCell>
                    <TableCell className="text-center">{item.totalHours.toFixed(1)}h</TableCell>
                    <TableCell className="text-center">{item.totalPatients}</TableCell>
                    <TableCell className="text-right font-bold">
                      R$ {item.totalValue.toFixed(2).replace('.', ',')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
