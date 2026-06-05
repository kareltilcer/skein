import type { StitchInstance } from '../types'

export type StitchRun = { id: string; count: number }

/**
 * Collapse consecutive stitch instances of the same id into single runs.
 * Use this when rendering a flattened stitch row as notation ("k4, p2, k4").
 */
export function groupRuns(stitches: StitchInstance[]): StitchRun[] {
  const out: StitchRun[] = []
  for (const s of stitches) {
    if (s.count <= 0) continue
    const last = out[out.length - 1]
    if (last && last.id === s.stitchId) last.count += s.count
    else out.push({ id: s.stitchId, count: s.count })
  }
  return out
}
