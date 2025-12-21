-- CreateEnum
CREATE TYPE "ProductionDoctorApprovalStatus" AS ENUM ('PENDING_DOCTOR_APPROVAL', 'APPROVED_BY_DOCTOR', 'CONTESTED', 'CONTEST_RESOLVED');

-- AlterTable
ALTER TABLE "Production"
ADD COLUMN "doctorApprovalStatus" "ProductionDoctorApprovalStatus" NOT NULL DEFAULT 'PENDING_DOCTOR_APPROVAL',
ADD COLUMN "doctorApprovedAt" TIMESTAMP(3),
ADD COLUMN "contestReason" TEXT,
ADD COLUMN "contestedAt" TIMESTAMP(3),
ADD COLUMN "contestResolvedAt" TIMESTAMP(3),
ADD COLUMN "contestResolvedBy" TEXT,
ADD COLUMN "contestResolution" TEXT;

-- CreateIndex
CREATE INDEX "Production_doctorApprovalStatus_idx" ON "Production"("doctorApprovalStatus");
