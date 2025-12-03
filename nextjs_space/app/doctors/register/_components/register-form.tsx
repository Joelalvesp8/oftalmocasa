'use client';

/**
 * Formulário de Auto-Cadastro para Médicos
 * Apenas dados pessoais e bancários
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface FormData {
  // Dados Pessoais
  name: string;
  birthDate: string;
  graduationDate: string;
  councilType: string;
  councilNumber: string;
  councilState: string;
  cpf: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Dados Empresariais
  companyName: string;
  cnpj: string;
  taxRegime: string;
  
  // Dados Bancários
  bankNumber: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  pixKeyType: string;
  pixKey: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    birthDate: '',
    graduationDate: '',
    councilType: 'CRM',
    councilNumber: '',
    councilState: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    cnpj: '',
    taxRegime: 'SN',
    bankNumber: '',
    bankName: '',
    bankAgency: '',
    bankAccount: '',
    pixKeyType: 'CPF',
    pixKey: '',
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.cpf || !formData.email || !formData.phone ||
        !formData.councilType || !formData.councilNumber) {
      toast.error('Preencha todos os campos obrigatórios');
      return false;
    }
    
    if (!formData.password || formData.password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Senhas não conferem');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/doctors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro');
      }

      setSuccess(true);
      toast.success(data.message || 'Cadastro realizado com sucesso!');
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Cadastro Realizado com Sucesso!
        </h2>
        <p className="text-gray-600 mb-4">
          Seu cadastro foi enviado e está aguardando aprovação da administração.
        </p>
        <p className="text-sm text-gray-500">
          Você receberá um e-mail quando seu cadastro for aprovado.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Redirecionando para o login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex-1 h-2 rounded-full ${
          step >= 1 ? 'bg-blue-600' : 'bg-gray-200'
        }`} />
        <div className={`flex-1 h-2 rounded-full ${
          step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
        }`} />
        <div className={`flex-1 h-2 rounded-full ${
          step >= 3 ? 'bg-blue-600' : 'bg-gray-200'
        }`} />
      </div>

      {/* Step 1: Dados Pessoais */}
      {step === 1 && (
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
                placeholder="000.000.000-00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
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
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
              />
            </div>
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
                placeholder="SP"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={handleNext}>
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Dados Empresariais */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dados Empresariais</h3>
          
          <div>
            <Label htmlFor="companyName">Razão Social</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleBack}>
              Voltar
            </Button>
            <Button type="button" onClick={handleNext}>
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Dados Bancários */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dados Bancários</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankNumber">Número do Banco</Label>
              <Input
                id="bankNumber"
                value={formData.bankNumber}
                onChange={(e) => handleChange('bankNumber', e.target.value)}
                placeholder="000"
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

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleBack}>
              Voltar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalizar Cadastro
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
