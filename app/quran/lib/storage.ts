const ONE_MINUTE_MS = 60 * 1000

type StoredWithExpiry<T> = {
  expiresAt: number
  value: T
}

export function readStorageWithExpiry<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as StoredWithExpiry<T>
    if (!parsed || typeof parsed !== 'object') {
      window.localStorage.removeItem(key)
      return null
    }

    if (typeof parsed.expiresAt !== 'number' || Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key)
      return null
    }

    return parsed.value
  } catch {
    return null
  }
}

export function writeStorageWithExpiry<T>(
  key: string,
  value: T,
  ttlMs: number,
) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const payload: StoredWithExpiry<T> = {
      expiresAt: Date.now() + Math.max(ttlMs, ONE_MINUTE_MS),
      value,
    }

    window.localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // Ignore quota and serialization issues.
  }
}

export function readStorageValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return fallback
    }

    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorageValue<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore quota and serialization issues.
  }
}
