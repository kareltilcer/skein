import { setStorageAdapter } from '@skein/shared';
const localStorageAdapter = {
    getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
    setItem: (key, value) => { window.localStorage.setItem(key, value); return Promise.resolve(); },
    removeItem: (key) => { window.localStorage.removeItem(key); return Promise.resolve(); },
    multiRemove: (keys) => {
        for (const k of keys)
            window.localStorage.removeItem(k);
        return Promise.resolve();
    },
};
setStorageAdapter(localStorageAdapter);
