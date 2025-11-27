// Middleware para proteção de rotas
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Verificar acesso ao painel admin
    if (pathname.startsWith('/admin')) {
      const role = token?.role as string
      const adminRoles = ['Diretoria', 'Diretoria Médica', 'Administrador']
      
      if (!adminRoles.includes(role)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/profile/:path*'],
}
