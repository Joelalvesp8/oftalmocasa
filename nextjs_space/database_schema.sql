-- ============================================
-- SQL COMPLETO DO SISTEMA OFTALMOCASA
-- Execute este SQL no Supabase para criar todas as tabelas
-- ============================================

-- Limpar tabelas existentes (CUIDADO: isto apaga todos os dados!)
-- DROP TABLE IF EXISTS "InvoicePayment" CASCADE;
-- DROP TABLE IF EXISTS "InvoiceItem" CASCADE;
-- DROP TABLE IF EXISTS "Invoice" CASCADE;
-- DROP TABLE IF EXISTS "DoctorDocument" CASCADE;
-- DROP TABLE IF EXISTS "Appointment" CASCADE;
-- DROP TABLE IF EXISTS "Production" CASCADE;
-- DROP TABLE IF EXISTS "PaymentReport" CASCADE;
-- DROP TABLE IF EXISTS "DoctorSchedule" CASCADE;
-- DROP TABLE IF EXISTS "Doctor" CASCADE;
-- DROP TABLE IF EXISTS "Permission" CASCADE;
-- DROP TABLE IF EXISTS "Session" CASCADE;
-- DROP TABLE IF EXISTS "Account" CASCADE;
-- DROP TABLE IF EXISTS "User" CASCADE;
-- DROP TABLE IF EXISTS "VerificationToken" CASCADE;
-- DROP TABLE IF EXISTS "Sector" CASCADE;
-- DROP TABLE IF EXISTS "Role" CASCADE;

-- DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
-- DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
-- DROP TYPE IF EXISTS "InvoiceStatus" CASCADE;
-- DROP TYPE IF EXISTS "InvoiceType" CASCADE;
-- DROP TYPE IF EXISTS "DoctorStatus" CASCADE;
-- DROP TYPE IF EXISTS "AppointmentStatus" CASCADE;
-- DROP TYPE IF EXISTS "ReportStatus" CASCADE;
-- DROP TYPE IF EXISTS "ProductionStatus" CASCADE;
-- DROP TYPE IF EXISTS "DoctorSector" CASCADE;
-- DROP TYPE IF EXISTS "TaxRegime" CASCADE;
-- DROP TYPE IF EXISTS "PaymentClass" CASCADE;
-- DROP TYPE IF EXISTS "PaymentType" CASCADE;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE "PaymentType" AS ENUM ('FIXED', 'VARIABLE');

CREATE TYPE "PaymentClass" AS ENUM ('CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5');

CREATE TYPE "TaxRegime" AS ENUM ('LP', 'SN', 'LR');

CREATE TYPE "DoctorSector" AS ENUM ('AMBULATORIO', 'EMERGENCIA', 'CENTRO_CIRURGICO');

CREATE TYPE "ProductionStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'PAID');

CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'PAID', 'CANCELLED');

CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

CREATE TYPE "DoctorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INCOMPLETE');

CREATE TYPE "InvoiceType" AS ENUM ('PRODUTO', 'SERVICO');

CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PROCESSED', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TYPE "PaymentMethod" AS ENUM ('A_VISTA', 'FATURADO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'PIX', 'TRANSFERENCIA', 'CHEQUE', 'OUTROS');

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL');

-- ============================================
-- TABELAS DO SISTEMA
-- ============================================

-- Tabela: Role
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Role_level_key" ON "Role"("level");
CREATE INDEX "Role_level_idx" ON "Role"("level");

-- Tabela: Sector
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Sector_name_key" ON "Sector"("name");

-- Tabela: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Agente Administrativo',
    "sector" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_sector_idx" ON "User"("sector");

-- Tabela: Account (NextAuth)
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- Tabela: Session (NextAuth)
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- Tabela: VerificationToken (NextAuth)
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- Tabela: Permission
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "canAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Permission_userId_toolName_key" ON "Permission"("userId", "toolName");
CREATE INDEX "Permission_userId_idx" ON "Permission"("userId");
CREATE INDEX "Permission_toolName_idx" ON "Permission"("toolName");

