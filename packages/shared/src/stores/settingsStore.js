import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sharedJSONStorage } from '../storage/zustandStorage';
const RECENT_MAX = 12; // store more than we show so we have craft-filtered extras
export const useSettingsStore = create()(persist((set) => ({
    theme: 'auto',
    language: 'en',
    languageInitialized: false,
    defaultCraft: 'knit',
    needleSizeUnit: 'mm',
    holdTimeMs: 3000,
    hasSeenWelcome: false,
    recentStitchIds: [],
    setTheme: (theme) => set({ theme }),
    setLanguage: (language) => set({ language, languageInitialized: true }),
    setDefaultCraft: (defaultCraft) => set({ defaultCraft }),
    setNeedleSizeUnit: (needleSizeUnit) => set({ needleSizeUnit }),
    setHoldTimeMs: (holdTimeMs) => set({ holdTimeMs }),
    markWelcomeSeen: () => set({ hasSeenWelcome: true }),
    recordStitchUsed: (id) => set((s) => {
        const filtered = s.recentStitchIds.filter((x) => x !== id);
        return { recentStitchIds: [id, ...filtered].slice(0, RECENT_MAX) };
    }),
}), {
    name: 'skein-settings',
    storage: sharedJSONStorage(),
    version: 1,
    partialize: (s) => ({
        theme: s.theme,
        language: s.language,
        languageInitialized: s.languageInitialized,
        defaultCraft: s.defaultCraft,
        needleSizeUnit: s.needleSizeUnit,
        holdTimeMs: s.holdTimeMs,
        hasSeenWelcome: s.hasSeenWelcome,
        recentStitchIds: s.recentStitchIds,
    }),
    migrate: (persistedState, fromVersion) => {
        const s = (persistedState ?? {});
        if (fromVersion < 1) {
            // v0 partialize dropped `languageInitialized`. Anyone who had v0
            // persisted state has already chosen (or accepted) a language —
            // mark it initialized so the root-layout effect doesn't override
            // their saved `language` with the OS-detected one on next boot.
            return { ...s, languageInitialized: true };
        }
        return s;
    },
}));
