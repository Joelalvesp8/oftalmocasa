# 📦 GUIA COMPLETO PARA DEPLOY NA VERCEL - SISTEMA OFTALMOCASA

## ✅ ANÁLISE COMPLETA DO PROJETO

### Status Atual
- ✅ Código do módulo de Notas Fiscais implementado
- ✅ Models do Prisma criados
- ✅ APIs funcionais
- ✅ Frontend completo
- ⚠️ Build apresenta problemas que precisam ser corrigidos

---

## 🔧 CORREÇÕES NECESSÁRIAS ANTES DO DEPLOY

### 1. Problema com Google Fonts
**Erro**: Build falha ao tentar baixar fonte Inter do Google Fonts

**Solução**: Configurar fonts para fallback ou usar fonts locais

Edite `/app/layout.tsx`:

```typescript
// ANTES:
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

// DEPOIS (OPÇÃO 1 - Desabilitar):
// Remover import e usar font-family padrão do Tailwind

// OU OPÇÃO 2 - Configurar com fallback:
import { Inter } from 'next/font/google'
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial']
})
```

### 2. Configuração do Prisma
**Status**: ✅ JÁ CORRIGIDO

O output path foi removido do schema.prisma para usar o padrão.

### 3. Arquivo yarn.lock
**Status**: ✅ JÁ CRIADO

Arquivo criado para compatibilidade com Next.js build.

---

## 📋 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Configure estas variáveis no Vercel Dashboard (Settings > Environment Variables):

### Obrigatórias:
```env
# Banco de Dados (SUPABASE)
DATABASE_URL=postgresql://user:password@host:5432/database

# NextAuth
NEXTAUTH_SECRET=<gerar-string-aleatoria-segura>
NEXTAUTH_URL=https://seu-dominio.vercel.app

# Se usar autenticação OAuth (opcional)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
```

### Opcionais (AWS S3 para armazenamento):
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key
AWS_S3_BUCKET_NAME=seu-bucket
```

**IMPORTANTE**: Não comitar o arquivo `.env` no Git!

---

## 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE

### Passo 1: Criar/Ativar Projeto Supabase
1. Acesse https://supabase.com/dashboard
2. Crie novo projeto ou ative o existente
3. Aguarde inicialização completa

### Passo 2: Executar SQL
1. Vá em **SQL Editor** > **New Query**
2. Cole o conteúdo do arquivo `database_schema.sql`
3. Execute (RUN)
4. Verifique se 17 tabelas foram criadas

### Passo 3: Copiar Connection String
1. Vá em **Settings** > **Database**
2. Copie a **Connection Pooling** URL (recomendado para Vercel)
3. Use no `DATABASE_URL`

Formato:
```
postgresql://postgres.xxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

---

## 🚀 DEPLOY NA VERCEL

### Método 1: Deploy via Dashboard (Recomendado)

1. **Conectar Repositório**
   - Acesse https://vercel.com/new
   - Conecte sua conta GitHub
   - Selecione o repositório `oftalmocasa`
   - Branch: `claude/invoice-entry-module-yHmsZ` (ou main)

2. **Configurar Build**
   ```
   Framework Preset: Next.js
   Root Directory: nextjs_space
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Configurar Variáveis de Ambiente**
   - Adicione todas as variáveis listadas acima
   - ⚠️ Use `DATABASE_URL` do Supabase Connection Pooling
   - ⚠️ Use `NEXTAUTH_URL` com domínio da Vercel

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde build (2-5 minutos)
   - Vercel gerará URL automática: `oftalmocasa.vercel.app`

### Método 2: Deploy via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd /home/user/oftalmocasa/nextjs_space
vercel

# Seguir prompts:
# - Set up and deploy? Yes
# - Scope? Sua conta
# - Link to existing project? No
# - Project name? oftalmocasa
# - Directory? ./
# - Override settings? No

# Deploy para produção
vercel --prod
```

---

## 🔒 BUILD COMMANDS E SCRIPTS

### Scripts disponíveis:
```json
{
  "dev": "next dev",           # Desenvolvimento local
  "build": "next build",        # Build de produção
  "start": "next start",        # Servidor de produção
  "lint": "next lint"           # Linting
}
```

