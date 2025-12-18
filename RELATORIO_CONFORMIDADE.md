# 📋 Relatório de Conformidade - Sistema Oftalmocasa

**Data da Análise:** 2025-12-18
**Branch:** `claude/security-typescript-strict-6xWDi`
**Analisado por:** Claude Code

---

## 📊 Resumo Executivo

O sistema Oftalmocasa foi analisado em 10 categorias de boas práticas para desenvolvimento seguro, tipado e resiliente. O relatório identifica **problemas críticos**, **avisos** e **boas práticas** já implementadas.

### Status Geral por Categoria

| # | Categoria | Status | Problemas Críticos | Avisos | Conformidade |
|---|-----------|--------|-------------------|---------|--------------|
| 1 | Segurança | 🟡 Parcial | 3 | 5 | 60% |
| 2 | TypeScript Estrito | 🔴 Crítico | 4 | 2 | 30% |
| 3 | Crash Prevention | 🟡 Parcial | 2 | 4 | 50% |
| 4 | Server vs Client | 🟢 Bom | 0 | 1 | 90% |
| 5 | Prisma | 🟡 Parcial | 3 | 2 | 40% |
| 6 | Next.js Image | 🟢 Bom | 0 | 1 | 95% |
| 7 | Responsividade | 🟡 Parcial | 1 | 3 | 55% |
| 8 | Acessibilidade | 🟡 Parcial | 2 | 3 | 50% |
| 9 | Validação | 🟡 Parcial | 2 | 2 | 60% |
| 10 | Performance | 🔴 Crítico | 3 | 2 | 25% |

**Conformidade Geral: 55%**

---

## 1️⃣ Segurança em Primeiro Lugar

### ✅ Boas Práticas Implementadas

- ✅ **NextAuth.js configurado** com Credentials + Google OAuth
- ✅ **RBAC implementado** com 10 níveis hierárquicos
- ✅ **Middleware de autenticação** protegendo rotas sensíveis
- ✅ **AWS S3** para armazenamento seguro de arquivos
- ✅ **Validações Zod** criadas em `lib/validations.ts`
- ✅ **Bcryptjs** para hash de senhas
- ✅ **Verificação de sessão** em todas as rotas API analisadas

### 🔴 Problemas Críticos

**1. Type Casting Inseguro com `any`**
- **Local:** Múltiplas rotas API
- **Exemplos:**
  ```typescript
  // nextjs_space/app/api/admin/users/route.ts:21
  const userRole = (session.user as any).role ?? ''

  // nextjs_space/app/api/doctors/documents/route.ts:41
  const isAdmin = ['Diretoria', 'Diretoria Médica', 'Administrador'].includes((user as any).role);
  ```
- **Risco:** Permite bypass de validação de tipos, possível acesso a propriedades inexistentes
- **Correção:** Criar type guard ou usar SessionUser interface

**2. Rotas API sem Validação Zod**
- **Rotas afetadas:**
  - `POST /api/doctors/route.ts` - Aceita qualquer JSON
  - `POST /api/ambulatorio/appointments/route.ts` - Sem validação de schema
  - `POST /api/doctors/documents/route.ts` - FormData sem validação estruturada
- **Risco:** Injection attacks, dados inválidos no banco
- **Correção:** Criar schemas Zod e validar antes de processar

**3. Where Clauses com `any`**
- **Local:**
  ```typescript
  // nextjs_space/app/api/doctors/route.ts:17
  const where: any = {}

  // nextjs_space/app/api/ambulatorio/appointments/route.ts:19
  const where: any = {}
  ```
- **Risco:** SQL injection via Prisma (embora mitigado), perda de type safety
- **Correção:** Tipar corretamente com `Prisma.DoctorWhereInput`

### ⚠️ Avisos

1. **Hardcoded roles** - Roles estão em strings literais em vez de enums/constantes
2. **Error messages genéricos** - Podem expor informações sensíveis em logs
3. **Sem rate limiting** - APIs não têm proteção contra brute force
4. **Sem validação de file types** - Upload de documentos aceita qualquer tipo
5. **Presigned URLs com 1 hora** - Pode ser muito tempo para documentos sensíveis

### 🔧 Ações Recomendadas

