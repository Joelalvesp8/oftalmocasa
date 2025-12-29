'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CashFlowView() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Datas padrão: mês atual
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(lastDay.toISOString().split('T')[0])

  useEffect(() => {
    fetchCashFlow()
  }, [])

  const fetchCashFlow = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/invoices/cash-flow?startDate=${startDate}&endDate=${endDate}`
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar visão de caixa')
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Erro ao carregar visão de caixa:', error)
      toast.error('Erro ao carregar visão de caixa')
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCashFlow()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o período para análise de caixa</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFilter} className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Calendar className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {data && (
        <>
          {/* Resumo */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pago
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(data.summary.totalPaid)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.summary.totalCount} pagamentos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pendente
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(data.summary.totalPending)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.summary.pendingCount} pendentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(data.byInvoiceType.PRODUTO.total)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.byInvoiceType.PRODUTO.count} notas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(data.byInvoiceType.SERVICO.total)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.byInvoiceType.SERVICO.count} notas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Por Forma de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Por Forma de Pagamento</CardTitle>
              <CardDescription>Distribuição dos pagamentos por método</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.byMethod.map((method: any) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{method.method}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {method.count} pagamentos
                      </span>
                    </div>
                    <div className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(method.total)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Por Dia */}
          {data.byDay.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos por Dia</CardTitle>
                <CardDescription>Distribuição diária dos pagamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.byDay.map((day: any) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(day.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({day.count} pagamentos)
                        </span>
                      </div>
                      <div className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(day.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
