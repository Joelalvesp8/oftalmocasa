/**
 * Cache utilities using Next.js unstable_cache
 * Provides type-safe caching for frequently accessed static data
 */

import { unstable_cache } from 'next/cache'
import { prisma } from './db'

/**
 * Cache configuration
 * - revalidate: Time in seconds before cache becomes stale
 * - tags: Cache tags for manual revalidation
 */

// Cache roles (rarely change, can be cached for 1 hour)
export const getCachedRoles = unstable_cache(
  async () => {
    const roles = [
      'Diretoria',
      'Diretoria Médica',
      'Administrador',
      'Coordenador',
      'Médico',
      'Enfermeiro',
      'Técnico',
      'Recepcionista',
      'Financeiro',
      'Outro',
    ]
    return roles
  },
  ['roles'],
  {
    revalidate: 3600, // 1 hour
    tags: ['roles'],
  }
)

// Cache sectors (rarely change, can be cached for 1 hour)
export const getCachedSectors = unstable_cache(
  async () => {
    const sectors = [
      'Ambulatório',
      'Emergência',
      'Centro Cirúrgico',
      'UTI',
      'Internação',
      'Administração',
      'Financeiro',
      'RH',
    ]
    return sectors
  },
  ['sectors'],
  {
    revalidate: 3600, // 1 hour
    tags: ['sectors'],
  }
)

// Cache active doctors (update every 5 minutes)
export const getCachedActiveDoctors = unstable_cache(
  async () => {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        councilType: true,
        councilNumber: true,
        paymentType: true,
        paymentClass: true,
      },
      orderBy: { name: 'asc' },
    })
    return doctors
  },
  ['active-doctors'],
  {
    revalidate: 300, // 5 minutes
    tags: ['doctors', 'active-doctors'],
  }
)

// Cache payment classes (static, can be cached for 24 hours)
export const getCachedPaymentClasses = unstable_cache(
  async () => {
    const classes = [
      { value: 'CLASS_1', label: 'Classe 1 - Padrão' },
      { value: 'CLASS_2', label: 'Classe 2 - Intermediário' },
      { value: 'CLASS_3', label: 'Classe 3 - Avançado' },
      { value: 'CLASS_4', label: 'Classe 4 - Especialista' },
      { value: 'CLASS_5', label: 'Classe 5 - Premium' },
    ]
    return classes
  },
  ['payment-classes'],
  {
    revalidate: 86400, // 24 hours
    tags: ['payment-classes'],
  }
)

// Cache doctor schedules by doctor ID (update every 10 minutes)
export function getCachedDoctorSchedules(doctorId: string) {
  return unstable_cache(
    async () => {
      const schedules = await prisma.doctorSchedule.findMany({
        where: { doctorId },
        orderBy: [{ weekDays: 'asc' }, { startTime: 'asc' }],
      })
      return schedules
    },
    [`doctor-schedules-${doctorId}`],
    {
      revalidate: 600, // 10 minutes
      tags: ['schedules', `doctor-${doctorId}-schedules`],
    }
  )()
}

/**
 * Helper function to revalidate cache by tag
 * Usage: import { revalidateTag } from 'next/cache'
 * revalidateTag('doctors')
 */
export const CACHE_TAGS = {
  ROLES: 'roles',
  SECTORS: 'sectors',
  DOCTORS: 'doctors',
  ACTIVE_DOCTORS: 'active-doctors',
  PAYMENT_CLASSES: 'payment-classes',
  SCHEDULES: 'schedules',
} as const
