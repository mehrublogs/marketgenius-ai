'use client'

import { useLanguage } from './LanguageProvider'

interface PricingCardProps {
  name: string
  price: number
  description: string
  features: string[]
  cta: string
  popular?: boolean
  current?: boolean
  onSelect?: () => void
}

export default function PricingCard({ name, price, description, features, cta, popular, current, onSelect }: PricingCardProps) {
  const { locale } = useLanguage()
  const isRtl = locale === 'ar'

  return (
    <div className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:shadow-md ${
      popular
        ? 'border-primary-500 ring-2 ring-primary-500 dark:border-primary-400'
        : 'border-gray-200 dark:border-gray-700'
    } bg-white dark:bg-gray-800`}>
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-xs font-medium text-white">
          Most Popular
        </span>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          {price === 0 ? 'Free' : `$${price}`}
        </span>
        {price > 0 && <span className="text-sm text-gray-500 dark:text-gray-400">/{isRtl ? 'شهر' : 'mo'}</span>}
      </div>
      <ul className={`mb-8 flex-1 space-y-3 ${isRtl ? 'text-right' : ''}`}>
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
            <svg className={`mt-0.5 h-4 w-4 flex-shrink-0 text-secondary-500 ${isRtl ? 'order-1' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        disabled={current}
        className={`w-full rounded-xl px-5 py-3 text-center text-sm font-semibold transition-all ${
          current
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
            : popular
              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {current ? 'Current Plan' : cta}
      </button>
    </div>
  )
}
