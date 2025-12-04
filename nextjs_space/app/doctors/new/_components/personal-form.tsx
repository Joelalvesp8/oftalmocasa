'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { TaxRegime } from '@prisma/client'

interface PersonalFormProps {
  data: any
  onChange: (data: any) => void
}

export default function DoctorPersonalForm({ data, onChange }: PersonalFormProps) {
  const [searchingCnpj, setSearchingCnpj] = useState(false)

  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const mapTaxRegimeToForm = (regime: string | null): TaxRegime => {
    if (!regime) return 'LP' as TaxRegime
    
    const regimeUpper = regime.toUpperCase().replace(/_/g, ' ')
    
    if (regimeUpper.includes('SIMPLES')) return 'SN' as TaxRegime
    if (regimeUpper.includes('MEI')) return 'SN' as TaxRegime
    if (regimeUpper.includes('LUCRO REAL')) return 'LR' as TaxRegime
    if (regimeUpper.includes('LUCRO PRESUMIDO')) return 'LP' as TaxRegime
    
    return 'LP' as TaxRegime
  }

  const handleSearchCnpj = async () => {
    const cnpj = data.cnpj?.replace(/\D/g, '')
    
    if (!cnpj || cnpj.length !== 14) {
      toast.error('Digite um CNPJ válido com 14 dígitos')
      return
    }

    setSearchingCnpj(true)
    
    try {
      const response = await fetch(`/api/cnpj?cnpj=${cnpj}`)
      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Erro ao buscar CNPJ')
        return
      }

      // Auto-preenche os campos
      const mappedTaxRegime = mapTaxRegimeToForm(result.taxRegime)
      
      // Atualiza todos os campos de uma vez para garantir sincronização
      onChange({ 
        ...data, 
        companyName: result.companyName,
        taxRegime: mappedTaxRegime
      })
      
      // Mostra informações adicionais com dados da empresa
      const description = [
        result.fantasyName && `Nome Fantasia: ${result.fantasyName}`,
        result.status && `Status: ${result.status}`,
        result.mainActivity && `Atividade: ${result.mainActivity}`
      ].filter(Boolean).join('\n')
      
      toast.success('✅ Dados preenchidos automaticamente!', {
        description: description || result.companyName,
        duration: 5000
      })
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error)
      toast.error('Erro ao buscar CNPJ. Verifique sua conexão e tente novamente.')
    } finally {
      setSearchingCnpj(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Informações básicas do médico</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={data.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={data.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={data.cpf || ''}
                onChange={(e) => handleChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={data.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={data.birthDate || ''}
                onChange={(e) => handleChange('birthDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conselho Profissional</CardTitle>
          <CardDescription>Dados de registro profissional</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="councilType">Tipo *</Label>
              <Select
                value={data.councilType || ''}
                onValueChange={(value) => handleChange('councilType', value)}
              >
                <SelectTrigger id="councilType">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRM">CRM</SelectItem>
                  <SelectItem value="CRO">CRO</SelectItem>
                  <SelectItem value="CREFITO">CREFITO</SelectItem>
                  <SelectItem value="CRF">CRF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="councilNumber">Número *</Label>
              <Input
                id="councilNumber"
                value={data.councilNumber || ''}
                onChange={(e) => handleChange('councilNumber', e.target.value)}
                placeholder="123456"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="councilState">UF</Label>
              <Input
                id="councilState"
                value={data.councilState || ''}
                onChange={(e) => handleChange('councilState', e.target.value)}
                placeholder="SP"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduationDate">Data de Formação</Label>
              <Input
                id="graduationDate"
                type="date"
                value={data.graduationDate || ''}
                onChange={(e) => handleChange('graduationDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados Empresariais</CardTitle>
          <CardDescription>Informações da pessoa jurídica (se aplicável)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <div className="flex gap-2">
              <Input
                id="cnpj"
                value={data.cnpj || ''}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearchCnpj}
                disabled={!data.cnpj || searchingCnpj}
                className="shrink-0"
              >
                {searchingCnpj ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Digite o CNPJ e clique em Buscar para preencher automaticamente os dados
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Razão Social</Label>
            <Input
              id="companyName"
              value={data.companyName || ''}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRegime">Regime Tributário</Label>
            <Select
              value={data.taxRegime || ''}
              onValueChange={(value) => handleChange('taxRegime', value)}
            >
              <SelectTrigger id="taxRegime">
                <SelectValue placeholder="Selecione o regime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LP">Lucro Presumido (LP)</SelectItem>
                <SelectItem value="SN">Simples Nacional (SN)</SelectItem>
                <SelectItem value="LR">Lucro Real (LR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
