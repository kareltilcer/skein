import type { Craft, StitchDef } from '../types/domain'

// Quick-access stitch IDs for the bottom dock when no recents are available.
// Order matches the design's stitch dock (screens-setup.jsx + screens-library-create.jsx).
export const QUICK_DOCK_KNIT    = ['k', 'p', 'yo', 'k2tog', 'ssk', 'sl'] as const
export const QUICK_DOCK_CROCHET = ['sc', 'dc', 'hdc', 'ch', 'slst', 'tr'] as const

// Compose the 6-stitch dock: user's recents first, then craft defaults backfill.
// Only stitches matching the active craft pass through.
export function computeDockIds(
  craft: Craft,
  recents: string[],
  stitchMap: Record<string, StitchDef | undefined>,
  size = 6,
): string[] {
  const defaults = craft === 'knit' ? QUICK_DOCK_KNIT : QUICK_DOCK_CROCHET
  const filteredRecents = recents.filter((id) => stitchMap[id]?.type === craft)
  const ids: string[] = [...filteredRecents]
  for (const id of defaults) {
    if (ids.length >= size) break
    if (!ids.includes(id)) ids.push(id)
  }
  return ids.slice(0, size)
}
