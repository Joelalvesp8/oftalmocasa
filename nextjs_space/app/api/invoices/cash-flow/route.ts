import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

/**
 * GET /api/invoices/cash-flow
 * Visão de CAIXA - mostra pagamentos por data de pagamento efetivo
 * Esta visão mostra o que realmente entrou ou saiu do caixa
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

    // 3. Buscar pagamentos que foram efetivamente pagos no período (CAIXA)
    const payments = await prisma.invoicePayment.findMany({
      where: {
        paymentDate: {
          gte: start,
          lte: end,
        },
        status: 'PAID'
      },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            series: true,
            invoiceType: true,
            supplierCnpj: true,
            supplierName: true,
            emissionDate: true,
            totalValue: true,
          }
        }
      },
      orderBy: {
        paymentDate: 'asc'
      }
    })

    // 4. Buscar pagamentos pendentes (para informação adicional)
    const pendingPayments = await prisma.invoicePayment.findMany({
      where: {
        dueDate: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['PENDING', 'OVERDUE']
        }
      },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            series: true,
            invoiceType: true,
            supplierCnpj: true,
            supplierName: true,
            emissionDate: true,
            totalValue: true,
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    // 5. Agrupar por dia
    const paymentsByDay: Record<string, {
      date: string
      total: number
      count: number
      payments: typeof payments
    }> = {}

    payments.forEach(payment => {
      if (payment.paymentDate) {
        const dateKey = payment.paymentDate.toISOString().split('T')[0]

        if (!paymentsByDay[dateKey]) {
          paymentsByDay[dateKey] = {
            date: dateKey,
            total: 0,
            count: 0,
            payments: []
          }
        }

        paymentsByDay[dateKey].total += payment.amount
        paymentsByDay[dateKey].count += 1
        paymentsByDay[dateKey].payments.push(payment)
      }
    })

    // 6. Agrupar por método de pagamento
    const paymentsByMethod: Record<string, {
      method: string
      total: number
      count: number
      payments: typeof payments
    }> = {}

    payments.forEach(payment => {
      const method = payment.paymentMethod

      if (!paymentsByMethod[method]) {
        paymentsByMethod[method] = {
          method,
          total: 0,
          count: 0,
          payments: []
        }
      }

      paymentsByMethod[method].total += payment.amount
      paymentsByMethod[method].count += 1
      paymentsByMethod[method].payments.push(payment)
    })

    // 7. Calcular totais
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

    // 8. Agrupar por tipo de nota (produto vs serviço)
    const byInvoiceType = {
      PRODUTO: {
        total: payments.filter(p => p.invoice.invoiceType === 'PRODUTO').reduce((sum, p) => sum + p.amount, 0),
        count: payments.filter(p => p.invoice.invoiceType === 'PRODUTO').length,
      },
      SERVICO: {
        total: payments.filter(p => p.invoice.invoiceType === 'SERVICO').reduce((sum, p) => sum + p.amount, 0),
        count: payments.filter(p => p.invoice.invoiceType === 'SERVICO').length,
      }
    }

    return NextResponse.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalPaid,
        totalPending,
        totalCount: payments.length,
        pendingCount: pendingPayments.length,
      },
      byDay: Object.values(paymentsByDay).sort((a, b) => a.date.localeCompare(b.date)),
      byMethod: Object.values(paymentsByMethod),
      byInvoiceType,
      payments,
      pendingPayments,
    })

  } catch (error) {
    console.error('Erro ao buscar visão de caixa:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar visão de caixa' },
      { status: 500 }
    )
  }
}
