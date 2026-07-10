export function expandStitches(stitches) {
    const out = [];
    for (const inst of stitches) {
        for (let i = 0; i < inst.count; i++)
            out.push(inst.stitchId);
    }
    return out;
}
function collapseRuns(ids) {
    const out = [];
    for (const id of ids) {
        const last = out[out.length - 1];
        if (last && last.stitchId === id)
            last.count += 1;
        else
            out.push({ stitchId: id, count: 1 });
    }
    return out;
}
export function flattenSegments(segments) {
    const ids = [];
    for (const seg of segments)
        ids.push(...expandStitches(seg.stitches));
    return collapseRuns(ids);
}
export function segmentsFromMark(stitches, startTile, endTile) {
    const flat = expandStitches(stitches);
    const safeStart = Math.max(0, Math.min(startTile, flat.length - 1));
    const safeEnd = Math.max(safeStart, Math.min(endTile, flat.length - 1));
    const lead = flat.slice(0, safeStart);
    const repeat = flat.slice(safeStart, safeEnd + 1);
    const trail = flat.slice(safeEnd + 1);
    const segs = [];
    if (lead.length > 0)
        segs.push({ type: 'fixed', stitches: collapseRuns(lead) });
    segs.push({
        type: 'repeat',
        stitches: collapseRuns(repeat),
        rule: trail.length > 0 ? { kind: 'toLast', n: trail.length } : { kind: 'toEnd' },
    });
    if (trail.length > 0)
        segs.push({ type: 'fixed', stitches: collapseRuns(trail) });
    return segs;
}
function recomputeRepeatRule(segments) {
    return segments.map((seg, i) => {
        if (seg.type !== 'repeat')
            return seg;
        let trailCount = 0;
        for (let j = i + 1; j < segments.length; j++) {
            const s = segments[j];
            if (s.type !== 'fixed')
                continue;
            for (const inst of s.stitches)
                trailCount += inst.count;
        }
        return {
            ...seg,
            rule: trailCount > 0 ? { kind: 'toLast', n: trailCount } : { kind: 'toEnd' },
        };
    });
}
function appendToFlat(stitches, stitchId) {
    const last = stitches[stitches.length - 1];
    if (last && last.stitchId === stitchId) {
        return [...stitches.slice(0, -1), { stitchId, count: last.count + 1 }];
    }
    return [...stitches, { stitchId, count: 1 }];
}
export function appendStitchPreservingSegments(row, stitchId) {
    const nextStitches = appendToFlat(row.stitches, stitchId);
    if (!row.segments)
        return { ...row, stitches: nextStitches };
    const segs = [...row.segments];
    const lastIdx = segs.length - 1;
    const last = segs[lastIdx];
    let nextSegs;
    if (last.type === 'fixed') {
        nextSegs = segs.map((s, i) => i === lastIdx ? { ...s, stitches: appendToFlat(s.stitches, stitchId) } : s);
    }
    else {
        nextSegs = [...segs, { type: 'fixed', stitches: [{ stitchId, count: 1 }] }];
    }
    return { ...row, stitches: nextStitches, segments: recomputeRepeatRule(nextSegs) };
}
function popFromFlat(stitches) {
    if (stitches.length === 0)
        return stitches;
    const last = stitches[stitches.length - 1];
    if (last.count > 1)
        return [...stitches.slice(0, -1), { ...last, count: last.count - 1 }];
    return stitches.slice(0, -1);
}
export function removeLastStitchPreservingSegments(row) {
    if (row.stitches.length === 0)
        return row;
    const nextStitches = popFromFlat(row.stitches);
    if (!row.segments)
        return { ...row, stitches: nextStitches };
    const segs = [...row.segments];
    for (let i = segs.length - 1; i >= 0; i--) {
        const s = segs[i];
        const total = s.stitches.reduce((a, b) => a + b.count, 0);
        if (total === 0)
            continue;
        const next = popFromFlat(s.stitches);
        segs[i] = { ...s, stitches: next };
        break;
    }
    // Drop empty fixed segments; if the repeat itself is empty, abandon segmentation.
    const repeat = segs.find(s => s.type === 'repeat');
    const repeatEmpty = !repeat || repeat.stitches.reduce((a, b) => a + b.count, 0) === 0;
    if (repeatEmpty) {
        const { segments: _, ...rest } = row;
        return { ...rest, stitches: nextStitches };
    }
    const cleaned = segs.filter(s => s.type === 'repeat' || s.stitches.reduce((a, b) => a + b.count, 0) > 0);
    return { ...row, stitches: nextStitches, segments: recomputeRepeatRule(cleaned) };
}
