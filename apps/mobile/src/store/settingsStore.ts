import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Settings, Theme, Craft } from '../types'

const RECENT_MAX = 12 // store more than we show so we have craft-filtered extras

type SettingsStore = Settings & {
  recentStitchIds: string[]
  setTheme: (theme: Theme) => void
  setLanguage: (lang: string) => void
  setDefaultCraft: (craft: Craft) => void
  setHoldTimeMs: (ms: number) => void
  markWelcomeSeen: () => void
  recordStitchUsed: (id: string) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme:               'auto',
      language:            'en',
      languageInitialized: false,
      defaultCraft:        'knit',
      holdTimeMs:          3000,
      hasSeenWelcome:      false,
      recentStitchIds:     [],

      setTheme:         (theme) => set({ theme }),
      setLanguage:      (language) => set({ language, languageInitialized: true }),
      setDefaultCraft:  (defaultCraft) => set({ defaultCraft }),
      setHoldTimeMs:    (holdTimeMs) => set({ holdTimeMs }),
      markWelcomeSeen:  () => set({ hasSeenWelcome: true }),
      recordStitchUsed: (id) => set((s) => {
        const filtered = s.recentStitchIds.filter((x) => x !== id)
        return { recentStitchIds: [id, ...filtered].slice(0, RECENT_MAX) }
      }),
    }),
    {
      name: 'skein-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
