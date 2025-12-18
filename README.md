# Sistema Oftalmocasa

## 📋 Descrição

Sistema de Gestão Oftalmológica completo desenvolvido para a Oftalmocasa.

## 🚀 Tecnologias

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: NextAuth.js (Email/Senha + Google SSO)
- **UI**: Tailwind CSS + Shadcn/ui
- **Armazenamento**: AWS S3 (documentos médicos)

## 🏗️ Arquitetura

### Setores (8)
- Diretoria
- Administrativo/Financeiro
- Consultórios
- Centro Cirúrgico
- Recepção
- Agendamento
- Exames
- Emergência

### Perfis de Usuário (10 níveis hierárquicos)
1. Diretoria
2. Diretoria Médica
3. Administrador
4. Coordenador
5. Supervisor
6. Agente Administrativo
7. Recepcionista
8. Técnico
9. Médico
10. Médico Convidado

## ✨ Funcionalidades Implementadas

### 1. Sistema de Repasse Médico
- ✅ Configuração de classes de pagamento
- ✅ Cálculo automático de produção
- ✅ Tipos de agenda (Mapa, Pronto Atendimento, etc)
- ✅ Exportação para Excel (ExcelJS)

### 2. Cadastro Médico Externo
- ✅ Registro público de médicos
- ✅ Upload de documentos (RG, CPF, CRM, Comprovantes)
- ✅ Sistema de aprovação administrativa
- ✅ Integração com AWS S3

### 3. Busca Automática de CNPJ
- ✅ Integração com BrasilAPI (gratuita)
- ✅ Preenchimento automático de Razão Social e Regime Tributário
- ✅ Implementado em 3 locais:
  - Cadastro administrativo
  - Registro público
  - Edição de perfil

### 4. Sistema de Ambulatório
- ✅ Controle de atendimentos
- ✅ Dashboard de produção
- ✅ Relatórios financeiros

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- Yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Joelalvesp8/oftalmocasa.git

# Entre na pasta do projeto
cd oftalmocasa/nextjs_space

# Instale as dependências
yarn install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais

# Execute as migrations do banco
yarn prisma migrate dev

# Inicie o servidor de desenvolvimento
yarn dev
```

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `nextjs_space` com:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/oftalmocasa"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Google SSO (opcional)
GOOGLE_CLIENT_ID="seu-client-id"
GOOGLE_CLIENT_SECRET="seu-client-secret"

# AWS S3 (para upload de documentos)
AWS_BUCKET_NAME="seu-bucket"
AWS_FOLDER_PREFIX="oftalmocasa/"
```

## 👤 Usuário Administrador Padrão

- **Email**: joelalvesp8@gmail.com
- **Senha**: #Formul@1

## 📂 Estrutura do Projeto

```
oftalmocasa/
└── nextjs_space/
    ├── app/
    │   ├── api/          # Endpoints da API
    │   ├── admin/        # Painel administrativo
    │   ├── ambulatorio/  # Sistema de ambulatório
    │   ├── doctors/      # Gestão de médicos
    │   ├── login/        # Autenticação
    │   └── profile/      # Perfil do usuário
    ├── components/       # Componentes reutilizáveis
    ├── lib/              # Utilitários e configurações
    ├── prisma/           # Schema do banco de dados
    └── public/           # Arquivos estáticos
```

## 🔒 Segurança

- ✅ Autenticação via NextAuth.js
- ✅ Controle de acesso baseado em perfis (RBAC)
- ✅ Validação de formulários com Zod
- ✅ Hash de senhas com bcrypt
- ✅ Proteção de rotas via middleware
- ✅ Arquivos sensíveis protegidos no .gitignore

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
yarn dev

# Build para produção
yarn build

# Iniciar produção
yarn start

# Prisma Studio (visualizar banco)
yarn prisma studio

# Criar migration
yarn prisma migrate dev --name nome_da_migration
```

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
2. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
3. Push para a branch (`git push origin feature/nova-funcionalidade`)
4. Abra um Pull Request

## 📄 Licença

Este projeto é privado e de propriedade da Oftalmocasa.

## 📧 Contato

Para dúvidas ou suporte, entre em contato:
- **Email**: joelalvesp8@gmail.com

---

**Desenvolvido com ❤️ para a Oftalmocasa**
