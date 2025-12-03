'use client';

/**
 * Tab de Gerenciamento de Documentos
 * Upload, listagem e exclusão de documentos
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FileUp, Loader2, Download, Trash2, FileText } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  description: string | null;
  type: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
}

interface DocumentsTabProps {
  doctorId: string;
}

export function DocumentsTab({ doctorId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    type: 'OUTROS',
    description: '',
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/doctors/documents?doctorId=${doctorId}`);
      const data = await response.json();
      
      if (response.ok) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadForm((prev) => ({ ...prev, file }));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      toast.error('Selecione um arquivo');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('doctorId', doctorId);
      formData.append('type', uploadForm.type);
      if (uploadForm.description) {
        formData.append('description', uploadForm.description);
      }

      const response = await fetch('/api/doctors/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      toast.success('Documento enviado com sucesso!');
      setUploadForm({ file: null, type: 'OUTROS', description: '' });
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      loadDocuments();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/doctors/documents/download?id=${documentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao baixar documento');
      }

      // Abrir URL em nova aba para download
      const link = document.createElement('a');
      link.href = data.url;
      link.target = '_blank';
      link.download = fileName;
      link.click();
      
      toast.success('Download iniciado');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/doctors/documents?id=${documentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir documento');
      }

      toast.success('Documento excluído com sucesso');
      loadDocuments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      RG: 'RG',
      CPF: 'CPF',
      DIPLOMA: 'Diploma',
      CRM: 'CRM',
      CONTRATO: 'Contrato',
      OUTROS: 'Outros',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <form onSubmit={handleUpload} className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold">Enviar Novo Documento</h3>
        
        <div>
          <Label htmlFor="file-upload">Arquivo *</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="document-type">Tipo de Documento *</Label>
          <Select
            value={uploadForm.type}
            onValueChange={(v) => setUploadForm((prev) => ({ ...prev, type: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RG">RG</SelectItem>
              <SelectItem value="CPF">CPF</SelectItem>
              <SelectItem value="DIPLOMA">Diploma</SelectItem>
              <SelectItem value="CRM">CRM</SelectItem>
              <SelectItem value="CONTRATO">Contrato</SelectItem>
              <SelectItem value="OUTROS">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={uploadForm.description}
            onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição opcional do documento"
            rows={3}
          />
        </div>

        <Button type="submit" disabled={uploading || !uploadForm.file}>
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <FileUp className="mr-2 h-4 w-4" />
          Enviar Documento
        </Button>
      </form>

      {/* Documents List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Meus Documentos</h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>Nenhum documento enviado ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {getDocumentTypeLabel(doc.type)}
                        </span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>
                          {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc.id, doc.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O documento será permanentemente excluído.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(doc.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
