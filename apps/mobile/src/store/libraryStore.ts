import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { LibrarySequence, LibraryPattern, LibraryRow } from '../types'

const SEED_SEQUENCES: LibrarySequence[] = [
  {
    id: 'lib-seq-stockinette',
    name: 'Stockinette body',
    craft: 'knit',
    rows: [
      { id: 'r1', label: 'Knit row',  stitches: [{ stitchId: 'k', count: 1 }] },
      { id: 'r2', label: 'Purl row',  stitches: [{ stitchId: 'p', count: 1 }] },
    ],
    totalRepeats: 1,
    loop: true,
    isBuiltIn: true,
  },
  {
    id: 'lib-seq-rib',
    name: '2x2 Rib',
    craft: 'knit',
    rows: [
      { id: 'r1', label: '*k2, p2* rep', stitches: [{ stitchId: 'k', count: 2 }, { stitchId: 'p', count: 2 }] },
      { id: 'r2', label: '*p2, k2* rep', stitches: [{ stitchId: 'p', count: 2 }, { stitchId: 'k', count: 2 }] },
    ],
    totalRepeats: 1,
    loop: true,
    isBuiltIn: true,
  },
  {
    id: 'lib-seq-seed',
    name: 'Seed stitch',
    craft: 'knit',
    rows: [
      { id: 'r1', label: '*k1, p1* rep', stitches: [{ stitchId: 'k', count: 1 }, { stitchId: 'p', count: 1 }] },
      { id: 'r2', label: '*p1, k1* rep', stitches: [{ stitchId: 'p', count: 1 }, { stitchId: 'k', count: 1 }] },
    ],
    totalRepeats: 1,
    loop: true,
    isBuiltIn: true,
  },
  {
    id: 'lib-seq-garter',
    name: 'Garter',
    craft: 'knit',
    rows: [
      { id: 'r1', label: 'Knit all', stitches: [{ stitchId: 'k', count: 1 }] },
    ],
    totalRepeats: 1,
    loop: true,
    isBuiltIn: true,
  },
  {
    id: 'lib-seq-cable',
    name: 'Cable panel · 6st',
    craft: 'knit',
    rows: [
      { id: 'r1', label: 'k6',           stitches: [{ stitchId: 'k', count: 6 }] },
      { id: 'r2', label: 'p6',           stitches: [{ stitchId: 'p', count: 6 }] },
      { id: 'r3', label: 'k6',           stitches: [{ stitchId: 'k', count: 6 }] },
      { id: 'r4', label: 'p6',           stitches: [{ stitchId: 'p', count: 6 }] },
      { id: 'r5', label: 'c4f, k2',      stitches: [{ stitchId: 'c4f', count: 1 }, { stitchId: 'k', count: 2 }] },
      { id: 'r6', label: 'p6',           stitches: [{ stitchId: 'p', count: 6 }] },
      { id: 'r7', label: 'k6',           stitches: [{ stitchId: 'k', count: 6 }] },
      { id: 'r8', label: 'p6',           stitches: [{ stitchId: 'p', count: 6 }] },
    ],
    totalRepeats: 1,
    loop: false,
    isBuiltIn: true,
  },
  {
    id: 'lib-seq-bobble',
    name: 'Bobble row',
    craft: 'knit',
    rows: [
      { id: 'r1', label: '*k3, mb* rep', stitches: [{ stitchId: 'k', count: 3 }, { stitchId: 'mb', count: 1 }] },
    ],
    totalRepeats: 1,
    loop: false,
    isBuiltIn: true,
  },
  {
    id: 'lib-seq-granny',
    name: 'Granny square ring',
    craft: 'crochet',
    rows: [
      { id: 'r1', label: 'Magic ring',       stitches: [{ stitchId: 'mr', count: 1 }] },
      { id: 'r2', label: '3dc, ch1 × 4',    stitches: [{ stitchId: 'dc', count: 3 }, { stitchId: 'ch', count: 1 }] },
      { id: 'r3', label: 'sl st join',       stitches: [{ stitchId: 'slst', count: 1 }] },
      { id: 'r4', label: '(3dc, ch1, 3dc) corners', stitches: [{ stitchId: 'dc', count: 3 }, { stitchId: 'ch', count: 1 }, { stitchId: 'dc', count: 3 }] },
      { id: 'r5', label: 'sl st join',       stitches: [{ stitchId: 'slst', count: 1 }] },
      { id: 'r6', label: 'fasten off',       stitches: [] },
    ],
    totalRepeats: 1,
    loop: false,
    isBuiltIn: true,
  },
  {
    id: 'lib-seq-shell',
    name: 'Shell border',
    craft: 'crochet',
    rows: [
      { id: 'r1', label: 'sc all',           stitches: [{ stitchId: 'sc', count: 1 }] },
      { id: 'r2', label: '*sk1, 5dc, sk1, sc* rep', stitches: [{ stitchId: 'dc', count: 5 }, { stitchId: 'sc', count: 1 }] },
    ],
    totalRepeats: 1,
    loop: false,
    isBuiltIn: true,
  },
]

