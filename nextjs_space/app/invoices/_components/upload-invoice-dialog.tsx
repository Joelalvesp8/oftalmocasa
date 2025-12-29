'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface UploadInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function UploadInvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadInvoiceDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [parseResult, setParseResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Verifica se é um arquivo XML
      if (!selectedFile.name.toLowerCase().endsWith('.xml')) {
        toast.error('Por favor, selecione um arquivo XML')
        return
      }

      setFile(selectedFile)
      setParseResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Selecione um arquivo XML')
      return
    }

    try {
      setUploading(true)

      // Ler o conteúdo do arquivo
      const reader = new FileReader()
      reader.onload = async (e) => {
        const xmlContent = e.target?.result as string

        try {
          // Enviar para a API
          const response = await fetch('/api/invoices/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              xmlContent,
              fileName: file.name,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Erro ao processar nota fiscal')
          }

          setParseResult(data.invoice)
          toast.success('Nota fiscal processada com sucesso!')

          // Aguardar 1 segundo para mostrar o resultado e fechar
          setTimeout(() => {
            onSuccess()
            handleClose()
          }, 1500)

        } catch (error: any) {
          console.error('Erro ao fazer upload:', error)
          toast.error(error.message || 'Erro ao processar nota fiscal')
          setUploading(false)
        }
      }

      reader.onerror = () => {
        toast.error('Erro ao ler o arquivo')
        setUploading(false)
      }

      reader.readAsText(file)

    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao processar nota fiscal')
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setParseResult(null)
    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload de Nota Fiscal</DialogTitle>
          <DialogDescription>
            Faça o upload do arquivo XML da nota fiscal (NF-e ou NFS-e)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Área de upload */}
          {!parseResult && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="space-y-2">
                  <FileText className="mx-auto h-12 w-12 text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar um arquivo XML
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Suporta NF-e (Produtos) e NFS-e (Serviços)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Resultado do parse */}
          {parseResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Nota fiscal processada com sucesso!</span>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Número:</span>{' '}
                    <span className="font-medium">{parseResult.number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>{' '}
                    <span className="font-medium">
                      {parseResult.invoiceType === 'PRODUTO' ? 'Produto (NF-e)' : 'Serviço (NFS-e)'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Fornecedor:</span>{' '}
                    <span className="font-medium">{parseResult.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Emissão:</span>{' '}
                    <span className="font-medium">
                      {new Date(parseResult.emissionDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor Total:</span>{' '}
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(parseResult.totalValue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          {!parseResult && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Processar Nota Fiscal
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