```typescript
// 1. Criar type guard seguro
export function isSessionUser(user: any): user is SessionUser {
  return user && typeof user.role === 'string' && typeof user.id === 'string'
}

// 2. Criar schemas Zod para todas as rotas
export const createDoctorSchema = z.object({
  personal: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    cpf: z.string().regex(/^\d{11}$/),
    // ... mais campos
  }),
  // ...
})

// 3. Usar Prisma types
import { Prisma } from '@prisma/client'
const where: Prisma.DoctorWhereInput = {}

// 4. Criar constantes para roles
export const ADMIN_ROLES = ['Diretoria', 'Diretoria Médica', 'Administrador'] as const
```

---

## 2️⃣ TypeScript Estrito

### ✅ Boas Práticas Implementadas

- ✅ **tsconfig.json** com `"strict": true` habilitado
- ✅ **Interfaces** criadas em `lib/types.ts`
- ✅ **Prisma types** sendo importados

### 🔴 Problemas Críticos

**1. Uso Massivo de `any` - 73 ocorrências em 31 arquivos**

**Arquivos mais problemáticos:**
- `app/api/doctors/documents/route.ts` - 7 usos de `any`
- `app/doctors/new/page.tsx` - 4 usos
- `app/doctors/new/_components/payment-form.tsx` - 4 usos
- `app/admin/users/[id]/route.ts` - 4 usos

**Exemplos:**
```typescript
// nextjs_space/app/doctors/new/_components/personal-form.tsx:14
interface PersonalFormProps {
  data: any  // ❌ Deveria ser DoctorPersonalData
  onChange: (data: any) => void  // ❌ Deveria ser tipado
}

// nextjs_space/app/ambulatorio/_components/production-dashboard.tsx:21
const [productions, setProductions] = useState<any[]>([])  // ❌ Deveria ser Production[]
```

**2. Props sem Interface Adequada**
```typescript
// Múltiplos componentes
onChange: (data: any) => void
schedules.map((schedule: any) => (...))
Object.values(productionsByDoctor).map((item: any) => ...)
```

**3. Accumulators com `any`**
```typescript
// nextjs_space/app/ambulatorio/_components/production-dashboard.tsx:113
}, {} as any)  // ❌ Deveria tipar o accumulator
```

**4. Session User sem Type Guard**
```typescript
const userRole = (session.user as any).role
```

### ⚠️ Avisos

1. **Interfaces parcialmente implementadas** - Nem todos os componentes usam
2. **Prisma Decimal não tratado** - Números decimais podem causar problemas

### 🔧 Ações Recomendadas

**Criar interfaces completas:**
```typescript
// lib/types.ts
import { Doctor, Production, DoctorSchedule, Prisma } from '@prisma/client'

export interface DoctorPersonalFormData {
  name: string
  email: string
  cpf: string
  phone: string
  birthDate?: string
  graduationDate?: string
  councilType: 'CRM' | 'CRO' | 'CREFITO' | 'CRF'
  councilNumber: string
  councilState?: string
  companyName?: string
  cnpj?: string
  taxRegime?: 'LP' | 'SN' | 'LR'
}

export interface ProductionsByDoctor {
  doctor: Pick<Doctor, 'id' | 'name'>
  productions: Production[]
  totalHours: number
  totalPatients: number
  totalValue: number
}

// Atualizar todos os componentes para usar estas interfaces
```

**Habilitar regras mais estritas no tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 3️⃣ Crash Prevention

### ✅ Boas Práticas Implementadas

- ✅ **Try-catch** em todas as rotas API
- ✅ **Algumas validações** antes de processar dados
- ✅ **Error responses** estruturados

### 🔴 Problemas Críticos

**1. Falta de Optional Chaining Consistente**
```typescript
// nextjs_space/app/api/admin/users/route.ts:21
const userRole = (session.user as any).role ?? ''  // ⚠️ Usa ?? mas sem ?.

// Deveria ser:
const userRole = session?.user?.role ?? ''
```

**2. Acesso a Arrays sem Validação**
```typescript
// Múltiplos locais
doctor.schedules.length === 0  // ❌ E se schedules for undefined?
doctor.schedules[0]  // ❌ Pode crashar

// Deveria ser:
doctor.schedules?.length === 0
doctor.schedules?.[0]
```

### ⚠️ Avisos

