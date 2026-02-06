/**
 * Utilitário de OCR para Nota Fiscal
 * Usa Tesseract.js para extrair dados de NFe/NFSe em PDF ou imagem
 */

// Tipos extraídos da NF
export interface InvoiceOCRData {
  invoiceNumber: string | null
  issueDate: Date | null
  totalValue: number | null
  cnpj: string | null
  confidence: number // 0-100
  rawText: string
}

/**
 * Extrai dados de uma Nota Fiscal usando OCR
 * @param buffer Buffer do arquivo (PDF ou imagem)
 * @param mimeType Tipo MIME do arquivo
 * @returns Dados extraídos da NF
 */
export async function extractInvoiceData(
  buffer: Buffer,
  mimeType: string
): Promise<InvoiceOCRData> {
  try {
    // Se for PDF, converter para imagem primeiro
    let imageBuffer = buffer
    if (mimeType === 'application/pdf') {
      imageBuffer = await convertPdfToImage(buffer)
    }

    // Processar com Tesseract
    const text = await performOCR(imageBuffer)

    // Extrair dados estruturados
    const data = parseInvoiceText(text)

    return data
  } catch (error) {
    console.error('Erro no OCR:', error)
    throw new Error('Falha ao processar OCR da Nota Fiscal')
  }
}

/**
 * Realiza OCR usando Tesseract.js
 * NOTA: Requer instalação de tesseract.js: npm install tesseract.js
 */
async function performOCR(imageBuffer: Buffer): Promise<string> {
  // TODO: Implementar quando tesseract.js estiver instalado
  // const { createWorker } = require('tesseract.js');
  // const worker = await createWorker('por');
  // const { data: { text } } = await worker.recognize(imageBuffer);
  // await worker.terminate();
  // return text;

  // Por enquanto, retorna texto de exemplo para desenvolvimento
  console.warn('⚠️ OCR não implementado ainda. Instale: npm install tesseract.js')
  return `
    NOTA FISCAL ELETRÔNICA
    Nº 12345
    Data de Emissão: 15/12/2024
    CNPJ: 12345678000190
    Valor Total: R$ 5.000,00
  `
}

/**
 * Converte PDF para imagem
 * NOTA: Requer instalação de pdf-parse ou pdf2pic
 */
async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
  // TODO: Implementar conversão PDF → Image
  // const pdftopic = require('pdf2pic');
  // ...

  console.warn('⚠️ Conversão PDF não implementada. Use imagens por enquanto.')
  return pdfBuffer
}

/**
 * Parseia texto extraído para estruturar dados da NF
 */
function parseInvoiceText(text: string): InvoiceOCRData {
  const data: InvoiceOCRData = {
    invoiceNumber: null,
    issueDate: null,
    totalValue: null,
    cnpj: null,
    confidence: 0,
    rawText: text,
  }

  // Extrair número da NF
  const numberMatch = text.match(/(?:n[ºªo]\.?\s*|número\s*[:.]?\s*)(\d+)/i)
  if (numberMatch) {
    data.invoiceNumber = numberMatch[1]
    data.confidence += 25
  }

  // Extrair data de emissão
  const dateMatch = text.match(/(?:emissão|data)(?:\s*[:.]?\s*)(\d{2}\/\d{2}\/\d{4})/i)
  if (dateMatch) {
    const [day, month, year] = dateMatch[1].split('/')
    data.issueDate = new Date(`${year}-${month}-${day}`)
    data.confidence += 25
  }

  // Extrair CNPJ
  const cnpjMatch = text.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})/g)
  if (cnpjMatch && cnpjMatch.length > 0) {
    data.cnpj = cnpjMatch[0].replace(/\D/g, '') // Remove pontuação
    data.confidence += 25
  }

  // Extrair valor total
  const valueMatch = text.match(/(?:total|valor)(?:\s*[:.]?\s*R?\$?\s*)([\d.,]+)/i)
  if (valueMatch) {
    const valueStr = valueMatch[1].replace(/\./g, '').replace(',', '.')
    data.totalValue = parseFloat(valueStr)
    data.confidence += 25
  }

  return data
}

/**
 * Valida se CNPJ da NF confere com CNPJ do médico
 */
export function validateCNPJ(invoiceCNPJ: string, doctorCNPJ: string): boolean {
  // Remove formatação
  const cleanInvoiceCNPJ = invoiceCNPJ.replace(/\D/g, '')
  const cleanDoctorCNPJ = doctorCNPJ.replace(/\D/g, '')

  return cleanInvoiceCNPJ === cleanDoctorCNPJ
}

/**
 * Valida se valor da NF confere com valor da produção (± 5% tolerância)
 */
export function validateValue(invoiceValue: number, productionValue: number): boolean {
  const tolerance = 0.05 // 5%
  const diff = Math.abs(invoiceValue - productionValue)
  const maxDiff = productionValue * tolerance

  return diff <= maxDiff
}

/**
 * Formata CNPJ para exibição: 12.345.678/0001-90
 */
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '')
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}
