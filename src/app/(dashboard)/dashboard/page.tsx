import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLocaleFromCookie, getTranslation } from '@/lib/i18n'
import { formatDate, formatNumber } from '@/lib/utils'
import DashboardCard from '@/components/DashboardCard'

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const locale = getLocaleFromCookie(cookieStore.get('locale')?.value)
  const t = (key: string) => getTranslation(key, locale)

  const userId = user.id

  const [contentCount, urlCount, clickAgg, recentContent, recentLinks, toolsUsed] = await Promise.all([
    prisma.generatedContent.count({ where: { userId } }),
    prisma.shortLink.count({ where: { userId } }),
    prisma.shortLink.aggregate({ where: { userId }, _sum: { clicks: true } }),
    prisma.generatedContent.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.shortLink.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.generatedContent.groupBy({ by: ['tool'], where: { userId }, _count: true }),
  ])

  const totalClicks = clickAgg._sum.clicks ?? 0
  const toolsUsedCount = toolsUsed.length

  const quickActions = [
    { href: '/tools/article-writer', label: t('sidebar.articleWriter'), icon: '✍️' },
    { href: '/tools/seo-tools', label: t('sidebar.seoTools'), icon: '🔍' },
    { href: '/tools/social-posts', label: t('sidebar.socialPosts'), icon: '📱' },
    { href: '/tools/image-prompt', label: t('sidebar.imagePrompt'), icon: '🖼️' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('dashboard.welcome').replace('{name}', user.name)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title={t('dashboard.totalContent')} value={formatNumber(contentCount)} icon="📄" color="primary" />
        <DashboardCard title={t('dashboard.totalUrls')} value={formatNumber(urlCount)} icon="🔗" color="secondary" />
        <DashboardCard title={t('dashboard.totalClicks')} value={formatNumber(totalClicks)} icon="👆" color="amber" />
        <DashboardCard title={t('dashboard.toolsUsed')} value={formatNumber(toolsUsedCount)} icon="🛠️" color="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentActivity')}</h2>
          <div className="mt-4 space-y-3">
            {recentContent.length > 0 ? (
              recentContent.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.input}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.tool} · {formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('general.noData')}</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('url.myLinks')}</h2>
          <div className="mt-4 space-y-3">
            {recentLinks.length > 0 ? (
              recentLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{link.title || link.url}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(link.clicks)} {t('url.clicks').toLowerCase()} · {formatDate(link.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('general.noData')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.quickActions')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
