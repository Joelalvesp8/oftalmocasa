// Session utilities
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth-options'
import { SessionUser } from './types'

/**
 * Get the current session on server components
 */
export async function getCurrentSession() {
  const session = await getServerSession(authOptions)
  return session
}

/**
 * Get the current user from session
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getCurrentSession()
  return session?.user as SessionUser | null
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession()
  return !!session
}
