'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import DashboardCard from '@/components/DashboardCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface AnalyticsData {
  contentCount: number
  urlCount: number
  totalClicks: number
  toolUsage: { tool: string; count: number }[]
  recentContent: { id: string; tool: string; input: string; createdAt: string; user?: { name: string; email: string } }[]
  recentClicks: { id: string; timestamp: string; link: { slug: string; url: string } }[]
}

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toolLabels: Record<string, string> = {
    'article-writer': 'Article Writer',
    'seo-title': 'SEO Title',
    'seo-meta': 'Meta Description',
    'seo-checklist': 'SEO Checklist',
    'seo-score': 'SEO Score',
    'image-prompt': 'Image Prompt',
    'social-posts': 'Social Posts',
    'product-description': 'Product Description',
    'keyword-research': 'Keyword Research',
    'hashtag-generator': 'Hashtag Generator',
  }

  const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16']

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
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('analytics.title')}</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard title={t('dashboard.totalContent')} value={data?.contentCount || 0} icon="📝" color="primary" />
        <DashboardCard title={t('dashboard.totalUrls')} value={data?.urlCount || 0} icon="🔗" color="secondary" />
        <DashboardCard title={t('dashboard.totalClicks')} value={data?.totalClicks || 0} icon="👆" color="amber" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Tool Usage Chart */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('analytics.topTools')}</h3>
          {data?.toolUsage && data.toolUsage.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.toolUsage.map(t => ({ ...t, label: toolLabels[t.tool] || t.tool }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">{t('general.noData')}</p>
          )}
        </div>

        {/* Tool Usage Pie */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('analytics.topTools')}</h3>
          {data?.toolUsage && data.toolUsage.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.toolUsage} dataKey="count" nameKey="tool" cx="50%" cy="50%" outerRadius={80} label={({ name }) => toolLabels[name || ''] || name || ''}>
                    {data.toolUsage.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">{t('general.noData')}</p>
          )}
        </div>
      </div>

      {/* Recent Content */}
      <div className="card mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('analytics.recentGen')}</h3>
        {data?.recentContent && data.recentContent.length > 0 ? (
          <div className="space-y-3">
            {data.recentContent.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{toolLabels[item.tool] || item.tool}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.input.slice(0, 80)}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">{t('general.noData')}</p>
        )}
      </div>

      {/* Recent Clicks */}
      <div className="card">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('analytics.urlClicks')}</h3>
        {data?.recentClicks && data.recentClicks.length > 0 ? (
          <div className="space-y-3">
            {data.recentClicks.map(click => (
              <div key={click.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">/s/{click.link.slug}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{click.link.url.slice(0, 60)}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(click.timestamp).toLocaleString()}</span>
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