-- Tabela: Doctor
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "graduationDate" TIMESTAMP(3),
    "councilType" TEXT NOT NULL,
    "councilNumber" TEXT NOT NULL,
    "councilState" TEXT,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "cnpj" TEXT,
    "taxRegime" "TaxRegime",
    "bankNumber" TEXT,
    "bankName" TEXT,
    "bankAgency" TEXT,
    "bankAccount" TEXT,
    "pixKeyType" TEXT,
    "pixKey" TEXT,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'VARIABLE',
    "paymentClass" "PaymentClass" NOT NULL DEFAULT 'CLASS_1',
    "monthlyFixedValue" DOUBLE PRECISION,
    "status" "DoctorStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedReason" TEXT,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Doctor_cpf_key" ON "Doctor"("cpf");
CREATE UNIQUE INDEX "Doctor_email_key" ON "Doctor"("email");
CREATE UNIQUE INDEX "Doctor_cnpj_key" ON "Doctor"("cnpj");
CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");
CREATE INDEX "Doctor_cpf_idx" ON "Doctor"("cpf");
CREATE INDEX "Doctor_email_idx" ON "Doctor"("email");
CREATE INDEX "Doctor_isActive_idx" ON "Doctor"("isActive");
CREATE INDEX "Doctor_status_idx" ON "Doctor"("status");
CREATE INDEX "Doctor_userId_idx" ON "Doctor"("userId");

-- Tabela: DoctorSchedule
CREATE TABLE "DoctorSchedule" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "scheduleCode" TEXT NOT NULL,
    "scheduleName" TEXT NOT NULL,
    "sector" "DoctorSector" NOT NULL,
    "patientsPerHour" INTEGER NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "exceedBonus" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "weekDays" JSONB NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorSchedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DoctorSchedule_doctorId_scheduleCode_key" ON "DoctorSchedule"("doctorId", "scheduleCode");
CREATE INDEX "DoctorSchedule_doctorId_idx" ON "DoctorSchedule"("doctorId");
CREATE INDEX "DoctorSchedule_isActive_idx" ON "DoctorSchedule"("isActive");

-- Tabela: Production
CREATE TABLE "Production" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "scheduleCode" TEXT NOT NULL,
    "scheduleName" TEXT NOT NULL,
    "scheduledHours" DOUBLE PRECISION NOT NULL,
    "workedHours" DOUBLE PRECISION NOT NULL,
    "scheduledPatients" INTEGER NOT NULL,
    "attendedPatients" INTEGER NOT NULL,
    "exceededPatients" INTEGER NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "baseValue" DOUBLE PRECISION NOT NULL,
    "exceedValue" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "status" "ProductionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentReportId" TEXT,

    CONSTRAINT "Production_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Production_doctorId_date_scheduleCode_key" ON "Production"("doctorId", "date", "scheduleCode");
CREATE INDEX "Production_doctorId_date_idx" ON "Production"("doctorId", "date");
CREATE INDEX "Production_status_idx" ON "Production"("status");

-- Tabela: PaymentReport
CREATE TABLE "PaymentReport" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "doctorId" TEXT NOT NULL,
    "taxRegime" TEXT NOT NULL,
    "bankNumber" TEXT,
    "bankName" TEXT,
    "bankAgency" TEXT,
    "bankAccount" TEXT,
    "pixKeyType" TEXT,
    "pixKey" TEXT,
    "paymentType" TEXT NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "totalPatients" INTEGER NOT NULL,
    "exceededPatients" INTEGER NOT NULL,
    "baseValue" DOUBLE PRECISION NOT NULL,
    "exceedValue" DOUBLE PRECISION NOT NULL,
    "grossValue" DOUBLE PRECISION NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentReport_doctorId_month_year_key" ON "PaymentReport"("doctorId", "month", "year");
CREATE INDEX "PaymentReport_month_year_idx" ON "PaymentReport"("month", "year");
CREATE INDEX "PaymentReport_status_idx" ON "PaymentReport"("status");

-- Tabela: Appointment
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "scheduleCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT,
    "patientEmail" TEXT,
    "healthPlan" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "arrivedAt" TIMESTAMP(3),
    "attendedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Appointment_doctorId_date_idx" ON "Appointment"("doctorId", "date");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- Tabela: DoctorDocument
CREATE TABLE "DoctorDocument" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DoctorDocument_doctorId_idx" ON "DoctorDocument"("doctorId");
CREATE INDEX "DoctorDocument_type_idx" ON "DoctorDocument"("type");

-- ============================================
-- TABELAS DE NOTAS FISCAIS
-- ============================================

