'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import AdminTable from '@/components/AdminTable'

interface ShortLink {
  id: string
  slug: string
  url: string
  clicks: number
  createdAt: string
  user: { name: string; email: string }
}

export default function AdminLinksPage() {
  const { t } = useLanguage()
  const [links, setLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/links')
      .then(r => r.json())
      .then(data => { if (data.links) setLinks(data.links) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'user', label: 'User', render: (v: unknown) => (v as ShortLink['user'])?.name || '-' },
    { key: 'slug', label: 'Slug', render: (v: unknown) => <span className="font-mono text-primary-600">/s/{v as string}</span> },
    { key: 'url', label: 'URL', render: (v: unknown) => <span className="max-w-[250px] truncate block text-xs">{v as string}</span> },
    { key: 'clicks', label: t('url.clicks'), render: (v: unknown) => <span className="font-semibold">{v as number}</span> },
    { key: 'createdAt', label: 'Date', render: (v: unknown) => new Date(v as string).toLocaleDateString() },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('admin.links')}</h1>
      <AdminTable columns={columns} data={links as unknown as Record<string, unknown>[]} loading={loading} />
    </div>
  )
}
