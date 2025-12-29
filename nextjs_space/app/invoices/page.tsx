'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import UploadInvoiceDialog from './_components/upload-invoice-dialog'
import InvoiceTable from './_components/invoice-table'
import CashFlowView from './_components/cash-flow-view'
import AccrualView from './_components/accrual-view'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/invoices')

      if (!response.ok) {
        throw new Error('Erro ao carregar notas fiscais')
      }

      const data = await response.json()
      setInvoices(data.invoices || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error)
      toast.error('Erro ao carregar notas fiscais')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false)
    fetchInvoices()
    toast.success('Nota fiscal processada com sucesso!')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notas Fiscais</h1>
          <p className="text-muted-foreground">
            Gestão de notas fiscais de produtos e serviços
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Nota Fiscal
        </Button>
      </div>

      {/* Cards de estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(stats.totalValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.PRODUTO}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.SERVICO}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principais */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Listagem</TabsTrigger>
          <TabsTrigger value="cash-flow">Visão de Caixa</TabsTrigger>
          <TabsTrigger value="accrual">Visão de Competência</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Notas Fiscais</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as notas fiscais cadastradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceTable
                invoices={invoices}
                loading={loading}
                onRefresh={fetchInvoices}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <CashFlowView />
        </TabsContent>

        <TabsContent value="accrual" className="space-y-4">
          <AccrualView />
        </TabsContent>
      </Tabs>

      {/* Dialog de upload */}
      <UploadInvoiceDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}
