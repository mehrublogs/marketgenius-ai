'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import DashboardCard from '@/components/DashboardCard'

interface AdminData {
  totalUsers: number
  totalContent: number
  totalLinks: number
  totalClicks: number
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[]
}

export default function AdminDashboard() {
  const { t } = useLanguage()
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-8 w-8 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('admin.dashboard')}</h1>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title={t('admin.totalUsers')} value={data?.totalUsers || 0} icon="👥" color="primary" />
        <DashboardCard title={t('admin.totalContent')} value={data?.totalContent || 0} icon="📝" color="secondary" />
        <DashboardCard title={t('admin.totalLinks')} value={data?.totalLinks || 0} icon="🔗" color="amber" />
        <DashboardCard title={t('admin.totalClicks')} value={data?.totalClicks || 0} icon="👆" color="rose" />
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Users</h3>
        {data?.recentUsers && data.recentUsers.length > 0 ? (
          <div className="space-y-3">
            {data.recentUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${user.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>{user.role}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">{t('general.noData')}</p>
        )}
      </div>
    </div>
  )
}
