'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OutputPanel from '@/components/OutputPanel'
import { useLanguage } from '@/components/LanguageProvider'

type Tab = 'title' | 'meta' | 'checklist' | 'score'

interface ChecklistItem {
  item: string
  done: boolean
}

export default function SeoToolsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<Tab>('title')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [keyword, setKeyword] = useState('')
  const [content, setContent] = useState('')

  const [titles, setTitles] = useState<string[]>([])
  const [descriptions, setDescriptions] = useState<string[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [score, setScore] = useState<{ score: number; grade: string; issues: string[] } | null>(null)

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

  const generateTitles = async () => {
    if (!keyword.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seo-title', inputs: { keyword } }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate')
      const data = await res.json()
      setTitles(data.titles || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const generateMeta = async () => {
    if (!keyword.trim() || !content.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seo-meta', inputs: { keyword, content } }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate')
      const data = await res.json()
      setDescriptions(data.descriptions || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const generateChecklist = async () => {
    if (!keyword.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seo-checklist', inputs: { keyword } }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate')
      const data = await res.json()
      setChecklist(data.checklist || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const generateScore = async () => {
    if (!keyword.trim() || !content.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seo-score', inputs: { keyword, content } }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate')
      const data = await res.json()
      setScore(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'title', label: t('tools.seo.tabTitle') || 'SEO Title Generator' },
    { key: 'meta', label: t('tools.seo.tabMeta') || 'Meta Description Generator' },
    { key: 'checklist', label: t('tools.seo.tabChecklist') || 'SEO Checklist' },
    { key: 'score', label: t('tools.seo.tabScore') || 'SEO Score' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SEO Tools</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate titles, meta descriptions, checklists, and score your content.
        </p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-0 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {activeTab === 'title' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Generate SEO-optimized title suggestions for your keyword.</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="Enter your target keyword"
                  className="input-field flex-1"
                />
                <button onClick={generateTitles} disabled={loading || !keyword.trim()} className="btn-primary whitespace-nowrap">
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
              {titles.length > 0 && (
                <OutputPanel title="Suggested Titles" copyText={titles.join('\n')}>
                  <ul className="space-y-2">
                    {titles.map((t, i) => (
                      <li key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-200">
                        {t}
                      </li>
                    ))}
                  </ul>
                </OutputPanel>
              )}
            </div>
          )}

          {activeTab === 'meta' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Generate compelling meta descriptions for your content.</p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="Target keyword"
                  className="input-field"
                />
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Brief description of your content"
                  rows={3}
                  className="input-field resize-none"
                />
                <button onClick={generateMeta} disabled={loading || !keyword.trim() || !content.trim()} className="btn-primary">
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
              {descriptions.length > 0 && (
                <OutputPanel title="Meta Descriptions" copyText={descriptions.join('\n\n')}>
                  <ul className="space-y-2">
                    {descriptions.map((d, i) => (
                      <li key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-200">
                        {d}
                      </li>
                    ))}
                  </ul>
                </OutputPanel>
              )}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Generate a comprehensive SEO checklist for your keyword.</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="Enter your target keyword"
                  className="input-field flex-1"
                />
                <button onClick={generateChecklist} disabled={loading || !keyword.trim()} className="btn-primary whitespace-nowrap">
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
              {checklist.length > 0 && (
                <OutputPanel title="SEO Checklist" copyText={checklist.map(c => `${c.done ? '[x]' : '[ ]'} ${c.item}`).join('\n')}>
                  <ul className="space-y-2">
                    {checklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/50">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => {
                            const updated = [...checklist]
                            updated[i] = { ...updated[i], done: !updated[i].done }
                            setChecklist(updated)
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className={`text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.item}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {checklist.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={generateChecklist} disabled={loading} className="btn-secondary text-xs">
                        Regenerate
                      </button>
                      <button onClick={() => setChecklist([])} className="btn-secondary text-xs">
                        Clear
                      </button>
                    </div>
                  )}
                </OutputPanel>
              )}
            </div>
          )}

          {activeTab === 'score' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Get an on-page SEO score for your content and keyword.</p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="Enter your target keyword"
                  className="input-field"
                />
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste your content here for scoring"
                  rows={4}
                  className="input-field resize-none"
                />
                <button onClick={generateScore} disabled={loading || !keyword.trim() || !content.trim()} className="btn-primary">
                  {loading ? 'Scoring...' : 'Check Score'}
                </button>
              </div>
              {score && (
                <div className="card">
                  <div className="flex items-center gap-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20">
                      <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">{score.score}</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">Grade: {score.grade}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">On-Page SEO Score</p>
                    </div>
                  </div>
                  {score.issues.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Issues Found:</p>
                      <ul className="space-y-1">
                        {score.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                            <span className="mt-0.5">&#9679;</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {score.issues.length === 0 && (
                    <p className="mt-4 text-sm text-secondary-600 dark:text-secondary-400">No issues found! Great job.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
