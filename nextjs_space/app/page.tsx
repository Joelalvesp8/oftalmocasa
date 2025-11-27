// Root page - redirect to dashboard or login
import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await getCurrentSession()

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
