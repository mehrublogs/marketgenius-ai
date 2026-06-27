'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from './LanguageProvider'

interface SidebarProps {
  user: { name: string; email: string; role: string }
}

export default function Sidebar({ user }: SidebarProps) {
  const { t, locale } = useLanguage()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isAdmin = user.role === 'admin'

  const mainLinks = [
    { href: '/dashboard', label: t('sidebar.dashboard'), icon: '📊' },
    { href: '/tools/article-writer', label: t('sidebar.articleWriter'), icon: '✍️' },
    { href: '/tools/seo-tools', label: t('sidebar.seoTools'), icon: '🔍' },
    { href: '/tools/image-prompt', label: t('sidebar.imagePrompt'), icon: '🖼️' },
    { href: '/tools/social-posts', label: t('sidebar.socialPosts'), icon: '📱' },
    { href: '/tools/product-description', label: t('sidebar.productDesc'), icon: '📦' },
    { href: '/tools/keyword-research', label: t('sidebar.keywordResearch'), icon: '🔑' },
    { href: '/tools/hashtag-generator', label: t('sidebar.hashtagGenerator'), icon: '🏷️' },
  ]

  const utilityLinks = [
    { href: '/url-shortener', label: t('sidebar.urlShortener'), icon: '🔗' },
    { href: '/analytics', label: t('sidebar.analytics'), icon: '📈' },
    { href: '/history', label: t('nav.history') || 'History', icon: '📋' },
    { href: '/settings', label: t('sidebar.settings'), icon: '⚙️' },
  ]

  const adminLinks = [
    { href: '/admin', label: t('admin.dashboard'), icon: '🛡️' },
    { href: '/admin/users', label: t('admin.users'), icon: '👥' },
    { href: '/admin/content', label: t('admin.content'), icon: '📄' },
    { href: '/admin/links', label: t('admin.links'), icon: '🔗' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href)
        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
    }`

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setCollapsed(true)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed bottom-0 left-0 top-16 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-all dark:border-gray-700 dark:bg-gray-900 lg:static lg:z-auto ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
        {/* User info */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t('sidebar.tools')}
          </p>
          {mainLinks.map(link => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          <p className="mb-2 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Utilities
          </p>
          {utilityLinks.map(link => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          {isAdmin && (
            <>
              <p className="mb-2 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Admin
              </p>
              {adminLinks.map(link => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg lg:hidden"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  )
}
