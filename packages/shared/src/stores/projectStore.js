import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sharedJSONStorage } from '../storage/zustandStorage';
function getCurrentSequence(project) {
    const part = project.parts[project.currentPartIndex];
    return part?.sequences[project.currentSequenceIndex];
}
export const useProjectStore = create()(persist((set) => ({
    projects: [],
    addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
    updateProject: (id, updates) => set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
    })),
    deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
    advanceRow: (id) => set((s) => {
        const idx = s.projects.findIndex((p) => p.id === id);
        if (idx === -1)
            return s;
        const p = { ...s.projects[idx] };
        const seq = getCurrentSequence(p);
        if (!seq)
            return s;
        const nextRow = p.currentRowIndex + 1;
        if (nextRow < seq.rows.length) {
            p.currentRowIndex = nextRow;
        }
        else {
            const nextRepeat = p.currentRepeat + 1;
            if (nextRepeat <= seq.totalRepeats) {
                p.currentRepeat = nextRepeat;
                p.currentRowIndex = 0;
            }
            else {
                const part = p.parts[p.currentPartIndex];
                const nextSeqIdx = p.currentSequenceIndex + 1;
                if (nextSeqIdx < part.sequences.length) {
                    p.currentSequenceIndex = nextSeqIdx;
                    p.currentRepeat = 1;
                    p.currentRowIndex = 0;
                }
                else if (part.loop) {
                    p.currentSequenceIndex = 0;
                    p.currentRepeat = 1;
                    p.currentRowIndex = 0;
                }
                else {
                    const nextPartIdx = p.currentPartIndex + 1;
                    if (nextPartIdx < p.parts.length) {
                        p.currentPartIndex = nextPartIdx;
                        p.currentSequenceIndex = 0;
                        p.currentRepeat = 1;
                        p.currentRowIndex = 0;
                    }
                    else {
                        p.status = 'finished';
                    }
                }
            }
        }
        p.updatedAt = new Date().toISOString();
        const updated = [...s.projects];
        updated[idx] = p;
        return { projects: updated };
    }),
    retreatRow: (id) => set((s) => {
        const idx = s.projects.findIndex((p) => p.id === id);
        if (idx === -1)
            return s;
        const p = { ...s.projects[idx] };
        const currentPart = p.parts[p.currentPartIndex];
        if (p.currentRowIndex > 0) {
            p.currentRowIndex--;
        }
        else if (p.currentRepeat > 1) {
            const seq = getCurrentSequence(p);
            p.currentRepeat--;
            p.currentRowIndex = seq ? seq.rows.length - 1 : 0;
        }
        else if (p.currentSequenceIndex > 0) {
            p.currentSequenceIndex--;
            const part = p.parts[p.currentPartIndex];
            const prevSeq = part?.sequences[p.currentSequenceIndex];
            p.currentRepeat = prevSeq?.totalRepeats ?? 1;
            p.currentRowIndex = (prevSeq?.rows.length ?? 1) - 1;
        }
        else if (currentPart?.loop) {
            const lastSeqIdx = currentPart.sequences.length - 1;
            const lastSeq = currentPart.sequences[lastSeqIdx];
            p.currentSequenceIndex = lastSeqIdx;
            p.currentRepeat = lastSeq?.totalRepeats ?? 1;
            p.currentRowIndex = (lastSeq?.rows.length ?? 1) - 1;
        }
        else if (p.currentPartIndex > 0) {
            p.currentPartIndex--;
            const prevPart = p.parts[p.currentPartIndex];
            p.currentSequenceIndex = (prevPart?.sequences.length ?? 1) - 1;
            const prevSeq = prevPart?.sequences[p.currentSequenceIndex];
            p.currentRepeat = prevSeq?.totalRepeats ?? 1;
            p.currentRowIndex = (prevSeq?.rows.length ?? 1) - 1;
        }
        p.updatedAt = new Date().toISOString();
        const updated = [...s.projects];
        updated[idx] = p;
        return { projects: updated };
    }),
    jumpTo: (id, partIdx, seqIdx, rowIdx, repeat = 1) => set((s) => {
        const idx = s.projects.findIndex((p) => p.id === id);
        if (idx === -1)
            return s;
        const p = { ...s.projects[idx] };
        const part = p.parts[partIdx];
        if (!part)
            return s;
        const seq = part.sequences[seqIdx];
        if (!seq)
            return s;
        p.currentPartIndex = partIdx;
        p.currentSequenceIndex = seqIdx;
        p.currentRepeat = Math.max(1, Math.min(repeat, seq.totalRepeats));
        p.currentRowIndex = Math.max(0, Math.min(rowIdx, seq.rows.length - 1));
        p.updatedAt = new Date().toISOString();
        const updated = [...s.projects];
        updated[idx] = p;
        return { projects: updated };
    }),
}), {
    name: 'skein-projects',
    storage: sharedJSONStorage(),
    version: 1,
    migrate: (persistedState, _fromVersion) => {
        return (persistedState ?? {});
    },
}));
// Marker rows (isMarker) are skipped in progress totals so the progress bar
// doesn't peg at 100% one row early on patterns that end with e.g. "fasten off".
function countableRows(seq) {
    return seq.rows.reduce((n, r) => n + (r.isMarker ? 0 : 1), 0);
}
export function totalRows(project) {
    return project.parts.reduce((sum, part) => {
        return sum + part.sequences.reduce((s2, seq) => s2 + countableRows(seq) * seq.totalRepeats, 0);
    }, 0);
}
export function completedRows(project) {
    let count = 0;
    for (let pi = 0; pi < project.parts.length; pi++) {
        const part = project.parts[pi];
        for (let si = 0; si < part.sequences.length; si++) {
            const seq = part.sequences[si];
            const perRepeat = countableRows(seq);
            if (pi < project.currentPartIndex || (pi === project.currentPartIndex && si < project.currentSequenceIndex)) {
                count += perRepeat * seq.totalRepeats;
            }
            else if (pi === project.currentPartIndex && si === project.currentSequenceIndex) {
                const rowsBeforeCurrent = seq.rows
                    .slice(0, project.currentRowIndex)
                    .reduce((n, r) => n + (r.isMarker ? 0 : 1), 0);
                count += (project.currentRepeat - 1) * perRepeat + rowsBeforeCurrent;
            }
        }
    }
    return count;
}
