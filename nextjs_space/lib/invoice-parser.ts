// Utilitário para parsing de XML de Notas Fiscais
// Suporta NF-e (Produtos) e NFS-e (Serviços)

import { parseStringPromise } from 'xml2js'

export interface ParsedInvoice {
  // Identificação
  number: string
  series: string | null
  accessKey: string | null
  invoiceType: 'PRODUTO' | 'SERVICO'

  // Fornecedor/Prestador
  supplierCnpj: string
  supplierName: string
  supplierIe: string | null
  supplierAddress: string | null

  // Datas
  emissionDate: Date
  competenceDate: Date

  // Valores
  subtotal: number
  discountValue: number
  taxValue: number
  freightValue: number
  insuranceValue: number
  otherExpenses: number
  totalValue: number

  // Itens
  items: ParsedInvoiceItem[]

  // Pagamentos
  payments: ParsedInvoicePayment[]
}

export interface ParsedInvoiceItem {
  code: string | null
  description: string
  ncm: string | null
  cfop: string | null
  unit: string | null
  quantity: number
  unitValue: number
  totalValue: number
  discountValue: number
  icmsValue: number
  ipiValue: number
  pisValue: number
  cofinsValue: number
  issValue: number
}

export interface ParsedInvoicePayment {
  paymentMethod: 'A_VISTA' | 'FATURADO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'PIX' | 'TRANSFERENCIA' | 'CHEQUE' | 'OUTROS'
  installmentNumber: number
  totalInstallments: number
  amount: number
  dueDate: Date | null
  competenceDate: Date
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL'
}

/**
 * Detecta o tipo de nota fiscal baseado no XML
 */
function detectInvoiceType(xml: any): 'PRODUTO' | 'SERVICO' {
  // NF-e tem tag <NFe> ou <nfeProc>
  if (xml.nfeProc || xml.NFe) {
    return 'PRODUTO'
  }

  // NFS-e pode ter várias estruturas dependendo da prefeitura
  // Normalmente tem <nfse>, <RPS>, <CompNfse>, etc
  if (xml.nfse || xml.RPS || xml.CompNfse || xml.ConsultarNfseResposta) {
    return 'SERVICO'
  }

  // Padrão para PRODUTO se não conseguir detectar
  return 'PRODUTO'
}

/**
 * Converte código de forma de pagamento da NF-e para enum
 */
function mapPaymentMethod(code: string): ParsedInvoicePayment['paymentMethod'] {
  const paymentMap: Record<string, ParsedInvoicePayment['paymentMethod']> = {
    '01': 'A_VISTA',        // Dinheiro
    '02': 'CHEQUE',         // Cheque
    '03': 'CARTAO_CREDITO', // Cartão de Crédito
    '04': 'CARTAO_DEBITO',  // Cartão de Débito
    '05': 'A_VISTA',        // Crédito Loja
    '10': 'A_VISTA',        // Vale Alimentação
    '11': 'A_VISTA',        // Vale Refeição
    '12': 'A_VISTA',        // Vale Presente
    '13': 'A_VISTA',        // Vale Combustível
    '14': 'BOLETO',         // Duplicata Mercantil
    '15': 'BOLETO',         // Boleto Bancário
    '16': 'A_VISTA',        // Depósito Bancário
    '17': 'PIX',            // PIX
    '18': 'TRANSFERENCIA',  // Transferência bancária
    '19': 'A_VISTA',        // Programa de fidelidade
    '90': 'OUTROS',         // Sem pagamento
    '99': 'OUTROS',         // Outros
  }

  return paymentMap[code] || 'OUTROS'
}

/**
 * Extrai valor de campo do XML (trata diferentes estruturas)
 */
function extractValue(obj: any, ...paths: string[]): any {
  for (const path of paths) {
    const keys = path.split('.')
    let value = obj

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key]
      } else {
        value = undefined
        break
      }
    }

    if (value !== undefined && value !== null) {
      // Se for array com um elemento, retorna o elemento
      if (Array.isArray(value) && value.length === 1) {
        return value[0]
      }
      // Se for array com múltiplos elementos, retorna o array
      if (Array.isArray(value)) {
        return value
      }
      return value
    }
  }

  return null
}

/**
 * Converte string de data AAAA-MM-DD para Date
 */
function parseDate(dateStr: string | null): Date {
  if (!dateStr) return new Date()

  // Remove timezone se houver
  const cleanDate = dateStr.split('T')[0]
  const [year, month, day] = cleanDate.split('-').map(Number)

  return new Date(year, month - 1, day)
}