1. **Map sem validação prévia**
   ```typescript
   schedules.map((schedule: any) => ...)  // E se schedules for null?
   ```

2. **Prisma queries sem tratamento de null**
   ```typescript
   const doctor = await prisma.doctor.findUnique({ where: { id } })
   // Usa doctor sem verificar if (!doctor)
   ```

3. **FormData sem validação**
   ```typescript
   const file = formData.get('file') as File  // E se não for File?
   ```

4. **Date parsing sem try-catch**
   ```typescript
   new Date(data.date)  // Pode gerar Invalid Date
   ```

### 🔧 Ações Recomendadas

**1. Adicionar Optional Chaining sistematicamente:**
```typescript
// Antes
const userRole = (session.user as any).role ?? ''

// Depois
const userRole = session?.user?.role ?? ''

// Antes
if (doctor.schedules.length === 0) { ... }

// Depois
if (!doctor?.schedules || doctor.schedules.length === 0) { ... }
```

**2. Validar antes de mapear:**
```typescript
// Antes
schedules.map((schedule: any) => ...)

// Depois
const validSchedules = schedules ?? []
validSchedules.map((schedule: DoctorSchedule) => ...)
```

**3. Validar Prisma results:**
```typescript
const doctor = await prisma.doctor.findUnique({ where: { id } })
if (!doctor) {
  return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 })
}
```

**4. Helper para validar datas:**
```typescript
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}
```

---

## 4️⃣ Server vs Client Components

### ✅ Boas Práticas Implementadas

- ✅ **'use client'** corretamente usado em componentes com hooks
- ✅ **Server Components** como padrão nas pages
- ✅ **Separação clara** entre componentes de servidor e cliente
- ✅ **Não há hooks em Server Components**

### ⚠️ Avisos

1. **Alguns client components poderiam ser server components** se refatorados para não usar estado

**Exemplo:**
```typescript
// Poderia ser um server component com server actions
'use client'
export default function SomeForm() {
  const [data, setData] = useState()
  // ...
}
```

### 🔧 Ações Recomendadas

- Revisar componentes client para ver se podem ser migrados para server components com server actions
- Usar React Server Components para melhor performance

---

## 5️⃣ Prisma

### ✅ Boas Práticas Implementadas

- ✅ **Prisma Client** centralizado em `lib/db.ts`
- ✅ **Schema bem estruturado** com relações
- ✅ **Enums** do Prisma sendo usados

### 🔴 Problemas Críticos

**1. Nenhum uso de Transactions**
- **Risco:** Dados inconsistentes em operações complexas
- **Exemplo problema:**
  ```typescript
  // nextjs_space/app/api/doctors/route.ts:85-134
  // Cria médico + schedules sem transaction
  const doctor = await prisma.doctor.create({
    data: {
      // ... dados do médico
      schedules: {
        create: schedules.map(...)  // Se falhar aqui, médico fica sem schedules
      }
    }
  })
  ```

**2. Decimal não convertido para Number**
- **Risco:** Erros em cálculos, problemas com JSON
- **Local:** Qualquer campo Decimal do schema Prisma
- **Schema afetado:**
  ```prisma
  model DoctorSchedule {
    hourlyRate     Decimal  @db.Decimal(10,2)
    exceedBonus    Decimal? @db.Decimal(5,2)
  }

  model Production {
    totalValue     Decimal  @db.Decimal(10,2)
  }
  ```

**3. Falta de Error Handling específico**
```typescript
catch (error) {
  console.error('Erro...', error)
  return NextResponse.json({ error: 'Erro genérico' }, { status: 500 })
}
// ❌ Não trata Prisma errors (P2002 unique constraint, P2025 not found, etc)
```

### ⚠️ Avisos

1. **Queries sem paginação** - `findMany()` sem take/skip
2. **Sem soft deletes** - Deleções são hard deletes

### 🔧 Ações Recomendadas

**1. Usar Transactions para operações complexas:**
```typescript
// Criar médico com schedules
const doctor = await prisma.$transaction(async (tx) => {
  const newDoctor = await tx.doctor.create({
    data: {
      name: personal.name,
      // ... outros dados
    }
  })

  if (schedules && schedules.length > 0) {
    await tx.doctorSchedule.createMany({
      data: schedules.map(s => ({
        ...s,
        doctorId: newDoctor.id
      }))
    })
  }

  return tx.doctor.findUnique({
    where: { id: newDoctor.id },
    include: { schedules: true }
  })
})
```

