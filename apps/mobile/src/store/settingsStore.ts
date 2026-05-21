import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Settings, Theme, Craft } from '../types'

type SettingsStore = Settings & {
  setTheme: (theme: Theme) => void
  setLanguage: (lang: string) => void
  setDefaultCraft: (craft: Craft) => void
  setHoldTimeMs: (ms: number) => void
  markWelcomeSeen: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme:            'light',
      language:         'en',
      defaultCraft:     'knit',
      holdTimeMs:       3000,
      hasSeenWelcome:   false,

      setTheme:         (theme) => set({ theme }),
      setLanguage:      (language) => set({ language }),
      setDefaultCraft:  (defaultCraft) => set({ defaultCraft }),
      setHoldTimeMs:    (holdTimeMs) => set({ holdTimeMs }),
      markWelcomeSeen:  () => set({ hasSeenWelcome: true }),
    }),
    {
      name: 'skein-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
