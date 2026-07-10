let adapter = null;
export function setStorageAdapter(a) {
    adapter = a;
}
export function getStorageAdapter() {
    if (!adapter) {
        throw new Error('@skein/shared: storage adapter not set. Call setStorageAdapter() before any persisted store is used.');
    }
    return adapter;
}
export async function multiRemove(keys) {
    const a = getStorageAdapter();
    if (a.multiRemove) {
        await a.multiRemove(keys);
        return;
    }
    await Promise.all(keys.map((k) => a.removeItem(k)));
}
