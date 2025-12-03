/**
 * Página de Perfil do Médico
 * Permite que médicos editem seus dados e façam upload de documentos
 * NÃO mostra informações internas (classificação, agendas, valores)
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db';
import { DoctorProfileClient } from './_components/doctor-profile-client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Meu Perfil - Médico',
  description: 'Gerenciar dados pessoais e documentos',
};

export default async function DoctorProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar dados do médico relacionado ao usuário
  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.id },
  });

  if (!doctor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Cadastro Médico Não Encontrado
          </h2>
          <p className="text-yellow-700 mb-4">
            Você ainda não possui um cadastro médico vinculado à sua conta.
          </p>
          <Link
            href="/doctors/register"
            className="inline-block bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Fazer Cadastro Médico
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Meu Perfil Médico</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seus dados pessoais e documentos
        </p>
      </div>

      <DoctorProfileClient doctor={JSON.parse(JSON.stringify(doctor))} />
    </div>
  );
}
