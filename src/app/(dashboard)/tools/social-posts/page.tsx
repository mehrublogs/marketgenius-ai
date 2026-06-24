'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ToolForm from '@/components/ToolForm'
import OutputPanel from '@/components/OutputPanel'
import { useLanguage } from '@/components/LanguageProvider'

interface Variation {
  id: number
  text: string
}

export default function SocialPostsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<{ variations: Variation[] } | null>(null)
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
        body: JSON.stringify({ type: 'social-posts', inputs: data }),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Social Media Posts</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate engaging social media posts for any platform.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Post Details</h2>
          <ToolForm
            fields={[
              { name: 'platform', label: t('tools.social.platform') || 'Platform', type: 'select', options: [
                { value: 'Facebook', label: 'Facebook' },
                { value: 'Instagram', label: 'Instagram' },
                { value: 'LinkedIn', label: 'LinkedIn' },
                { value: 'Twitter', label: 'Twitter/X' },
              ], defaultValue: 'Facebook', required: true },
              { name: 'topic', label: t('tools.social.topic') || 'Topic', type: 'text', placeholder: 'e.g., AI in Marketing', required: true },
              { name: 'tone', label: t('tools.social.tone') || 'Tone', type: 'select', options: [
                { value: 'Professional', label: 'Professional' },
                { value: 'Casual', label: 'Casual' },
                { value: 'Funny', label: 'Funny' },
                { value: 'Inspirational', label: 'Inspirational' },
              ], defaultValue: 'Professional', required: true },
              { name: 'language', label: t('tools.social.language') || 'Language', type: 'select', options: [
                { value: 'English', label: 'English' },
                { value: 'Arabic', label: 'Arabic' },
                { value: 'Spanish', label: 'Spanish' },
                { value: 'French', label: 'French' },
              ], defaultValue: 'English', required: true },
              { name: 'cta', label: t('tools.social.cta') || 'Call to Action', type: 'text', placeholder: 'e.g., Join now, Learn more', required: true },
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
                <p className="text-lg">Create your social post</p>
                <p className="mt-1 text-sm">Multiple variations will appear here</p>
              </div>
            </div>
          )}

          {output && output.variations.map(v => (
            <OutputPanel key={v.id} title={`Variation ${v.id}`} copyText={v.text}>
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">{v.text}</pre>
            </OutputPanel>
          ))}
        </div>
      </div>
    </div>
  )
}
