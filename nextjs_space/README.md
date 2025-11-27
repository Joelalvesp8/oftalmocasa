# 🏥 Sistema Oftalmocasa

Sistema administrativo multiusuário completo para gestão oftalmológica com controle de permissões hierarquizadas (RBAC).

## ✨ Funcionalidades Principais

### ✅ Implementadas no MVP

- **Sistema de Autenticação Completo**
  - Login com email/senha
  - Google SSO (Single Sign-On)
  - Proteção de rotas com middleware
  - Sessões JWT seguras

- **Gestão de Usuários (Admin Panel)**
  - Criar, editar e deletar usuários
  - Atribuir roles e setores
  - Ativar/desativar usuários
  - Busca e filtros

- **Sistema RBAC (Role-Based Access Control)**
  - 10 roles hierarquizadas
  - 8 setores organizacionais
  - Controle granular de permissões

- **Dashboard Principal**
  - Cards de ferramentas disponíveis
  - Indicadores de sistema
  - Interface responsiva

- **Perfil de Usuário**
  - Visualização de informações
  - Edição de nome e foto
  - Alteração de senha

- **Progressive Web App (PWA)**
  - Instalável em desktop e mobile
  - Service Worker configurado
  - Ícones e manifest

### 🚧 Em Desenvolvimento

- Controle Financeiro
- Repasse Médicos
- Relatórios e Dashboards
- Calculadora de Banco de Horas

---

## 👥 Estrutura Organizacional

### Setores
1. Diretoria
2. Administrativo/Financeiro
3. Consultórios
4. Centro Cirúrgico
5. Recepção
6. Agendamento
7. Exames
8. Emergência

### Roles (Hierarquia - nível mais baixo = mais poder)

| Nível | Role | Descrição | Acesso |
|-------|------|-----------|--------|
| 1 | Diretoria | Acesso total | Admin completo |
| 2 | Diretoria Médica | Acesso total | Admin completo |
| 3 | Administrador | Acesso total | Admin completo |
| 4 | Coordenador | Gestão do setor | Gerencial |
| 5 | Supervisor | Gestão do setor | Gerencial |
| 6 | Agente Administrativo | Operacional limitado | Operacional |
| 7 | Recepcionista | Operacional limitado | Operacional |
| 8 | Técnico | Operacional limitado | Operacional |
| 9 | Médico | Painel de repasse | Específico |
| 10 | Médico Convidado | Perfil básico | Limitado |

---

## 🔐 Credenciais de Acesso

### Usuário Administrador Principal
- **Email:** `joelalvesp8@gmail.com`
- **Senha:** `#Formul@1`
- **Role:** Administrador
- **Acesso:** Total ao sistema

> ⚠️ **Importante:** Altere a senha após o primeiro acesso!

---

## 🚀 Como Usar

### 1. Primeiro Acesso

1. Acesse a URL do sistema
2. Será redirecionado para `/login`
3. Faça login com as credenciais acima
4. Será redirecionado para `/dashboard`

### 2. Navegação

**Dashboard (`/dashboard`)**
- Página inicial após login
- Cards com ferramentas disponíveis
- Indicadores do sistema

**Gestão de Usuários (`/admin`)** - Apenas admins
- Criar novos usuários
- Editar usuários existentes
- Gerenciar roles e setores
- Ativar/desativar contas

**Perfil (`/profile`)**
- Ver informações pessoais
- Editar nome
- Alterar senha

### 3. Gerenciamento de Usuários

**Criar Usuário:**
1. Acesse `/admin`
2. Clique em "Novo Usuário"
3. Preencha: nome, email, senha, role e setor
4. Clique em "Criar Usuário"

**Editar Usuário:**
1. Na tabela de usuários, clique no menu (⋮)
2. Selecione "Editar"
3. Modifique os dados necessários
4. Salve as alterações

