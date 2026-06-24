'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ToolForm from '@/components/ToolForm'
import OutputPanel from '@/components/OutputPanel'
import { useLanguage } from '@/components/LanguageProvider'

export default function ProductDescriptionPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<{
    shortDescription: string
    longDescription: string
    bulletPoints: string[]
    seoTitle: string
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
        body: JSON.stringify({ type: 'product-description', inputs: data }),
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Description Generator</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Write compelling product descriptions that drive conversions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Product Details</h2>
          <ToolForm
            fields={[
              { name: 'productName', label: t('tools.product.name') || 'Product Name', type: 'text', placeholder: 'e.g., SmartPro Wireless Earbuds', required: true },
              { name: 'features', label: t('tools.product.features') || 'Features (comma separated)', type: 'textarea', placeholder: 'e.g., Noise cancelling, 12hr battery, Water resistant', required: true },
              { name: 'audience', label: t('tools.product.audience') || 'Target Audience', type: 'text', placeholder: 'e.g., Fitness enthusiasts', required: true },
              { name: 'tone', label: t('tools.product.tone') || 'Tone', type: 'select', options: [
                { value: 'Professional', label: 'Professional' },
                { value: 'Casual', label: 'Casual' },
                { value: 'Luxury', label: 'Luxury' },
                { value: 'Friendly', label: 'Friendly' },
              ], defaultValue: 'Professional', required: true },
              { name: 'language', label: t('tools.product.language') || 'Language', type: 'select', options: [
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
                <p className="text-lg">Enter your product details</p>
                <p className="mt-1 text-sm">Generated descriptions will appear here</p>
              </div>
            </div>
          )}

          {output && (
            <>
              <OutputPanel title="Short Description" copyText={output.shortDescription}>
                <p className="text-sm text-gray-700 dark:text-gray-300">{output.shortDescription}</p>
              </OutputPanel>

              <OutputPanel title="Long Description" copyText={output.longDescription}>
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">{output.longDescription}</pre>
              </OutputPanel>

              <OutputPanel title="Bullet Points" copyText={output.bulletPoints.join('\n')}>
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {output.bulletPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </OutputPanel>

              <OutputPanel title="SEO Title" copyText={output.seoTitle}>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{output.seoTitle}</p>
              </OutputPanel>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
