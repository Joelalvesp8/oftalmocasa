// Seed script para popular o banco de dados inicial
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ROLES = [
  { name: 'Diretoria', description: 'Acesso total ao sistema', level: 1 },
  { name: 'Diretoria Médica', description: 'Acesso total ao sistema', level: 2 },
  { name: 'Administrador', description: 'Acesso total ao sistema', level: 3 },
  { name: 'Coordenador', description: 'Gestão do setor', level: 4 },
  { name: 'Supervisor', description: 'Gestão do setor', level: 5 },
  { name: 'Agente Administrativo', description: 'Operacional limitado', level: 6 },
  { name: 'Recepcionista', description: 'Operacional limitado', level: 7 },
  { name: 'Técnico', description: 'Operacional limitado', level: 8 },
  { name: 'Médico', description: 'Acesso a painel de repasse', level: 9 },
  { name: 'Médico Convidado', description: 'Perfil e futuras funções', level: 10 },
]

const SECTORS = [
  { name: 'Diretoria', description: 'Diretoria executiva' },
  { name: 'Administrativo/Financeiro', description: 'Gestão administrativa e financeira' },
  { name: 'Consultórios', description: 'Atendimento em consultórios' },
  { name: 'Centro Cirúrgico', description: 'Procedimentos cirúrgicos' },
  { name: 'Recepção', description: 'Atendimento e recepção' },
  { name: 'Agendamento', description: 'Agendamento de consultas e exames' },
  { name: 'Exames', description: 'Realização de exames' },
  { name: 'Emergência', description: 'Atendimento de emergência' },
]

const TOOLS = [
  'Controle Financeiro',
  'Repasse Médicos',
  'Relatórios',
  'Dashboards',
  'Perfil de Usuário',
  'Calculadora de Banco de Horas',
  'Gestão de Usuários',
]

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes (em ordem correta devido às foreign keys)
  console.log('🗑️  Limpando dados existentes...')
  await prisma.permission.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.sector.deleteMany()

  // Popular Roles
  console.log('👥 Criando roles...')
  for (const role of ROLES) {
    await prisma.role.create({
      data: role,
    })
  }
  console.log(`✅ ${ROLES.length} roles criadas`)

  // Popular Setores
  console.log('🏢 Criando setores...')
  for (const sector of SECTORS) {
    await prisma.sector.create({
      data: sector,
    })
  }
  console.log(`✅ ${SECTORS.length} setores criados`)

  // Criar usuário admin principal
  console.log('👤 Criando usuário administrador...')
  const hashedPassword = await bcrypt.hash('#Formul@1', 10)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador Sistema',
      email: 'joelalvesp8@gmail.com',
      password: hashedPassword,
      role: 'Administrador',
      sector: 'Diretoria',
      isActive: true,
    },
  })

  // Criar permissões para o admin (acesso total)
  console.log('🔑 Criando permissões para administrador...')
  for (const tool of TOOLS) {
    await prisma.permission.create({
      data: {
        userId: adminUser.id,
        toolName: tool,
        canAccess: true,
      },
    })
  }

  // Criar usuário de teste padrão (obrigatório para testes)
  console.log('👤 Criando usuário de teste...')
  const testPassword = await bcrypt.hash('johndoe123', 10)
  const testUser = await prisma.user.create({
    data: {
      name: 'Usuário Teste',
      email: 'john@doe.com',
      password: testPassword,
      role: 'Administrador',
      sector: 'Diretoria',
      isActive: true,
    },
  })

  // Criar permissões para o usuário de teste
  for (const tool of TOOLS) {
    await prisma.permission.create({
      data: {
        userId: testUser.id,
        toolName: tool,
        canAccess: true,
      },
    })
  }

  console.log('✅ Seed concluído com sucesso!')
  console.log('\n📊 Resumo:')
  console.log(`  - Roles: ${ROLES.length}`)
  console.log(`  - Setores: ${SECTORS.length}`)
  console.log(`  - Usuários: 2 (admin + teste)`)
  console.log(`  - Permissões: ${TOOLS.length * 2}\n`)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
