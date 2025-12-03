'use client';

/**
 * Cliente do Perfil Médico
 * Tabs para edição de dados e gerenciamento de documentos
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { EditDataTab } from './edit-data-tab';
import { DocumentsTab } from './documents-tab';
import type { Doctor } from '@prisma/client';

interface DoctorProfileClientProps {
  doctor: Doctor;
}

export function DoctorProfileClient({ doctor: initialDoctor }: DoctorProfileClientProps) {
  const [doctor, setDoctor] = useState(initialDoctor);

  return (
    <Tabs defaultValue="data" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="data">Meus Dados</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
      </TabsList>

      <TabsContent value="data" className="mt-6">
        <Card className="p-6">
          <EditDataTab doctor={doctor} onUpdate={setDoctor} />
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <Card className="p-6">
          <DocumentsTab doctorId={doctor.id} />
        </Card>
      </TabsContent>
    </Tabs>
  );
}
