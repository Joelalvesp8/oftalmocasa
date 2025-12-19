'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DoctorBankFormData } from '@/lib/types'

interface BankFormProps {
  data: DoctorBankFormData
  onChange: (data: DoctorBankFormData) => void
}

export default function DoctorBankForm({ data, onChange }: BankFormProps) {
  const handleChange = <K extends keyof DoctorBankFormData>(
    field: K,
    value: DoctorBankFormData[K]
  ) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Bancários</CardTitle>
        <CardDescription>Informações para pagamento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankNumber">Número do Banco</Label>
            <Input
              id="bankNumber"
              value={data.bankNumber || ''}
              onChange={(e) => handleChange('bankNumber', e.target.value)}
              placeholder="001"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="bankName">Nome do Banco</Label>
            <Input
              id="bankName"
              value={data.bankName || ''}
              onChange={(e) => handleChange('bankName', e.target.value)}
              placeholder="Banco do Brasil"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAgency">Agência</Label>
            <Input
              id="bankAgency"
              value={data.bankAgency || ''}
              onChange={(e) => handleChange('bankAgency', e.target.value)}
              placeholder="0001"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankAccount">Conta Corrente</Label>
            <Input
              id="bankAccount"
              value={data.bankAccount || ''}
              onChange={(e) => handleChange('bankAccount', e.target.value)}
              placeholder="12345-6"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixKeyType">Tipo de Chave PIX</Label>
            <Select
              value={data.pixKeyType || ''}
              onValueChange={(value) => handleChange('pixKeyType', value)}
            >
              <SelectTrigger id="pixKeyType">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="TELEFONE">Telefone</SelectItem>
                <SelectItem value="ALEATORIA">Chave Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pixKey">Chave PIX</Label>
          <Input
            id="pixKey"
            value={data.pixKey || ''}
            onChange={(e) => handleChange('pixKey', e.target.value)}
            placeholder="Digite a chave PIX"
          />
        </div>
      </CardContent>
    </Card>
  )
}
