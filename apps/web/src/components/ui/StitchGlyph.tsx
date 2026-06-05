import React from 'react'

type Props = {
  symbol: string
  color?: string
  size?: number
  strokeWidth?: number
}

export default function StitchGlyph({ symbol, color = 'currentColor', size = 24, strokeWidth = 2.2 }: Props) {
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  let glyph: React.ReactNode
  switch (symbol) {
    case 'vline':      glyph = <line x1="12" y1="3"  x2="12" y2="21" {...common}/>; break
    case 'vline2':     glyph = <><line x1="9"  y1="3" x2="9"  y2="21" {...common}/><line x1="15" y1="3" x2="15" y2="21" {...common}/></>; break
    case 'vlineX':     glyph = <><line x1="12" y1="3" x2="12" y2="21" {...common}/><line x1="7" y1="7" x2="17" y2="17" {...common}/></>; break
    case 'dash':       glyph = <line x1="3"  y1="12" x2="21" y2="12" {...common}/>; break
    case 'ring':       glyph = <circle cx="12" cy="12" r="6" {...common}/>; break
    case 'ringBig':    glyph = <circle cx="12" cy="12" r="8" {...common}/>; break
    case 'slashR':     glyph = <line x1="5"  y1="19" x2="19" y2="5"  {...common}/>; break
    case 'slashL':     glyph = <line x1="5"  y1="5"  x2="19" y2="19" {...common}/>; break
    case 'slashRdot':  glyph = <><line x1="5" y1="19" x2="19" y2="5" {...common}/><circle cx="12" cy="12" r="1.6" fill={color}/></>; break
    case 'triUp':      glyph = <path d="M5 19 L12 5 L19 19 Z" {...common}/>; break
    case 'vee':        glyph = <path d="M5 7 L12 17 L19 7" {...common}/>; break
    case 'vee2':       glyph = <><path d="M5 7 L12 17 L19 7" {...common}/><line x1="12" y1="17" x2="12" y2="21" {...common}/></>; break
    case 'plus':       glyph = <><line x1="12" y1="5" x2="12" y2="19" {...common}/><line x1="5" y1="12" x2="19" y2="12" {...common}/></>; break
    case 'cableL':     glyph = <><path d="M6 5 C 10 9, 14 15, 18 19" {...common}/><path d="M18 5 C 14 9, 10 15, 6 19" {...common}/></>; break
    case 'cableR':     glyph = <><path d="M18 5 C 14 9, 10 15, 6 19" {...common}/><path d="M6 5 C 10 9, 14 15, 18 19" {...common}/></>; break
    case 'dot':        glyph = <circle cx="12" cy="12" r="4" fill={color}/>; break
    case 'dotSm':      glyph = <circle cx="12" cy="12" r="2.5" fill={color}/>; break
    case 'grey':       glyph = <rect x="4" y="4" width="16" height="16" rx="3" fill={color} fillOpacity="0.18"/>; break
    case 'oval':       glyph = <ellipse cx="12" cy="12" rx="7" ry="4" {...common}/>; break
    case 'cross':      glyph = <><line x1="6" y1="6" x2="18" y2="18" {...common}/><line x1="18" y1="6" x2="6" y2="18" {...common}/></>; break
    case 'tee':        glyph = <><line x1="12" y1="4" x2="12" y2="20" {...common}/><line x1="6" y1="20" x2="18" y2="20" {...common}/></>; break
    case 'teeBar':     glyph = <><line x1="12" y1="4" x2="12" y2="20" {...common}/><line x1="6" y1="20" x2="18" y2="20" {...common}/><line x1="6" y1="12" x2="18" y2="12" {...common}/></>; break
    case 'teeBar2':    glyph = <><line x1="12" y1="4" x2="12" y2="20" {...common}/><line x1="6" y1="20" x2="18" y2="20" {...common}/><line x1="6" y1="10" x2="18" y2="10" {...common}/><line x1="6" y1="15" x2="18" y2="15" {...common}/></>; break
    case 'teeBar3':    glyph = <><line x1="12" y1="4" x2="12" y2="20" {...common}/><line x1="6" y1="20" x2="18" y2="20" {...common}/><line x1="6" y1="9" x2="18" y2="9" {...common}/><line x1="6" y1="13" x2="18" y2="13" {...common}/><line x1="6" y1="17" x2="18" y2="17" {...common}/></>; break
    case 'crossSlash': glyph = <><line x1="6" y1="6" x2="18" y2="18" {...common}/><line x1="18" y1="6" x2="6" y2="18" {...common}/><line x1="4" y1="12" x2="20" y2="12" {...common}/></>; break
    case 'teeSlash':   glyph = <><line x1="12" y1="4" x2="12" y2="20" {...common}/><line x1="6" y1="20" x2="18" y2="20" {...common}/><line x1="6" y1="12" x2="18" y2="12" {...common}/><line x1="4" y1="6" x2="20" y2="18" {...common}/></>; break
    case 'flower':     glyph = <><circle cx="12" cy="6" r="2.5" {...common}/><circle cx="7" cy="14" r="2.5" {...common}/><circle cx="17" cy="14" r="2.5" {...common}/></>; break
    case 'teeFwd':     glyph = <><path d="M8 4 C 14 8, 14 16, 8 20" {...common}/><line x1="6" y1="20" x2="18" y2="20" {...common}/></>; break
    case 'teeBwd':     glyph = <><path d="M16 4 C 10 8, 10 16, 16 20" {...common}/><line x1="6" y1="20" x2="18" y2="20" {...common}/></>; break
    case 'fan':        glyph = <path d="M5 19 Q 8 8 12 8 Q 16 8 19 19" {...common}/>; break
    default:           glyph = <circle cx="12" cy="12" r="6" {...common}/>
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>{glyph}</svg>
  )
}
