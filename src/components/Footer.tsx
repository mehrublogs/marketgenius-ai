'use client'

import { useLanguage } from './LanguageProvider'
import Link from 'next/link'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">M</div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/features" className="hover:text-gray-700 dark:hover:text-gray-300">{t('nav.features')}</Link>
            <Link href="/pricing" className="hover:text-gray-700 dark:hover:text-gray-300">{t('nav.pricing')}</Link>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">&copy; {new Date().getFullYear()} {t('app.name')}. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  )
}
