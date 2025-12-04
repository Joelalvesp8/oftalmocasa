import { NextRequest, NextResponse } from 'next/server';

// Marca esta rota como dinâmica para evitar erros de build
export const dynamic = 'force-dynamic';

/**
 * API para consultar dados de CNPJ usando BrasilAPI
 * Endpoint público: GET /api/cnpj?cnpj={cnpj}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cnpj = searchParams.get('cnpj');

    if (!cnpj) {
      return NextResponse.json(
        { error: 'CNPJ é obrigatório' },
        { status: 400 }
      );
    }

    // Remove caracteres não numéricos
    const cnpjClean = cnpj.replace(/\D/g, '');

    if (cnpjClean.length !== 14) {
      return NextResponse.json(
        { error: 'CNPJ inválido. Deve conter 14 dígitos.' },
        { status: 400 }
      );
    }

    // Consulta a BrasilAPI
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'CNPJ não encontrado na base da Receita Federal' },
          { status: 404 }
        );
      }
      
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Acesso negado pela API. Verifique o CNPJ e tente novamente.' },
          { status: 403 }
        );
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
          { status: 429 }
        );
      }
      
      // Para outros erros, registra e retorna erro genérico
      const errorText = await response.text().catch(() => 'Resposta inválida');
      console.error(`Erro na API BrasilAPI (${response.status}):`, errorText);
      
      return NextResponse.json(
        { error: 'Erro ao consultar CNPJ. Verifique os dados e tente novamente.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Mapeia os dados para o formato do nosso sistema
    const mappedData = {
      cnpj: data.cnpj,
      companyName: data.razao_social || '',
      fantasyName: data.nome_fantasia || '',
      taxRegime: mapTaxRegime(data.opcao_pelo_simples, data.porte),
      address: {
        street: data.logradouro || '',
        number: data.numero || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.municipio || '',
        state: data.uf || '',
        zipCode: data.cep || '',
      },
      legalNature: data.natureza_juridica || '',
      openingDate: data.data_inicio_atividade || '',
      mainActivity: data.cnae_fiscal_descricao || '',
      status: data.descricao_situacao_cadastral || '',
      partners: data.qsa?.map((partner: any) => ({
        name: partner.nome_socio || '',
        qualification: partner.qualificacao_socio || '',
        country: partner.pais_socio || '',
      })) || [],
    };

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar CNPJ. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

/**
 * Mapeia os dados da Receita Federal para o regime tributário
 */
function mapTaxRegime(
  opcaoSimples: string | boolean | null | undefined,
  porte: string | null | undefined
): 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI' | null {
  // Se optante pelo Simples Nacional
  if (opcaoSimples === 'Sim' || opcaoSimples === true) {
    if (porte === 'MICROEMPRESA' || porte === 'ME') {
      return 'MEI';
    }
    return 'SIMPLES_NACIONAL';
  }

  // Para empresas maiores, sugere Lucro Presumido como padrão
  // (o usuário pode alterar manualmente se necessário)
  if (porte === 'EMPRESA DE GRANDE PORTE' || porte === 'DEMAIS') {
    return 'LUCRO_REAL';
  }

  // Padrão: Lucro Presumido
  return 'LUCRO_PRESUMIDO';
}