**2. Converter Decimal para Number:**
```typescript
// Criar helper
export function convertDecimalFields<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj

  const result = { ...obj } as any
  Object.keys(result).forEach(key => {
    if (result[key] && typeof result[key] === 'object' && 'toNumber' in result[key]) {
      result[key] = result[key].toNumber()
    }
  })
  return result
}

// Usar nas queries
const productions = await prisma.production.findMany(...)
const converted = productions.map(convertDecimalFields)
return NextResponse.json({ productions: converted })
```

**3. Tratar erros do Prisma:**
```typescript
import { Prisma } from '@prisma/client'

try {
  // ...
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Registro duplicado' },
        { status: 409 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      )
    }
  }

  console.error('Erro inesperado:', error)
  return NextResponse.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  )
}
```

---

## 6️⃣ Next.js Image

### ✅ Boas Práticas Implementadas

- ✅ **Nenhum uso de `<img>` tag** encontrado
- ✅ Projeto não usa imagens tradicionais HTML

### ⚠️ Avisos

1. **Nenhum uso de `next/image` encontrado** - Se houver imagens no futuro, usar `next/image`

### 🔧 Ações Recomendadas

**Quando adicionar imagens:**
```typescript
import Image from 'next/image'

// ✅ Com container e aspect ratio
<div className="relative aspect-video w-full overflow-hidden rounded-lg">
  <Image
    src="/path/to/image.jpg"
    alt="Descrição significativa da imagem"
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="object-cover"
    priority={false}
  />
</div>

// ✅ Com dimensões fixas
<Image
  src="/logo.png"
  alt="Logo Oftalmocasa"
  width={200}
  height={50}
  sizes="200px"
/>
```

---

## 7️⃣ Responsividade

### ✅ Boas Práticas Implementadas

- ✅ **Tailwind CSS** configurado
- ✅ **Algumas classes responsivas** (grid-cols-2, grid-cols-3)
- ✅ **Grid layouts** para organização

### 🔴 Problemas Críticos

**1. Baixo uso de classes responsivas - apenas 20 ocorrências**
- Para um projeto com 118 arquivos TypeScript, isso é insuficiente
- Muitos componentes não adaptam para mobile

### ⚠️ Avisos

1. **Tabelas sem overflow** - Podem quebrar em mobile
2. **Forms com grid-cols fixo** - Não se adaptam para telas pequenas
3. **Sem container queries** - Layouts não respondem ao contexto

**Exemplos problemáticos:**
```typescript
// nextjs_space/app/doctors/new/_components/personal-form.tsx:94
<div className="grid grid-cols-2 gap-4">
  {/* ❌ Sempre 2 colunas, mesmo em mobile */}
</div>

// nextjs_space/app/doctors/new/_components/personal-form.tsx:119
<div className="grid grid-cols-3 gap-4">
  {/* ❌ 3 colunas em mobile = ilegível */}
</div>
```

### 🔧 Ações Recomendadas

**1. Mobile-First com breakpoints:**
```typescript
// ❌ Antes
<div className="grid grid-cols-2 gap-4">

// ✅ Depois (mobile-first)
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

// ❌ Antes
<div className="grid grid-cols-3 gap-4">

// ✅ Depois
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

// ✅ Tabelas responsivas
<div className="overflow-x-auto">
  <Table className="min-w-full">
    ...
  </Table>
</div>

// ✅ Flex com wrap
<div className="flex flex-col gap-2 md:flex-row md:items-center">
```

**2. Testar em todos os breakpoints:**
- Mobile: 320px - 640px
- Tablet: 640px - 1024px
- Desktop: 1024px+

---

## 8️⃣ Acessibilidade

### ✅ Boas Práticas Implementadas

- ✅ **Labels em formulários** com `htmlFor`
- ✅ **Semantic HTML** em componentes UI (Radix UI)
- ✅ **Alguns aria-labels** (8 ocorrências)

### 🔴 Problemas Críticos