const SEED_PATTERNS: LibraryPattern[] = [
  {
    id: 'lib-pat-cardigan',
    name: 'Granny Cardigan v3',
    craft: 'knit',
    sequenceIds: ['lib-seq-rib', 'lib-seq-stockinette', 'lib-seq-cable'],
    isBuiltIn: true,
  },
  {
    id: 'lib-pat-socks',
    name: 'Sock recipe — short row heel',
    craft: 'knit',
    sequenceIds: ['lib-seq-rib', 'lib-seq-stockinette'],
    isBuiltIn: true,
  },
  {
    id: 'lib-pat-beanie',
    name: 'Magic ring beanie',
    craft: 'crochet',
    sequenceIds: ['lib-seq-granny', 'lib-seq-shell'],
    isBuiltIn: true,
  },
  {
    id: 'lib-pat-throw',
    name: 'Hexagon throw',
    craft: 'crochet',
    sequenceIds: ['lib-seq-granny'],
    isBuiltIn: true,
  },
]

const SEED_ROWS: LibraryRow[] = [
  {
    id: 'lib-row-1x2rib',
    label: 'k1, *p2, k1*, rep',
    craft: 'knit',
    stitches: [{ stitchId: 'k', count: 1 }, { stitchId: 'p', count: 2 }, { stitchId: 'k', count: 1 }],
    isBuiltIn: true,
  },
  {
    id: 'lib-row-allknit',
    label: 'All knit',
    craft: 'knit',
    stitches: [{ stitchId: 'k', count: 1 }],
    isBuiltIn: true,
  },
  {
    id: 'lib-row-allpurl',
    label: 'All purl',
    craft: 'knit',
    stitches: [{ stitchId: 'p', count: 1 }],
    isBuiltIn: true,
  },
  {
    id: 'lib-row-decr',
    label: 'Decrease right',
    craft: 'knit',
    stitches: [{ stitchId: 'k2tog', count: 1 }, { stitchId: 'k', count: 1 }],
    isBuiltIn: true,
  },
  {
    id: 'lib-row-eyelet',
    label: 'YO eyelet row',
    craft: 'knit',
    stitches: [{ stitchId: 'k', count: 1 }, { stitchId: 'yo', count: 1 }, { stitchId: 'k2tog', count: 1 }],
    isBuiltIn: true,
  },
  {
    id: 'lib-row-granny-shell',
    label: 'Granny shell',
    craft: 'crochet',
    stitches: [{ stitchId: 'dc', count: 3 }, { stitchId: 'ch', count: 1 }],
    isBuiltIn: true,
  },
]

type LibraryStore = {
  sequences: LibrarySequence[]
  patterns: LibraryPattern[]
  rows: LibraryRow[]
  addSequence: (seq: LibrarySequence) => void
  addPattern: (pat: LibraryPattern) => void
  addRow: (row: LibraryRow) => void
  deleteSequence: (id: string) => void
  deletePattern: (id: string) => void
  deleteRow: (id: string) => void
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set) => ({
      sequences: SEED_SEQUENCES,
      patterns:  SEED_PATTERNS,
      rows:      SEED_ROWS,

      addSequence: (seq)  => set((s) => ({ sequences: [...s.sequences, seq] })),
      addPattern:  (pat)  => set((s) => ({ patterns:  [...s.patterns, pat]  })),
      addRow:      (row)  => set((s) => ({ rows:      [...s.rows, row]      })),

      deleteSequence: (id) => set((s) => ({ sequences: s.sequences.filter((x) => x.id !== id) })),
      deletePattern:  (id) => set((s) => ({ patterns:  s.patterns.filter((x)  => x.id !== id) })),
      deleteRow:      (id) => set((s) => ({ rows:      s.rows.filter((x)      => x.id !== id) })),
    }),
    {
      name: 'skein-library',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
