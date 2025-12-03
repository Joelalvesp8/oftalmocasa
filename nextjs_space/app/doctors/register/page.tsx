/**
 * Página Pública de Auto-Cadastro para Médicos
 * Permite que médicos se cadastrem externamente sem autenticação
 */

import { RegisterForm } from './_components/register-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Cadastro Médico - Sistema Oftalmocasa',
  description: 'Formulário de auto-cadastro para médicos',
};

export default function DoctorRegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Login
          </Link>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Cadastro Médico</h1>
            <p className="mt-2 text-gray-600">
              Preencha seus dados para se cadastrar no Sistema Oftalmocasa.
              Após o envio, seu cadastro será avaliado pela administração.
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <RegisterForm />
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Já possui cadastro? <Link href="/login" className="text-blue-600 hover:underline">Faça login</Link></p>
        </div>
      </div>
    </div>
  );
}
