'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ToolForm from '@/components/ToolForm'
import { useLanguage } from '@/components/LanguageProvider'

interface KeywordItem {
  keyword: string
  intent: string
  difficulty: string
  volume: number
  competition: string
}

interface KeywordOutput {
  seedKeyword: string
  country: string
  language: string
  keywords: KeywordItem[]
  note: string
}

export default function KeywordResearchPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<KeywordOutput | null>(null)
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
        body: JSON.stringify({ type: 'keyword-research', inputs: data }),
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

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'Low': return 'text-green-600 dark:text-green-400'
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'High': return 'text-orange-600 dark:text-orange-400'
      case 'Very High': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const competitionColor = (c: string) => {
    switch (c) {
      case 'Low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Keyword Research</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Discover high-value keywords with volume, difficulty, and intent data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Research Parameters</h2>
          <ToolForm
            fields={[
              { name: 'seedKeyword', label: t('tools.keyword.seed') || 'Seed Keyword', type: 'text', placeholder: 'e.g., digital marketing', required: true },
              { name: 'country', label: t('tools.keyword.country') || 'Country', type: 'select', options: [
                { value: 'US', label: 'United States' },
                { value: 'UK', label: 'United Kingdom' },
                { value: 'Canada', label: 'Canada' },
                { value: 'Australia', label: 'Australia' },
                { value: 'Global', label: 'Global' },
              ], defaultValue: 'Global', required: true },
              { name: 'language', label: t('tools.keyword.language') || 'Language', type: 'select', options: [
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
                <p className="text-lg">Enter a seed keyword</p>
                <p className="mt-1 text-sm">Keyword suggestions will appear here</p>
              </div>
            </div>
          )}

          {output && (
            <div className="card overflow-hidden">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Keywords for &ldquo;{output.seedKeyword}&rdquo;
                </h3>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  {output.country}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 pr-4 font-semibold text-gray-700 dark:text-gray-300">Keyword</th>
                      <th className="pb-3 pr-4 font-semibold text-gray-700 dark:text-gray-300">Intent</th>
                      <th className="pb-3 pr-4 font-semibold text-gray-700 dark:text-gray-300">Difficulty</th>
                      <th className="pb-3 pr-4 font-semibold text-gray-700 dark:text-gray-300">Volume</th>
                      <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Competition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {output.keywords.map((kw, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{kw.keyword}</td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700 dark:text-gray-400">
                            {kw.intent}
                          </span>
                        </td>
                        <td className={`py-3 pr-4 font-medium ${difficultyColor(kw.difficulty)}`}>{kw.difficulty}</td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{kw.volume.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${competitionColor(kw.competition)}`}>
                            {kw.competition}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  {output.note || 'Note: Keyword volumes and competition data are estimates. For precise data, use tools like Google Keyword Planner or Ahrefs.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
