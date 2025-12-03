import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Mês e ano são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar relatórios de pagamento
    const reports = await prisma.paymentReport.findMany({
      where: { month, year },
      include: { doctor: true },
      orderBy: { doctor: { name: 'asc' } }
    })

    // Criar workbook Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Pagamentos Médicos')

    // Configurar colunas (matching planilha do usuário)
    worksheet.columns = [
      { header: 'LP / SN', key: 'taxRegime', width: 10 },
      { header: 'Nº', key: 'bankNumber', width: 10 },
      { header: 'BANCO', key: 'bankName', width: 20 },
      { header: 'AG', key: 'bankAgency', width: 10 },
      { header: 'C/C', key: 'bankAccount', width: 15 },
      { header: 'TIPO CHAVE', key: 'pixKeyType', width: 15 },
      { header: 'CHAVE PIX', key: 'pixKey', width: 30 },
      { header: 'FIXO/ VAR.', key: 'paymentType', width: 12 },
      { header: 'VALOR_BRUTO', key: 'grossValue', width: 15 },
      { header: 'ANO_PAGAMENTO', key: 'year', width: 15 },
      { header: 'MES_REFERENCIA', key: 'monthRef', width: 15 },
      { header: 'MES_NOME', key: 'monthName', width: 15 }
    ]

    // Adicionar dados
    const monthNames = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ]

    reports.forEach(report => {
      worksheet.addRow({
        taxRegime: report.taxRegime || 'LP',
        bankNumber: report.bankNumber || '',
        bankName: report.bankName || '',
        bankAgency: report.bankAgency || '',
        bankAccount: report.bankAccount || '',
        pixKeyType: report.pixKeyType || '',
        pixKey: report.pixKey || '',
        paymentType: report.paymentType,
        grossValue: `R$ ${report.grossValue.toFixed(2).replace('.', ',')}`,
        year: report.year,
        monthRef: report.month,
        monthName: monthNames[report.month - 1]
      })
    })

    // Estilizar planilha
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 20

    // Bordas para todas as células com dados
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    })

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pagamentos_${month}_${year}.xlsx"`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}
