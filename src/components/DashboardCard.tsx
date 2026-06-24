'use client'

export default function DashboardCard({
  title,
  value,
  icon,
  description,
  color = 'primary',
}: {
  title: string
  value: string | number
  icon: string
  description?: string
  color?: 'primary' | 'secondary' | 'amber' | 'rose'
}) {
  const colorMap = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
  }

  return (
    <div className="card group relative overflow-hidden">
      <div className={`absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-gradient-to-br ${colorMap[color]} opacity-10`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <span className="text-2xl">{icon}</span>
        </div>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        {description && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description}</p>}
      </div>
    </div>
  )
}
