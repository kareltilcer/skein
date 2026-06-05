import { createJSONStorage } from 'zustand/middleware'
import { getStorageAdapter } from './adapter'

/**
 * Single `createJSONStorage` factory all shared stores use. Reads through the
 * adapter registered by the host app (AsyncStorage on mobile, localStorage on
 * web, anything sync-aware in the future).
 *
 * `createJSONStorage` is called lazily by zustand on first read, so the
 * adapter only has to be registered before any persisted store hydrates —
 * not before this file is imported.
 */
export function sharedJSONStorage() {
  return createJSONStorage(() => ({
    getItem: (key: string) => getStorageAdapter().getItem(key),
    setItem: (key: string, value: string) => getStorageAdapter().setItem(key, value),
    removeItem: (key: string) => getStorageAdapter().removeItem(key),
  }))
}
