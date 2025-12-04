'use client';

/**
 * Tab de Edição de Dados
 * Permite editar dados pessoais e bancários
 * NÃO mostra classificação interna
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Search } from 'lucide-react';
import type { Doctor, TaxRegime } from '@prisma/client';

interface EditDataTabProps {
  doctor: Doctor;
  onUpdate: (doctor: Doctor) => void;
}

export function EditDataTab({ doctor, onUpdate }: EditDataTabProps) {
  const [loading, setLoading] = useState(false);
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [formData, setFormData] = useState({
    // Dados Pessoais
    name: doctor.name,
    birthDate: doctor.birthDate ? new Date(doctor.birthDate).toISOString().split('T')[0] : '',
    graduationDate: doctor.graduationDate ? new Date(doctor.graduationDate).toISOString().split('T')[0] : '',
    councilType: doctor.councilType,
    councilNumber: doctor.councilNumber,
    councilState: doctor.councilState || '',
    cpf: doctor.cpf,
    phone: doctor.phone,
    email: doctor.email,
    
    // Dados Empresariais
    companyName: doctor.companyName || '',
    cnpj: doctor.cnpj || '',
    taxRegime: doctor.taxRegime || 'SN',
    
    // Dados Bancários
    bankNumber: doctor.bankNumber || '',
    bankName: doctor.bankName || '',
    bankAgency: doctor.bankAgency || '',
    bankAccount: doctor.bankAccount || '',
    pixKeyType: doctor.pixKeyType || 'CPF',
    pixKey: doctor.pixKey || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchCnpj = async () => {
    if (!formData.cnpj) {
      toast.error('Digite um CNPJ para buscar');
      return;
    }

    setSearchingCnpj(true);

    try {
      const cnpjClean = formData.cnpj.replace(/\D/g, '');
      
      if (cnpjClean.length !== 14) {
        toast.error('CNPJ inválido. Digite 14 dígitos.');
        return;
      }

      const response = await fetch(`/api/cnpj?cnpj=${cnpjClean}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao consultar CNPJ');
      }

      // Preenche os campos automaticamente
      setFormData((prev) => ({
        ...prev,
        companyName: data.companyName || prev.companyName,
        taxRegime: mapTaxRegimeToForm(data.taxRegime) || prev.taxRegime,
      }));

      toast.success('Dados do CNPJ carregados com sucesso!');
      
      // Mostra informações adicionais em um toast informativo
      if (data.fantasyName) {
        toast.info(`Nome Fantasia: ${data.fantasyName}`);
      }
      if (data.status) {
        toast.info(`Status: ${data.status}`);
      }
      if (data.mainActivity) {
        toast.info(`Atividade Principal: ${data.mainActivity}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao buscar CNPJ');
    } finally {
      setSearchingCnpj(false);
    }
  };

  const mapTaxRegimeToForm = (regime: string | null): TaxRegime => {
    if (regime === 'SIMPLES_NACIONAL' || regime === 'MEI') return 'SN' as TaxRegime;
    if (regime === 'LUCRO_PRESUMIDO') return 'LP' as TaxRegime;
    if (regime === 'LUCRO_REAL') return 'LR' as TaxRegime;
    return 'SN' as TaxRegime; // padrão
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar dados');
      }

      toast.success('Dados atualizados com sucesso!');
      onUpdate(data.doctor);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status do Cadastro:</span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          doctor.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
          doctor.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
          doctor.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {doctor.status === 'APPROVED' ? 'Aprovado' :
           doctor.status === 'PENDING' ? 'Aguardando Aprovação' :
           doctor.status === 'REJECTED' ? 'Rejeitado' :
           'Incompleto'}
        </span>
      </div>

      {/* Dados Pessoais */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dados Pessoais</h3>
        
        <div>
          <Label htmlFor="name">Nome Completo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground mt-1">CPF não pode ser alterado</p>
          </div>
          
          <div>
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="graduationDate">Data de Formação</Label>
            <Input
              id="graduationDate"
              type="date"
              value={formData.graduationDate}
              onChange={(e) => handleChange('graduationDate', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="councilType">Conselho *</Label>
            <Select value={formData.councilType} onValueChange={(v) => handleChange('councilType', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CRM">CRM</SelectItem>
                <SelectItem value="CRO">CRO</SelectItem>
                <SelectItem value="CREFITO">CREFITO</SelectItem>
                <SelectItem value="CRF">CRF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="councilNumber">Número *</Label>
            <Input
              id="councilNumber"
              value={formData.councilNumber}
              onChange={(e) => handleChange('councilNumber', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="councilState">UF</Label>
            <Input
              id="councilState"
              value={formData.councilState}
              onChange={(e) => handleChange('councilState', e.target.value)}
              maxLength={2}
            />
          </div>
        </div>
      </div>

      {/* Dados Empresariais */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dados Empresariais</h3>
        
        <div>
          <Label htmlFor="cnpj">CNPJ</Label>
          <div className="flex gap-2">
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => handleChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSearchCnpj}
              disabled={searchingCnpj || !formData.cnpj}
            >
              {searchingCnpj ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Buscar</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Digite o CNPJ e clique em Buscar para preencher automaticamente os dados
          </p>
        </div>

        <div>
          <Label htmlFor="companyName">Razão Social</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="taxRegime">Regime Tributário</Label>
          <Select value={formData.taxRegime} onValueChange={(v) => handleChange('taxRegime', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SN">Simples Nacional</SelectItem>
              <SelectItem value="LP">Lucro Presumido</SelectItem>
              <SelectItem value="LR">Lucro Real</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dados Bancários */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dados Bancários</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bankNumber">Número do Banco</Label>
            <Input
              id="bankNumber"
              value={formData.bankNumber}
              onChange={(e) => handleChange('bankNumber', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="bankName">Nome do Banco</Label>
            <Input
              id="bankName"
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bankAgency">Agência</Label>
            <Input
              id="bankAgency"
              value={formData.bankAgency}
              onChange={(e) => handleChange('bankAgency', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="bankAccount">Conta</Label>
            <Input
              id="bankAccount"
              value={formData.bankAccount}
              onChange={(e) => handleChange('bankAccount', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pixKeyType">Tipo de Chave PIX</Label>
            <Select value={formData.pixKeyType} onValueChange={(v) => handleChange('pixKeyType', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
                <SelectItem value="EMAIL">E-mail</SelectItem>
                <SelectItem value="TELEFONE">Telefone</SelectItem>
                <SelectItem value="ALEATORIA">Chave Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="pixKey">Chave PIX</Label>
            <Input
              id="pixKey"
              value={formData.pixKey}
              onChange={(e) => handleChange('pixKey', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}
