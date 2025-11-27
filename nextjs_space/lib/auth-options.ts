// NextAuth configuration
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Credenciais inválidas')
        }

        if (!user.isActive) {
          throw new Error('Usuário inativo. Contate o administrador.')
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValidPassword) {
          throw new Error('Credenciais inválidas')
        }

        return {
          id: user.id,
          email: user.email ?? '',
          name: user.name ?? '',
          image: user.image ?? null,
          role: user.role ?? 'Agente Administrativo',
          sector: user.sector ?? null,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'YOUR_GOOGLE_CLIENT_SECRET',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.sector = (user as any).sector
      }

      // Se for login via Google, buscar/criar usuário no banco
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        })

        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.sector = dbUser.sector
        } else {
          // Criar novo usuário para Google SSO
          const newUser = await prisma.user.create({
            data: {
              email: token.email,
              name: token.name ?? 'Usuário Google',
              image: token.picture,
              role: 'Agente Administrativo',
              sector: null,
              isActive: true,
            },
          })
          token.id = newUser.id
          token.role = newUser.role
          token.sector = newUser.sector
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
        (session.user as any).sector = token.sector as string | null
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
