/**
 * S3 File Management
 * Funções para upload, download e gerenciamento de arquivos no S3
 */

import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

/**
 * Upload de arquivo para S3
 * @param buffer Buffer do arquivo
 * @param fileName Nome do arquivo
 * @param isPublic Se o arquivo é público ou privado
 * @returns Caminho completo do arquivo no S3 (cloud_storage_path)
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  isPublic = false
): Promise<string> {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const folder = isPublic ? 'public/uploads' : 'uploads';
  const key = `${folderPrefix}${folder}/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
  });

  await s3Client.send(command);
  return key;
}

/**
 * Obter URL do arquivo
 * @param cloudStoragePath Caminho do arquivo no S3
 * @param isPublic Se o arquivo é público ou privado
 * @returns URL para acessar o arquivo
 */
export async function getFileUrl(
  cloudStoragePath: string,
  isPublic: boolean
): Promise<string> {
  if (isPublic) {
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloudStoragePath}`;
  }

  // Para arquivos privados, gera URL assinada com validade de 1 hora
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Deletar arquivo do S3
 * @param cloudStoragePath Caminho do arquivo no S3
 */
export async function deleteFile(cloudStoragePath: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
  });

  await s3Client.send(command);
}

/**
 * Renomear/mover arquivo no S3
 * @param oldKey Caminho antigo
 * @param newKey Novo caminho
 */
export async function renameFile(
  oldKey: string,
  newKey: string
): Promise<void> {
  // Copiar arquivo para novo local
  const copyCommand = new CopyObjectCommand({
    Bucket: bucketName,
    CopySource: `${bucketName}/${oldKey}`,
    Key: newKey,
  });
  await s3Client.send(copyCommand);

  // Deletar arquivo antigo
  await deleteFile(oldKey);
}
