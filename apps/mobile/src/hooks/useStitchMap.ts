import { useMemo } from 'react'
import { STITCH_MAP } from '../tokens/stitches'
import { useCustomStitchStore } from '../store/customStitchStore'
import { useTheme } from '../theme/ThemeContext'
import type { StitchDef } from '../types'

/**
 * Built-in stitches merged with user-defined custom stitches.
 * Use this anywhere a stitch is rendered or resolved by id — otherwise
 * custom stitches are silently dropped because they're not in STITCH_MAP.
 */
export function useStitchMap(): Record<string, StitchDef> {
  const customStitches = useCustomStitchStore(s => s.customStitches)
  const { colors } = useTheme()
  return useMemo(() => {
    if (customStitches.length === 0) return STITCH_MAP
    const merged: Record<string, StitchDef> = { ...STITCH_MAP }
    for (const c of customStitches) {
      merged[c.id] = {
        id:     c.id,
        abbr:   c.abbr,
        name:   c.name,
        type:   c.type,
        symbol: c.symbol,
        color:  colors[c.tileColorKey] ?? colors.forest,
      }
    }
    return merged
  }, [customStitches, colors])
}
