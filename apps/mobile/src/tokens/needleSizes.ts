import type { Craft, NeedleUnit } from '../types'

export type NeedleEntry = { mm: string; us: string; typical: string }

export const KNIT_SIZES: NeedleEntry[] = [
  { mm: '1.5',  us: '',         typical: 'Lace' },
  { mm: '1.75', us: '',         typical: 'Lace' },
  { mm: '2.0',  us: 'US 0',     typical: 'Lace' },
  { mm: '2.25', us: 'US 1',     typical: 'Lace' },
  { mm: '2.5',  us: '',         typical: 'Lace' },
  { mm: '2.75', us: 'US 2',     typical: 'Fingering' },
  { mm: '3.0',  us: '',         typical: 'Fingering' },
  { mm: '3.25', us: 'US 3',     typical: 'Sport' },
  { mm: '3.5',  us: 'US 4',     typical: 'Sport' },
  { mm: '3.75', us: 'US 5',     typical: 'DK' },
  { mm: '4.0',  us: 'US 6',     typical: 'DK' },
  { mm: '4.5',  us: 'US 7',     typical: 'Worsted' },
  { mm: '5.0',  us: 'US 8',     typical: 'Worsted' },
  { mm: '5.5',  us: 'US 9',     typical: 'Aran' },
  { mm: '6.0',  us: 'US 10',    typical: 'Bulky' },
  { mm: '6.5',  us: 'US 10.5',  typical: 'Bulky' },
  { mm: '7.0',  us: '',         typical: 'Bulky' },
  { mm: '8.0',  us: 'US 11',    typical: 'Chunky' },
  { mm: '9.0',  us: 'US 13',    typical: 'Super Chunky' },
  { mm: '10.0', us: 'US 15',    typical: 'Jumbo' },
  { mm: '12.0', us: 'US 17',    typical: 'Jumbo' },
  { mm: '15.0', us: 'US 19',    typical: 'Jumbo' },
]

export const CROCHET_SIZES: NeedleEntry[] = [
  { mm: '2.25', us: 'B/1',    typical: 'Lace' },
  { mm: '2.75', us: 'C/2',    typical: 'Fingering' },
  { mm: '3.25', us: 'D/3',    typical: 'Sport' },
  { mm: '3.5',  us: 'E/4',    typical: 'Sport' },
  { mm: '3.75', us: 'F/5',    typical: 'DK' },
  { mm: '4.0',  us: 'G/6',    typical: 'DK' },
  { mm: '4.5',  us: '7',      typical: 'Worsted' },
  { mm: '5.0',  us: 'H/8',    typical: 'Worsted' },
  { mm: '5.5',  us: 'I/9',    typical: 'Aran' },
  { mm: '6.0',  us: 'J/10',   typical: 'Bulky' },
  { mm: '6.5',  us: 'K/10.5', typical: 'Bulky' },
  { mm: '8.0',  us: 'L/11',   typical: 'Chunky' },
  { mm: '9.0',  us: 'M/13',   typical: 'Chunky' },
  { mm: '10.0', us: 'N/15',   typical: 'Jumbo' },
  { mm: '12.0', us: 'P/Q',    typical: 'Jumbo' },
]

export const KNIT_NEEDLE_TYPES = ['Straight', 'Circular', 'DPN']

export function sizesFor(craft: Craft): NeedleEntry[] {
  return craft === 'knit' ? KNIT_SIZES : CROCHET_SIZES
}

export function findEntry(craft: Craft, mm: string): NeedleEntry | undefined {
  return sizesFor(craft).find((s) => s.mm === mm)
}

export function formatNeedleSize(craft: Craft, mm: string, unit: NeedleUnit): string {
  const entry = findEntry(craft, mm)
  if (unit === 'us' && entry?.us) return entry.us
  return `${mm} mm`
}