### Build na Vercel:
```bash
# 1. Install
npm install --legacy-peer-deps

# 2. Prisma Generate
npx prisma generate

# 3. Build
npm run build
```

---

## ⚙️ CONFIGURAÇÕES RECOMENDADAS VERCEL

### vercel.json (criar na raiz de nextjs_space)
```json
{
  "buildCommand": "npx prisma generate && npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "regions": ["gru1"],
  "env": {
    "DATABASE_URL": "@database-url"
  }
}
```

### .gitignore (adicionar/verificar)
```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# prisma
prisma/*.db
prisma/*.db-journal
```

---

## 🎯 CHECKLIST PRÉ-DEPLOY

- [ ] Banco Supabase ativo e acessível
- [ ] SQL executado com sucesso (17 tabelas criadas)
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] `NEXTAUTH_URL` aponta para domínio Vercel
- [ ] `DATABASE_URL` usa Connection Pooling do Supabase
- [ ] Código commitado no branch correto
- [ ] Google Fonts configurado com fallback
- [ ] Build local funciona (opcional)

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### 1. Build Timeout na Vercel
**Causa**: Build muito lento
**Solução**:
- Usar `regions: ["gru1"]` no vercel.json (São Paulo)
- Verificar dependências pesadas

### 2. Erro de conexão com Banco
**Causa**: DATABASE_URL incorreta
**Solução**:
- Usar Connection Pooling URL (porta 6543)
- Adicionar `?pgbouncer=true&connection_limit=1`

### 3. NextAuth redirect error
**Causa**: NEXTAUTH_URL incorreta
**Solução**:
- Produção: `https://seu-app.vercel.app`
- Não usar `localhost` em produção

### 4. Prisma Client não gerado
**Causa**: Build não executou `prisma generate`
**Solução**:
- Adicionar `postinstall` script:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### 5. Erro CORS ou API routes
**Causa**: next.config.js mal configurado
**Solução**: Verificar rewrites e headers

---

## 📊 PÓS-DEPLOY

### 1. Criar Primeiro Usuário Admin
```sql
-- Executar no Supabase SQL Editor
INSERT INTO "User" ("id", "name", "email", "password", "role", "isActive", "createdAt", "updatedAt")
VALUES (
  'user_admin_1',
  'Administrador',
  'admin@oftalmocasa.com',
  '$2a$10$hashedpassword', -- Use bcrypt para gerar hash
  'Administrador',
  true,
  NOW(),
  NOW()
);
```

### 2. Testar Funcionalidades
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Upload de Nota Fiscal funciona
- [ ] Parsing de XML funciona
- [ ] Visão de Caixa carrega
- [ ] Visão de Competência carrega

### 3. Monitoramento
- Vercel Analytics: https://vercel.com/dashboard/analytics
- Logs: https://vercel.com/dashboard/logs
- Supabase Logs: Dashboard > Logs

---

## 🚨 SEGURANÇA

### Importante:
1. **Nunca** commitar `.env` no Git
2. **Sempre** usar HTTPS em produção
3. **Gerar** `NEXTAUTH_SECRET` único e seguro:
   ```bash
   openssl rand -base64 32
   ```
4. **Limitar** acesso ao Supabase por IP (opcional)
5. **Habilitar** Row Level Security no Supabase
6. **Usar** variáveis de ambiente para secrets

---

## 📞 SUPORTE

### Recursos:
- Documentação Vercel: https://vercel.com/docs
- Documentação Next.js: https://nextjs.org/docs
- Documentação Prisma: https://www.prisma.io/docs
- Documentação Supabase: https://supabase.com/docs

### Comandos Úteis:
```bash
# Ver logs em tempo real
vercel logs --follow

# Ver deployment info
vercel inspect [url]

# Rollback para versão anterior
vercel rollback

# Deletar deployment
vercel rm [deployment-url]
```

---

## 🎉 PRONTO PARA DEPLOY!

O sistema está pronto para ser implantado. Siga o checklist acima e você terá o **Sistema Oftalmocasa com módulo de Notas Fiscais** rodando em produção na Vercel!

**Tempo estimado de deploy**: 5-10 minutos
**Primeira build**: 2-5 minutos
**Deploys subsequentes**: 1-3 minutos

Boa sorte! 🚀
