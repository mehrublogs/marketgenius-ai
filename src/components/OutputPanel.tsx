'use client'

import { useState } from 'react'
import { useLanguage } from './LanguageProvider'

interface OutputPanelProps {
  title?: string
  children: React.ReactNode
  copyText?: string
}

export default function OutputPanel({ title, children, copyText }: OutputPanelProps) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = copyText || (typeof children === 'string' ? children : '')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="card mt-6">
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title || t('tools.result')}</h3>
          <button onClick={handleCopy} className="btn-secondary text-xs">
            {copied ? (
              <span className="flex items-center gap-1 text-secondary-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('tools.copied')}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('tools.copy')}
              </span>
            )}
          </button>
        </div>
      )}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {children}
      </div>
    </div>
  )
}
