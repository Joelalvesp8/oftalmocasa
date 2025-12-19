import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createDoctorSchema, doctorQuerySchema } from '@/lib/validations'
import { DoctorWhereInput } from '@/lib/types'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Validar query parameters com Zod
    const queryValidation = doctorQuerySchema.safeParse({
      search: searchParams.get('search'),
      active: searchParams.get('active'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Parâmetros inválidos',
          details: queryValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { search, active, page, limit } = queryValidation.data
    const skip = (page - 1) * limit

    const where: DoctorWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { cpf: { contains: search } },
        { councilNumber: { contains: search } },
      ]
    }

    if (active !== undefined) {
      where.isActive = active === 'true'
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          schedules: true,
          _count: {
            select: {
              appointments: true,
              productions: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip,
      }),
      prisma.doctor.count({ where }),
    ])

    return NextResponse.json({
      doctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
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

    const body = await request.json()

    // Validar com Zod
    const validation = createDoctorSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { personal, bank, schedules, payment } = validation.data

    // Validar se CPF ou email já existem
    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        OR: [
          { cpf: personal.cpf },
          { email: personal.email },
          ...(personal.cnpj ? [{ cnpj: personal.cnpj }] : []),
        ],
      },
    })

    if (existingDoctor) {
      return NextResponse.json(
        { error: 'CPF, email ou CNPJ já cadastrado' },
        { status: 409 }
      )
    }

    // Usar transaction para garantir atomicidade
    const doctor = await prisma.$transaction(async (tx) => {
      // Criar médico
      const newDoctor = await tx.doctor.create({
        data: {
          // Dados pessoais
          name: personal.name,
          birthDate: personal.birthDate ? new Date(personal.birthDate) : null,
          graduationDate: personal.graduationDate
            ? new Date(personal.graduationDate)
            : null,
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
          paymentType: payment?.paymentType ?? 'VARIABLE',
          paymentClass: payment?.paymentClass ?? 'CLASS_1',
          monthlyFixedValue: payment?.monthlyFixedValue,
        },
      })

      // Criar agendas se existirem
      if (schedules && schedules.length > 0) {
        await tx.doctorSchedule.createMany({
          data: schedules.map((schedule) => ({
            doctorId: newDoctor.id,
            scheduleCode: schedule.scheduleCode,
            scheduleName: schedule.scheduleName,
            sector: schedule.sector,
            patientsPerHour: schedule.patientsPerHour,
            hourlyRate: schedule.hourlyRate,
            exceedBonus: schedule.exceedBonus ?? 40,
            weekDays: schedule.weekDays,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          })),
        })
      }

      // Retornar médico com agendas
      return await tx.doctor.findUnique({
        where: { id: newDoctor.id },
        include: { schedules: true },
      })
    })

    return NextResponse.json({ doctor }, { status: 201 })
  } catch (error) {
    // Tratar erros específicos do Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Registro duplicado' },
          { status: 409 }
        )
      }
    }

    console.error('Erro ao criar médico:', error)
    return NextResponse.json(
      { error: 'Erro ao criar médico' },
      { status: 500 }
    )
  }
}
