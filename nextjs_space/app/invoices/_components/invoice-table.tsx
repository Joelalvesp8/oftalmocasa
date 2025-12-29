'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, FileText, Eye, Loader2 } from 'lucide-react'

interface InvoiceTableProps {
  invoices: any[]
  loading: boolean
  onRefresh: () => void
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  PROCESSED: 'bg-blue-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  CANCELLED: 'bg-gray-500',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSED: 'Processada',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
}

const typeLabels: Record<string, string> = {
  PRODUTO: 'Produto (NF-e)',
  SERVICO: 'Serviço (NFS-e)',
}

export default function InvoiceTable({
  invoices,
  loading,
  onRefresh,
}: InvoiceTableProps) {

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma nota fiscal encontrada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Faça o upload do primeiro arquivo XML para começar
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Data de Emissão</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            // Verifica status de pagamento
            const allPaid = invoice.payments?.every((p: any) => p.status === 'PAID') ?? false
            const anyOverdue = invoice.payments?.some((p: any) => p.status === 'OVERDUE') ?? false
            const hasPayments = invoice.payments && invoice.payments.length > 0

            let paymentBadge = null
            if (hasPayments) {
              if (allPaid) {
                paymentBadge = <Badge className="bg-green-500">Pago</Badge>
              } else if (anyOverdue) {
                paymentBadge = <Badge className="bg-red-500">Vencido</Badge>
              } else {
                paymentBadge = <Badge className="bg-yellow-500">Pendente</Badge>
              }
            }

            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.number}
                  {invoice.series && <span className="text-muted-foreground"> / {invoice.series}</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {typeLabels[invoice.invoiceType] || invoice.invoiceType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{invoice.supplierName}</div>
                    <div className="text-xs text-muted-foreground">
                      CNPJ: {invoice.supplierCnpj}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(invoice.emissionDate).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(invoice.totalValue)}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[invoice.status] || 'bg-gray-500'}>
                    {statusLabels[invoice.status] || invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {paymentBadge}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      {invoice.xmlPath && (
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          Baixar XML
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
