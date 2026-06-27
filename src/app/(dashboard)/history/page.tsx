'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { getChatHistory, deleteChatMessage, clearChatHistory, getLoginHistory, clearLoginHistory, type ChatMessage, type LoginRecord } from '@/lib/history'

type Tab = 'chat' | 'login'

export default function HistoryPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [tab, setTab] = useState<Tab>('chat')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) router.push('/login')
      else {
        setCheckingAuth(false)
        setChatHistory(getChatHistory())
        setLoginHistory(getLoginHistory())
      }
    })
  }, [router])

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  const handleDeleteChat = (id: string) => {
    deleteChatMessage(id)
    setChatHistory(getChatHistory())
  }

  const handleClearChat = () => {
    if (confirm('Clear all chat history?')) {
      clearChatHistory()
      setChatHistory([])
    }
  }

  const handleClearLogin = () => {
    if (confirm('Clear all login history?')) {
      clearLoginHistory()
      setLoginHistory([])
    }
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString()
  }

  const getToolLabel = (tool: string) => {
    const labels: Record<string, string> = {
      'article-writer': 'Article Writer',
      'seo-title': 'SEO Title Generator',
      'seo-meta': 'SEO Meta Description',
      'seo-checklist': 'SEO Checklist',
      'seo-score': 'SEO Score Analyzer',
      'image-prompt': 'Image Prompt Generator',
      'social-posts': 'Social Media Posts',
      'product-description': 'Product Description',
      'keyword-research': 'Keyword Research',
      'hashtag-generator': 'Hashtag Generator',
    }
    return labels[tool] || tool
  }

  const getOutputPreview = (output: unknown): string => {
    if (!output) return 'No output'
    const obj = output as Record<string, unknown>
    if (obj.title) return String(obj.title)
    if (obj.prompt) return String(obj.prompt).slice(0, 100)
    if (obj.variations) return `${(obj.variations as unknown[]).length} variations`
    if (obj.keywords) return `${(obj.keywords as unknown[]).length} keywords`
    if (obj.checklist) return `${(obj.checklist as unknown[]).length} items`
    if (obj.body) return String(obj.body).slice(0, 100) + '...'
    if (obj.message) return String(obj.message)
    return JSON.stringify(output).slice(0, 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.history') || 'History'}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your chat history and login activity.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          onClick={() => setTab('chat')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === 'chat' ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Chat History ({chatHistory.length})
        </button>
        <button
          onClick={() => setTab('login')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === 'login' ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Login History ({loginHistory.length})
        </button>
      </div>

      {/* Chat History */}
      {tab === 'chat' && (
        <div className="space-y-3">
          {chatHistory.length > 0 && (
            <div className="flex justify-end">
              <button onClick={handleClearChat} className="text-sm text-red-500 hover:text-red-600">Clear All</button>
            </div>
          )}
          {chatHistory.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-12 text-gray-400 dark:border-gray-700 dark:text-gray-500">
              <div className="text-center">
                <p className="text-lg">No chat history yet</p>
                <p className="mt-1 text-sm">Use AI tools and your history will appear here</p>
              </div>
            </div>
          ) : (
            chatHistory.map((msg) => (
              <div key={msg.id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {getToolLabel(msg.tool)}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(msg.timestamp)}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {getOutputPreview(msg.output)}
                    </p>
                  </div>
                  <div className="ml-2 flex gap-1">
                    <button
                      onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteChat(msg.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                {expandedId === msg.id && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                    <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">INPUT:</p>
                    <pre className="mb-2 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(msg.input, null, 2)}</pre>
                    <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">OUTPUT:</p>
                    <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">{JSON.stringify(msg.output, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Login History */}
      {tab === 'login' && (
        <div className="space-y-3">
          {loginHistory.length > 0 && (
            <div className="flex justify-end">
              <button onClick={handleClearLogin} className="text-sm text-red-500 hover:text-red-600">Clear All</button>
            </div>
          )}
          {loginHistory.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-12 text-gray-400 dark:border-gray-700 dark:text-gray-500">
              <div className="text-center">
                <p className="text-lg">No login history yet</p>
                <p className="mt-1 text-sm">Login activity will appear here</p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {loginHistory.map((record, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          record.status === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{record.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{record.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(record.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
