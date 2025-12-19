// Zod validation schemas
import { z } from 'zod'

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const signupSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

// ============================================
// User Management Schemas
// ============================================

export const createUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.string().min(1, 'Role é obrigatória'),
  sector: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const updateUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  role: z.string().min(1, 'Role é obrigatória').optional(),
  sector: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
})

export const updateProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  image: z.string().url('URL inválida').optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres').optional(),
}).refine(
  (data) => {
    // Se newPassword foi fornecido, currentPassword é obrigatório
    if (data.newPassword && !data.currentPassword) {
      return false
    }
    return true
  },
  {
    message: 'Senha atual é obrigatória para alterar a senha',
    path: ['currentPassword'],
  }
)

// ============================================
// Permission Schemas
// ============================================

export const permissionSchema = z.object({
  userId: z.string(),
  toolName: z.string(),
  canAccess: z.boolean(),
})

// ============================================
// Doctor Schemas
// ============================================

export const doctorPersonalSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  phone: z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos'),
  birthDate: z.string().optional(),
  graduationDate: z.string().optional(),
  councilType: z.enum(['CRM', 'CRO', 'CREFITO', 'CRF'], {
    errorMap: () => ({ message: 'Tipo de conselho inválido' }),
  }),
  councilNumber: z.string().min(4, 'Número do conselho deve ter no mínimo 4 caracteres'),
  councilState: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  companyName: z.string().optional(),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos').optional(),
  taxRegime: z.enum(['LP', 'SN', 'LR'], {
    errorMap: () => ({ message: 'Regime tributário inválido' }),
  }).optional(),
})

export const doctorBankSchema = z.object({
  bankNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
  pixKeyType: z.string().optional(),
  pixKey: z.string().optional(),
})

export const doctorScheduleSchema = z.object({
  scheduleCode: z.string().min(1, 'Código da agenda é obrigatório'),
  scheduleName: z.string().min(1, 'Nome da agenda é obrigatório'),
  sector: z.enum(['AMBULATORIO', 'EMERGENCIA', 'CENTRO_CIRURGICO'], {
    errorMap: () => ({ message: 'Setor inválido' }),
  }),
  patientsPerHour: z.number().int().positive('Pacientes por hora deve ser positivo'),
  hourlyRate: z.number().positive('Taxa horária deve ser positiva'),
  exceedBonus: z.number().min(0).max(100).default(40),
  weekDays: z.array(z.number().int().min(0).max(6)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (formato: HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (formato: HH:MM)'),
})

export const doctorPaymentSchema = z.object({
  paymentType: z.enum(['FIXED', 'VARIABLE']).default('VARIABLE'),
  paymentClass: z.enum(['CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5']).default('CLASS_1'),
  monthlyFixedValue: z.number().positive().optional(),
})

export const createDoctorSchema = z.object({
  personal: doctorPersonalSchema,
  bank: doctorBankSchema.optional(),
  schedules: z.array(doctorScheduleSchema).optional(),
  payment: doctorPaymentSchema.optional(),
})

export const updateDoctorSchema = z.object({
  personal: doctorPersonalSchema.partial().optional(),
  bank: doctorBankSchema.partial().optional(),
  payment: doctorPaymentSchema.partial().optional(),
})

export const approveDoctorSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Ação deve ser "approve" ou "reject"' }),
  }),
  rejectedReason: z.string().optional(),
})

export const registerDoctorSchema = z.object({
  // Dados Pessoais
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  phone: z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos'),
  birthDate: z.string().optional(),
  graduationDate: z.string().optional(),
  councilType: z.enum(['CRM', 'CRO', 'CREFITO', 'CRF'], {
    errorMap: () => ({ message: 'Tipo de conselho inválido' }),
  }),
  councilNumber: z.string().min(4, 'Número do conselho deve ter no mínimo 4 caracteres'),
  councilState: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),

  // Dados Empresariais
  companyName: z.string().optional(),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos').optional(),
  taxRegime: z.enum(['LP', 'SN', 'LR'], {
    errorMap: () => ({ message: 'Regime tributário inválido' }),
  }).optional(),

  // Dados Bancários
  bankNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
  pixKeyType: z.string().optional(),
  pixKey: z.string().optional(),
})