/**
 * Parse de NF-e (Nota Fiscal Eletrônica de Produto)
 */
async function parseNFe(xml: any): Promise<ParsedInvoice> {
  // Estrutura pode ser nfeProc > NFe > infNFe ou NFe > infNFe
  const nfe = extractValue(xml, 'nfeProc.NFe.0', 'NFe.0', 'nfeProc.NFe', 'NFe')
  const infNFe = extractValue(nfe, 'infNFe.0', 'infNFe')
  const ide = extractValue(infNFe, 'ide.0', 'ide')
  const emit = extractValue(infNFe, 'emit.0', 'emit')
  const total = extractValue(infNFe, 'total.0.ICMSTot.0', 'total.ICMSTot.0', 'total.0.ICMSTot', 'total.ICMSTot')
  const det = extractValue(infNFe, 'det') || []
  const pag = extractValue(infNFe, 'pag') || []

  // Chave de acesso
  const accessKey = extractValue(infNFe, '$.Id') || extractValue(infNFe, 'Id.0') || null
  const cleanAccessKey = accessKey ? accessKey.replace('NFe', '') : null

  // Número e série
  const number = extractValue(ide, 'nNF.0', 'nNF') || '0'
  const series = extractValue(ide, 'serie.0', 'serie') || null

  // Data de emissão
  const emissionDateStr = extractValue(ide, 'dhEmi.0', 'dhEmi', 'dEmi.0', 'dEmi')
  const emissionDate = parseDate(emissionDateStr)

  // Fornecedor
  const supplierCnpj = extractValue(emit, 'CNPJ.0', 'CNPJ') || ''
  const supplierName = extractValue(emit, 'xNome.0', 'xNome') || ''
  const supplierIe = extractValue(emit, 'IE.0', 'IE') || null

  const enderEmit = extractValue(emit, 'enderEmit.0', 'enderEmit')
  const supplierAddress = enderEmit ?
    `${extractValue(enderEmit, 'xLgr.0', 'xLgr') || ''}, ${extractValue(enderEmit, 'nro.0', 'nro') || ''} - ${extractValue(enderEmit, 'xBairro.0', 'xBairro') || ''}, ${extractValue(enderEmit, 'xMun.0', 'xMun') || ''} - ${extractValue(enderEmit, 'UF.0', 'UF') || ''}` : null

  // Valores totais
  const subtotal = parseFloat(extractValue(total, 'vProd.0', 'vProd') || '0')
  const discountValue = parseFloat(extractValue(total, 'vDesc.0', 'vDesc') || '0')
  const taxValue = parseFloat(extractValue(total, 'vICMS.0', 'vICMS') || '0')
  const freightValue = parseFloat(extractValue(total, 'vFrete.0', 'vFrete') || '0')
  const insuranceValue = parseFloat(extractValue(total, 'vSeg.0', 'vSeg') || '0')
  const otherExpenses = parseFloat(extractValue(total, 'vOutro.0', 'vOutro') || '0')
  const totalValue = parseFloat(extractValue(total, 'vNF.0', 'vNF') || '0')

  // Parse dos itens
  const items: ParsedInvoiceItem[] = (Array.isArray(det) ? det : [det]).map((item: any) => {
    const prod = extractValue(item, 'prod.0', 'prod')
    const imposto = extractValue(item, 'imposto.0', 'imposto')

    return {
      code: extractValue(prod, 'cProd.0', 'cProd'),
      description: extractValue(prod, 'xProd.0', 'xProd') || '',
      ncm: extractValue(prod, 'NCM.0', 'NCM'),
      cfop: extractValue(prod, 'CFOP.0', 'CFOP'),
      unit: extractValue(prod, 'uCom.0', 'uCom'),
      quantity: parseFloat(extractValue(prod, 'qCom.0', 'qCom') || '0'),
      unitValue: parseFloat(extractValue(prod, 'vUnCom.0', 'vUnCom') || '0'),
      totalValue: parseFloat(extractValue(prod, 'vProd.0', 'vProd') || '0'),
      discountValue: parseFloat(extractValue(prod, 'vDesc.0', 'vDesc') || '0'),
      icmsValue: parseFloat(extractValue(imposto, 'ICMS.0.ICMS00.0.vICMS.0', 'ICMS.ICMS00.vICMS') || '0'),
      ipiValue: parseFloat(extractValue(imposto, 'IPI.0.IPITrib.0.vIPI.0', 'IPI.IPITrib.vIPI') || '0'),
      pisValue: parseFloat(extractValue(imposto, 'PIS.0.PISAliq.0.vPIS.0', 'PIS.PISAliq.vPIS') || '0'),
      cofinsValue: parseFloat(extractValue(imposto, 'COFINS.0.COFINSAliq.0.vCOFINS.0', 'COFINS.COFINSAliq.vCOFINS') || '0'),
      issValue: 0,
    }
  })

  // Parse dos pagamentos
  const payments: ParsedInvoicePayment[] = []

  if (Array.isArray(pag) && pag.length > 0) {
    pag.forEach((pagItem: any) => {
      const detPag = extractValue(pagItem, 'detPag') || []
      const detPagArray = Array.isArray(detPag) ? detPag : [detPag]

      detPagArray.forEach((det: any, index: number) => {
        const tPag = extractValue(det, 'tPag.0', 'tPag') || '99'
        const vPag = parseFloat(extractValue(det, 'vPag.0', 'vPag') || '0')

        if (vPag > 0) {
          payments.push({
            paymentMethod: mapPaymentMethod(tPag),
            installmentNumber: index + 1,
            totalInstallments: detPagArray.length,
            amount: vPag,
            dueDate: tPag === '14' || tPag === '15' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 30 dias para boleto/duplicata
            competenceDate: emissionDate,
            status: tPag === '01' || tPag === '17' || tPag === '04' ? 'PAID' : 'PENDING', // À vista, PIX, débito = pago
          })
        }
      })
    })
  }

  // Se não houver pagamentos, criar um padrão
  if (payments.length === 0) {
    payments.push({
      paymentMethod: 'A_VISTA',
      installmentNumber: 1,
      totalInstallments: 1,
      amount: totalValue,
      dueDate: null,
      competenceDate: emissionDate,
      status: 'PENDING',
    })
  }

  return {
    number,
    series,
    accessKey: cleanAccessKey,
    invoiceType: 'PRODUTO',
    supplierCnpj,
    supplierName,
    supplierIe,
    supplierAddress,
    emissionDate,
    competenceDate: emissionDate,
    subtotal,
    discountValue,
    taxValue,
    freightValue,
    insuranceValue,
    otherExpenses,
    totalValue,
    items,
    payments,
  }
}

