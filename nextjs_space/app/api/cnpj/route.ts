/**
 * API de Consulta de CNPJ
 * Consulta dados da Receita Federal usando BrasilAPI com cache
 *
 * Endpoint: GET /api/cnpj?cnpj={cnpj}&forceRefresh={boolean}
 *
 * Features:
 * - Cache em memória com TTL de 24h
 * - Validação com Zod
 * - Type-safe responses
 * - Error handling detalhado
 */

import { NextRequest, NextResponse } from 'next/server'
import { cnpjQuerySchema } from '@/lib/validations'
import {
  BrasilAPICNPJResponse,
  CNPJData,
  SystemTaxRegime,
  cleanCNPJ,
  isValidCNPJFormat
} from '@/lib/types'
import {
  getCachedCNPJ,
  setCachedCNPJ,
  invalidateCNPJ,
  getCacheStats,
} from '@/lib/cnpj-cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cnpjParam = searchParams.get('cnpj')
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    // Validar parâmetros
    if (!cnpjParam) {
      return NextResponse.json(
        { error: 'CNPJ é obrigatório' },
        { status: 400 }
      )
    }

    // Limpar e validar formato
    const cnpjClean = cleanCNPJ(cnpjParam)

    const validation = cnpjQuerySchema.safeParse({ cnpj: cnpjClean })
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'CNPJ inválido',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Verificar cache (se não for forceRefresh)
    if (!forceRefresh) {
      const cached = getCachedCNPJ(cnpjClean)
      if (cached) {
        console.log(`[CNPJ Cache HIT] ${cnpjClean}`)
        return NextResponse.json({
          ...cached,
          _cached: true,
          _cacheStats: getCacheStats(),
        })
      }
    } else {
      // Se forceRefresh, invalidar cache existente
      invalidateCNPJ(cnpjClean)
      console.log(`[CNPJ Cache INVALIDATED] ${cnpjClean}`)
    }

    console.log(`[CNPJ Cache MISS] Consultando BrasilAPI para ${cnpjClean}`)

    // Consultar BrasilAPI
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Oftalmocasa-Sistema/1.0',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      return handleBrasilAPIError(response)
    }

    const apiData: BrasilAPICNPJResponse = await response.json()

    // Mapear dados para formato do sistema
    const mappedData: CNPJData = mapBrasilAPIResponse(apiData)

    // Armazenar em cache
    setCachedCNPJ(cnpjClean, mappedData)

    return NextResponse.json({
      ...mappedData,
      _cached: false,
      _cacheStats: getCacheStats(),
    })
  } catch (error) {
    console.error('[CNPJ API] Erro ao consultar CNPJ:', error)
    return NextResponse.json(
      { error: 'Erro ao consultar CNPJ. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}

/**
 * Trata erros da BrasilAPI com mensagens específicas
 */
async function handleBrasilAPIError(response: Response): Promise<NextResponse> {
  const status = response.status

  switch (status) {
    case 404:
      return NextResponse.json(
        { error: 'CNPJ não encontrado na base da Receita Federal' },
        { status: 404 }
      )

    case 403:
      return NextResponse.json(
        { error: 'Acesso negado pela API. Verifique o CNPJ e tente novamente.' },
        { status: 403 }
      )

    case 429:
      return NextResponse.json(
        {
          error: 'Muitas requisições. Aguarde um momento e tente novamente.',
          retryAfter: response.headers.get('Retry-After') || '60'
        },
        { status: 429 }
      )

    case 500:
    case 502:
    case 503:
      return NextResponse.json(
        { error: 'Serviço da Receita Federal temporariamente indisponível' },
        { status: 503 }
      )

    default:
      const errorText = await response.text().catch(() => 'Resposta inválida')
      console.error(`[BrasilAPI Error ${status}]:`, errorText)

      return NextResponse.json(
        { error: 'Erro ao consultar CNPJ. Verifique os dados e tente novamente.' },
        { status }
      )
  }
}

/**
 * Mapeia resposta da BrasilAPI para formato do sistema
 */
function mapBrasilAPIResponse(apiData: BrasilAPICNPJResponse): CNPJData {
  return {
    cnpj: apiData.cnpj,
    companyName: apiData.razao_social || '',
    fantasyName: apiData.nome_fantasia || '',
    taxRegime: mapTaxRegime(apiData.opcao_pelo_simples, apiData.opcao_pelo_mei, apiData.porte),
    address: {
      street: apiData.logradouro || '',
      number: apiData.numero || '',
      complement: apiData.complemento || '',
      neighborhood: apiData.bairro || '',
      city: apiData.municipio || '',
      state: apiData.uf || '',
      zipCode: apiData.cep || '',
    },
    legalNature: apiData.natureza_juridica || '',
    openingDate: apiData.data_inicio_atividade || '',
    mainActivity: apiData.cnae_fiscal_descricao || '',
    status: apiData.descricao_situacao_cadastral || '',
    phone1: apiData.ddd_telefone_1 || '',
    phone2: apiData.ddd_telefone_2 || '',
    email: apiData.email || '',
    size: apiData.porte || '',
    partners: (apiData.qsa || []).map((partner) => ({
      name: partner.nome_socio || '',
      cpfCnpj: partner.cnpj_cpf_do_socio || '',
      qualification: partner.qualificacao_socio || '',
      country: partner.pais_socio || 'Brasil',
      capitalPercentage: partner.percentual_capital_social || 0,
    })),
  }
}

/**
 * Determina regime tributário baseado nos dados da Receita Federal
 */
function mapTaxRegime(
  opcaoSimples: boolean | string | null,
  opcaoMEI: boolean | string | null,
  porte: string
): SystemTaxRegime | null {
  // MEI tem prioridade
  if (opcaoMEI === true || opcaoMEI === 'Sim' || opcaoMEI === 'S') {
    return 'MEI'
  }

  // Simples Nacional
  if (opcaoSimples === true || opcaoSimples === 'Sim' || opcaoSimples === 'S') {
    return 'SN' // Simples Nacional
  }

  // Para empresas de grande porte, sugere Lucro Real
  if (porte === 'EMPRESA DE GRANDE PORTE' || porte === 'DEMAIS') {
    return 'LR' // Lucro Real
  }

  // Padrão: Lucro Presumido
  return 'LP' // Lucro Presumido
}
