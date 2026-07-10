import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sharedJSONStorage } from '../storage/zustandStorage';
import { uuid } from '../utils/uuid';
function uid() {
    return 'custom_' + uuid();
}
export const useCustomStitchStore = create()(persist((set) => ({
    customStitches: [],
    addCustomStitch: (def) => {
        const id = uid();
        const stitch = { ...def, id, createdAt: new Date().toISOString() };
        set((s) => ({ customStitches: [...s.customStitches, stitch] }));
        return id;
    },
    removeCustomStitch: (id) => set((s) => ({ customStitches: s.customStitches.filter((x) => x.id !== id) })),
}), {
    name: 'skein-custom-stitches',
    storage: sharedJSONStorage(),
    version: 1,
    migrate: (persistedState, _fromVersion) => {
        return (persistedState ?? {});
    },
}));
