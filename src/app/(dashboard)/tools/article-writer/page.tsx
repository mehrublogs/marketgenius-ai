'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ToolForm from '@/components/ToolForm'
import OutputPanel from '@/components/OutputPanel'
import { useLanguage } from '@/components/LanguageProvider'

export default function ArticleWriterPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<{
    title: string
    outline: string[]
    body: string
    metaDescription: string
  } | null>(null)
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
        body: JSON.stringify({ type: 'article-writer', inputs: data }),
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

  const allCopyText = output
    ? `Title:\n${output.title}\n\nOutline:\n${output.outline.join('\n')}\n\nBody:\n${output.body}\n\nMeta Description:\n${output.metaDescription}`
    : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Article Writer</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate SEO-optimized articles with titles, outlines, and meta descriptions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Article Details</h2>
          <ToolForm
            fields={[
              { name: 'topic', label: t('tools.article.topic') || 'Topic', type: 'text', placeholder: 'e.g., Digital Marketing Trends', required: true },
              { name: 'language', label: t('tools.article.language') || 'Language', type: 'select', options: [
                { value: 'English', label: 'English' },
                { value: 'Arabic', label: 'Arabic' },
                { value: 'Spanish', label: 'Spanish' },
                { value: 'French', label: 'French' },
              ], defaultValue: 'English', required: true },
              { name: 'tone', label: t('tools.article.tone') || 'Tone', type: 'select', options: [
                { value: 'Professional', label: 'Professional' },
                { value: 'Casual', label: 'Casual' },
                { value: 'Friendly', label: 'Friendly' },
                { value: 'Persuasive', label: 'Persuasive' },
              ], defaultValue: 'Professional', required: true },
              { name: 'targetAudience', label: t('tools.article.audience') || 'Target Audience', type: 'text', placeholder: 'e.g., Marketing professionals', required: true },
              { name: 'wordCount', label: t('tools.article.wordCount') || 'Approx. Word Count', type: 'select', options: [
                { value: '500', label: '500' },
                { value: '1000', label: '1000' },
                { value: '1500', label: '1500' },
                { value: '2000', label: '2000' },
                { value: '3000', label: '3000' },
              ], defaultValue: '1000', required: true },
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
                <p className="text-lg">Fill in the form and click Generate</p>
                <p className="mt-1 text-sm">Your article will appear here</p>
              </div>
            </div>
          )}

          {output && (
            <>
              <OutputPanel title="Title" copyText={output.title}>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{output.title}</p>
              </OutputPanel>

              <OutputPanel title="Outline" copyText={output.outline.join('\n')}>
                <ol className="list-inside list-decimal space-y-1 text-gray-700 dark:text-gray-300">
                  {output.outline.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </OutputPanel>

              <OutputPanel title="Article Body" copyText={output.body}>
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">{output.body}</pre>
              </OutputPanel>

              <OutputPanel title="Meta Description" copyText={output.metaDescription}>
                <p className="text-sm text-gray-600 dark:text-gray-400">{output.metaDescription}</p>
              </OutputPanel>

              <OutputPanel title="Copy All" copyText={allCopyText}>
                <p className="text-xs text-gray-400 dark:text-gray-500">Click copy above to get the full article content.</p>
              </OutputPanel>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
