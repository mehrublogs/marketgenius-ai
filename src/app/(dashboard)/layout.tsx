import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { getLocaleFromCookie } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const locale = getLocaleFromCookie(cookieStore.get('locale')?.value)

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <main className="flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
