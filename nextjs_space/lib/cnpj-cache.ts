/**
 * Cache Layer para Consultas CNPJ
 * Implementa cache em memória com TTL para reduzir chamadas à BrasilAPI
 */

import { CNPJData, CNPJCacheEntry } from './types'

// Cache em memória (Map)
const cnpjCache = new Map<string, CNPJCacheEntry>()

// Configurações padrão
const DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 horas em milissegundos
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hora

/**
 * Busca CNPJ no cache
 * Retorna null se não existir ou estiver expirado
 */
export function getCachedCNPJ(cnpj: string): CNPJData | null {
  const entry = cnpjCache.get(cnpj)

  if (!entry) {
    return null
  }

  // Verifica expiração
  if (new Date() > entry.expiresAt) {
    cnpjCache.delete(cnpj)
    return null
  }

  return entry.data
}

/**
 * Armazena CNPJ no cache
 */
export function setCachedCNPJ(
  cnpj: string,
  data: CNPJData,
  ttl: number = DEFAULT_TTL
): void {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttl)

  const entry: CNPJCacheEntry = {
    data,
    cachedAt: now,
    expiresAt,
  }

  cnpjCache.set(cnpj, entry)
}

/**
 * Remove CNPJ do cache
 */
export function invalidateCNPJ(cnpj: string): void {
  cnpjCache.delete(cnpj)
}

/**
 * Limpa todo o cache
 */
export function clearCNPJCache(): void {
  cnpjCache.clear()
}

/**
 * Remove entradas expiradas do cache
 */
export function cleanupExpiredEntries(): number {
  const now = new Date()
  let removedCount = 0

  for (const [cnpj, entry] of cnpjCache.entries()) {
    if (now > entry.expiresAt) {
      cnpjCache.delete(cnpj)
      removedCount++
    }
  }

  return removedCount
}

/**
 * Retorna estatísticas do cache
 */
export function getCacheStats(): {
  totalEntries: number
  activeEntries: number
  expiredEntries: number
} {
  const now = new Date()
  let activeEntries = 0
  let expiredEntries = 0

  for (const entry of cnpjCache.values()) {
    if (now > entry.expiresAt) {
      expiredEntries++
    } else {
      activeEntries++
    }
  }

  return {
    totalEntries: cnpjCache.size,
    activeEntries,
    expiredEntries,
  }
}

// Configurar limpeza automática de entradas expiradas
if (typeof window === 'undefined') {
  // Apenas no servidor (não no browser)
  setInterval(() => {
    const removed = cleanupExpiredEntries()
    if (removed > 0) {
      console.log(`[CNPJ Cache] Limpeza automática: ${removed} entradas expiradas removidas`)
    }
  }, CLEANUP_INTERVAL)
}

/**
 * Função auxiliar para debug
 */
export function debugCache(): void {
  const stats = getCacheStats()
  console.log('[CNPJ Cache] Estatísticas:', stats)
  console.log('[CNPJ Cache] CNPJs em cache:', Array.from(cnpjCache.keys()))
}
