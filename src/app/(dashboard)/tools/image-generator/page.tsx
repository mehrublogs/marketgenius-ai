'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { saveChatMessage } from '@/lib/history'

interface GeneratedImage {
  url: string
  alt: string
  width: number
  height: number
  photographer: string
  source: string
}

export default function ImageGeneratorPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [aiPrompt, setAiPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || loading) return

    setLoading(true)
    setError('')
    setImages([])
    setAiPrompt('')

    try {
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), count: 6 }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate images')
      }

      const data = await res.json()
      setImages(data.images || [])
      setAiPrompt(data.aiPrompt || '')
      saveChatMessage({ tool: 'image-generator', input: { prompt }, output: data })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyAiPrompt = () => {
    navigator.clipboard.writeText(aiPrompt)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  const suggestedPrompts = [
    'Professional business team in modern office',
    'Beautiful sunset over mountain landscape',
    'Creative workspace with laptop and coffee',
    'Abstract technology background with blue lights',
    'Healthy food arrangement on wooden table',
    'City skyline at golden hour',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Image Generator</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate images from text prompts. Get high-quality images and AI prompts for custom generation.
        </p>
      </div>

      {/* Prompt Input */}
      <div className="card">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="label">Describe the image you want</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A professional business team working in a modern office with natural lighting..."
              className="input-field min-h-[100px] resize-none"
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="btn-primary"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </span>
              ) : (
                'Generate Images'
              )}
            </button>
          </div>
        </form>

        {/* Suggested Prompts */}
        {images.length === 0 && !loading && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">SUGGESTED PROMPTS:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* AI Prompt for Custom Generation */}
      {aiPrompt && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Prompt for Custom Generation</h3>
            <button
              onClick={copyAiPrompt}
              className="rounded-lg bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400"
            >
              {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 rounded-lg p-3 dark:bg-gray-800">{aiPrompt}</p>
          <p className="mt-2 text-xs text-gray-400">Use this prompt in Midjourney, DALL-E, Leonardo.ai, or Bing Image Creator for custom AI-generated images.</p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Generated Images</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {images.map((img, i) => (
              <div
                key={i}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="h-48 w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40">
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition group-hover:opacity-100">
                    <p className="text-xs font-medium text-white">Click to enlarge</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="max-h-[80vh] rounded-lg object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/60 p-4">
              <p className="text-sm text-white">{selectedImage.alt}</p>
              <p className="text-xs text-gray-300">Photo by {selectedImage.photographer} on {selectedImage.source}</p>
              <div className="mt-2 flex gap-2">
                <a
                  href={selectedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30"
                >
                  Open Full Size
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedImage.url)
                  }}
                  className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30"
                >
                  Copy URL
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
