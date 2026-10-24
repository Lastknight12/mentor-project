const store = new Map()
const pending = new Map()

export function getCached(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function setCached(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export async function withCache(key, ttlMs, loader) {
  const cached = getCached(key)
  if (cached !== null) return { value: cached, hit: true }

  if (pending.has(key)) {
    const value = await pending.get(key)
    return { value, hit: true }
  }

  const task = Promise.resolve()
    .then(loader)
    .then((value) => {
      setCached(key, value, ttlMs)
      return value
    })
    .finally(() => {
      pending.delete(key)
    })

  pending.set(key, task)
  const value = await task
  return { value, hit: false }
}

export function clearCache() {
  store.clear()
}