/**
 * Parse de NFS-e (Nota Fiscal de Serviço Eletrônica)
 */
async function parseNFSe(xml: any): Promise<ParsedInvoice> {
  // NFS-e tem muitas variações dependendo da prefeitura
  // Vamos tentar suportar o padrão ABRASF

  const nfse = extractValue(xml, 'CompNfse.Nfse.0.InfNfse.0', 'nfse.0', 'CompNfse.Nfse.InfNfse')
  const rps = extractValue(xml, 'RPS.0', 'RPS')

  const info = nfse || rps || {}

  // Número e data
  const number = extractValue(info, 'Numero.0', 'Numero', 'IdentificacaoRps.Numero.0', 'IdentificacaoRps.Numero') || '0'
  const series = extractValue(info, 'Serie.0', 'Serie', 'IdentificacaoRps.Serie.0', 'IdentificacaoRps.Serie') || null

  const emissionDateStr = extractValue(info, 'DataEmissao.0', 'DataEmissao', 'DataEmissaoRps.0', 'DataEmissaoRps')
  const emissionDate = parseDate(emissionDateStr)

  // Prestador (fornecedor)
  const prestador = extractValue(info, 'PrestadorServico.0', 'PrestadorServico', 'Prestador.0', 'Prestador')
  const supplierCnpj = extractValue(prestador, 'IdentificacaoPrestador.Cnpj.0', 'Cnpj.0', 'IdentificacaoPrestador.Cnpj', 'Cnpj') || ''
  const supplierName = extractValue(prestador, 'RazaoSocial.0', 'RazaoSocial') || ''
  const supplierIe = extractValue(prestador, 'InscricaoMunicipal.0', 'InscricaoMunicipal') || null

  const enderPrestador = extractValue(prestador, 'Endereco.0', 'Endereco')
  const supplierAddress = enderPrestador ?
    `${extractValue(enderPrestador, 'Endereco.0', 'Endereco') || ''}, ${extractValue(enderPrestador, 'Numero.0', 'Numero') || ''} - ${extractValue(enderPrestador, 'Bairro.0', 'Bairro') || ''}, ${extractValue(enderPrestador, 'Cidade.0', 'Cidade') || ''} - ${extractValue(enderPrestador, 'Uf.0', 'Uf') || ''}` : null

  // Valores do serviço
  const servico = extractValue(info, 'Servico.0', 'Servico', 'Valores.0', 'Valores')
  const subtotal = parseFloat(extractValue(servico, 'Valores.ValorServicos.0', 'ValorServicos.0', 'Valores.ValorServicos', 'ValorServicos') || '0')
  const discountValue = parseFloat(extractValue(servico, 'Valores.DescontoIncondicionado.0', 'DescontoIncondicionado.0', 'Valores.DescontoIncondicionado', 'DescontoIncondicionado') || '0')
  const issValue = parseFloat(extractValue(servico, 'Valores.ValorIss.0', 'ValorIss.0', 'Valores.ValorIss', 'ValorIss') || '0')
  const totalValue = parseFloat(extractValue(servico, 'Valores.ValorLiquidoNfse.0', 'ValorLiquidoNfse.0', 'Valores.ValorLiquidoNfse', 'ValorLiquidoNfse') || subtotal - discountValue)

  // Descrição do serviço
  const description = extractValue(servico, 'Discriminacao.0', 'Discriminacao') || 'Serviço'

  // Criar um item para o serviço
  const items: ParsedInvoiceItem[] = [{
    code: extractValue(servico, 'CodigoTributacaoMunicipio.0', 'CodigoTributacaoMunicipio'),
    description,
    ncm: null,
    cfop: null,
    unit: 'UN',
    quantity: 1,
    unitValue: subtotal,
    totalValue: subtotal,
    discountValue,
    icmsValue: 0,
    ipiValue: 0,
    pisValue: 0,
    cofinsValue: 0,
    issValue,
  }]

  // Pagamento padrão para serviço (normalmente faturado)
  const payments: ParsedInvoicePayment[] = [{
    paymentMethod: 'FATURADO',
    installmentNumber: 1,
    totalInstallments: 1,
    amount: totalValue,
    dueDate: new Date(emissionDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    competenceDate: emissionDate,
    status: 'PENDING',
  }]

  return {
    number,
    series,
    accessKey: null, // NFS-e geralmente não tem chave de acesso
    invoiceType: 'SERVICO',
    supplierCnpj,
    supplierName,
    supplierIe,
    supplierAddress,
    emissionDate,
    competenceDate: emissionDate,
    subtotal,
    discountValue,
    taxValue: issValue,
    freightValue: 0,
    insuranceValue: 0,
    otherExpenses: 0,
    totalValue,
    items,
    payments,
  }
}

/**
 * Função principal para fazer parse de XML de Nota Fiscal
 */
export async function parseInvoiceXml(xmlContent: string): Promise<ParsedInvoice> {
  try {
    // Remove BOM se houver
    const cleanXml = xmlContent.replace(/^\uFEFF/, '')

    // Parse do XML para objeto JavaScript
    const result = await parseStringPromise(cleanXml, {
      explicitArray: true,
      mergeAttrs: true,
      normalize: true,
      normalizeTags: false,
      trim: true,
    })

    // Detecta o tipo de nota
    const invoiceType = detectInvoiceType(result)

    // Parse conforme o tipo
    if (invoiceType === 'PRODUTO') {
      return await parseNFe(result)
    } else {
      return await parseNFSe(result)
    }

  } catch (error) {
    console.error('Erro ao fazer parse do XML:', error)
    throw new Error('Erro ao processar XML da nota fiscal. Verifique se o arquivo é válido.')
  }
}

/**
 * Valida se o XML é de uma nota fiscal válida
 */
export function isValidInvoiceXml(xmlContent: string): boolean {
  try {
    const cleanXml = xmlContent.replace(/^\uFEFF/, '').trim()

    // Verifica se começa com tag XML
    if (!cleanXml.startsWith('<?xml') && !cleanXml.startsWith('<nfeProc') && !cleanXml.startsWith('<NFe') && !cleanXml.startsWith('<nfse')) {
      return false
    }

    // Verifica se contém tags de nota fiscal
    return cleanXml.includes('NFe') ||
           cleanXml.includes('nfse') ||
           cleanXml.includes('RPS') ||
           cleanXml.includes('CompNfse')

  } catch {
    return false
  }
}
