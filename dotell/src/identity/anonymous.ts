const STORAGE_KEY = 'dotell:anonymous_id'

export function getAnonymousId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) {
    return existing
  }

  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY, id)
  return id
}

export function clearAnonymousId(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(STORAGE_KEY)
}
