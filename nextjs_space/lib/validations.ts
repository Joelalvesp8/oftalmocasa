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
// Type Exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type PermissionInput = z.infer<typeof permissionSchema>