-- Tabela: Invoice
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "series" TEXT,
    "accessKey" TEXT,
    "invoiceType" "InvoiceType" NOT NULL,
    "supplierCnpj" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierIe" TEXT,
    "supplierAddress" TEXT,
    "emissionDate" TIMESTAMP(3) NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "competenceDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freightValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insuranceValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "xmlPath" TEXT,
    "xmlFileName" TEXT,
    "pdfPath" TEXT,
    "notes" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invoice_accessKey_key" ON "Invoice"("accessKey");
CREATE INDEX "Invoice_supplierCnpj_idx" ON "Invoice"("supplierCnpj");
CREATE INDEX "Invoice_invoiceType_idx" ON "Invoice"("invoiceType");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_emissionDate_idx" ON "Invoice"("emissionDate");
CREATE INDEX "Invoice_competenceDate_idx" ON "Invoice"("competenceDate");
CREATE INDEX "Invoice_entryDate_idx" ON "Invoice"("entryDate");

-- Tabela: InvoiceItem
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "ncm" TEXT,
    "cfop" TEXT,
    "unit" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitValue" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "icmsValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ipiValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pisValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cofinsValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- Tabela: InvoicePayment
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "installmentNumber" INTEGER NOT NULL DEFAULT 1,
    "totalInstallments" INTEGER NOT NULL DEFAULT 1,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "competenceDate" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "bankAccount" TEXT,
    "checkNumber" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");
CREATE INDEX "InvoicePayment_paymentMethod_idx" ON "InvoicePayment"("paymentMethod");
CREATE INDEX "InvoicePayment_status_idx" ON "InvoicePayment"("status");
CREATE INDEX "InvoicePayment_dueDate_idx" ON "InvoicePayment"("dueDate");
CREATE INDEX "InvoicePayment_paymentDate_idx" ON "InvoicePayment"("paymentDate");
CREATE INDEX "InvoicePayment_competenceDate_idx" ON "InvoicePayment"("competenceDate");

-- ============================================
-- FOREIGN KEYS (Relacionamentos)
-- ============================================

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Permission" ADD CONSTRAINT "Permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Production" ADD CONSTRAINT "Production_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Production" ADD CONSTRAINT "Production_paymentReportId_fkey" FOREIGN KEY ("paymentReportId") REFERENCES "PaymentReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentReport" ADD CONSTRAINT "PaymentReport_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorDocument" ADD CONSTRAINT "DoctorDocument_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- DADOS INICIAIS (Seeds)
-- ============================================

-- Inserir roles padrão
INSERT INTO "Role" ("id", "name", "description", "level", "createdAt", "updatedAt") VALUES
('role_1', 'Diretoria', 'Acesso total ao sistema', 1, NOW(), NOW()),
('role_2', 'Diretoria Médica', 'Gestão médica e administrativa', 2, NOW(), NOW()),
('role_3', 'Administrador', 'Gestão administrativa', 3, NOW(), NOW()),
('role_4', 'Coordenador', 'Coordenação de equipes', 4, NOW(), NOW()),
('role_5', 'Supervisor', 'Supervisão de setores', 5, NOW(), NOW()),
('role_6', 'Gerente', 'Gerenciamento operacional', 6, NOW(), NOW()),
('role_7', 'Analista', 'Análise e relatórios', 7, NOW(), NOW()),
('role_8', 'Assistente', 'Suporte e assistência', 8, NOW(), NOW()),
('role_9', 'Agente Administrativo', 'Operações básicas', 9, NOW(), NOW()),
('role_10', 'Estagiário', 'Acesso limitado', 10, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Inserir setores padrão
INSERT INTO "Sector" ("id", "name", "description", "createdAt", "updatedAt") VALUES
('sector_1', 'Ambulatório', 'Atendimento ambulatorial', NOW(), NOW()),
('sector_2', 'Emergência', 'Atendimento de emergência', NOW(), NOW()),
('sector_3', 'Centro Cirúrgico', 'Procedimentos cirúrgicos', NOW(), NOW()),
('sector_4', 'Administrativo', 'Setor administrativo', NOW(), NOW()),
('sector_5', 'Financeiro', 'Setor financeiro', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Schema do banco de dados criado com sucesso!';
    RAISE NOTICE 'Total de tabelas: 17';
    RAISE NOTICE 'Total de enums: 12';
    RAISE NOTICE 'Sistema pronto para uso!';
END $$;
