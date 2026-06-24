import Database from 'better-sqlite3'
import path from 'path'
import crypto from 'crypto'

function cuid() {
  return 'c' + crypto.randomBytes(12).toString('hex')
}

function nowISO() {
  return new Date().toISOString()
}

// Initialize SQLite database
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
const _db = new Database(dbPath)

// Enable WAL mode for better concurrent access
_db.pragma('journal_mode = WAL')
_db.pragma('foreign_keys = ON')

// Create tables
_db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS GeneratedContent (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    tool TEXT NOT NULL,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id)
  );
  CREATE TABLE IF NOT EXISTS ShortLink (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    title TEXT DEFAULT '',
    clicks INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id)
  );
  CREATE TABLE IF NOT EXISTS ClickEvent (
    id TEXT PRIMARY KEY,
    linkId TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    referer TEXT DEFAULT '',
    userAgent TEXT DEFAULT '',
    FOREIGN KEY (linkId) REFERENCES ShortLink(id)
  );
  CREATE TABLE IF NOT EXISTS Plan (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    contentLimit INTEGER DEFAULT 50,
    urlLimit INTEGER DEFAULT 10,
    features TEXT DEFAULT '[]',
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS Subscription (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE NOT NULL,
    planId TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    startedAt TEXT DEFAULT (datetime('now')),
    expiresAt TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (planId) REFERENCES Plan(id)
  );
  CREATE TABLE IF NOT EXISTS UsageLog (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    action TEXT NOT NULL,
    tool TEXT DEFAULT '',
    metadata TEXT DEFAULT '{}',
    createdAt TEXT DEFAULT (datetime('now'))
  );
`)

// Helper to build WHERE clauses
function buildWhere(conditions: Record<string, unknown>): { clause: string; values: unknown[] } {
  const keys = Object.keys(conditions)
  if (keys.length === 0) return { clause: '1=1', values: [] }
  const clauses: string[] = []
  const values: unknown[] = []
  for (const key of keys) {
    const val = conditions[key]
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      // Handle Prisma-like operators
      if ('in' in val) {
        clauses.push(`${key} IN (${val.in.map(() => '?').join(',')})`)
        values.push(...val.in)
      } else if ('contains' in val) {
        clauses.push(`${key} LIKE ?`)
        values.push(`%${val.contains}%`)
      } else if ('gte' in val) {
        clauses.push(`${key} >= ?`)
        values.push(val.gte)
      } else if ('lte' in val) {
        clauses.push(`${key} <= ?`)
        values.push(val.lte)
      } else if ('gt' in val) {
        clauses.push(`${key} > ?`)
        values.push(val.gt)
      } else if ('lt' in val) {
        clauses.push(`${key} < ?`)
        values.push(val.lt)
      }
    } else {
      clauses.push(`${key} = ?`)
      values.push(val)
    }
  }
  return { clause: clauses.join(' AND '), values }
}

function buildOrderBy(orderBy: unknown): string {
  if (!orderBy) return ''
  if (typeof orderBy === 'object' && orderBy !== null && !Array.isArray(orderBy)) {
    const entries = Object.entries(orderBy)
    return entries.map(([k, v]) => `${k} ${v === 'desc' ? 'DESC' : 'ASC'}`).join(', ')
  }
  return ''
}

// Create a Prisma-like query API
function createModel(tableName: string) {
  return {
    findUnique({ where }: { where: Record<string, unknown> }) {
      const { clause, values } = buildWhere(where)
      return _db.prepare(`SELECT * FROM ${tableName} WHERE ${clause} LIMIT 1`).get(...values)
    },

    findFirst({ where, orderBy }: { where?: Record<string, unknown>; orderBy?: unknown } = {}) {
      const { clause, values } = buildWhere(where || {})
      const order = buildOrderBy(orderBy)
      const sql = `SELECT * FROM ${tableName} WHERE ${clause}${order ? ' ORDER BY ' + order : ''} LIMIT 1`
      return _db.prepare(sql).get(...values)
    },

    findMany({ where, orderBy, take, select, include }: { where?: Record<string, unknown>; orderBy?: unknown; take?: number; select?: Record<string, boolean>; include?: Record<string, unknown> } = {}) {
      const { clause, values } = buildWhere(where || {})
      const order = buildOrderBy(orderBy)
      let sql = `SELECT * FROM ${tableName} WHERE ${clause}${order ? ' ORDER BY ' + order : ''}`
      if (take) sql += ` LIMIT ${take}`

      let rows = _db.prepare(sql).all(...values) as Record<string, unknown>[]

      // Handle include (join related tables)
      if (include && typeof include === 'object') {
        for (const [relName, relConfig] of Object.entries(include)) {
          if (relName === 'user' && tableName === 'GeneratedContent') {
            for (const row of rows) {
              row.user = _db.prepare('SELECT id, name, email FROM User WHERE id = ?').get(row.userId)
            }
          } else if (relName === 'user' && tableName === 'ShortLink') {
            for (const row of rows) {
              row.user = _db.prepare('SELECT id, name, email FROM User WHERE id = ?').get(row.userId)
            }
          } else if (relName === 'link' && tableName === 'ClickEvent') {
            for (const row of rows) {
              row.link = _db.prepare('SELECT slug, url FROM ShortLink WHERE id = ?').get(row.linkId)
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

      return rows
    },

    count({ where }: { where?: Record<string, unknown> } = {}) {
      const { clause, values } = buildWhere(where || {})
      const result = _db.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE ${clause}`).get(...values) as { count: number }
      return result.count
    },

    create({ data }: { data: Record<string, unknown> }) {
      const id = (data.id as string) || cuid()
      const now = nowISO()
      const insertData = { id, createdAt: now, updatedAt: now, ...data }
      const keys = Object.keys(insertData)
      const placeholders = keys.map(() => '?').join(', ')
      const values = Object.values(insertData).map(v => (typeof v === 'object' ? JSON.stringify(v) : v))
      _db.prepare(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`).run(...values)
      return _db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id)
    },

    createMany({ data }: { data: Record<string, unknown>[] }) {
      const insert = _db.transaction((items: Record<string, unknown>[]) => {
        let count = 0
        for (const item of items) {
          const id = item.id || cuid()
          const now = nowISO()
          const insertData = { id, createdAt: now, ...item }
          const keys = Object.keys(insertData)
          const placeholders = keys.map(() => '?').join(', ')
          const values = Object.values(insertData).map(v => (typeof v === 'object' ? JSON.stringify(v) : v))
          _db.prepare(`INSERT OR IGNORE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`).run(...values)
          count++
        }
        return count
      })
      return { count: insert(data) }
    },

    update({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      const { clause, values: whereValues } = buildWhere(where)
      const now = nowISO()
      const setClauses: string[] = []
      const setValues: unknown[] = []
      for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'object' && val !== null && !Array.isArray(val) && 'increment' in val) {
          setClauses.push(`${key} = ${key} + ?`)
          setValues.push(val.increment)
        } else if (typeof val === 'object' && val !== null && !Array.isArray(val) && 'set' in val) {
          setClauses.push(`${key} = ?`)
          setValues.push(val.set)
        } else {
          setClauses.push(`${key} = ?`)
          setValues.push(typeof val === 'object' ? JSON.stringify(val) : val)
        }
      }
      setClauses.push('updatedAt = ?')
      setValues.push(now)
      _db.prepare(`UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${clause}`).run(...setValues, ...whereValues)
      return _db.prepare(`SELECT * FROM ${tableName} WHERE ${clause}`).get(...whereValues)
    },

    upsert({ where, update, create }: { where: Record<string, unknown>; update: Record<string, unknown>; create: Record<string, unknown> }) {
      const existing = _db.prepare(`SELECT * FROM ${tableName} WHERE ${Object.keys(where).map(k => `${k} = ?`).join(' AND ')}`).get(...Object.values(where))
      if (existing) {
        return this.update({ where, data: update })
      }
      return this.create({ data: create })
    },

    aggregate({ where, _sum }: { where?: Record<string, unknown>; _sum?: Record<string, boolean> }) {
      const { clause, values } = buildWhere(where || {})
      if (_sum) {
        const fields = Object.keys(_sum).filter(k => _sum[k])
        const sums: Record<string, number> = {}
        for (const field of fields) {
          const result = _db.prepare(`SELECT COALESCE(SUM(${field}), 0) as total FROM ${tableName} WHERE ${clause}`).get(...values) as { total: number }
          sums[field] = result.total
        }
        return { _sum: sums }
      }
      return {}
    },

    groupBy({ by, where, _count, orderBy, take }: { by: string[]; where?: Record<string, unknown>; _count?: boolean | Record<string, boolean>; orderBy?: unknown; take?: number }) {
      const { clause, values } = buildWhere(where || {})
      const groupField = by[0]
      const order = buildOrderBy(orderBy)
      let sql = `SELECT ${groupField}, COUNT(*) as _count_val FROM ${tableName} WHERE ${clause} GROUP BY ${groupField}${order ? ' ORDER BY ' + order : ''}`
      if (take) sql += ` LIMIT ${take}`
      const rows = _db.prepare(sql).all(...values) as Record<string, unknown>[]
      return rows.map(row => {
        const result: Record<string, unknown> = { [groupField]: row[groupField] }
        if (_count) {
          result._count = { [groupField]: row._count_val }
        }
        return result
      })
    },

    delete({ where }: { where: Record<string, unknown> }) {
      const { clause, values } = buildWhere(where)
      return _db.prepare(`DELETE FROM ${tableName} WHERE ${clause}`).run(...values)
    },
  }
}

// Export a Prisma-like client
export const prisma = {
  user: createModel('User'),
  generatedContent: createModel('GeneratedContent'),
  shortLink: createModel('ShortLink'),
  clickEvent: createModel('ClickEvent'),
  plan: createModel('Plan'),
  subscription: createModel('Subscription'),
  usageLog: createModel('UsageLog'),
  $disconnect() {
    _db.close()
  },
} as any
