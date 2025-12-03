'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PersonalFormProps {
  data: any
  onChange: (data: any) => void
}

export default function DoctorPersonalForm({ data, onChange }: PersonalFormProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
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
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="companyName">Razão Social</Label>
              <Input
                id="companyName"
                value={data.companyName || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={data.cnpj || ''}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
