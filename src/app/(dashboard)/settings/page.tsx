import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLocaleFromCookie, getTranslation } from '@/lib/i18n'

async function updateProfile(formData: FormData) {
  'use server'

  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  if (!name?.trim()) throw new Error('Name is required')

  await prisma.user.update({
    where: { id: session.id },
    data: { name: name.trim() },
  })

  redirect('/settings')
}

export default async function SettingsPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const locale = getLocaleFromCookie(cookieStore.get('locale')?.value)
  const t = (key: string) => getTranslation(key, locale)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('settings.title')}</p>
      </div>

      <form action={updateProfile} className="card space-y-5">
        <div>
          <label htmlFor="name" className="label">{t('settings.name')}</label>
          <input id="name" name="name" type="text" defaultValue={user.name} className="input-field" />
        </div>
        <div>
          <label htmlFor="email" className="label">{t('settings.email')}</label>
          <input id="email" type="email" defaultValue={user.email} className="input-field" disabled />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('settings.email')} cannot be changed</p>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">{t('settings.save')}</button>
        </div>
      </form>
    </div>
  )
}
