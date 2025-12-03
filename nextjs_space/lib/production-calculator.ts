import { prisma } from '@/lib/db'
import { PaymentClass, PaymentType } from '@prisma/client'

type ScheduleConfig = {
  patientsPerHour: number
  exceedBonus: number
}

type PaymentConfig = {
  hourlyRate?: number
  fixedAmount?: number
  type: string
}

/**
 * Sistema de Cálculo de Produção Médica
 * Baseado nas regras de repasse do Oftalmocasa
 */
export class ProductionCalculator {
  // Configurações base das agendas
  private static readonly SCHEDULE_CONFIG: Record<string, ScheduleConfig> = {
    GERAL: { patientsPerHour: 4, exceedBonus: 40 },
    ESPECIALISTA: { patientsPerHour: 3, exceedBonus: 40 },
    MAPA: { patientsPerHour: 6, exceedBonus: 0 }
  }

  // Configurações de pagamento por classe
  private static readonly PAYMENT_CLASSES: Record<PaymentClass, PaymentConfig> = {
    CLASS_1: { hourlyRate: 125, type: 'VARIABLE' },
    CLASS_2: { hourlyRate: 160, type: 'VARIABLE' },
    CLASS_3: { hourlyRate: 200, type: 'VARIABLE' },
    CLASS_4: { fixedAmount: 500, type: 'FIXED' },
    CLASS_5: { hourlyRate: 125, type: 'MAPA_ONLY' }
  }

  /**
   * Calcula a produção diária de um médico
   */
  static async calculateDailyProduction(doctorId: string, date: Date) {
    // Buscar dados do médico
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        schedules: true,
        appointments: {
          where: {
            date: {
              gte: new Date(date.setHours(0, 0, 0, 0)),
              lte: new Date(date.setHours(23, 59, 59, 999))
            },
            status: { in: ['COMPLETED', 'NO_SHOW'] }
          }
        }
      }
    })

    if (!doctor) throw new Error('Médico não encontrado')

    const productionBySchedule = new Map<string, any>()

    // Agrupar appointments por tipo de agenda
    doctor.appointments.forEach(appointment => {
      const key = appointment.scheduleCode
      if (!productionBySchedule.has(key)) {
        productionBySchedule.set(key, {
          scheduleCode: key,
          appointments: [],
          patients: 0
        })
      }
      
      const prod = productionBySchedule.get(key)
      if (prod) {
        prod.appointments.push(appointment)
        prod.patients++
      }
    })

    // Calcular produção para cada tipo de agenda
    const productions = []
    
    for (const [scheduleCode, data] of productionBySchedule) {
      const schedule = doctor.schedules.find(s => s.scheduleCode === scheduleCode)
      if (!schedule) continue

      const config = this.SCHEDULE_CONFIG[scheduleCode] || this.SCHEDULE_CONFIG.GERAL
      const paymentClass = this.PAYMENT_CLASSES[doctor.paymentClass]

      // Calcular horas trabalhadas
      const workedHours = this.calculateWorkedHours(data.appointments)
      
      // Calcular pacientes excedentes
      const expectedPatients = Math.floor(workedHours * config.patientsPerHour)
      const exceededPatients = Math.max(0, data.patients - expectedPatients)

      // Calcular valores
      let baseValue = 0
      let exceedValue = 0

      if (paymentClass.type === 'FIXED') {
        // Médico Classe 4 - Valor fixo
        baseValue = (paymentClass.fixedAmount || 0) / 30 // Valor diário
      } else if (paymentClass.type === 'MAPA_ONLY' && scheduleCode === 'MAPA') {
        // Médico Classe 5 - Apenas MAPA
        baseValue = workedHours * (paymentClass.hourlyRate || 0)
      } else if (paymentClass.type === 'VARIABLE') {
        // Médicos Classes 1, 2, 3
        baseValue = workedHours * (paymentClass.hourlyRate || 0)
        exceedValue = exceededPatients * config.exceedBonus
      }

      const production = {
        doctorId,
        date,
        scheduleCode,
        scheduleName: schedule.scheduleName,
        scheduledHours: this.calculateScheduledHours(schedule),
        workedHours,
        scheduledPatients: expectedPatients,
        attendedPatients: data.patients,
        exceededPatients,
        hourlyRate: paymentClass.hourlyRate || 0,
        baseValue,
        exceedValue,
        totalValue: baseValue + exceedValue,
        status: 'PENDING' as const
      }

      productions.push(production)
    }

    return productions
  }

  /**
   * Calcula o relatório mensal de pagamento
   */
  static async generateMonthlyPaymentReport(
    doctorId: string,
    month: number,
    year: number
  ) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        productions: {
          where: {
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1)
            }
          }
        }
      }
    })

    if (!doctor) throw new Error('Médico não encontrado')

    // Somar todas as produções do mês
    const summary = doctor.productions.reduce((acc, prod) => {
      acc.totalHours += prod.workedHours
      acc.totalPatients += prod.attendedPatients
      acc.exceededPatients += prod.exceededPatients
      acc.baseValue += prod.baseValue
      acc.exceedValue += prod.exceedValue
      acc.totalValue += prod.totalValue
      return acc
    }, {
      totalHours: 0,
      totalPatients: 0,
      exceededPatients: 0,
      baseValue: 0,
      exceedValue: 0,
      totalValue: 0
    })

    // Criar relatório de pagamento
    const paymentReport = {
      doctorId,
      month,
      year,
      taxRegime: doctor.taxRegime || 'LP',
      bankNumber: doctor.bankNumber,
      bankName: doctor.bankName,
      bankAgency: doctor.bankAgency,
      bankAccount: doctor.bankAccount,
      pixKeyType: doctor.pixKeyType,
      pixKey: doctor.pixKey,
      paymentType: doctor.paymentType === 'FIXED' ? 'FIXO' : 'VAR',
      totalHours: summary.totalHours,
      totalPatients: summary.totalPatients,
      exceededPatients: summary.exceededPatients,
      baseValue: summary.baseValue,
      exceedValue: summary.exceedValue,
      grossValue: summary.totalValue,
      status: 'DRAFT' as const
    }

    return paymentReport
  }

  /**
   * Calcula horas trabalhadas baseado nos atendimentos
   */
  private static calculateWorkedHours(appointments: any[]): number {
    if (appointments.length === 0) return 0

    // Ordenar por horário
    const sortedAppointments = appointments
      .filter(a => a.attendedAt && a.completedAt)
      .sort((a, b) => 
        new Date(a.attendedAt!).getTime() - new Date(b.attendedAt!).getTime()
      )

    if (sortedAppointments.length === 0) return 0

    // Pegar primeiro e último atendimento
    const firstAttendance = new Date(sortedAppointments[0].attendedAt!)
    const lastAttendance = new Date(sortedAppointments[sortedAppointments.length - 1].completedAt!)

    // Calcular diferença em horas
    const diffMs = lastAttendance.getTime() - firstAttendance.getTime()
    const hours = diffMs / (1000 * 60 * 60)

    // Arredondar para 0.5 horas
    return Math.ceil(hours * 2) / 2
  }

  /**
   * Calcula horas agendadas para uma agenda
   */
  private static calculateScheduledHours(schedule: any): number {
    const [startHour, startMin] = schedule.startTime.split(':').map(Number)
    const [endHour, endMin] = schedule.endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    return (endMinutes - startMinutes) / 60
  }
}
