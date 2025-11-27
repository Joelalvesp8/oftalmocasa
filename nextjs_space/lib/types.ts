// Type definitions for the application
import { User as PrismaUser } from '@prisma/client'

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
    id: 'medical-repayment',
    name: 'Repasse Médicos',
    description: 'Sistema de repasse e pagamentos médicos',
    icon: 'Stethoscope',
    href: '/medical-repayment',
    status: 'development',
    requiredRoles: ['Diretoria', 'Diretoria Médica', 'Administrador', 'Médico'],
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
