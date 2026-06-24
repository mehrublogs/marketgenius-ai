'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import AdminTable from '@/components/AdminTable'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const { t } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => { if (data.users) setUsers(data.users) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleRole = async (id: string, newRole: string) => {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role: newRole }) })
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive: !isActive }) })
    setUsers(users.map(u => u.id === id ? { ...u, isActive: !isActive } : u))
  }

  const columns = [
    { key: 'name', label: t('settings.name') },
    { key: 'email', label: t('auth.email') },
    {
      key: 'role', label: 'Role',
      render: (v: unknown) => (
        <select value={v as string} onChange={e => toggleRole(v as string, e.target.value)} className="input-field !w-auto !py-1 text-xs">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: (v: unknown, row: Record<string, unknown>) => (
        <button onClick={() => toggleActive(row.id as string, v as boolean)} className={`rounded-full px-2 py-1 text-xs font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {v ? 'Active' : 'Disabled'}
        </button>
      ),
    },
    {
      key: 'createdAt', label: t('url.created'),
      render: (v: unknown) => new Date(v as string).toLocaleDateString(),
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('admin.users')}</h1>
      <AdminTable columns={columns} data={users as unknown as Record<string, unknown>[]} loading={loading} />
    </div>
  )
}