**1. Falta de aria-labels em ícones interativos**
```typescript
// Ícones de botões sem descrição
<Button>
  <Search className="h-4 w-4 mr-2" />  {/* ❌ Sem aria-label */}
  Buscar
</Button>

<Button variant="outline">
  <Download className="h-4 w-4" />  {/* ❌ Só ícone, sem texto */}
</Button>
```

**2. Inputs sem descrições adequadas**
```typescript
// Inputs de data sem format hint
<Input
  type="date"
  value={data.birthDate || ''}
  // ❌ Falta aria-describedby com formato esperado
/>
```

### ⚠️ Avisos

1. **Select sem aria-label quando não tem label visual**
2. **Tabelas sem caption**
3. **Modals sem aria-describedby**

### 🔧 Ações Recomendadas

**1. Adicionar aria-labels em ícones:**
```typescript
// ✅ Botão só com ícone
<Button
  variant="outline"
  aria-label="Baixar relatório em Excel"
>
  <Download className="h-4 w-4" />
</Button>

// ✅ Ícone decorativo
<Button>
  <Search className="h-4 w-4 mr-2" aria-hidden="true" />
  Buscar CNPJ
</Button>
```

**2. Melhorar descrições de inputs:**
```typescript
<div>
  <Label htmlFor="cpf">CPF *</Label>
  <Input
    id="cpf"
    aria-describedby="cpf-format"
    aria-required="true"
  />
  <span id="cpf-format" className="text-xs text-muted-foreground">
    Formato: 000.000.000-00
  </span>
</div>
```

**3. Adicionar captions em tabelas:**
```typescript
<Table>
  <caption className="sr-only">
    Produção médica por médico no mês selecionado
  </caption>
  <TableHeader>...</TableHeader>
</Table>
```

---

## 9️⃣ Validação

### ✅ Boas Práticas Implementadas

- ✅ **Zod schemas criados** em `lib/validations.ts`
- ✅ **Validação de autenticação** (loginSchema, signupSchema)
- ✅ **Validação de usuários** (createUserSchema, updateUserSchema)
- ✅ **Mensagens de erro** estruturadas

### 🔴 Problemas Críticos

**1. Schemas Zod não usados em todas as rotas**

**Rotas SEM validação Zod:**
- ❌ `POST /api/doctors` - Aceita qualquer JSON (linhas 56-144)
- ❌ `POST /api/ambulatorio/appointments` - Sem validação de schema (linhas 75-126)
- ❌ `POST /api/doctors/[id]` - PUT sem validação
- ❌ `POST /api/ambulatorio/production`

**Rotas COM validação Zod:** ✅
- `POST /api/admin/users` - Usa createUserSchema
- `POST /api/signup` - Usa signupSchema
- `PUT /api/profile` - Usa updateProfileSchema

**2. Falta de schemas Zod para entidades principais**
- Faltam schemas para: Doctor, Appointment, Production, DoctorSchedule

### ⚠️ Avisos

1. **Mensagens de erro genéricas** - Não especificam qual campo falhou
2. **Validação de CPF/CNPJ** - Apenas formato, não valida dígitos verificadores

### 🔧 Ações Recomendadas

**1. Criar schemas Zod completos:**
```typescript
// lib/validations.ts

export const doctorPersonalSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  phone: z.string().min(10, 'Telefone inválido'),
  birthDate: z.string().optional(),
  graduationDate: z.string().optional(),
  councilType: z.enum(['CRM', 'CRO', 'CREFITO', 'CRF']),
  councilNumber: z.string().min(4),
  councilState: z.string().length(2).optional(),
  companyName: z.string().optional(),
  cnpj: z.string().regex(/^\d{14}$/).optional(),
  taxRegime: z.enum(['LP', 'SN', 'LR']).optional(),
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
  scheduleCode: z.string().min(1),
  scheduleName: z.string().min(1),
  sector: z.enum(['AMBULATORIO', 'EMERGENCIA', 'CENTRO_CIRURGICO']),
  patientsPerHour: z.number().int().positive(),
  hourlyRate: z.number().positive(),
  exceedBonus: z.number().min(0).max(100).default(40),
  weekDays: z.array(z.number().int().min(0).max(6)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
})

export const createDoctorSchema = z.object({
  personal: doctorPersonalSchema,
  bank: doctorBankSchema.optional(),
  schedules: z.array(doctorScheduleSchema).optional(),
  payment: z.object({
    paymentType: z.enum(['FIXED', 'VARIABLE']).default('VARIABLE'),
    paymentClass: z.enum(['CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5']).default('CLASS_1'),
    monthlyFixedValue: z.number().positive().optional(),
  }).optional(),
})

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid('ID do médico inválido'),
  scheduleCode: z.string().min(1),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data inválida',
  }),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  patientName: z.string().min(3),
  patientPhone: z.string().optional(),
  patientEmail: z.string().email().optional(),
  healthPlan: z.string().optional(),
})

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
```

