'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ToolForm from '@/components/ToolForm'
import OutputPanel from '@/components/OutputPanel'
import { useLanguage } from '@/components/LanguageProvider'
import { saveChatMessage } from '@/lib/history'

interface SectionImage {
  heading: string
  url: string
  alt: string
  aiPrompt: string
}

interface ArticleOutput {
  title: string
  metaDescription: string
  permalink: string
  focusKeywords: string[]
  tags: string[]
  outline: string[]
  body: string
  faqs: { question: string; answer: string }[]
  featuredImage: { url: string; alt: string; aiPrompt: string }
  sectionImages: SectionImage[]
}

export default function ArticleWriterPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<ArticleOutput | null>(null)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [showAiPrompt, setShowAiPrompt] = useState<string | null>(null)

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
      const result = await res.json()
      setOutput(result)
      saveChatMessage({ tool: 'article-writer', input: data, output: result })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const allCopyText = output
    ? `Title: ${output.title}\nMeta Description: ${output.metaDescription}\nPermalink: ${output.permalink}\nFocus Keywords: ${output.focusKeywords?.join(', ')}\nTags: ${output.tags?.join(', ')}\n\nOutline:\n${output.outline?.join('\n')}\n\nArticle:\n${output.body}\n\nFAQs:\n${output.faqs?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
    : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Article Writer</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate complete SEO articles with images, meta tags, FAQs and more.
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
              { name: 'wordCount', label: t('tools.article.wordCount') || 'Word Count (min 2000)', type: 'select', options: [
                { value: '2000', label: '2000 words (Recommended)' },
                { value: '2500', label: '2500 words' },
                { value: '3000', label: '3000 words' },
                { value: '4000', label: '4000 words (In-depth)' },
                { value: '5000', label: '5000 words (Ultimate Guide)' },
              ], defaultValue: '2000', required: true },
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
              {/* Featured Image */}
              {output.featuredImage && (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <img
                      src={output.featuredImage.url}
                      alt={output.featuredImage.alt}
                      className="h-64 w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => setShowAiPrompt(showAiPrompt === 'featured' ? null : 'featured')}
                        className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 transition"
                      >
                        AI Prompt
                      </button>
                      <a
                        href={output.featuredImage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 transition"
                      >
                        Open Full
                      </a>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-sm font-medium text-white">Featured Image</p>
                    </div>
                  </div>
                  {showAiPrompt === 'featured' && (
                    <div className="bg-gray-50 p-3 dark:bg-gray-800">
                      <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">AI IMAGE PROMPT:</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{output.featuredImage.aiPrompt}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(output.featuredImage.aiPrompt)}
                        className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        Copy Prompt
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SEO Preview Card */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">SEARCH PREVIEW</h3>
                <p className="text-lg font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer">{output.title}</p>
                <p className="mt-0.5 text-sm text-green-700 dark:text-green-400">https://yoursite.com/{output.permalink}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{output.metaDescription}</p>
              </div>

              {/* Title */}
              <OutputPanel title="Title" copyText={output.title}>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{output.title}</p>
                <p className="mt-1 text-xs text-gray-400">{output.title?.length || 0}/60 characters</p>
              </OutputPanel>

              {/* Meta Description */}
              <OutputPanel title="Meta Description" copyText={output.metaDescription}>
                <p className="text-sm text-gray-700 dark:text-gray-300">{output.metaDescription}</p>
                <p className="mt-1 text-xs text-gray-400">{output.metaDescription?.length || 0}/160 characters</p>
              </OutputPanel>

              {/* Permalink */}
              <OutputPanel title="Permalink / Slug" copyText={output.permalink}>
                <p className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300">/{output.permalink}</p>
              </OutputPanel>

              {/* Focus Keywords */}
              <OutputPanel title="Focus Keywords" copyText={output.focusKeywords?.join(', ')}>
                <div className="flex flex-wrap gap-2">
                  {output.focusKeywords?.map((kw, i) => (
                    <span key={i} className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {kw}
                    </span>
                  ))}
                </div>
              </OutputPanel>

              {/* Tags */}
              <OutputPanel title="Tags" copyText={output.tags?.join(', ')}>
                <div className="flex flex-wrap gap-2">
                  {output.tags?.map((tag, i) => (
                    <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              </OutputPanel>

              {/* Outline */}
              <OutputPanel title="Outline" copyText={output.outline?.join('\n')}>
                <ol className="list-inside list-decimal space-y-1 text-gray-700 dark:text-gray-300">
                  {output.outline?.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </OutputPanel>

              {/* Article Body */}
              <OutputPanel title="Article Body" copyText={output.body}>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-300">{output.body}</pre>
              </OutputPanel>

              {/* Section Images */}
              {output.sectionImages && output.sectionImages.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">SECTION IMAGES</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {output.sectionImages.map((img, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-lg">
                        <img
                          src={img.url}
                          alt={img.alt}
                          className="h-32 w-full object-cover transition group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100">
                          <div className="p-2">
                            <p className="text-xs font-medium text-white truncate">{img.heading}</p>
                            <button
                              onClick={() => setShowAiPrompt(showAiPrompt === `section-${i}` ? null : `section-${i}`)}
                              className="mt-1 text-[10px] text-white/80 hover:text-white"
                            >
                              View AI Prompt
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {showAiPrompt && showAiPrompt.startsWith('section-') && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                      <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">AI IMAGE PROMPT:</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {output.sectionImages[parseInt(showAiPrompt.split('-')[1])]?.aiPrompt}
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(output.sectionImages[parseInt(showAiPrompt.split('-')[1])]?.aiPrompt || '')}
                        className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        Copy Prompt
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* FAQs */}
              {output.faqs && output.faqs.length > 0 && (
                <OutputPanel title="FAQs" copyText={output.faqs?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}>
                  <div className="space-y-3">
                    {output.faqs.map((faq, i) => (
                      <div key={i} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                        <p className="font-medium text-gray-900 dark:text-white">Q{i + 1}: {faq.question}</p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </OutputPanel>
              )}

              {/* Copy All */}
              <OutputPanel title="Copy Everything" copyText={allCopyText}>
                <p className="text-xs text-gray-400 dark:text-gray-500">Click copy above to get the full article with all SEO elements.</p>
              </OutputPanel>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
