export type StorageAdapter = {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  multiRemove?(keys: string[]): Promise<void>
}

let adapter: StorageAdapter | null = null

export function setStorageAdapter(a: StorageAdapter): void {
  adapter = a
}

export function getStorageAdapter(): StorageAdapter {
  if (!adapter) {
    throw new Error(
      '@skein/shared: storage adapter not set. Call setStorageAdapter() before any persisted store is used.',
    )
  }
  return adapter
}

export async function multiRemove(keys: string[]): Promise<void> {
  const a = getStorageAdapter()
  if (a.multiRemove) {
    await a.multiRemove(keys)
    return
  }
  await Promise.all(keys.map((k) => a.removeItem(k)))
}
