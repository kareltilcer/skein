export type Craft = 'knit' | 'crochet'
export type Theme = 'light' | 'dark'

export type StitchDef = {
  id: string
  abbr: string
  name: string
  type: Craft
  symbol: string
  color: string
}

export type StitchInstance = {
  stitchId: string
  count: number
}

export type Row = {
  id: string
  label: string
  stitches: StitchInstance[]
}

export type Sequence = {
  id: string
  name: string
  rows: Row[]
  totalRepeats: number
  loop: boolean
}

export type Part = {
  id: string
  name: string
  color: string
  notes?: string
  sequences: Sequence[]
  loop?: boolean
}

export type Project = {
  id: string
  name: string
  craft: Craft
  yarnWeight: string
  needleSize: string
  needleType?: string
  yarnColor: string
  notes: string
  status: 'active' | 'finished'
  parts: Part[]
  currentPartIndex: number
  currentSequenceIndex: number
  currentRepeat: number
  currentRowIndex: number
  createdAt: string
  updatedAt: string
}

export type LibrarySequence = {
  id: string
  name: string
  craft: Craft
  rows: Row[]
  totalRepeats: number
  loop: boolean
  isBuiltIn: boolean
}

export type LibraryPattern = {
  id: string
  name: string
  craft: Craft
  sequenceIds: string[]
  isBuiltIn: boolean
}

export type LibraryRow = {
  id: string
  label: string
  craft: Craft
  stitches: StitchInstance[]
  isBuiltIn: boolean
}

export type Settings = {
  theme: Theme
  language: string
  defaultCraft: Craft
  holdTimeMs: number
  hasSeenWelcome: boolean
}

export type TileColorKey = 'brick' | 'mustard' | 'forest' | 'brickDk' | 'mustardDk' | 'forestDk'
export type CountsAs = 'inc' | 'one' | 'dec'

export type CustomStitchDef = {
  id: string
  abbr: string
  name: string
  type: Craft
  symbol: string
  tileColorKey: TileColorKey
  countsAs: CountsAs
  notation?: string
  group?: string
  createdAt: string
}
