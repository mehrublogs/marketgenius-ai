'use client'

import { useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PricingCard from '@/components/PricingCard'

export default function PricingPage() {
  const { t, locale } = useLanguage()
  const [isYearly, setIsYearly] = useState(false)
  const isRtl = locale === 'ar'

  const rows = [
    {
      feature: t('sidebar.articleWriter'),
      free: t('plan.free.content'),
      pro: t('plan.pro.content'),
      agency: t('pricing.compare.unlimited'),
    },
    {
      feature: t('sidebar.urlShortener'),
      free: t('plan.free.urls'),
      pro: t('plan.pro.urls'),
      agency: t('pricing.compare.unlimited'),
    },
    {
      feature: t('sidebar.keywordResearch'),
      free: '✓',
      pro: '✓',
      agency: '✓',
    },
    {
      feature: t('sidebar.seoTools'),
      free: '✓',
      pro: '✓',
      agency: '✓',
    },
    {
      feature: t('sidebar.hashtagGenerator'),
      free: '✓',
      pro: '✓',
      agency: '✓',
    },
    {
      feature: t('sidebar.imagePrompt'),
      free: '✓',
      pro: '✓',
      agency: '✓',
    },
    {
      feature: t('sidebar.socialPosts'),
      free: '✓',
      pro: '✓',
      agency: '✓',
    },
    {
      feature: t('sidebar.productDesc'),
      free: '✓',
      pro: '✓',
      agency: '✓',
    },
    {
      feature: t('pricing.compare.prioritySupport'),
      free: '—',
      pro: '✓',
      agency: '✓',
    },
    {
      feature: t('pricing.compare.teamMembers'),
      free: '—',
      pro: '—',
      agency: '✓',
    },
  ]

  return (
    <>
      <Navbar />
      <main>
        <section className="px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
                {t('pricing.title')}
              </h1>
            </div>

            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {t('pricing.monthly')}
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isYearly ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                role="switch"
                aria-checked={isYearly}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {t('pricing.yearly')}
              </span>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
              <PricingCard
                name={t('pricing.free')}
                price={0}
                description={t('plan.free.desc')}
                features={[
                  t('plan.free.content'),
                  t('plan.free.urls'),
                ]}
                cta={t('pricing.getStarted')}
              />
              <PricingCard
                name={t('pricing.pro')}
                price={isYearly ? 24 : 29}
                description={t('plan.pro.desc')}
                features={[
                  t('plan.pro.content'),
                  t('plan.pro.urls'),
                  t('plan.pro.features'),
                ]}
                cta={t('pricing.getStarted')}
                popular
              />
              <PricingCard
                name={t('pricing.agency')}
                price={isYearly ? 83 : 99}
                description={t('plan.agency.desc')}
                features={[
                  t('plan.agency.content'),
                  t('plan.agency.urls'),
                  t('plan.agency.features'),
                ]}
                cta={t('pricing.getStarted')}
              />
            </div>

            <section className="mt-24">
              <h2 className="text-2xl font-bold text-center text-gray-900 sm:text-3xl mb-10 dark:text-white">
                {t('pricing.compare.title')}
              </h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                      <th className={`py-4 px-6 font-semibold text-gray-900 dark:text-white ${isRtl ? 'text-right' : ''}`}>
                        {t('pricing.compare.title')}
                      </th>
                      <th className="py-4 px-4 text-center font-semibold text-gray-900 dark:text-white">{t('pricing.free')}</th>
                      <th className="py-4 px-4 text-center font-semibold text-primary-600 dark:text-primary-400">{t('pricing.pro')}</th>
                      <th className="py-4 px-4 text-center font-semibold text-gray-900 dark:text-white">{t('pricing.agency')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className={`py-4 px-6 text-gray-700 dark:text-gray-300 ${isRtl ? 'text-right' : ''}`}>{row.feature}</td>
                        <td className={`py-4 px-4 text-center text-gray-600 dark:text-gray-400 ${row.free === '✓' ? 'text-secondary-600 dark:text-secondary-400' : ''}`}>{row.free}</td>
                        <td className={`py-4 px-4 text-center text-gray-600 dark:text-gray-400 ${row.pro === '✓' ? 'text-secondary-600 dark:text-secondary-400' : ''}`}>{row.pro}</td>
                        <td className={`py-4 px-4 text-center text-gray-600 dark:text-gray-400 ${row.agency === '✓' ? 'text-secondary-600 dark:text-secondary-400' : ''}`}>{row.agency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
