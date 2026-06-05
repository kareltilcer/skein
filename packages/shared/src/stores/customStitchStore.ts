import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sharedJSONStorage } from '../storage/zustandStorage'
import type { CustomStitchDef, TileColorKey, CountsAs, Craft } from '../types/domain'
import { uuid } from '../utils/uuid'

function uid() {
  return 'custom_' + uuid()
}

type NewCustomStitch = {
  abbr: string
  name: string
  type: Craft
  symbol: string
  tileColorKey: TileColorKey
  countsAs: CountsAs
  notation?: string
  group?: string
}

type CustomStitchStore = {
  customStitches: CustomStitchDef[]
  addCustomStitch: (def: NewCustomStitch) => string
  removeCustomStitch: (id: string) => void
}

export const useCustomStitchStore = create<CustomStitchStore>()(
  persist(
    (set) => ({
      customStitches: [],

      addCustomStitch: (def) => {
        const id = uid()
        const stitch: CustomStitchDef = { ...def, id, createdAt: new Date().toISOString() }
        set((s) => ({ customStitches: [...s.customStitches, stitch] }))
        return id
      },

      removeCustomStitch: (id) =>
        set((s) => ({ customStitches: s.customStitches.filter((x) => x.id !== id) })),
    }),
    {
      name: 'skein-custom-stitches',
      storage: sharedJSONStorage(),
      version: 1,
      migrate: (persistedState, _fromVersion) => {
        return (persistedState ?? {}) as { customStitches?: CustomStitchDef[] }
      },
    },
  ),
)
