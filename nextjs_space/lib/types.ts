// Type definitions for the application
import {
  User as PrismaUser,
  Doctor as PrismaDoctor,
  DoctorSchedule as PrismaDoctorSchedule,
  Production as PrismaProduction,
  Appointment as PrismaAppointment,
  PaymentReport as PrismaPaymentReport,
  DoctorDocument as PrismaDoctorDocument,
  PaymentType,
  PaymentClass,
  TaxRegime,
  DoctorSector,
  ProductionStatus,
  AppointmentStatus,
  DoctorStatus,
  ReportStatus,
  Prisma
} from '@prisma/client'

// ============================================
// Session & User Types
// ============================================

export interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
  sector?: string | null
}

export interface UserWithPermissions extends PrismaUser {
  permissions?: {
    toolName: string
    canAccess: boolean
  }[]
}

// Type guard for SessionUser
export function isSessionUser(user: unknown): user is SessionUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    typeof (user as SessionUser).id === 'string'
  )
}

// Type guard for checking if user has role
export function hasRole(user: unknown): user is SessionUser & { role: string } {
  return isSessionUser(user) && typeof user.role === 'string'
}

// ============================================
// Doctor Form Data Types
// ============================================

export interface DoctorPersonalFormData {
  name: string
  email: string
  cpf: string
  phone: string
  birthDate?: string
  graduationDate?: string
  councilType: string
  councilNumber: string
  councilState?: string
  companyName?: string
  cnpj?: string
  taxRegime?: TaxRegime
}

export interface DoctorBankFormData {
  bankNumber?: string
  bankName?: string
  bankAgency?: string
  bankAccount?: string
  pixKeyType?: string
  pixKey?: string
}

export interface DoctorScheduleFormData {
  scheduleCode: string
  scheduleName: string
  sector: DoctorSector
  patientsPerHour: number
  hourlyRate: number
  exceedBonus?: number
  weekDays: number[]
  startTime: string
  endTime: string
}

export interface DoctorPaymentFormData {
  paymentType: PaymentType
  paymentClass: PaymentClass
  monthlyFixedValue?: number
}

export interface CreateDoctorFormData {
  personal: DoctorPersonalFormData
  bank?: DoctorBankFormData
  schedules?: DoctorScheduleFormData[]
  payment?: DoctorPaymentFormData
}

// ============================================
// Appointment Types
// ============================================

export interface CreateAppointmentData {
  doctorId: string
  scheduleCode: string
  date: string
  time: string
  patientName: string
  patientPhone?: string
  patientEmail?: string
  healthPlan?: string
}

export interface AppointmentWithDoctor extends PrismaAppointment {
  doctor: Pick<PrismaDoctor, 'id' | 'name' | 'councilType' | 'councilNumber'>
}

export interface AppointmentStatistics {
  scheduled: number
  confirmed: number
  waiting: number
  inProgress: number
  completed: number
  noShow: number
}

// ============================================
// Production Types
// ============================================

export interface ProductionWithDoctor extends PrismaProduction {
  doctor: Pick<PrismaDoctor, 'id' | 'name'>
}

export interface ProductionSummary {
  totalHours: number
  totalPatients: number
  totalValue: number
}

export interface ProductionsByDoctor {
  doctor: Pick<PrismaDoctor, 'id' | 'name'>
  productions: PrismaProduction[]
  totalHours: number
  totalPatients: number
  totalValue: number
}

// ============================================
// API Response Types
// ============================================

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

export interface ApiError {
  error: string
  details?: Record<string, string[]>
}

// ============================================
// Where Input Types (for API queries)
// ============================================

export type DoctorWhereInput = Prisma.DoctorWhereInput
export type AppointmentWhereInput = Prisma.AppointmentWhereInput
export type ProductionWhereInput = Prisma.ProductionWhereInput
export type UserWhereInput = Prisma.UserWhereInput

// ============================================
// Original Types
// ============================================

export interface Tool {
  id: string
  name: string
  description: string
  icon: string
  href: string
  status: 'active' | 'development' | 'disabled'
  requiredRoles?: string[]
}