**2. Aplicar validação nas rotas:**
```typescript
// app/api/doctors/route.ts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // ✅ Validar com Zod
    const validation = createDoctorSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { personal, bank, schedules, payment } = validation.data

    // ... resto do código
  } catch (error) {
    // ...
  }
}
```

**3. Validar CPF/CNPJ com dígitos verificadores:**
```typescript
// lib/validations.ts
export const cpfSchema = z.string().refine(validateCPF, {
  message: 'CPF inválido',
})

export const cnpjSchema = z.string().refine(validateCNPJ, {
  message: 'CNPJ inválido',
})

function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  // Validar dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (parseInt(cpf.charAt(9)) !== digit) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (parseInt(cpf.charAt(10)) !== digit) return false

  return true
}

function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, '')
  if (cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  // Validar dígitos verificadores (implementação similar ao CPF)
  // ... código de validação

  return true
}
```

---

## 🔟 Performance

### ✅ Boas Práticas Implementadas

- ✅ **Prisma select** para reduzir dados retornados
- ✅ **Next.js App Router** com otimizações automáticas

### 🔴 Problemas Críticos

**1. Sem Dynamic Imports para componentes pesados**
- Todos os componentes são carregados eagerly
- Modais, dashboards com gráficos carregam imediatamente

**Exemplos:**
```typescript
// ❌ Carrega tudo imediatamente
import ProductionDashboard from './_components/production-dashboard'
import AttendanceControl from './_components/attendance-control'

// ✅ Deveria usar dynamic import
const ProductionDashboard = dynamic(() => import('./_components/production-dashboard'), {
  loading: () => <Skeleton />
})
```

**2. Sem Paginação em Listagens**
- `GET /api/doctors` - Retorna TODOS os médicos
- `GET /api/ambulatorio/appointments` - Retorna TODOS os agendamentos do dia
- `GET /api/admin/users` - Retorna TODOS os usuários

**Risco:** Com crescimento da base, queries lentas e timeouts

**3. Sem Cache Strategies**
- Todas as queries são dinâmicas (`export const dynamic = 'force-dynamic'`)
- Nenhum uso de `revalidate`, `cache`, ou `unstable_cache`
- Dados estáticos (roles, setores) recarregam sempre

### ⚠️ Avisos

1. **Queries sem índices otimizados** - Verificar schema Prisma
2. **Múltiplas queries sequenciais** - Poderiam ser paralelas

### 🔧 Ações Recomendadas

**1. Implementar Dynamic Imports:**
```typescript
// app/ambulatorio/page.tsx
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const ProductionDashboard = dynamic(
  () => import('./_components/production-dashboard'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false // Se não precisa SSR
  }
)

const AttendanceControl = dynamic(
  () => import('./_components/attendance-control'),
  { loading: () => <Skeleton className="h-96" /> }
)
```

**2. Adicionar Paginação:**
```typescript
// app/api/doctors/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const skip = (page - 1) * limit

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      take: limit,
      skip,
      orderBy: { name: 'asc' }
    }),
    prisma.doctor.count({ where })
  ])

  return NextResponse.json({
    doctors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
}
```

**3. Implementar Cache:**
```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache'

export const getRoles = unstable_cache(
  async () => {
    return await prisma.role.findMany({
      orderBy: { level: 'asc' }
    })
  },
  ['roles'],
  { revalidate: 3600 } // Cache por 1 hora
)

export const getSectors = unstable_cache(
  async () => {
    return await prisma.sector.findMany({
      orderBy: { name: 'asc' }
    })
  },
  ['sectors'],
  { revalidate: 3600 }
)
```

