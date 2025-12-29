'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, BarChart3, Building2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AccrualView() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Datas padrão: mês atual
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(lastDay.toISOString().split('T')[0])

  useEffect(() => {
    fetchAccrual()
  }, [])

  const fetchAccrual = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/invoices/accrual?startDate=${startDate}&endDate=${endDate}`
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar visão de competência')
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Erro ao carregar visão de competência:', error)
      toast.error('Erro ao carregar visão de competência')
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAccrual()
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
          <CardDescription>Selecione o período para análise de competência</CardDescription>
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
                  Total do Período
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(data.summary.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.summary.totalCount} notas fiscais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Valor Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(data.summary.averageValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  por nota fiscal
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
                  }).format(data.byType.PRODUTO.total)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.byType.PRODUTO.count} notas
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
                  }).format(data.byType.SERVICO.total)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.byType.SERVICO.count} notas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Status de Pagamento</CardTitle>
              <CardDescription>Distribuição das notas por status de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Pago</Badge>
                  </div>
                  <div className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(data.paymentStatus.paid)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500">Pendente</Badge>
                  </div>
                  <div className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(data.paymentStatus.pending)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500">Vencido</Badge>
                  </div>
                  <div className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(data.paymentStatus.overdue)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Por Mês */}
          {data.byMonth.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Mês</CardTitle>
                <CardDescription>Distribuição mensal das despesas por competência</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.byMonth.map((month: any) => (
                    <div key={month.month} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(month.month + '-01').toLocaleDateString('pt-BR', {
                              year: 'numeric',
                              month: 'long'
                            })}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({month.count} notas)
                          </span>
                        </div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(month.totalValue)}
                        </div>
                      </div>
                      <div className="ml-6 text-sm text-muted-foreground">
                        Produtos: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(month.byType.PRODUTO.total)} |
                        Serviços: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(month.byType.SERVICO.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Fornecedores */}
          {data.topSuppliers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Fornecedores</CardTitle>
                <CardDescription>Fornecedores com maior volume no período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topSuppliers.map((supplier: any, index: number) => (
                    <div key={supplier.cnpj} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-xs text-muted-foreground">
                            CNPJ: {supplier.cnpj} | {supplier.count} notas
                          </div>
                        </div>
                      </div>
                      <div className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(supplier.totalValue)}
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
