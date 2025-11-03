const SESSION_KEY = 'onprez_auth_recovery'

interface SessionData {
  email?: string
  handle?: string
  businessName?: string
  businessCategory?: string
  timestamp: number
}

export const sessionStorage = {
  save(data: Partial<SessionData>) {
    try {
      const existing = this.get()
      const updated = {
        ...existing,
        ...data,
        timestamp: Date.now(),
      }
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  },

  get(): SessionData | null {
    try {
      const data = window.sessionStorage.getItem(SESSION_KEY)
      if (!data) return null

      const parsed = JSON.parse(data)
      const age = Date.now() - parsed.timestamp

      // Expire after 30 minutes
      if (age > 30 * 60 * 1000) {
        this.clear()
        return null
      }

      return parsed
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  },

  clear() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY)
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  },
}