export interface Sector {
  id: string
  name: string
  description?: string | null
}

export interface Role {
  id: string
  name: string
  description?: string | null
  level: number
}

// ============================================
// Constants
// ============================================

export const ADMIN_ROLES = ['Diretoria', 'Diretoria Médica', 'Administrador'] as const
export const MEDICAL_ROLES = ['Médico', 'Médico Convidado'] as const
export const MANAGER_ROLES = ['Coordenador', 'Supervisor'] as const

export type AdminRole = typeof ADMIN_ROLES[number]
export type MedicalRole = typeof MEDICAL_ROLES[number]
export type ManagerRole = typeof MANAGER_ROLES[number]

export const AVAILABLE_TOOLS: Tool[] = [
  {
    id: 'profile',
    name: 'Perfil de Usuário',
    description: 'Visualize e edite suas informações pessoais',
    icon: 'User',
    href: '/profile',
    status: 'active',
  },
  {
    id: 'financial',
    name: 'Controle Financeiro',
    description: 'Gestão financeira e controle de receitas',
    icon: 'DollarSign',
    href: '/financial',
    status: 'development',
    requiredRoles: ['Diretoria', 'Diretoria Médica', 'Administrador'],
  },
  {
    id: 'doctors',
    name: 'Cadastro de Médicos',
    description: 'Gerenciamento de médicos e agendas',
    icon: 'UserCog',
    href: '/doctors',
    status: 'active',
    requiredRoles: ['Diretoria', 'Diretoria Médica', 'Administrador'],
  },
  {
    id: 'ambulatorio',
    name: 'Módulo Ambulatório',
    description: 'Controle de atendimentos e produção médica',
    icon: 'Stethoscope',
    href: '/ambulatorio',
    status: 'active',
    requiredRoles: ['Diretoria', 'Diretoria Médica', 'Administrador', 'Recepcionista', 'Médico'],
  },
  {
    id: 'doctor-profile',
    name: 'Meu Perfil Médico',
    description: 'Gerenciar meus dados e documentos',
    icon: 'UserCircle',
    href: '/doctors/profile',
    status: 'active',
    requiredRoles: ['Médico'],
  },
  {
    id: 'reports',
    name: 'Relatórios',
    description: 'Relatórios detalhados e análises',
    icon: 'FileText',
    href: '/reports',
    status: 'development',
  },
  {
    id: 'dashboards',
    name: 'Dashboards',
    description: 'Visualização gráfica de indicadores',
    icon: 'BarChart',
    href: '/dashboards',
    status: 'development',
  },
  {
    id: 'time-calculator',
    name: 'Calculadora de Banco de Horas',
    description: 'Calcule e gerencie banco de horas',
    icon: 'Clock',
    href: '/time-calculator',
    status: 'development',
  },
  {
    id: 'admin',
    name: 'Gestão de Usuários',
    description: 'Administração de usuários e permissões',
    icon: 'Users',
    href: '/admin',
    status: 'active',
    requiredRoles: ['Diretoria', 'Diretoria Médica', 'Administrador'],
  },
]

// ============================================
// Utility Functions
// ============================================

/**
 * Converte campos Decimal do Prisma para Number
 * Usado para serializar dados do Prisma para JSON
 */
export function convertDecimalFields<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj

  const result = { ...obj }
  Object.keys(result).forEach((key) => {
    const value = result[key]
    if (value && typeof value === 'object' && 'toNumber' in value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(result as any)[key] = (value as { toNumber: () => number }).toNumber()
    } else if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(result as any)[key] = value.map((item) =>
        typeof item === 'object' ? convertDecimalFields(item) : item
      )
    } else if (value && typeof value === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(result as any)[key] = convertDecimalFields(value as Record<string, unknown>)
    }
  })
  return result
}

/**
 * Valida e parseia uma data
 * Retorna null se a data for inválida
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Verifica se um usuário tem role de admin
 */
export function isAdminRole(role: string | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
}
