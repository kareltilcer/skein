/**
 * Collapse consecutive stitch instances of the same id into single runs.
 * Use this when rendering a flattened stitch row as notation ("k4, p2, k4").
 */
export function groupRuns(stitches) {
    const out = [];
    for (const s of stitches) {
        if (s.count <= 0)
            continue;
        const last = out[out.length - 1];
        if (last && last.id === s.stitchId)
            last.count += s.count;
        else
            out.push({ id: s.stitchId, count: s.count });
    }
    return out;
}
