'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ToolForm from '@/components/ToolForm'
import OutputPanel from '@/components/OutputPanel'
import { useLanguage } from '@/components/LanguageProvider'

export default function ImagePromptPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<{ prompt: string } | null>(null)
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
        body: JSON.stringify({ type: 'image-prompt', inputs: data }),
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Image Prompt Generator</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create detailed AI image prompts for any platform, style, and mood.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Prompt Details</h2>
          <ToolForm
            fields={[
              { name: 'subject', label: t('tools.image.subject') || 'Subject', type: 'text', placeholder: 'e.g., A cozy coffee shop interior', required: true },
              { name: 'style', label: t('tools.image.style') || 'Style', type: 'select', options: [
                { value: 'Realistic', label: 'Realistic' },
                { value: 'Cartoon', label: 'Cartoon' },
                { value: '3D Render', label: '3D Render' },
                { value: 'Watercolor', label: 'Watercolor' },
                { value: 'Minimalist', label: 'Minimalist' },
              ], defaultValue: 'Realistic', required: true },
              { name: 'mood', label: t('tools.image.mood') || 'Mood', type: 'select', options: [
                { value: 'Professional', label: 'Professional' },
                { value: 'Playful', label: 'Playful' },
                { value: 'Dramatic', label: 'Dramatic' },
                { value: 'Calm', label: 'Calm' },
                { value: 'Energetic', label: 'Energetic' },
              ], defaultValue: 'Professional', required: true },
              { name: 'platform', label: t('tools.image.platform') || 'Platform', type: 'select', options: [
                { value: 'Instagram', label: 'Instagram' },
                { value: 'Facebook', label: 'Facebook' },
                { value: 'Website', label: 'Website' },
                { value: 'Print', label: 'Print' },
                { value: 'Pinterest', label: 'Pinterest' },
              ], defaultValue: 'Instagram', required: true },
              { name: 'aspectRatio', label: t('tools.image.aspect') || 'Aspect Ratio', type: 'select', options: [
                { value: '1:1', label: '1:1' },
                { value: '4:5', label: '4:5' },
                { value: '16:9', label: '16:9' },
                { value: '9:16', label: '9:16' },
                { value: '3:2', label: '3:2' },
              ], defaultValue: '1:1', required: true },
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
                <p className="text-lg">Configure your image prompt</p>
                <p className="mt-1 text-sm">The generated prompt will appear here</p>
              </div>
            </div>
          )}

          {output && (
            <OutputPanel title="Generated Prompt" copyText={output.prompt}>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{output.prompt}</p>
            </OutputPanel>
          )}
        </div>
      </div>
    </div>
  )
}