**4. Paralelizar queries independentes:**
```typescript
// ❌ Antes (sequencial)
const doctor = await prisma.doctor.findUnique({ where: { id } })
const documents = await prisma.doctorDocument.findMany({ where: { doctorId: id } })

// ✅ Depois (paralelo)
const [doctor, documents] = await Promise.all([
  prisma.doctor.findUnique({ where: { id } }),
  prisma.doctorDocument.findMany({ where: { doctorId: id } })
])
```

**5. Adicionar índices no Prisma Schema:**
```prisma
model Doctor {
  // ...

  @@index([email])
  @@index([cpf])
  @@index([cnpj])
  @@index([isActive])
}

model Appointment {
  // ...

  @@index([doctorId])
  @@index([date])
  @@index([status])
  @@index([doctorId, date])
}

model Production {
  // ...

  @@index([doctorId])
  @@index([month, year])
  @@index([doctorId, month, year])
}
```

---

## 📝 Plano de Ação Prioritário

### 🔴 Alta Prioridade (Crítico)

1. **Eliminar todos os usos de `any`** (73 ocorrências)
   - Criar interfaces completas em `lib/types.ts`
   - Atualizar todos os componentes e rotas
   - Prazo: 3-5 dias

2. **Adicionar validação Zod em todas as rotas API**
   - Criar schemas para Doctor, Appointment, Production
   - Aplicar em todas as rotas POST/PUT
   - Prazo: 2-3 dias

3. **Implementar Prisma Transactions**
   - Identificar operações críticas
   - Adicionar transactions em criação/atualização de médicos
   - Prazo: 1-2 dias

4. **Adicionar Paginação**
   - Implementar em /api/doctors, /api/appointments, /api/users
   - Atualizar componentes frontend
   - Prazo: 2 dias

### 🟡 Média Prioridade

5. **Corrigir Type Casting Inseguro**
   - Criar type guards
   - Substituir `(user as any).role` por acesso seguro
   - Prazo: 1 dia

6. **Adicionar Optional Chaining Consistente**
   - Revisar todos os acessos a objetos/arrays
   - Adicionar `?.` e `??` onde necessário
   - Prazo: 1-2 dias

7. **Implementar Responsividade Mobile-First**
   - Atualizar grids e layouts
   - Testar em mobile/tablet
   - Prazo: 2-3 dias

8. **Melhorar Acessibilidade**
   - Adicionar aria-labels
   - Melhorar descrições
   - Prazo: 1-2 dias

### 🟢 Baixa Prioridade (Melhorias)

9. **Adicionar Dynamic Imports**
   - Lazy load componentes pesados
   - Prazo: 1 dia

10. **Implementar Cache Strategies**
    - Cache para dados estáticos
    - Revalidação inteligente
    - Prazo: 1-2 dias

11. **Converter Decimal para Number**
    - Criar helper
    - Aplicar em todas as queries
    - Prazo: 1 dia

12. **Melhorar Error Handling**
    - Tratar erros específicos do Prisma
    - Mensagens mais descritivas
    - Prazo: 1 dia

---

## 📊 Métricas de Sucesso

### Antes (Estado Atual)
- ❌ 73 usos de `any`
- ❌ 6 rotas sem validação Zod
- ❌ 0 transactions
- ❌ 0 paginação
- ❌ 20 classes responsivas
- ❌ 8 aria-labels
- ⚠️ 55% conformidade geral

### Depois (Meta)
- ✅ 0 usos de `any`
- ✅ 100% rotas com validação Zod
- ✅ Transactions em operações críticas
- ✅ Paginação em todas as listagens
- ✅ 100+ classes responsivas
- ✅ 50+ aria-labels
- ✅ 90%+ conformidade geral

---

## 🎯 Próximos Passos

1. **Revisar este relatório** com a equipe
2. **Priorizar correções** baseado em risco/impacto
3. **Criar issues/tasks** no sistema de gestão
4. **Implementar correções** por categoria
5. **Testar** cada correção
6. **Code review** das mudanças
7. **Re-análise** após implementação

---

## 📚 Recursos Recomendados

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Zod Documentation](https://zod.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Accessibility (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Relatório gerado automaticamente por Claude Code**
**Para dúvidas ou suporte, consulte a documentação ou abra uma issue.**
