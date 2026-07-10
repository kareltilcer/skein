// Quick-access stitch IDs for the bottom dock when no recents are available.
// Order matches the design's stitch dock (screens-setup.jsx + screens-library-create.jsx).
export const QUICK_DOCK_KNIT = ['k', 'p', 'yo', 'k2tog', 'ssk', 'sl'];
export const QUICK_DOCK_CROCHET = ['sc', 'dc', 'hdc', 'ch', 'slst', 'tr'];
// Compose the 6-stitch dock: user's recents first, then craft defaults backfill.
// Only stitches matching the active craft pass through.
export function computeDockIds(craft, recents, stitchMap, size = 6) {
    const defaults = craft === 'knit' ? QUICK_DOCK_KNIT : QUICK_DOCK_CROCHET;
    const filteredRecents = recents.filter((id) => stitchMap[id]?.type === craft);
    const ids = [...filteredRecents];
    for (const id of defaults) {
        if (ids.length >= size)
            break;
        if (!ids.includes(id))
            ids.push(id);
    }
    return ids.slice(0, size);
}
