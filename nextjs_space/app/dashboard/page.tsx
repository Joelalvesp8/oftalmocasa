// Dashboard page - redirects to home
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Redireciona para a página principal (home)
  redirect('/')
}
