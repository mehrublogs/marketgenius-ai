import crypto from 'crypto'

function cuid() {
  return 'c' + crypto.randomBytes(12).toString('hex')
}

function nowISO() {
  return new Date().toISOString()
}

// In-memory database tables
const tables: Record<string, Map<string, Record<string, unknown>>> = {
  User: new Map(),
  GeneratedContent: new Map(),
  ShortLink: new Map(),
  ClickEvent: new Map(),
  Plan: new Map(),
  Subscription: new Map(),
  UsageLog: new Map(),
}

// Seed default data on first load
let seeded = false
function seedIfNeeded() {
  if (seeded) return
  seeded = true

  // Default plans
  const plans = [
    { id: 'plan_free', name: 'free', description: 'Free plan with basic features', price: 0, contentLimit: 10, urlLimit: 5, features: '["5 AI Tools","Basic Analytics","URL Shortener (5 links)"]', isActive: 1 },
    { id: 'plan_pro', name: 'pro', description: 'Professional plan with advanced features', price: 29.99, contentLimit: 100, urlLimit: 50, features: '["All AI Tools","Advanced Analytics","Priority Support","URL Shortener (50 links)","Custom Templates"]', isActive: 1 },
    { id: 'plan_enterprise', name: 'enterprise', description: 'Enterprise plan with unlimited features', price: 99.99, contentLimit: -1, urlLimit: -1, features: '["Unlimited AI Tools","Enterprise Analytics","24/7 Support","Unlimited URLs","Custom Integrations","Team Management","API Access"]', isActive: 1 },
  ]
  for (const plan of plans) {
    const now = nowISO()
    tables.Plan.set(plan.id, { ...plan, createdAt: now, updatedAt: now })
  }

  // Default admin user (password: admin12345)
  const adminId = 'user_admin'
  tables.User.set(adminId, {
    id: adminId,
    email: 'admin@example.com',
    password: '$2b$12$dyOoQcah8xH/Of9lci2ceuy6Kt3OTqoZZ4YTpp3D9dAC8rNdKfNJi', // bcrypt hash of admin12345
    name: 'Admin User',
    role: 'admin',
    isActive: 1,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  })

  // Default demo user (password: user12345)
  const userId = 'user_demo'
  tables.User.set(userId, {
    id: userId,
    email: 'user@example.com',
    password: '$2b$12$YmQsqeXfhHQPENzuekowieOJWVNKTuq6kqpAiNGlC9NXunWGNuT9C', // bcrypt hash of user12345
    name: 'Demo User',
    role: 'user',
    isActive: 1,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  })

  // Default subscription for demo user
  tables.Subscription.set('sub_demo', {
    id: 'sub_demo',
    userId: userId,
    planId: 'plan_free',
    status: 'active',
    startedAt: nowISO(),
    expiresAt: null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  })
}

seedIfNeeded()

function buildWhere(conditions: Record<string, unknown>): { clause: string; values: unknown[] } {
  const keys = Object.keys(conditions)
  if (keys.length === 0) return { clause: '1=1', values: [] }
  return {
    clause: keys.map(k => `${k} = ?`).join(' AND '),
    values: Object.values(conditions),
  }
}

function matchesWhere(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
  for (const [key, val] of Object.entries(where)) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      if ('in' in val && !val.in.includes(row[key])) return false
      if ('contains' in val && !(row[key] as string || '').includes(val.contains)) return false
      if ('gte' in val && (row[key] as number) < val.gte) return false
      if ('lte' in val && (row[key] as number) > val.lte) return false
      if ('gt' in val && (row[key] as number) <= val.gt) return false
      if ('lt' in val && (row[key] as number) >= val.lt) return false
    } else {
      if (row[key] !== val) return false
    }
  }
  return true
}

function sortRows(rows: Record<string, unknown>[], orderBy: unknown): Record<string, unknown>[] {
  if (!orderBy || typeof orderBy !== 'object' || Array.isArray(orderBy)) return rows
  const entries = Object.entries(orderBy as Record<string, string>)
  return [...rows].sort((a, b) => {
    for (const [key, dir] of entries) {
      const aVal = a[key] as string | number
      const bVal = b[key] as string | number
      if (aVal < bVal) return dir === 'asc' ? -1 : 1
      if (aVal > bVal) return dir === 'asc' ? 1 : -1
    }
    return 0
  })
}

