'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import AdminTable from '@/components/AdminTable'

interface Content {
  id: string
  tool: string
  input: string
  output: string
  createdAt: string
  user: { name: string; email: string }
}

export default function AdminContentPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/content')
      .then(r => r.json())
      .then(data => { if (data.items) setItems(data.items) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toolLabels: Record<string, string> = {
    'article-writer': 'Article Writer',
    'seo-title': 'SEO Title',
    'seo-meta': 'Meta Desc',
    'image-prompt': 'Image Prompt',
    'social-posts': 'Social Posts',
    'product-description': 'Product Desc',
    'keyword-research': 'Keyword Research',
    'hashtag-generator': 'Hashtag Gen',
  }

  const columns = [
    { key: 'user', label: 'User', render: (v: unknown) => (v as Content['user'])?.name || '-' },
    { key: 'tool', label: 'Tool', render: (v: unknown) => <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">{toolLabels[v as string] || v as string}</span> },
    { key: 'input', label: 'Input', render: (v: unknown) => <span className="max-w-[200px] truncate block">{(v as string) || '-'}</span> },
    { key: 'createdAt', label: 'Date', render: (v: unknown) => new Date(v as string).toLocaleDateString() },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('admin.content')}</h1>
      <AdminTable columns={columns} data={items as unknown as Record<string, unknown>[]} loading={loading} />
    </div>
  )
}
