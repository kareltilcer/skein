/**
 * UUID v4. Prefers the platform crypto.randomUUID (available in modern
 * browsers and React Native >= 0.74 once the get-random-values polyfill is
 * loaded). Falls back to a Math.random implementation if neither is available
 * — that fallback should never run in practice, it's there so this module
 * never throws if loaded before a polyfill.
 */
export function uuid(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } }
  if (g.crypto?.randomUUID) return g.crypto.randomUUID()
  // Math.random fallback — RFC4122 compliant shape but not cryptographically strong.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