function createModel(tableName: string) {
  return {
    findUnique({ where }: { where: Record<string, unknown> }) {
      const table = tables[tableName]
      if (!table) return undefined
      for (const row of table.values()) {
        if (matchesWhere(row, where)) return { ...row }
      }
      return undefined
    },

    findFirst({ where = {}, orderBy }: { where?: Record<string, unknown>; orderBy?: unknown } = {}) {
      const table = tables[tableName]
      if (!table) return undefined
      let rows = [...table.values()].filter(r => matchesWhere(r, where))
      if (orderBy) rows = sortRows(rows, orderBy)
      return rows[0] ? { ...rows[0] } : undefined
    },

    findMany({ where = {}, orderBy, take, select, include }: { where?: Record<string, unknown>; orderBy?: unknown; take?: number; select?: Record<string, boolean>; include?: Record<string, unknown> } = {}) {
      const table = tables[tableName]
      if (!table) return []
      let rows = [...table.values()].filter(r => matchesWhere(r, where))
      if (orderBy) rows = sortRows(rows, orderBy)
      if (take) rows = rows.slice(0, take)

      // Handle include (join related tables)
      if (include && typeof include === 'object') {
        for (const [relName] of Object.entries(include)) {
          if (relName === 'user' && (tableName === 'GeneratedContent' || tableName === 'ShortLink')) {
            for (const row of rows) {
              row.user = tables.User.get(row.userId as string) || null
            }
          } else if (relName === 'link' && tableName === 'ClickEvent') {
            for (const row of rows) {
              row.link = tables.ShortLink.get(row.linkId as string) || null
            }
          } else if (relName === 'plan' && tableName === 'Subscription') {
            for (const row of rows) {
              row.plan = tables.Plan.get(row.planId as string) || null
            }
          }
        }
      }

      // Handle select
      if (select && typeof select === 'object') {
        rows = rows.map(row => {
          const selected: Record<string, unknown> = {}
          for (const [key, include] of Object.entries(select)) {
            if (include) selected[key] = row[key]
          }
          return selected
        })
      }

      return rows.map(r => ({ ...r }))
    },

    count({ where = {} }: { where?: Record<string, unknown> } = {}) {
      const table = tables[tableName]
      if (!table) return 0
      return [...table.values()].filter(r => matchesWhere(r, where)).length
    },

    create({ data }: { data: Record<string, unknown> }) {
      const table = tables[tableName]
      const id = (data.id as string) || cuid()
      const now = nowISO()
      const record = { id, createdAt: now, updatedAt: now, ...data }
      table.set(id, record)
      return { ...record }
    },

    createMany({ data }: { data: Record<string, unknown>[] }) {
      const table = tables[tableName]
      let count = 0
      for (const item of data) {
        const id = (item.id as string) || cuid()
        const now = nowISO()
        const record = { id, createdAt: now, ...item }
        if (!table.has(id)) {
          table.set(id, record)
          count++
        }
      }
      return { count }
    },

    update({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      const table = tables[tableName]
      for (const row of table.values()) {
        if (matchesWhere(row, where)) {
          const now = nowISO()
          for (const [key, val] of Object.entries(data)) {
            if (typeof val === 'object' && val !== null && 'increment' in val) {
              row[key] = (row[key] as number) + (val as { increment: number }).increment
            } else if (typeof val === 'object' && val !== null && 'set' in val) {
              row[key] = (val as { set: unknown }).set
            } else {
              row[key] = val
            }
          }
          row.updatedAt = now
          return { ...row }
        }
      }
      return undefined
    },

    upsert({ where, update, create }: { where: Record<string, unknown>; update: Record<string, unknown>; create: Record<string, unknown> }) {
      const existing = this.findUnique({ where })
      if (existing) {
        return this.update({ where, data: update })
      }
      return this.create({ data: create })
    },

    aggregate({ where = {}, _sum }: { where?: Record<string, unknown>; _sum?: Record<string, boolean> } = {}) {
      const table = tables[tableName]
      if (!table) return { _sum: {} }
      const rows = [...table.values()].filter(r => matchesWhere(r, where))
      if (_sum) {
        const fields = Object.keys(_sum).filter(k => _sum[k])
        const sums: Record<string, number> = {}
        for (const field of fields) {
          sums[field] = rows.reduce((acc, r) => acc + ((r[field] as number) || 0), 0)
        }
        return { _sum: sums }
      }
      return { _sum: {} }
    },

    groupBy({ by, where = {}, _count, orderBy, take }: { by: string[]; where?: Record<string, unknown>; _count?: boolean | Record<string, boolean>; orderBy?: unknown; take?: number }) {
      const table = tables[tableName]
      if (!table) return []
      const groupField = by[0]
      const rows = [...table.values()].filter(r => matchesWhere(r, where))
      const groups = new Map<unknown, Record<string, unknown>[]>()

      for (const row of rows) {
        const key = row[groupField]
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(row)
      }

      let results = [...groups.entries()].map(([key, items]) => {
        const result: Record<string, unknown> = { [groupField]: key }
        if (_count) {
          result._count = { [groupField]: items.length }
        }
        return result
      })

      if (orderBy) results = sortRows(results, orderBy) as Record<string, unknown>[]
      if (take) results = results.slice(0, take)
      return results
    },

    delete({ where }: { where: Record<string, unknown> }) {
      const table = tables[tableName]
      let count = 0
      for (const [id, row] of table.entries()) {
        if (matchesWhere(row, where)) {
          table.delete(id)
          count++
        }
      }
      return { count }
    },
  }
}

export const prisma = {
  user: createModel('User'),
  generatedContent: createModel('GeneratedContent'),
  shortLink: createModel('ShortLink'),
  clickEvent: createModel('ClickEvent'),
  plan: createModel('Plan'),
  subscription: createModel('Subscription'),
  usageLog: createModel('UsageLog'),
  $disconnect() {},
} as any
