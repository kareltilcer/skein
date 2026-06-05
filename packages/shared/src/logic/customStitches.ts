import type { CustomStitchDef, StitchDef } from '../types/domain'
import type { ColorTokens } from '../tokens/colors'
import { STITCH_MAP } from '../tokens/stitches'

/**
 * Merge built-in stitch map with user-defined custom stitches.
 * Custom stitches have a tileColorKey that resolves to a palette color from
 * the active theme. Returns a brand new map only when there are custom
 * stitches — otherwise returns the shared STITCH_MAP reference so callers'
 * `useMemo` deps stay stable.
 */
export function mergeStitchMap(
  customStitches: CustomStitchDef[],
  colors: ColorTokens,
): Record<string, StitchDef> {
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
}
