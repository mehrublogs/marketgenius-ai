'use client'

interface Column {
  key: string
  label: string
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

interface AdminTableProps {
  columns: Column[]
  data: Record<string, unknown>[]
  loading?: boolean
}

export default function AdminTable({ columns, data, loading }: AdminTableProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <svg className="h-6 w-6 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="card">
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No data available</div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {data.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
              {columns.map(col => (
                <td key={col.key} className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] as string) || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
