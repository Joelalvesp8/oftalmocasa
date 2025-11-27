// RBAC (Role-Based Access Control) utilities

export const ROLE_HIERARCHY = {
  'Diretoria': 1,
  'Diretoria Médica': 2,
  'Administrador': 3,
  'Coordenador': 4,
  'Supervisor': 5,
  'Agente Administrativo': 6,
  'Recepcionista': 7,
  'Técnico': 8,
  'Médico': 9,
  'Médico Convidado': 10,
} as const

export type UserRole = keyof typeof ROLE_HIERARCHY

// Roles com acesso total ao sistema
export const ADMIN_ROLES: UserRole[] = [
  'Diretoria',
  'Diretoria Médica',
  'Administrador',
]

// Roles de gestão
export const MANAGER_ROLES: UserRole[] = [
  'Coordenador',
  'Supervisor',
]

// Roles operacionais
export const OPERATIONAL_ROLES: UserRole[] = [
  'Agente Administrativo',
  'Recepcionista',
  'Técnico',
]

// Roles médicas
export const MEDICAL_ROLES: UserRole[] = [
  'Médico',
  'Médico Convidado',
]

/**
 * Verifica se um usuário tem permissão de admin
 */
export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role as UserRole)
}

/**
 * Verifica se um usuário tem permissão de gerenciamento
 */
export function isManager(role: string): boolean {
  return MANAGER_ROLES.includes(role as UserRole)
}

/**
 * Verifica se um usuário é médico
 */
export function isMedical(role: string): boolean {
  return MEDICAL_ROLES.includes(role as UserRole)
}

/**
 * Compara nível hierárquico de duas roles
 * Retorna true se role1 tem nível maior ou igual a role2
 */
export function hasHigherOrEqualRole(role1: string, role2: string): boolean {
  const level1 = ROLE_HIERARCHY[role1 as UserRole] ?? 99
  const level2 = ROLE_HIERARCHY[role2 as UserRole] ?? 99
  return level1 <= level2
}

/**
 * Obtém o nível hierárquico de uma role
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role as UserRole] ?? 99
}
