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
// Invoice Schemas
// ============================================

export const invoiceItemSchema = z.object({
  code: z.string().optional().nullable(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  ncm: z.string().optional().nullable(),
  cfop: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unitValue: z.number().positive('Valor unitário deve ser positivo'),
  totalValue: z.number().positive('Valor total deve ser positivo'),
  discountValue: z.number().min(0, 'Desconto não pode ser negativo').default(0),
  icmsValue: z.number().min(0, 'ICMS não pode ser negativo').default(0),
  ipiValue: z.number().min(0, 'IPI não pode ser negativo').default(0),
  pisValue: z.number().min(0, 'PIS não pode ser negativo').default(0),
  cofinsValue: z.number().min(0, 'COFINS não pode ser negativo').default(0),
  issValue: z.number().min(0, 'ISS não pode ser negativo').default(0),
})

export const invoicePaymentSchema = z.object({
  paymentMethod: z.enum([
    'A_VISTA',
    'FATURADO',
    'CARTAO_CREDITO',
    'CARTAO_DEBITO',
    'BOLETO',
    'PIX',
    'TRANSFERENCIA',
    'CHEQUE',
    'OUTROS'
  ]),
  installmentNumber: z.number().int().positive().default(1),
  totalInstallments: z.number().int().positive().default(1),
  amount: z.number().positive('Valor do pagamento deve ser positivo'),
  dueDate: z.string().or(z.date()).optional().nullable(),
  paymentDate: z.string().or(z.date()).optional().nullable(),
  competenceDate: z.string().or(z.date()),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL']).default('PENDING'),
  bankAccount: z.string().optional().nullable(),
  checkNumber: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const createInvoiceSchema = z.object({
  // Identificação
  number: z.string().min(1, 'Número da nota é obrigatório'),
  series: z.string().optional().nullable(),
  accessKey: z.string().length(44, 'Chave de acesso deve ter 44 dígitos').optional().nullable(),
  invoiceType: z.enum(['PRODUTO', 'SERVICO'], {
    errorMap: () => ({ message: 'Tipo deve ser PRODUTO ou SERVICO' })
  }),

  // Fornecedor
  supplierCnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos'),
  supplierName: z.string().min(1, 'Nome do fornecedor é obrigatório'),
  supplierIe: z.string().optional().nullable(),
  supplierAddress: z.string().optional().nullable(),

  // Datas
  emissionDate: z.string().or(z.date()),
  competenceDate: z.string().or(z.date()),

  // Valores
  subtotal: z.number().positive('Subtotal deve ser positivo'),
  discountValue: z.number().min(0, 'Desconto não pode ser negativo').default(0),
  taxValue: z.number().min(0, 'Impostos não podem ser negativos').default(0),
  freightValue: z.number().min(0, 'Frete não pode ser negativo').default(0),
  insuranceValue: z.number().min(0, 'Seguro não pode ser negativo').default(0),
  otherExpenses: z.number().min(0, 'Outras despesas não podem ser negativas').default(0),
  totalValue: z.number().positive('Valor total deve ser positivo'),

  // Status
  status: z.enum(['PENDING', 'PROCESSED', 'APPROVED', 'REJECTED', 'CANCELLED']).default('PENDING'),

  // Observações
  notes: z.string().optional().nullable(),

  // Relacionamentos
  items: z.array(invoiceItemSchema).min(1, 'Deve haver pelo menos um item'),
  payments: z.array(invoicePaymentSchema).min(1, 'Deve haver pelo menos uma forma de pagamento'),
})

export const updateInvoiceSchema = z.object({
  number: z.string().min(1, 'Número da nota é obrigatório').optional(),
  series: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'PROCESSED', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
})

export const invoiceFilterSchema = z.object({
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  invoiceType: z.enum(['PRODUTO', 'SERVICO']).optional(),
  status: z.enum(['PENDING', 'PROCESSED', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  supplierCnpj: z.string().optional(),
  paymentMethod: z.enum([
    'A_VISTA',
    'FATURADO',
    'CARTAO_CREDITO',
    'CARTAO_DEBITO',
    'BOLETO',
    'PIX',
    'TRANSFERENCIA',
    'CHEQUE',
    'OUTROS'
  ]).optional(),
})

// Schema para upload de XML
export const uploadInvoiceXmlSchema = z.object({
  xmlContent: z.string().min(1, 'Conteúdo XML é obrigatório'),
  fileName: z.string().min(1, 'Nome do arquivo é obrigatório'),
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

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>
export type InvoicePaymentInput = z.infer<typeof invoicePaymentSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>
export type UploadInvoiceXmlInput = z.infer<typeof uploadInvoiceXmlSchema>
