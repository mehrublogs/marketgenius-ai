'use client'

const HISTORY_KEY = 'marketgenius_history'
const LOGIN_HISTORY_KEY = 'marketgenius_login_history'

export interface ChatMessage {
  id: string
  tool: string
  input: Record<string, string>
  output: unknown
  timestamp: string
}

export interface LoginRecord {
  email: string
  name: string
  timestamp: string
  status: 'success' | 'failed'
  ip?: string
}

// --- Chat History ---

export function getChatHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
  const history = getChatHistory()
  const newMsg: ChatMessage = {
    ...msg,
    id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    timestamp: new Date().toISOString(),
  }
  history.unshift(newMsg)
  if (history.length > 100) history.splice(100)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return newMsg
}

export function deleteChatMessage(id: string) {
  const history = getChatHistory().filter(m => m.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function clearChatHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

// --- Login History ---

export function getLoginHistory(): LoginRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(LOGIN_HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveLoginRecord(record: Omit<LoginRecord, 'timestamp'>): LoginRecord {
  const history = getLoginHistory()
  const newRecord: LoginRecord = {
    ...record,
    timestamp: new Date().toISOString(),
  }
  history.unshift(newRecord)
  if (history.length > 50) history.splice(50)
  localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history))
  return newRecord
}

export function clearLoginHistory() {
  localStorage.removeItem(LOGIN_HISTORY_KEY)
}

// --- Export All Data ---

export function exportAllData() {
  return {
    chatHistory: getChatHistory(),
    loginHistory: getLoginHistory(),
    exportedAt: new Date().toISOString(),
  }
}
