'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import OutputPanel from '@/components/OutputPanel'

interface ShortLink {
  id: string
  slug: string
  url: string
  title: string
  clicks: number
  createdAt: string
}

export default function UrlShortenerPage() {
  const { t, locale } = useLanguage()
  const [links, setLinks] = useState<ShortLink[]>([])
  const [url, setUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/url')
      .then(r => r.json())
      .then(data => { if (data.links) setLinks(data.links) })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, slug: slug || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error'); return }
      setResult(data.shortUrl)
      setUrl('')
      setSlug('')
      const linksRes = await fetch('/api/url')
      const linksData = await linksRes.json()
      if (linksData.links) setLinks(linksData.links)
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('url.title')}</h1>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t('url.longUrl')}</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} required placeholder="https://example.com/very-long-url" className="input-field" />
          </div>
          <div>
            <label className="label">{t('url.customSlug')}</label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="my-custom-slug" className="input-field" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('tools.loading') : t('url.shorten')}
          </button>
        </form>
      </div>

      {result && (
        <OutputPanel title={t('url.shortUrl')} copyText={result}>
          <div className="flex items-center gap-2">
            <input type="text" value={result} readOnly className="input-field flex-1" />
            <button onClick={() => copyToClipboard(result)} className="btn-secondary text-xs whitespace-nowrap">{t('url.copy')}</button>
          </div>
        </OutputPanel>
      )}

      <div className="card mt-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('url.myLinks')}</h3>
        {fetching ? (
          <div className="flex justify-center py-8">
            <svg className="h-6 w-6 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : links.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">{t('general.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-2 text-left font-medium text-gray-500">{t('url.shortUrl')}</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">{t('url.original')}</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">{t('url.clicks')}</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">{t('url.created')}</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">{t('tools.copy')}</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-3">
                      <span className="text-primary-600 dark:text-primary-400">{`${appUrl}/s/${link.slug}`}</span>
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-3 text-gray-600 dark:text-gray-400">{link.url}</td>
                    <td className="px-3 py-3 text-center font-semibold">{link.clicks}</td>
                    <td className="px-3 py-3 text-gray-500">{new Date(link.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => copyToClipboard(`${appUrl}/s/${link.slug}`)} className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
                        <svg className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
