import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { invoiceFilterSchema } from '@/lib/validations'

/**
 * GET /api/invoices
 * Lista notas fiscais com filtros
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
    const filters = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      invoiceType: searchParams.get('invoiceType'),
      status: searchParams.get('status'),
      supplierCnpj: searchParams.get('supplierCnpj'),
      paymentMethod: searchParams.get('paymentMethod'),
    }

    // Remove valores null/undefined
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v != null)
    )

    // 3. Validação dos filtros
    const validation = invoiceFilterSchema.safeParse(cleanFilters)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Filtros inválidos' },
        { status: 400 }
      )
    }

    const validFilters = validation.data

    // 4. Construir query do Prisma
    const where: any = {}

    if (validFilters.startDate || validFilters.endDate) {
      where.emissionDate = {}
      if (validFilters.startDate) {
        where.emissionDate.gte = new Date(validFilters.startDate)
      }
      if (validFilters.endDate) {
        where.emissionDate.lte = new Date(validFilters.endDate)
      }
    }

    if (validFilters.invoiceType) {
      where.invoiceType = validFilters.invoiceType
    }

    if (validFilters.status) {
      where.status = validFilters.status
    }

    if (validFilters.supplierCnpj) {
      where.supplierCnpj = {
        contains: validFilters.supplierCnpj
      }
    }

    if (validFilters.paymentMethod) {
      where.payments = {
        some: {
          paymentMethod: validFilters.paymentMethod
        }
      }
    }

    // 5. Buscar notas fiscais
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
        payments: true,
      },
      orderBy: {
        emissionDate: 'desc'
      }
    })

    // 6. Calcular estatísticas
    const stats = {
      total: invoices.length,
      totalValue: invoices.reduce((sum, inv) => sum + inv.totalValue, 0),
      byType: {
        PRODUTO: invoices.filter(inv => inv.invoiceType === 'PRODUTO').length,
        SERVICO: invoices.filter(inv => inv.invoiceType === 'SERVICO').length,
      },
      byStatus: {
        PENDING: invoices.filter(inv => inv.status === 'PENDING').length,
        PROCESSED: invoices.filter(inv => inv.status === 'PROCESSED').length,
        APPROVED: invoices.filter(inv => inv.status === 'APPROVED').length,
        REJECTED: invoices.filter(inv => inv.status === 'REJECTED').length,
        CANCELLED: invoices.filter(inv => inv.status === 'CANCELLED').length,
      }
    }

    return NextResponse.json({
      invoices,
      stats
    })

  } catch (error) {
    console.error('Erro ao buscar notas fiscais:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar notas fiscais' },
      { status: 500 }
    )
  }
}
