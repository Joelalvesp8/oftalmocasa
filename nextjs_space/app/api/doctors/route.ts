import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('active')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { councilNumber: { contains: search } }
      ]
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        schedules: true,
        _count: {
          select: {
            appointments: true,
            productions: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ doctors })
  } catch (error) {
    console.error('Erro ao buscar médicos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar médicos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { personal, bank, schedules, payment } = data

    // Validar se CPF ou email já existem
    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        OR: [
          { cpf: personal.cpf },
          { email: personal.email },
          personal.cnpj ? { cnpj: personal.cnpj } : {}
        ]
      }
    })

    if (existingDoctor) {
      return NextResponse.json(
        { error: 'CPF, email ou CNPJ já cadastrado' },
        { status: 400 }
      )
    }

    // Criar médico com agendas
    const doctor = await prisma.doctor.create({
      data: {
        // Dados pessoais
        name: personal.name,
        birthDate: personal.birthDate ? new Date(personal.birthDate) : null,
        graduationDate: personal.graduationDate ? new Date(personal.graduationDate) : null,
        councilType: personal.councilType,
        councilNumber: personal.councilNumber,
        councilState: personal.councilState,
        cpf: personal.cpf,
        phone: personal.phone,
        email: personal.email,
        
        // Dados empresariais
        companyName: personal.companyName,
        cnpj: personal.cnpj,
        taxRegime: personal.taxRegime,
        
        // Dados bancários
        bankNumber: bank?.bankNumber,
        bankName: bank?.bankName,
        bankAgency: bank?.bankAgency,
        bankAccount: bank?.bankAccount,
        pixKeyType: bank?.pixKeyType,
        pixKey: bank?.pixKey,
        
        // Classificação
        paymentType: payment?.paymentType || 'VARIABLE',
        paymentClass: payment?.paymentClass || 'CLASS_1',
        monthlyFixedValue: payment?.monthlyFixedValue,
        
        // Agendas
        schedules: schedules ? {
          create: schedules.map((schedule: any) => ({
            scheduleCode: schedule.scheduleCode,
            scheduleName: schedule.scheduleName,
            sector: schedule.sector,
            patientsPerHour: schedule.patientsPerHour,
            hourlyRate: schedule.hourlyRate,
            exceedBonus: schedule.exceedBonus || 40,
            weekDays: schedule.weekDays,
            startTime: schedule.startTime,
            endTime: schedule.endTime
          }))
        } : undefined
      },
      include: {
        schedules: true
      }
    })

    return NextResponse.json({ doctor }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar médico:', error)
    return NextResponse.json(
      { error: 'Erro ao criar médico' },
      { status: 500 }
    )
  }
}
