import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

/**
 * GET /api/invoices/accrual
 * Visão de COMPETÊNCIA - mostra despesas por data de competência
 * Esta visão mostra o que deve ser contabilizado no período, independente do pagamento
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // 2. Parse dos query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate e endDate são obrigatórios' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // 3. Buscar notas fiscais por data de competência
    const invoices = await prisma.invoice.findMany({
      where: {
        competenceDate: {
          gte: start,
          lte: end,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        items: true,
        payments: true,
      },
      orderBy: {
        competenceDate: 'asc'
      }
    })

    // 4. Agrupar por mês de competência
    const byMonth: Record<string, {
      month: string
      totalValue: number
      count: number
      invoices: typeof invoices
      byType: {
        PRODUTO: { total: number; count: number }
        SERVICO: { total: number; count: number }
      }
      byStatus: {
        paid: number
        pending: number
        overdue: number
      }
    }> = {}

    invoices.forEach(invoice => {
      // Formato: YYYY-MM
      const monthKey = invoice.competenceDate.toISOString().substring(0, 7)

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          month: monthKey,
          totalValue: 0,
          count: 0,
          invoices: [],
          byType: {
            PRODUTO: { total: 0, count: 0 },
            SERVICO: { total: 0, count: 0 }
          },
          byStatus: {
            paid: 0,
            pending: 0,
            overdue: 0
          }
        }
      }

      byMonth[monthKey].totalValue += invoice.totalValue
      byMonth[monthKey].count += 1
      byMonth[monthKey].invoices.push(invoice)

      // Agrupar por tipo
      if (invoice.invoiceType === 'PRODUTO') {
        byMonth[monthKey].byType.PRODUTO.total += invoice.totalValue
        byMonth[monthKey].byType.PRODUTO.count += 1
      } else {
        byMonth[monthKey].byType.SERVICO.total += invoice.totalValue
        byMonth[monthKey].byType.SERVICO.count += 1
      }

      // Verificar status de pagamento
      const allPaid = invoice.payments.every(p => p.status === 'PAID')
      const anyOverdue = invoice.payments.some(p => p.status === 'OVERDUE')

      if (allPaid) {
        byMonth[monthKey].byStatus.paid += invoice.totalValue
      } else if (anyOverdue) {
        byMonth[monthKey].byStatus.overdue += invoice.totalValue
      } else {
        byMonth[monthKey].byStatus.pending += invoice.totalValue
      }
    })

    // 5. Agrupar por fornecedor
    const bySupplier: Record<string, {
      cnpj: string
      name: string
      totalValue: number
      count: number
      invoices: typeof invoices
    }> = {}

    invoices.forEach(invoice => {
      const key = invoice.supplierCnpj

      if (!bySupplier[key]) {
        bySupplier[key] = {
          cnpj: invoice.supplierCnpj,
          name: invoice.supplierName,
          totalValue: 0,
          count: 0,
          invoices: []
        }
      }

      bySupplier[key].totalValue += invoice.totalValue
      bySupplier[key].count += 1
      bySupplier[key].invoices.push(invoice)
    })

    // 6. Calcular totais gerais
    const totalValue = invoices.reduce((sum, inv) => sum + inv.totalValue, 0)
    const totalByType = {
      PRODUTO: {
        total: invoices.filter(i => i.invoiceType === 'PRODUTO').reduce((sum, i) => sum + i.totalValue, 0),
        count: invoices.filter(i => i.invoiceType === 'PRODUTO').length,
      },
      SERVICO: {
        total: invoices.filter(i => i.invoiceType === 'SERVICO').reduce((sum, i) => sum + i.totalValue, 0),
        count: invoices.filter(i => i.invoiceType === 'SERVICO').length,
      }
    }

    // 7. Status de pagamento geral
    const paymentStatus = {
      paid: invoices.filter(i => i.payments.every(p => p.status === 'PAID')).reduce((sum, i) => sum + i.totalValue, 0),
      pending: invoices.filter(i => i.payments.some(p => p.status === 'PENDING')).reduce((sum, i) => sum + i.totalValue, 0),
      overdue: invoices.filter(i => i.payments.some(p => p.status === 'OVERDUE')).reduce((sum, i) => sum + i.totalValue, 0),
    }

    // 8. Top 10 fornecedores
    const topSuppliers = Object.values(bySupplier)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10)

    return NextResponse.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalValue,
        totalCount: invoices.length,
        averageValue: invoices.length > 0 ? totalValue / invoices.length : 0,
      },
      byMonth: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
      byType: totalByType,
      paymentStatus,
      topSuppliers,
      bySupplier: Object.values(bySupplier).sort((a, b) => b.totalValue - a.totalValue),
      invoices,
    })

  } catch (error) {
    console.error('Erro ao buscar visão de competência:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar visão de competência' },
      { status: 500 }
    )
  }
}
