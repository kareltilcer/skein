import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Project, Sequence } from '../types'

type ProjectStore = {
  projects: Project[]
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  advanceRow: (id: string) => void
  retreatRow: (id: string) => void
  markFinished: (id: string) => void
}

function getCurrentSequence(project: Project): Sequence | undefined {
  const part = project.parts[project.currentPartIndex]
  return part?.sequences[project.currentSequenceIndex]
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],

      addProject: (project) =>
        set((s) => ({ projects: [...s.projects, project] })),

      updateProject: (id, updates) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
        })),

      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      advanceRow: (id) =>
        set((s) => {
          const idx = s.projects.findIndex((p) => p.id === id)
          if (idx === -1) return s
          const p = { ...s.projects[idx] }
          const seq = getCurrentSequence(p)
          if (!seq) return s

          const nextRow = p.currentRowIndex + 1

          if (nextRow < seq.rows.length) {
            // advance within current sequence
            p.currentRowIndex = nextRow
          } else {
            // end of sequence rows — check repeats
            const nextRepeat = p.currentRepeat + 1
            if (nextRepeat <= seq.totalRepeats) {
              p.currentRepeat = nextRepeat
              p.currentRowIndex = 0
            } else {
              // done with this sequence — advance to next
              const part = p.parts[p.currentPartIndex]
              const nextSeqIdx = p.currentSequenceIndex + 1
              if (nextSeqIdx < part.sequences.length) {
                p.currentSequenceIndex = nextSeqIdx
                p.currentRepeat = 1
                p.currentRowIndex = 0
              } else if (part.loop) {
                // looping part — restart from first sequence; user must mark part finished manually
                p.currentSequenceIndex = 0
                p.currentRepeat = 1
                p.currentRowIndex = 0
              } else {
                // done with part — advance to next part
                const nextPartIdx = p.currentPartIndex + 1
                if (nextPartIdx < p.parts.length) {
                  p.currentPartIndex = nextPartIdx
                  p.currentSequenceIndex = 0
                  p.currentRepeat = 1
                  p.currentRowIndex = 0
                } else {
                  // project complete
                  p.status = 'finished'
                }
              }
            }
          }

          p.updatedAt = new Date().toISOString()
          const updated = [...s.projects]
          updated[idx] = p
          return { projects: updated }
        }),

      retreatRow: (id) =>
        set((s) => {
          const idx = s.projects.findIndex((p) => p.id === id)
          if (idx === -1) return s
          const p = { ...s.projects[idx] }
          const currentPart = p.parts[p.currentPartIndex]

          if (p.currentRowIndex > 0) {
            p.currentRowIndex--
          } else if (p.currentRepeat > 1) {
            const seq = getCurrentSequence(p)
            p.currentRepeat--
            p.currentRowIndex = seq ? seq.rows.length - 1 : 0
          } else if (p.currentSequenceIndex > 0) {
            p.currentSequenceIndex--
            const part = p.parts[p.currentPartIndex]
            const prevSeq = part?.sequences[p.currentSequenceIndex]
            p.currentRepeat = prevSeq?.totalRepeats ?? 1
            p.currentRowIndex = (prevSeq?.rows.length ?? 1) - 1
          } else if (currentPart?.loop) {
            // looping part — wrap to last sequence's last repeat's last row
            const lastSeqIdx = currentPart.sequences.length - 1
            const lastSeq = currentPart.sequences[lastSeqIdx]
            p.currentSequenceIndex = lastSeqIdx
            p.currentRepeat = lastSeq?.totalRepeats ?? 1
            p.currentRowIndex = (lastSeq?.rows.length ?? 1) - 1
          } else if (p.currentPartIndex > 0) {
            p.currentPartIndex--
            const prevPart = p.parts[p.currentPartIndex]
            p.currentSequenceIndex = (prevPart?.sequences.length ?? 1) - 1
            const prevSeq = prevPart?.sequences[p.currentSequenceIndex]
            p.currentRepeat = prevSeq?.totalRepeats ?? 1
            p.currentRowIndex = (prevSeq?.rows.length ?? 1) - 1
          }

          p.updatedAt = new Date().toISOString()
          const updated = [...s.projects]
          updated[idx] = p
          return { projects: updated }
        }),

      markFinished: (id) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, status: 'finished', updatedAt: new Date().toISOString() } : p,
          ),
        })),
    }),
    {
      name: 'skein-projects',
      storage: createJSONStorage(() => AsyncStorage),
      version: 0,
    },
  ),
)

// Helper: compute total rows across all parts/sequences/repeats
export function totalRows(project: Project): number {
  return project.parts.reduce((sum, part) => {
    return sum + part.sequences.reduce((s2, seq) => s2 + seq.rows.length * seq.totalRepeats, 0)
  }, 0)
}

// Helper: compute completed rows up to current position
export function completedRows(project: Project): number {
  let count = 0
  for (let pi = 0; pi < project.parts.length; pi++) {
    const part = project.parts[pi]
    for (let si = 0; si < part.sequences.length; si++) {
      const seq = part.sequences[si]
      if (pi < project.currentPartIndex || (pi === project.currentPartIndex && si < project.currentSequenceIndex)) {
        count += seq.rows.length * seq.totalRepeats
      } else if (pi === project.currentPartIndex && si === project.currentSequenceIndex) {
        count += (project.currentRepeat - 1) * seq.rows.length + project.currentRowIndex
      }
    }
  }
  return count
}
