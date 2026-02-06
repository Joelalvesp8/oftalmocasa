-- CreateEnum
CREATE TYPE "InvoiceOCRStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "InvoiceValidationStatus" AS ENUM ('PENDING_VALIDATION', 'VALID', 'CNPJ_MISMATCH', 'VALUE_MISMATCH', 'MANUAL_VALIDATION', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "totalValue" DOUBLE PRECISION,
    "cnpj" TEXT,
    "ocrStatus" "InvoiceOCRStatus" NOT NULL DEFAULT 'PENDING',
    "ocrProcessedAt" TIMESTAMP(3),
    "ocrErrorMessage" TEXT,
    "cnpjMatches" BOOLEAN,
    "valueMatches" BOOLEAN,
    "validationStatus" "InvoiceValidationStatus" NOT NULL DEFAULT 'PENDING_VALIDATION',
    "validationNotes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_productionId_key" ON "Invoice"("productionId");

-- CreateIndex
CREATE INDEX "Invoice_productionId_idx" ON "Invoice"("productionId");

-- CreateIndex
CREATE INDEX "Invoice_doctorId_idx" ON "Invoice"("doctorId");

-- CreateIndex
CREATE INDEX "Invoice_ocrStatus_idx" ON "Invoice"("ocrStatus");

-- CreateIndex
CREATE INDEX "Invoice_validationStatus_idx" ON "Invoice"("validationStatus");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
