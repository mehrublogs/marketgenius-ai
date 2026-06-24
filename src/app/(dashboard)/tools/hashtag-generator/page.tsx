'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ToolForm from '@/components/ToolForm'
import OutputPanel from '@/components/OutputPanel'
import { useLanguage } from '@/components/LanguageProvider'

interface HashtagOutput {
  popular: string[]
  niche: string[]
  branded: string[]
  lowCompetition: string[]
}

export default function HashtagGeneratorPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<HashtagOutput | null>(null)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) router.push('/login')
      else setCheckingAuth(false)
    })
  }, [router])

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  const handleSubmit = async (data: Record<string, string>) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'hashtag-generator', inputs: data }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate')
      }
      setOutput(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyAll = () => {
    if (!output) return
    const all = [
      ...output.popular,
      ...output.niche,
      ...output.branded,
      ...output.lowCompetition,
    ].join(' ')
    navigator.clipboard.writeText(all)
  }

  const copyGroup = (tags: string[]) => {
    navigator.clipboard.writeText(tags.join(' '))
  }

  const sections: { key: keyof HashtagOutput; label: string }[] = [
    { key: 'popular', label: 'Popular' },
    { key: 'niche', label: 'Niche' },
    { key: 'branded', label: 'Branded' },
    { key: 'lowCompetition', label: 'Low Competition' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hashtag Generator</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate trending and niche hashtags for any topic and platform.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Hashtag Details</h2>
          <ToolForm
            fields={[
              { name: 'topic', label: t('tools.hashtag.topic') || 'Topic', type: 'text', placeholder: 'e.g., Fitness', required: true },
              { name: 'niche', label: t('tools.hashtag.niche') || 'Niche', type: 'text', placeholder: 'e.g., Yoga, Weightlifting, Cardio', required: true },
              { name: 'platform', label: t('tools.hashtag.platform') || 'Platform', type: 'select', options: [
                { value: 'Instagram', label: 'Instagram' },
                { value: 'TikTok', label: 'TikTok' },
                { value: 'Twitter', label: 'Twitter/X' },
                { value: 'LinkedIn', label: 'LinkedIn' },
                { value: 'Facebook', label: 'Facebook' },
              ], defaultValue: 'Instagram', required: true },
              { name: 'language', label: t('tools.hashtag.language') || 'Language', type: 'select', options: [
                { value: 'English', label: 'English' },
                { value: 'Arabic', label: 'Arabic' },
              ], defaultValue: 'English', required: true },
            ]}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {!output && !error && (
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-12 text-gray-400 dark:border-gray-700 dark:text-gray-500">
              <div className="text-center">
                <p className="text-lg">Configure your hashtags</p>
                <p className="mt-1 text-sm">Generated hashtags will appear here</p>
              </div>
            </div>
          )}

          {output && (
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Hashtags</h3>
                <button onClick={copyAll} className="btn-secondary text-xs">
                  Copy All
                </button>
              </div>

              <div className="space-y-5">
                {sections.map(s => (
                  <div key={s.key}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{s.label}</p>
                      <button
                        onClick={() => copyGroup(output[s.key])}
                        className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {output[s.key].map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex cursor-pointer items-center rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30"
                          onClick={() => navigator.clipboard.writeText(tag)}
                          title="Click to copy"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