// ============================================
// Appointment Schemas
// ============================================

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid('ID do médico inválido'),
  scheduleCode: z.string().min(1, 'Código da agenda é obrigatório'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data inválida',
  }),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (formato: HH:MM)'),
  patientName: z.string().min(3, 'Nome do paciente deve ter no mínimo 3 caracteres'),
  patientPhone: z.string().optional(),
  patientEmail: z.string().email('Email inválido').optional(),
  healthPlan: z.string().optional(),
})

export const updateAppointmentSchema = z.object({
  status: z.enum([
    'SCHEDULED',
    'CONFIRMED',
    'WAITING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]).optional(),
  notes: z.string().optional(),
})

// ============================================
// Production Schemas
// ============================================

export const createProductionSchema = z.object({
  doctorId: z.string().uuid('ID do médico inválido'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data inválida',
  }),
  scheduleCode: z.string().min(1, 'Código da agenda é obrigatório'),
  scheduleName: z.string().min(1, 'Nome da agenda é obrigatório'),
  scheduledHours: z.number().nonnegative('Horas agendadas deve ser não-negativo'),
  workedHours: z.number().nonnegative('Horas trabalhadas deve ser não-negativo'),
  scheduledPatients: z.number().int().nonnegative('Pacientes agendados deve ser não-negativo'),
  attendedPatients: z.number().int().nonnegative('Pacientes atendidos deve ser não-negativo'),
  exceededPatients: z.number().int().nonnegative('Pacientes excedentes deve ser não-negativo'),
})

export const calculateProductionSchema = z.object({
  month: z.number().int().min(1).max(12, 'Mês deve estar entre 1 e 12'),
  year: z.number().int().min(2020).max(2100, 'Ano inválido'),
})

export const updateProductionSchema = z.object({
  workedHours: z.number().nonnegative('Horas trabalhadas deve ser não-negativo').optional(),
  attendedPatients: z.number().int().nonnegative('Pacientes atendidos deve ser não-negativo').optional(),
  exceededPatients: z.number().int().nonnegative('Pacientes excedentes deve ser não-negativo').optional(),
})

// ============================================
// Report Schemas
// ============================================

export const generatePaymentReportSchema = z.object({
  month: z.number().int().min(1).max(12, 'Mês deve estar entre 1 e 12'),
  year: z.number().int().min(2020).max(2100, 'Ano inválido'),
  doctorId: z.string().uuid('ID do médico inválido').optional(),
})

export const exportPaymentReportSchema = z.object({
  month: z.coerce.number().int().min(1).max(12, 'Mês deve estar entre 1 e 12'),
  year: z.coerce.number().int().min(2020).max(2100, 'Ano inválido'),
  doctorId: z.string().uuid('ID do médico inválido').optional(),
})

// ============================================
// Query Parameter Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const doctorQuerySchema = z.object({
  search: z.string().optional(),
  active: z.string().optional(),
  ...paginationSchema.shape,
})

export const appointmentQuerySchema = z.object({
  date: z.string().optional(),
  doctorId: z.string().optional(),
  status: z.enum([
    'SCHEDULED',
    'CONFIRMED',
    'WAITING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]).optional(),
  ...paginationSchema.shape,
})

export const productionQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  doctorId: z.string().optional(),
  ...paginationSchema.shape,
})

// ============================================
// Type Exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type PermissionInput = z.infer<typeof permissionSchema>

export type DoctorPersonalInput = z.infer<typeof doctorPersonalSchema>
export type DoctorBankInput = z.infer<typeof doctorBankSchema>
export type DoctorScheduleInput = z.infer<typeof doctorScheduleSchema>
export type DoctorPaymentInput = z.infer<typeof doctorPaymentSchema>
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>

export type CreateProductionInput = z.infer<typeof createProductionSchema>
export type UpdateProductionInput = z.infer<typeof updateProductionSchema>
export type CalculateProductionInput = z.infer<typeof calculateProductionSchema>

export type ApproveDoctorInput = z.infer<typeof approveDoctorSchema>
export type RegisterDoctorInput = z.infer<typeof registerDoctorSchema>

export type GeneratePaymentReportInput = z.infer<typeof generatePaymentReportSchema>
export type ExportPaymentReportInput = z.infer<typeof exportPaymentReportSchema>

export type PaginationInput = z.infer<typeof paginationSchema>
export type DoctorQueryInput = z.infer<typeof doctorQuerySchema>
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>
export type ProductionQueryInput = z.infer<typeof productionQuerySchema>
