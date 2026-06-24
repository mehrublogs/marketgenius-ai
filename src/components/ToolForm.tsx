'use client'

import { ReactNode } from 'react'

interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'select' | 'number' | 'textarea'
  placeholder?: string
  options?: { value: string; label: string }[]
  required?: boolean
  defaultValue?: string
}

interface ToolFormProps {
  fields: FieldConfig[]
  onSubmit: (data: Record<string, string>) => void
  loading?: boolean
  submitLabel?: string
  children?: ReactNode
}

export default function ToolForm({ fields, onSubmit, loading, submitLabel = 'Generate', children }: ToolFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    fields.forEach(f => {
      const value = formData.get(f.name) as string
      if (value) data[f.name] = value
    })
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={field.name}>
          <label htmlFor={field.name} className="label">{field.label}</label>
          {field.type === 'select' ? (
            <select id={field.name} name={field.name} defaultValue={field.defaultValue || ''} required={field.required} className="input-field">
              <option value="">Select {field.label}...</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea id={field.name} name={field.name} placeholder={field.placeholder} required={field.required} rows={3} className="input-field resize-none" />
          ) : (
            <input id={field.name} name={field.name} type={field.type} placeholder={field.placeholder} required={field.required} className="input-field" />
          )}
        </div>
      ))}
      {children}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </span>
        ) : submitLabel}
      </button>
    </form>
  )
}