**Deletar Usuário:**
1. No menu do usuário, selecione "Deletar"
2. Confirme a ação
3. O usuário será removido permanentemente

---

## 🛠️ Stack Tecnológica

### Core
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript** (modo estrito)
- **PostgreSQL** (via Prisma)

### Autenticação
- **NextAuth.js v4**
- **bcryptjs** (hash de senhas)
- **Google OAuth** (SSO)

### UI/UX
- **Tailwind CSS**
- **shadcn/ui** (componentes)
- **Lucide React** (ícones)
- **Framer Motion** (animações)

### Validação & Segurança
- **Zod** (validação de schemas)
- **RBAC** customizado
- **Middleware** de proteção de rotas

---

## 🔒 Segurança

### Implementações
✅ Hash de senhas (bcrypt)
✅ Sessões JWT seguras
✅ Proteção de rotas com middleware
✅ Validação Zod em todos os inputs
✅ RBAC granular
✅ Sanitização de dados
✅ CORS configurado
✅ CSRF protection (NextAuth)

---

## 📱 PWA (Progressive Web App)

### Recursos
- Instalável em desktop e mobile
- Ícones otimizados (192x192 e 512x512)
- Service Worker para cache
- Funciona offline (parcialmente)
- Shortcuts do sistema

### Como Instalar
**Desktop (Chrome/Edge):**
1. Acesse o sistema
2. Clique no ícone de instalação na barra de endereço
3. Confirme a instalação

**Mobile (Android/iOS):**
1. Abra no navegador
2. Menu → "Adicionar à tela inicial"
3. Confirme

---

## 🧪 Desenvolvimento

### Comandos Disponíveis

```bash
# Desenvolvimento
yarn dev

# Build de produção
yarn build

# Iniciar produção
yarn start

# Lint
yarn lint

# TypeScript check
yarn tsc --noEmit

# Prisma
yarn prisma generate        # Gerar cliente
yarn prisma db push        # Sincronizar schema
yarn prisma db seed        # Popular banco
yarn prisma studio         # Interface visual
```

### Estrutura de Pastas

```
nextjs_space/
├── app/                    # App Router
│   ├── api/               # API Routes
│   ├── admin/             # Painel Admin
│   ├── dashboard/         # Dashboard
│   ├── login/             # Login
│   ├── profile/           # Perfil
│   └── layout.tsx         # Layout raiz
├── components/            # Componentes React
│   ├── ui/               # shadcn/ui
│   ├── header.tsx        
│   ├── sidebar.tsx       
│   └── tool-card.tsx     
├── lib/                   # Utilitários
│   ├── auth-options.ts   # Config NextAuth
│   ├── rbac.ts           # Sistema RBAC
│   ├── validations.ts    # Schemas Zod
│   └── types.ts          # TypeScript types
├── prisma/
│   └── schema.prisma     # Schema do banco
├── public/               # Assets estáticos
└── scripts/
    └── seed.ts           # Seed do banco
```

---

## 🔧 Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Google SSO (Opcional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## 📋 Próximos Passos

### Funcionalidades Futuras
1. **Controle Financeiro**
   - Lançamentos
   - Fluxo de caixa
   - Conciliação

2. **Repasse Médicos**
   - Cálculo automático
   - Relatórios
   - Histórico

3. **Relatórios e Dashboards**
   - Indicadores visuais
   - Gráficos interativos
   - Exportação PDF/Excel

4. **Calculadora de Banco de Horas**
   - Registro de ponto
   - Cálculo de horas
   - Relatórios individuais

5. **Melhorias Gerais**
   - Notificações em tempo real
   - Auditoria de ações
   - Backup automático
   - Integração com sistemas externos

---

## 📞 Suporte

Para dúvidas, problemas ou sugestões:
- Email: joelalvesp8@gmail.com

---

## 📄 Licença

Sistema proprietário - Uso interno da Oftalmocasa

---

**Desenvolvido com ❤️ para Oftalmocasa**
