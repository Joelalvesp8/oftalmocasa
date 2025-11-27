// Login page
import { LoginForm } from './_components/login-form'
import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/session'
import { Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const session = await getCurrentSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              <span className="text-blue-600">Oftalmo</span>casa
            </h1>
          </div>
          <p className="text-center text-sm text-gray-600">
            Sistema de gestão administrativa
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  )
}
