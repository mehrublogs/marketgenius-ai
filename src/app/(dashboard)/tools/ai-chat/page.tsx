'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { saveChatMessage } from '@/lib/history'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type?: string
  output?: unknown
  timestamp: string
}

export default function SmartAIPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [detection, setDetection] = useState<{ topic: string; intent: string; confidence: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) router.push('/login')
      else setCheckingAuth(false)
    })
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/smart-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.content }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate')
      }

      const data = await res.json()

      if (data.detection) {
        setDetection(data.detection)
      }

      let responseText = ''
      const output = data.output

      if (data.type === 'general-chat') {
        responseText = output?.response || 'I could not generate a response. Please try again.'
      } else if (data.type === 'article-writer') {
        responseText = `**${output?.title || 'Article'}**\n\n${output?.body || ''}\n\n---\n**Meta:** ${output?.metaDescription || ''}\n**Tags:** ${output?.tags?.join(', ') || ''}\n**FAQs:** ${output?.faqs?.length || 0} questions included`
      } else if (data.type === 'seo') {
        responseText = `**SEO Results:**\n\n**Titles:**\n${output?.titles?.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n') || ''}\n\n**Meta Descriptions:**\n${output?.descriptions?.map((d: string, i: number) => `${i + 1}. ${d}`).join('\n') || ''}`
      } else if (data.type === 'social-media') {
        responseText = `**Social Media Posts:**\n\n${output?.variations?.map((v: { text: string }, i: number) => `**Post ${i + 1}:**\n${v.text}`).join('\n\n') || ''}`
      } else if (data.type === 'hashtags') {
        responseText = `**Hashtags:**\n\n**Popular:** ${output?.popular?.join(' ') || ''}\n\n**Niche:** ${output?.niche?.join(' ') || ''}\n\n**Branded:** ${output?.branded?.join(' ') || ''}\n\n**Low Competition:** ${output?.lowCompetition?.join(' ') || ''}`
      } else if (data.type === 'image-prompt') {
        responseText = `**Image Prompt:**\n\n${output?.prompt || ''}`
      } else if (data.type === 'keywords') {
        responseText = `**Keywords:**\n\n${output?.keywords?.map((k: { keyword: string; volume: number; difficulty: string }) => `• **${k.keyword}** - Vol: ${k.volume} - Difficulty: ${k.difficulty}`).join('\n') || ''}`
      } else {
        responseText = JSON.stringify(output, null, 2)
      }

      const assistantMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: responseText,
        type: data.type,
        output: data.output,
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMsg])
      saveChatMessage({ tool: 'smart-ai', input: { prompt: userMsg.content }, output: data })

    } catch (err) {
      const errorMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Smart AI Assistant</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Ask anything — AI auto-detects your intent and provides the best results</p>
        {detection && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Topic: {detection.topic}
            </span>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Intent: {detection.intent}
            </span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Confidence: {detection.confidence}%
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mb-4 text-5xl">🤖</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">How can I help you?</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">I can auto-detect what you need and generate the best results.</p>
              <div className="mt-6 grid grid-cols-2 gap-2 text-left">
                {[
                  'Write an article about digital marketing',
                  'Give me SEO tips for my blog',
                  'Create social posts about AI technology',
                  'Generate hashtags for fitness',
                  'Write a product description for wireless headphones',
                  'What is machine learning?',
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="rounded-lg border border-gray-200 bg-white p-2.5 text-left text-xs text-gray-600 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-primary-600 dark:hover:bg-primary-900/20"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
            }`}>
              {msg.type && msg.role === 'assistant' && (
                <span className="mb-1 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                  {msg.type}
                </span>
              )}
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
              <p className={`mt-1 text-[10px] ${msg.role === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything... (e.g., write an article about marketing)"
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
