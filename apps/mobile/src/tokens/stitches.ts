import type { StitchDef } from '../types'

// Color palette for stitch chips (cycling warm palette)
const KNIT_COLORS = ['#C4E3D4', '#D4C4E3', '#E3D4C4', '#C4D4E3', '#E3C4D4']
const CROCHET_COLORS = ['#E8D5B0', '#D0E8B0', '#B0D5E8', '#E8B0D0', '#D5E8B0']

function kc(i: number) { return KNIT_COLORS[i % KNIT_COLORS.length] }
function cc(i: number) { return CROCHET_COLORS[i % CROCHET_COLORS.length] }

export const STITCHES: StitchDef[] = [
  // — Knit (15) —
  { id: 'k',     abbr: 'k',     name: 'Knit',              type: 'knit',    symbol: 'vline',      color: kc(0) },
  { id: 'p',     abbr: 'p',     name: 'Purl',              type: 'knit',    symbol: 'dash',       color: kc(1) },
  { id: 'yo',    abbr: 'yo',    name: 'Yarn Over',         type: 'knit',    symbol: 'ring',       color: kc(2) },
  { id: 'k2tog', abbr: 'k2tog', name: 'Knit 2 Together',  type: 'knit',    symbol: 'slashR',     color: kc(3) },
  { id: 'ssk',   abbr: 'ssk',   name: 'Slip Slip Knit',   type: 'knit',    symbol: 'slashL',     color: kc(4) },
  { id: 'k3tog', abbr: 'k3tog', name: 'Knit 3 Together',  type: 'knit',    symbol: 'triUp',      color: kc(0) },
  { id: 'p2tog', abbr: 'p2tog', name: 'Purl 2 Together',  type: 'knit',    symbol: 'slashRdot',  color: kc(1) },
  { id: 'kfb',   abbr: 'kfb',   name: 'Knit Front & Back',type: 'knit',    symbol: 'vee',        color: kc(2) },
  { id: 'm1',    abbr: 'm1',    name: 'Make 1',            type: 'knit',    symbol: 'plus',       color: kc(3) },
  { id: 'sl',    abbr: 'sl',    name: 'Slip Stitch',       type: 'knit',    symbol: 'vline2',     color: kc(4) },
  { id: 'c4f',   abbr: 'c4f',   name: 'Cable 4 Front',    type: 'knit',    symbol: 'cableL',     color: kc(0) },
  { id: 'c4b',   abbr: 'c4b',   name: 'Cable 4 Back',     type: 'knit',    symbol: 'cableR',     color: kc(1) },
  { id: 'mb',    abbr: 'mb',    name: 'Make Bobble',       type: 'knit',    symbol: 'dot',        color: kc(2) },
  { id: 'tbl',   abbr: 'tbl',   name: 'Through Back Loop',type: 'knit',    symbol: 'vlineX',     color: kc(3) },
  { id: 'ns',    abbr: '—',     name: 'No Stitch',         type: 'knit',    symbol: 'grey',       color: kc(4) },

  // — Crochet (15) —
  { id: 'ch',    abbr: 'ch',    name: 'Chain',             type: 'crochet', symbol: 'oval',       color: cc(0) },
  { id: 'slst',  abbr: 'sl st', name: 'Slip Stitch (cr.)', type: 'crochet', symbol: 'dotSm',      color: cc(1) },
  { id: 'sc',    abbr: 'sc',    name: 'Single Crochet',    type: 'crochet', symbol: 'cross',      color: cc(2) },
  { id: 'hdc',   abbr: 'hdc',   name: 'Half Double Crochet',type:'crochet', symbol: 'tee',        color: cc(3) },
  { id: 'dc',    abbr: 'dc',    name: 'Double Crochet',    type: 'crochet', symbol: 'teeBar',     color: cc(4) },
  { id: 'tr',    abbr: 'tr',    name: 'Treble Crochet',    type: 'crochet', symbol: 'teeBar2',    color: cc(0) },
  { id: 'dtr',   abbr: 'dtr',   name: 'Double Treble',     type: 'crochet', symbol: 'teeBar3',    color: cc(1) },
  { id: 'sc2tog',abbr: 'sc2tog',name: 'Sc 2 Together',     type: 'crochet', symbol: 'crossSlash', color: cc(2) },
  { id: 'dc2tog',abbr: 'dc2tog',name: 'Dc 2 Together',     type: 'crochet', symbol: 'teeSlash',   color: cc(3) },
  { id: 'pic',   abbr: 'pic',   name: 'Picot',             type: 'crochet', symbol: 'flower',     color: cc(4) },
  { id: 'fpdc',  abbr: 'fpdc',  name: 'Front Post Dc',     type: 'crochet', symbol: 'teeFwd',     color: cc(0) },
  { id: 'bpdc',  abbr: 'bpdc',  name: 'Back Post Dc',      type: 'crochet', symbol: 'teeBwd',     color: cc(1) },
  { id: 'mr',    abbr: 'mr',    name: 'Magic Ring',        type: 'crochet', symbol: 'ringBig',    color: cc(2) },
  { id: 'shell', abbr: 'shell', name: 'Shell',             type: 'crochet', symbol: 'fan',        color: cc(3) },
  { id: 'vst',   abbr: 'v-st',  name: 'V-Stitch',          type: 'crochet', symbol: 'vee2',       color: cc(4) },
]

export const STITCH_MAP = Object.fromEntries(STITCHES.map(s => [s.id, s]))

export const STITCH_GROUPS: Record<string, string[]> = {
  all:       STITCHES.map(s => s.id),
  knit:      STITCHES.filter(s => s.type === 'knit').map(s => s.id),
  crochet:   STITCHES.filter(s => s.type === 'crochet').map(s => s.id),
  increases: ['yo', 'kfb', 'm1', 'mr'],
  decreases: ['k2tog', 'ssk', 'k3tog', 'p2tog', 'sc2tog', 'dc2tog'],
  cables:    ['c4f', 'c4b'],
}
