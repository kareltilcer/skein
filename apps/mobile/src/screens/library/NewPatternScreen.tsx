import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Modal, View, Text, Pressable, TextInput, StyleSheet,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  NestableScrollContainer as _NestableScrollContainer,
  NestableDraggableFlatList as _NestableDraggableFlatList,
  ScaleDecorator as _ScaleDecorator,
} from 'react-native-draggable-flatlist'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import { useLibraryStore } from '../../store/libraryStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useStitchMap } from '../../hooks/useStitchMap'
import { STITCHES } from '../../tokens/stitches'
import { uuid } from '../../utils/uuid'
import Icon from '../../components/ui/Icon'
import Btn from '../../components/ui/Btn'
import StitchGlyph from '../../components/StitchGlyph'
import StitchPickerModal from '../../components/pickers/StitchPickerModal'
import RowPickerModal from '../../components/pickers/RowPickerModal'
import SeqPickerModal from '../../components/pickers/SeqPickerModal'
import DefineCustomStitchScreen from '../setup/DefineCustomStitchScreen'
import RepeatRowBody from '../../components/RepeatRow/RepeatRowBody'
import { StitchTile } from '../../components/RepeatRow/RepeatTiles'
import {
  appendStitchPreservingSegments,
  expandStitches,
  removeLastStitchPreservingSegments,
  segmentsFromMark,
} from '../../components/RepeatRow/segments'
import type {
  Craft, LibraryPattern, LibraryRow, LibrarySequence, Row, RowSegment, StitchDef, StitchInstance,
} from '../../types'

const NestableScrollContainer = _NestableScrollContainer as any
const NestableDraggableFlatList = _NestableDraggableFlatList as any
const ScaleDecorator = _ScaleDecorator as any

type Props = {
  visible: boolean
  onClose: () => void
  defaultCraft?: Craft
}

type DraftRow = {
  id: string
  label: string
  stitches: StitchInstance[]
  segments?: RowSegment[]
}
type DraftSequence = {
  id: string
  name: string
  rows: DraftRow[]
  totalRepeats: number
  loop: boolean
}
type DraftPart = {
  id: string
  name: string
  sequences: DraftSequence[]
}

type ActiveRow = { partIdx: number; seqIdx: number; rowIdx: number }
type Marking = ActiveRow & { step: 'start' | 'end'; start: number | null }

const STITCH_BRICK   = new Set(['k', 'sl', 'kfb', 'm1'])
const STITCH_MUSTARD = new Set(['p', 'p2tog', 'mb'])


export default function NewPatternScreen({ visible, onClose, defaultCraft = 'knit' }: Props) {
  const { t } = useTranslation()
  const { colors, fonts, radius } = useTheme()
  const stitchMap = useStitchMap()
  const recordStitchUsed = useSettingsStore(s => s.recordStitchUsed)
  const librarySequences = useLibraryStore(s => s.sequences)
  const libraryPatterns  = useLibraryStore(s => s.patterns)
  const libraryRows      = useLibraryStore(s => s.rows)
  const { addPattern, addSequence } = useLibraryStore()

  const [name,  setName]  = useState('')
  const [craft, setCraft] = useState<Craft>(defaultCraft)
  const [parts, setParts] = useState<DraftPart[]>([])
  const [activePartIdx, setActivePartIdx] = useState<number | null>(null)

  const [activeRow, setActiveRow] = useState<ActiveRow | null>(null)
  const [focusedSeq, setFocusedSeq] = useState<number | null>(null)
  const [collapsedSeqs, setCollapsedSeqs] = useState<Set<string>>(new Set())
  const [marking, setMarking] = useState<Marking | null>(null)

  const [showSeqPicker, setShowSeqPicker] = useState(false)
  const [showStitchPicker, setShowStitchPicker] = useState(false)
  const [showRowPicker, setShowRowPicker] = useState(false)
  const [rowPickerSeqIdx, setRowPickerSeqIdx] = useState<number | null>(null)
  const [showDefineCustom, setShowDefineCustom] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{seqIdx: number; rowIdx: number} | null>(null)
  const [confirmSeqDialog, setConfirmSeqDialog] = useState<{seqIdx: number} | null>(null)

  // Workaround: NestableDraggableFlatList does not forward autoscrollSpeed/Threshold to its
  // useNestedAutoScroll hook, so the library defaults (speed=100, threshold=30) fire on every drag
  // begin and call scrollableRef.scrollTo on the NestableScrollContainer — yanking the view upward.
  // Neutralise it by replacing the scroll container's scrollTo with a no-op (touch scrolling is
  // unaffected; only programmatic autoscroll is silenced).
  const scrollContainerRef = useRef<any>(null)
  useEffect(() => {
    const node = scrollContainerRef.current
    if (!node || node.__autoscrollPatched) return
    if (typeof node.scrollTo === 'function') {
      node.scrollTo = () => {}
      node.__autoscrollPatched = true
    }
  })

  useEffect(() => {
    if (visible) {
      setName('')
      setCraft(defaultCraft)
      const first: DraftPart = { id: uuid(), name: t('libraryCreate.partDefaultLabel', { n: 1 }), sequences: [] }
      setParts([first])
      setActivePartIdx(0)
      setActiveRow(null)
      setFocusedSeq(null)
      setCollapsedSeqs(new Set())
      setMarking(null)
      setShowSeqPicker(false)
      setShowStitchPicker(false)
      setShowRowPicker(false)
      setRowPickerSeqIdx(null)
      setShowDefineCustom(false)
      setConfirmDialog(null)
      setConfirmSeqDialog(null)
    }
  }, [visible, defaultCraft, t])

  // Dock stitches — mirrors Step3/NewSequenceScreen so behaviour stays consistent across creators.
  const computeDockIds = useCallback((): string[] => {
    const QUICK_KNIT    = ['k', 'p', 'yo', 'k2tog', 'ssk', 'sl']
    const QUICK_CROCHET = ['sc', 'dc', 'hdc', 'ch', 'slst', 'tr']
    const dockDefaults  = craft === 'knit' ? QUICK_KNIT : QUICK_CROCHET
    const recent = useSettingsStore.getState().recentStitchIds.filter(id => stitchMap[id]?.type === craft)
    const ids: string[] = [...recent]
    for (const id of dockDefaults) {
      if (ids.length >= 6) break
      if (!ids.includes(id)) ids.push(id)
    }
    return ids.slice(0, 6)
  }, [craft, stitchMap])

  const [dockIds, setDockIds] = useState<string[]>(() => computeDockIds())
  useEffect(() => { setDockIds(computeDockIds()) }, [computeDockIds])
  const prevShowStitchPicker = useRef(showStitchPicker)
  useEffect(() => {
    if (prevShowStitchPicker.current && !showStitchPicker) setDockIds(computeDockIds())
    prevShowStitchPicker.current = showStitchPicker
  }, [showStitchPicker, computeDockIds])

  const dockStitches = dockIds
    .map(id => stitchMap[id])
    .filter((s): s is StitchDef => !!s)

  const totalStitchCount = STITCHES.filter(s => s.type === craft).length

  const part = activePartIdx != null ? parts[activePartIdx] : null

  const updateSeq = (partIdx: number, seqIdx: number, seq: DraftSequence) => {
    setParts(ps => ps.map((p, i) => i === partIdx
      ? { ...p, sequences: p.sequences.map((s, j) => j === seqIdx ? seq : s) }
      : p))
  }

  const addPart = () => {
    const newPart: DraftPart = { id: uuid(), name: t('libraryCreate.partDefaultLabel', { n: parts.length + 1 }), sequences: [] }
    setParts(ps => [...ps, newPart])
    setActivePartIdx(parts.length)
    setFocusedSeq(null)
    setActiveRow(null)
  }

  const removePart = (idx: number) => {
    setParts(ps => {
      const next = ps.filter((_, i) => i !== idx)
      return next.map((p, i) => {
        const looksDefault = /^(Part|Část|Teil)\s+\d+$/i.test(p.name.trim())
        return looksDefault ? { ...p, name: t('libraryCreate.partDefaultLabel', { n: i + 1 }) } : p
      })
    })
    if (activePartIdx === idx) setActivePartIdx(null)
    else if (activePartIdx != null && activePartIdx > idx) setActivePartIdx(activePartIdx - 1)
    setFocusedSeq(null)
    setActiveRow(null)
  }

  const renamePart = (idx: number, value: string) => {
    setParts(ps => ps.map((p, i) => i === idx ? { ...p, name: value } : p))
  }

  // Reorders — remap index-based pointers (activePartIdx, activeRow, focusedSeq, marking) by id.
  const reorderParts = (data: DraftPart[]) => {
    const prevActivePartId = activePartIdx != null ? parts[activePartIdx]?.id : null
    const prevActiveRowPartId = activeRow ? parts[activeRow.partIdx]?.id : null
    const prevMarkingPartId = marking ? parts[marking.partIdx]?.id : null
    setParts(data)
    if (prevActivePartId != null) {
      const idx = data.findIndex(p => p.id === prevActivePartId)
      setActivePartIdx(idx >= 0 ? idx : null)
    }
    if (activeRow && prevActiveRowPartId != null) {
      const idx = data.findIndex(p => p.id === prevActiveRowPartId)
      if (idx >= 0) setActiveRow({ ...activeRow, partIdx: idx })
      else setActiveRow(null)
    }
    if (marking && prevMarkingPartId != null) {
      const idx = data.findIndex(p => p.id === prevMarkingPartId)
      if (idx >= 0) setMarking({ ...marking, partIdx: idx })
      else setMarking(null)
    }
  }

  const reorderSequences = (partIdx: number, data: DraftSequence[]) => {
    const oldSeqs = parts[partIdx]?.sequences ?? []
    const prevFocusedSeqId = focusedSeq != null ? oldSeqs[focusedSeq]?.id : null
    const prevActiveRowSeqId = activeRow && activeRow.partIdx === partIdx ? oldSeqs[activeRow.seqIdx]?.id : null
    const prevMarkingSeqId = marking && marking.partIdx === partIdx ? oldSeqs[marking.seqIdx]?.id : null
    setParts(ps => ps.map((p, i) => i === partIdx ? { ...p, sequences: data } : p))
    if (prevFocusedSeqId != null) {
      const idx = data.findIndex(s => s.id === prevFocusedSeqId)
      setFocusedSeq(idx >= 0 ? idx : null)
    }
    if (activeRow && prevActiveRowSeqId != null) {
      const idx = data.findIndex(s => s.id === prevActiveRowSeqId)
      if (idx >= 0) setActiveRow({ ...activeRow, seqIdx: idx })
      else setActiveRow(null)
    }
    if (marking && prevMarkingSeqId != null) {
      const idx = data.findIndex(s => s.id === prevMarkingSeqId)
      if (idx >= 0) setMarking({ ...marking, seqIdx: idx })
      else setMarking(null)
    }
  }

  const reorderRows = (partIdx: number, seqIdx: number, data: DraftRow[]) => {
    const oldRows = parts[partIdx]?.sequences[seqIdx]?.rows ?? []
    const prevActiveRowId = activeRow && activeRow.partIdx === partIdx && activeRow.seqIdx === seqIdx
      ? oldRows[activeRow.rowIdx]?.id : null
    const prevMarkingRowId = marking && marking.partIdx === partIdx && marking.seqIdx === seqIdx
      ? oldRows[marking.rowIdx]?.id : null
    setParts(ps => ps.map((p, i) => i === partIdx
      ? { ...p, sequences: p.sequences.map((s, j) => j === seqIdx ? { ...s, rows: data } : s) }
      : p))
    if (activeRow && prevActiveRowId != null) {
      const idx = data.findIndex(r => r.id === prevActiveRowId)
      if (idx >= 0) setActiveRow({ ...activeRow, rowIdx: idx })
      else setActiveRow(null)
    }
    if (marking && prevMarkingRowId != null) {
      const idx = data.findIndex(r => r.id === prevMarkingRowId)
      if (idx >= 0) setMarking({ ...marking, rowIdx: idx })
      else setMarking(null)
    }
  }

  // Sequence add / remove
  const addSeq = () => {
    if (activePartIdx == null) return
    const partN = parts[activePartIdx]!
    const newSeq: DraftSequence = {
      id: uuid(),
      name: t('wizard.sequenceLabel', { n: partN.sequences.length + 1 }),
      rows: [], totalRepeats: 1, loop: false,
    }
    setParts(ps => ps.map((p, i) => i === activePartIdx ? { ...p, sequences: [...p.sequences, newSeq] } : p))
    setFocusedSeq(partN.sequences.length)
    setActiveRow(null)
  }

  const addSeqFromLib = (libSeq: LibrarySequence) => {
    if (activePartIdx == null) return
    const newSeq: DraftSequence = {
      id: uuid(), name: libSeq.name,
      rows: libSeq.rows.map(r => ({ id: uuid(), label: r.label, stitches: r.stitches, segments: r.segments })),
      totalRepeats: libSeq.totalRepeats, loop: libSeq.loop,
    }
    setParts(ps => ps.map((p, i) => i === activePartIdx ? { ...p, sequences: [...p.sequences, newSeq] } : p))
    setShowSeqPicker(false)
  }

  const addPatternFromLib = (libPat: LibraryPattern) => {
    if (activePartIdx == null) return
    const newSeqs: DraftSequence[] = libPat.sequenceIds
      .map(id => librarySequences.find(s => s.id === id))
      .filter((s): s is LibrarySequence => Boolean(s))
      .map(libSeq => ({
        id: uuid(), name: libSeq.name,
        rows: libSeq.rows.map(r => ({ id: uuid(), label: r.label, stitches: r.stitches, segments: r.segments })),
        totalRepeats: libSeq.totalRepeats, loop: libSeq.loop,
      }))
    setParts(ps => ps.map((p, i) => i === activePartIdx ? { ...p, sequences: [...p.sequences, ...newSeqs] } : p))
    setShowSeqPicker(false)
  }

  const removeSeq = (seqIdx: number) => {
    if (activePartIdx == null) return
    setParts(ps => ps.map((p, i) => i === activePartIdx
      ? { ...p, sequences: p.sequences.filter((_, j) => j !== seqIdx) }
      : p))
    setFocusedSeq(null)
    if (activeRow?.seqIdx === seqIdx) setActiveRow(null)
    else if (activeRow && activeRow.seqIdx > seqIdx) setActiveRow({ ...activeRow, seqIdx: activeRow.seqIdx - 1 })
    if (marking?.seqIdx === seqIdx) setMarking(null)
  }

  const confirmRemoveSeq = (seqIdx: number) => setConfirmSeqDialog({ seqIdx })
  const executeRemoveSeq = () => {
    if (!confirmSeqDialog) return
    removeSeq(confirmSeqDialog.seqIdx)
    setConfirmSeqDialog(null)
  }

  const toggleSeqCollapse = (seqId: string) => {
    setCollapsedSeqs(prev => {
      const next = new Set(prev)
      if (next.has(seqId)) next.delete(seqId)
      else next.add(seqId)
      return next
    })
  }

  // Row add / remove
  const addRow = (seqIdx: number) => {
    if (activePartIdx == null || !part) return
    const seq = part.sequences[seqIdx]!
    const newRow: DraftRow = { id: uuid(), label: t('wizard.rowLabel', { n: seq.rows.length + 1 }), stitches: [] }
    const newRowIdx = seq.rows.length
    updateSeq(activePartIdx, seqIdx, { ...seq, rows: [...seq.rows, newRow] })
    setActiveRow({ partIdx: activePartIdx, seqIdx, rowIdx: newRowIdx })
    setShowStitchPicker(false)
  }

  const addRowFromLib = (seqIdx: number, libRow: LibraryRow) => {
    if (activePartIdx == null || !part) return
    const seq = part.sequences[seqIdx]!
    const newRow: DraftRow = { id: uuid(), label: libRow.label, stitches: libRow.stitches, segments: libRow.segments }
    const newRowIdx = seq.rows.length
    updateSeq(activePartIdx, seqIdx, { ...seq, rows: [...seq.rows, newRow] })
    setActiveRow({ partIdx: activePartIdx, seqIdx, rowIdx: newRowIdx })
    setShowRowPicker(false)
  }

  const removeRow = (seqIdx: number, rowIdx: number) => {
    if (activePartIdx == null || !part) return
    const seq = part.sequences[seqIdx]!
    updateSeq(activePartIdx, seqIdx, { ...seq, rows: seq.rows.filter((_, j) => j !== rowIdx) })
    if (activeRow?.seqIdx === seqIdx && activeRow?.rowIdx === rowIdx) setActiveRow(null)
    if (marking?.seqIdx === seqIdx && marking?.rowIdx === rowIdx) setMarking(null)
  }

  const confirmRemoveRow = (seqIdx: number, rowIdx: number) => setConfirmDialog({ seqIdx, rowIdx })
  const executeRemoveRow = () => {
    if (!confirmDialog) return
    removeRow(confirmDialog.seqIdx, confirmDialog.rowIdx)
    setConfirmDialog(null)
  }

  const removeLastStitch = (seqIdx: number, rowIdx: number) => {
    if (activePartIdx == null || !part) return
    const seq = part.sequences[seqIdx]!
    const row = seq.rows[rowIdx]!
    if (row.stitches.length === 0) return
    const nextRow = removeLastStitchPreservingSegments(row)
    updateSeq(activePartIdx, seqIdx, { ...seq, rows: seq.rows.map((r, i) => i === rowIdx ? nextRow as DraftRow : r) })
  }

  const addStitchToRow = (partIdx: number, seqIdx: number, rowIdx: number, stitchId: string) => {
    const p = parts[partIdx]!
    const seq = p.sequences[seqIdx]!
    const row = seq.rows[rowIdx]!
    const nextRow = appendStitchPreservingSegments(row, stitchId)
    updateSeq(partIdx, seqIdx, { ...seq, rows: seq.rows.map((r, i) => i === rowIdx ? nextRow as DraftRow : r) })
    recordStitchUsed(stitchId)
  }

  // Marking
  const startMarking = (seqIdx: number, rowIdx: number) => {
    if (activePartIdx == null || !part) return
    const seq = part.sequences[seqIdx]!
    const row = seq.rows[rowIdx]!
    if (row.stitches.length === 0) return
    if (row.segments) {
      const { segments: _drop, ...rest } = row
      updateSeq(activePartIdx, seqIdx, { ...seq, rows: seq.rows.map((r, i) => i === rowIdx ? (rest as DraftRow) : r) })
    }
    setActiveRow(null)
    setShowStitchPicker(false)
    setMarking({ partIdx: activePartIdx, seqIdx, rowIdx, step: 'start', start: null })
  }

  const cancelMarking = () => setMarking(null)

  const handleMarkTap = (tileIdx: number) => {
    if (!marking) return
    if (marking.step === 'start') {
      setMarking({ ...marking, step: 'end', start: tileIdx })
      return
    }
    const start = marking.start
    if (start == null || tileIdx < start) return
    const seq = parts[marking.partIdx]!.sequences[marking.seqIdx]!
    const row = seq.rows[marking.rowIdx]!
    const segments = segmentsFromMark(row.stitches, start, tileIdx)
    updateSeq(marking.partIdx, marking.seqIdx, {
      ...seq,
      rows: seq.rows.map((r, i) => i === marking.rowIdx ? ({ ...r, segments } as DraftRow) : r),
    })
    setMarking(null)
  }

  const handlePickerSelect = (stitch: StitchDef) => {
    if (!activeRow) return
    addStitchToRow(activeRow.partIdx, activeRow.seqIdx, activeRow.rowIdx, stitch.id)
    setShowStitchPicker(false)
  }

  // Derived for preview + save gating
  const allSeqs = parts.flatMap(p => p.sequences)
  const totalSeq = allSeqs.length
  const previewSeqNames: string[] = allSeqs.map(s => s.name).filter(n => n.trim().length > 0)
  const hasAnyFilledRow = parts.some(p => p.sequences.some(s => s.rows.some(r => r.stitches.length > 0)))
  const ready = name.trim().length > 0 && hasAnyFilledRow

  const handleSave = () => {
    if (!ready) return
    const sequenceIds: string[] = []
    for (const p of parts) {
      for (const ds of p.sequences) {
        const nonEmptyRows = ds.rows.filter(r => r.stitches.length > 0) as Row[]
        if (nonEmptyRows.length === 0) continue
        const seq: LibrarySequence = {
          id: uuid(),
          name: ds.name.trim() || t('libraryCreate.untitledSeq'),
          craft,
          rows: nonEmptyRows,
          totalRepeats: ds.totalRepeats,
          loop: ds.loop,
          isBuiltIn: false,
        }
        addSequence(seq)
        sequenceIds.push(seq.id)
      }
    }
    const pat: LibraryPattern = {
      id: uuid(),
      name: name.trim(),
      craft,
      sequenceIds,
      isBuiltIn: false,
    }
    addPattern(pat)
    onClose()
  }

  const PART_COLORS = [colors.brick, colors.mustard, colors.forest, colors.brickDk, colors.mustardDk, colors.forestDk]
  const dockVisible = activeRow !== null && !showStitchPicker && marking === null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BlurView
          intensity={16}
          tint="dark"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(43,24,16,0.32)' }]}
        />
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={[styles.screen, { backgroundColor: colors.bg }]}>

            {/* Top bar */}
            <View style={[styles.topBar, { borderBottomColor: colors.rule }]}>
              <Pressable onPress={onClose} hitSlop={12} style={[styles.closeBtn, {
                backgroundColor: colors.card, borderColor: colors.rule,
              }]}>
                <Icon name="x" size={18} color={colors.inkSoft}/>
              </Pressable>
              <View style={[styles.draftBadge, { backgroundColor: colors.cream2, borderColor: colors.rule }]}>
                <Text style={{
                  fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkMute,
                  letterSpacing: 2, textTransform: 'uppercase',
                }}>{t('libraryCreate.draftPattern')}</Text>
              </View>
              <Pressable onPress={ready ? handleSave : undefined} hitSlop={12}>
                <Text style={{
                  fontFamily: fonts.bodySb, fontSize: 14, letterSpacing: -0.1,
                  color: ready ? colors.brick : colors.inkMute,
                }}>{t('common.save')}</Text>
              </Pressable>
            </View>

            {/* Page title */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
              <Text style={{
                fontFamily: fonts.display, fontSize: 32, color: colors.brick,
                letterSpacing: -0.5, lineHeight: 36,
              }}>{t('libraryCreate.newPatternTitle')}</Text>
              <Text style={{
                fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft,
                lineHeight: 20, marginTop: 6,
              }}>{t('libraryCreate.newPatternSub')}</Text>
            </View>

            <NestableScrollContainer
              ref={scrollContainerRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: dockVisible || marking !== null ? 230 : 130 }}
              keyboardShouldPersistTaps="handled"
            >

              {/* Live preview */}
              <View style={[styles.previewCard, {
                backgroundColor: colors.card,
                borderColor: colors.brick,
                shadowColor: colors.brick,
              }]}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 12,
                    backgroundColor: colors.brick,
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 20, color: '#FBF6EC' }}>
                      {parts.length}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{
                      fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                      letterSpacing: 1.8, textTransform: 'uppercase',
                    }}>{t('libraryCreate.livePreview')}</Text>
                    <Text style={{
                      fontFamily: fonts.bodyBd, fontSize: 15.5, marginTop: 3,
                      color: name ? colors.ink : colors.inkMute,
                      letterSpacing: -0.05, fontStyle: name ? 'normal' : 'italic',
                    }} numberOfLines={1}>
                      {name || t('libraryCreate.untitledPattern')}
                    </Text>
                    <Text style={{
                      fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 3,
                    }}>
                      {t('common.parts', { count: parts.length })} · {t('common.sequences', { count: totalSeq })}
                    </Text>
                  </View>
                </View>
                {previewSeqNames.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 10, paddingLeft: 60 }}>
                    {previewSeqNames.slice(0, 4).map((n, i) => (
                      <View key={i} style={{
                        paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
                        backgroundColor: colors.cream2,
                      }}>
                        <Text style={{ fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft, fontWeight: '600' }}>
                          {n}
                        </Text>
                      </View>
                    ))}
                    {previewSeqNames.length > 4 && (
                      <Text style={{
                        fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkMute, fontWeight: '600',
                        alignSelf: 'center',
                      }}>{t('pickerSeq.moreItems', { count: previewSeqNames.length - 4 })}</Text>
                    )}
                  </View>
                )}
              </View>

              {/* Name & craft */}
              <FormLabel hint={t('libraryCreate.identityHint')}>{t('libraryCreate.identityLabel')}</FormLabel>
              <View style={[styles.field, {
                backgroundColor: colors.card,
                borderColor: name ? colors.brick : colors.rule,
                borderWidth: name ? 1.5 : 1,
                borderRadius: radius.md,
                marginBottom: 10,
              }]}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  maxLength={60}
                  placeholder={t('libraryCreate.namePlaceholderPattern')}
                  placeholderTextColor={colors.inkMute}
                  style={{
                    fontFamily: fonts.body, fontSize: 16, color: colors.ink,
                    letterSpacing: -0.05,
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 22 }}>
                {([
                  { id: 'knit' as Craft,    label: t('craft.knit'),    icon: 'needle' as const },
                  { id: 'crochet' as Craft, label: t('craft.crochet'), icon: 'loop'   as const },
                ]).map(c => {
                  const active = craft === c.id
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCraft(c.id)}
                      style={[styles.craftBtn, {
                        flex: 1,
                        backgroundColor: active ? colors.brick : colors.card,
                        borderColor: active ? 'transparent' : colors.rule,
                        borderRadius: radius.md,
                      }]}
                    >
                      <Icon name={c.icon} size={16} color={active ? '#FBF6EC' : colors.brick}/>
                      <Text style={{
                        fontFamily: fonts.bodySb, fontSize: 14.5,
                        color: active ? '#FBF6EC' : colors.ink,
                        letterSpacing: -0.05,
                      }}>{c.label}</Text>
                    </Pressable>
                  )
                })}
              </View>

              {/* Parts list */}
              <FormLabel hint={t('libraryCreate.partsHint', { count: parts.length })}>{t('libraryCreate.partsLabel')}</FormLabel>
              <NestableDraggableFlatList
                data={parts}
                keyExtractor={(p: DraftPart) => p.id}
                onDragEnd={({ data }: { data: DraftPart[] }) => reorderParts(data)}
                scrollEnabled={false}
                activationDistance={12}
                autoscrollSpeed={0}
                renderItem={({ item: p, drag: partDrag, getIndex: getPartIndex }: any) => {
                  const pi: number = getPartIndex?.() ?? 0
                  const partColor = PART_COLORS[pi % PART_COLORS.length]!
                  const isActive = activePartIdx === pi
                  return (
                    <ScaleDecorator>
                      <View style={{ marginBottom: 10 }}>
                        <Pressable
                          onPress={() => {
                            if (isActive) {
                              setActivePartIdx(null)
                            } else {
                              setActivePartIdx(pi)
                            }
                            setFocusedSeq(null)
                            setActiveRow(null)
                          }}
                          style={{
                            backgroundColor: colors.card,
                            borderWidth: isActive ? 2 : 1,
                            borderColor: isActive ? colors.brick : colors.rule,
                            borderRadius: 16, padding: 12,
                            flexDirection: 'row', alignItems: 'center', gap: 10,
                            ...(isActive ? {
                              shadowColor: colors.brick,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.07,
                              shadowRadius: 6, elevation: 2,
                            } : {}),
                          }}
                        >
                          <Pressable onLongPress={partDrag} delayLongPress={200} hitSlop={8} style={{ padding: 4, marginLeft: -4 }}>
                            <Icon name="grip" size={16} color={colors.inkMute}/>
                          </Pressable>
                          <View style={{
                            width: 34, height: 34, borderRadius: 10,
                            backgroundColor: partColor,
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Text style={{ fontFamily: fonts.display, fontSize: 16, color: '#FBF6EC' }}>
                              {pi + 1}
                            </Text>
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            {isActive ? (
                              <TextInput
                                value={p.name}
                                onChangeText={(v) => renamePart(pi, v)}
                                maxLength={40}
                                autoFocus={false}
                                cursorColor={colors.brick}
                                selectionColor={colors.brick}
                                style={{
                                  fontFamily: fonts.bodyBd, fontSize: 16, color: colors.ink,
                                  padding: 0, margin: 0,
                                }}
                              />
                            ) : (
                              <Text style={{ fontFamily: fonts.bodyBd, fontSize: 16, color: colors.ink }} numberOfLines={1}>
                                {p.name}
                              </Text>
                            )}
                            <Text style={{
                              fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute, marginTop: 2,
                            }}>
                              {t('common.sequences', { count: p.sequences.length })}{isActive ? t('libraryCreate.editingMark') : ''}
                            </Text>
                          </View>
                          {isActive ? (
                            <Pressable onPress={() => removePart(pi)} hitSlop={6} style={{
                              flexDirection: 'row', alignItems: 'center', gap: 5,
                              backgroundColor: '#FBEFEA',
                              borderWidth: 1, borderColor: 'rgba(156,61,46,0.22)',
                              borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6,
                            }}>
                              <Icon name="trash" size={13} color={colors.brick}/>
                              <Text style={{
                                fontFamily: fonts.mono, fontSize: 9.5, fontWeight: '700',
                                color: colors.brick, letterSpacing: 1.4, textTransform: 'uppercase',
                              }}>{t('common.delete')}</Text>
                            </Pressable>
                          ) : (
                            <Icon name={'chevR'} size={16} color={colors.inkSoft}/>
                          )}
                        </Pressable>

                        {/* Expanded part body — inline sequence editor */}
                        {isActive && (
                          <View style={{
                            paddingLeft: 12,
                            borderLeftWidth: 2, borderLeftColor: colors.cream2,
                            marginLeft: 16, marginTop: 8,
                          }}>
                            <NestableDraggableFlatList
                              data={p.sequences}
                              keyExtractor={(s: DraftSequence) => s.id}
                              onDragEnd={({ data }: { data: DraftSequence[] }) => reorderSequences(pi, data)}
                              scrollEnabled={false}
                              activationDistance={12}
                              autoscrollSpeed={0}
                              renderItem={({ item: seq, drag: seqDrag, getIndex: getSeqIndex }: any) => {
                                const si: number = getSeqIndex?.() ?? 0
                                const seqColor = [colors.mustard, colors.brick, colors.forest][si % 3]!
                                const totalSts = seq.rows.reduce((sum: number, r: DraftRow) => sum + r.stitches.reduce((s2: number, st: StitchInstance) => s2 + st.count, 0), 0)
                                const seqHasRepeat = seq.rows.some((r: DraftRow) => !!r.segments)
                                const isEditing = focusedSeq === si
                                const seqDimmed = marking !== null && marking.seqIdx !== si
                                return (
                                  <ScaleDecorator>
                                    <View style={{ opacity: seqDimmed ? 0.3 : 1, marginBottom: 18 }} pointerEvents={seqDimmed ? 'none' : 'auto'}>
                                      {/* Sequence header */}
                                      <View style={{
                                        backgroundColor: colors.card,
                                        borderWidth: isEditing ? 2 : 1,
                                        borderColor: isEditing ? colors.brick : colors.rule,
                                        borderRadius: 16,
                                        paddingVertical: 12, paddingHorizontal: 14,
                                        marginBottom: 8,
                                        ...(isEditing ? {
                                          shadowColor: colors.brick,
                                          shadowOpacity: 0.07,
                                          shadowRadius: 6,
                                          shadowOffset: { width: 0, height: 0 },
                                          elevation: 2,
                                        } : {}),
                                      }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                          <Pressable onLongPress={seqDrag} delayLongPress={200} hitSlop={6} style={{ padding: 2 }}>
                                            <Icon name="grip" size={16} color={colors.inkMute}/>
                                          </Pressable>
                                          <View style={{
                                            width: 32, height: 32, borderRadius: 9,
                                            backgroundColor: seqColor,
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            shadowColor: seqColor,
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.35,
                                            shadowRadius: 4,
                                            elevation: 4,
                                          }}>
                                            <Text style={{ fontFamily: fonts.display, fontSize: 16, color: '#FBF6EC' }}>
                                              {si + 1}
                                            </Text>
                                          </View>
                                          <View style={{ flex: 1, minWidth: 0 }}>
                                            {isEditing ? (
                                              <TextInput
                                                value={seq.name}
                                                onChangeText={(v) => updateSeq(pi, si, { ...seq, name: v })}
                                                onBlur={() => setFocusedSeq(null)}
                                                autoFocus
                                                cursorColor={colors.brick}
                                                selectionColor={colors.brick}
                                                style={{
                                                  fontFamily: fonts.displayInput, fontSize: 20,
                                                  color: colors.ink, letterSpacing: -0.2,
                                                  padding: 0, margin: 0,
                                                }}
                                              />
                                            ) : (
                                              <Text style={{
                                                fontFamily: fonts.display, fontSize: 20,
                                                color: colors.ink, letterSpacing: -0.2, lineHeight: 24,
                                              }} numberOfLines={1}>
                                                {seq.name}
                                              </Text>
                                            )}
                                            <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute, marginTop: 3 }}>
                                              {t('common.rows', { count: seq.rows.length })} · {t('common.sts', { count: totalSts })}{seqHasRepeat ? '+' : ''}
                                              {seqHasRepeat && (
                                                <Text style={{ color: colors.brick }}>{t('wizard.step3HasRepeatSuffix')}</Text>
                                              )}
                                              {isEditing && (
                                                <Text style={{ color: colors.brick, fontWeight: '700' }}>{t('wizard.step3EditingMark')}</Text>
                                              )}
                                            </Text>
                                          </View>

                                          {isEditing ? (
                                            <Pressable
                                              onPress={() => confirmRemoveSeq(si)}
                                              hitSlop={6}
                                              style={{
                                                flexDirection: 'row', alignItems: 'center', gap: 5,
                                                backgroundColor: '#FBEFEA',
                                                borderWidth: 1, borderColor: 'rgba(156,61,46,0.22)',
                                                borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6,
                                                flexShrink: 0,
                                              }}
                                            >
                                              <Icon name="trash" size={13} color={colors.brick}/>
                                              <Text style={{
                                                fontFamily: fonts.mono, fontSize: 9.5, fontWeight: '700',
                                                color: colors.brick, letterSpacing: 1.4, textTransform: 'uppercase',
                                              }}>{t('common.delete')}</Text>
                                            </Pressable>
                                          ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                              <Pressable onPress={() => setFocusedSeq(si)} hitSlop={8}>
                                                <Icon name="edit" size={16} color={colors.inkSoft}/>
                                              </Pressable>
                                              <Pressable onPress={() => toggleSeqCollapse(seq.id)} hitSlop={8}>
                                                <Icon
                                                  name={collapsedSeqs.has(seq.id) ? 'chevR' : 'chevDown'}
                                                  size={16}
                                                  color={colors.inkSoft}
                                                />
                                              </Pressable>
                                            </View>
                                          )}
                                        </View>
                                      </View>

                                      {/* Row cards + Add row chooser */}
                                      {(!collapsedSeqs.has(seq.id) || isEditing) && (
                                        <View style={{ paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.cream2, marginLeft: 6 }}>
                                          <NestableDraggableFlatList
                                            data={seq.rows}
                                            keyExtractor={(r: DraftRow) => r.id}
                                            onDragEnd={({ data }: { data: DraftRow[] }) => reorderRows(pi, si, data)}
                                            scrollEnabled={false}
                                            activationDistance={12}
                                            autoscrollSpeed={0}
                                            renderItem={({ item: row, drag: rowDrag, getIndex: getRowIndex }: any) => {
                                              const ri: number = getRowIndex?.() ?? 0
                                              const isActiveR = activeRow?.partIdx === pi && activeRow?.seqIdx === si && activeRow?.rowIdx === ri
                                              const rowTotal = row.stitches.reduce((sum: number, s: StitchInstance) => sum + s.count, 0)
                                              const empty = rowTotal === 0
                                              const isMarkingThisRow = marking?.partIdx === pi && marking?.seqIdx === si && marking?.rowIdx === ri
                                              const rowDimmed = marking !== null && marking.seqIdx === si && !isMarkingThisRow
                                              const rowHasRepeat = !!row.segments
                                              const repeatIconActive = rowHasRepeat || isMarkingThisRow
                                              return (
                                                <ScaleDecorator>
                                                  <Pressable
                                                    onPress={() => {
                                                      if (marking !== null) return
                                                      setActiveRow({ partIdx: pi, seqIdx: si, rowIdx: ri })
                                                      setShowStitchPicker(false)
                                                    }}
                                                    style={{
                                                      backgroundColor: colors.card,
                                                      borderWidth: isActiveR || isMarkingThisRow ? 2 : 1,
                                                      borderColor: isActiveR || isMarkingThisRow ? colors.brick : colors.rule,
                                                      borderRadius: 14,
                                                      paddingVertical: 10, paddingHorizontal: 12,
                                                      opacity: rowDimmed ? 0.35 : 1,
                                                      marginBottom: 8,
                                                    }}
                                                    pointerEvents={rowDimmed ? 'none' : 'auto'}
                                                  >
                                                    {/* Row header */}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: empty && !rowHasRepeat && !isMarkingThisRow ? 0 : 10, gap: 8 }}>
                                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                                                        <Pressable onLongPress={rowDrag} delayLongPress={200} hitSlop={6} style={{ padding: 2 }}>
                                                          <Icon name="grip" size={14} color={colors.inkMute}/>
                                                        </Pressable>
                                                        <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: isActiveR || isMarkingThisRow ? colors.brick : colors.ink }}>
                                                          {row.label}{(isActiveR || isMarkingThisRow) ? ' ✱' : ''}
                                                        </Text>
                                                        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute }}>
                                                          · {t('common.sts', { count: rowTotal })}
                                                        </Text>
                                                        {rowHasRepeat && (
                                                          <View style={{
                                                            flexDirection: 'row', alignItems: 'center', gap: 3,
                                                            backgroundColor: '#FBEFEA',
                                                            borderWidth: 1, borderColor: 'rgba(156,61,46,0.18)',
                                                            paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6,
                                                          }}>
                                                            <Icon name="repeat" size={10} color={colors.brick} stroke={2.2}/>
                                                            <Text style={{
                                                              fontFamily: fonts.mono, fontSize: 9, fontWeight: '700',
                                                              color: colors.brick, letterSpacing: 0.6, textTransform: 'uppercase',
                                                            }}>{t('wizard.step3RepeatTag')}</Text>
                                                          </View>
                                                        )}
                                                      </View>
                                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                                        <Pressable
                                                          onPress={() => startMarking(si, ri)}
                                                          hitSlop={8}
                                                          disabled={empty}
                                                          style={{
                                                            width: 26, height: 26, borderRadius: 8,
                                                            alignItems: 'center', justifyContent: 'center',
                                                            backgroundColor: repeatIconActive ? '#FBEFEA' : 'transparent',
                                                            borderWidth: 1,
                                                            borderColor: repeatIconActive ? 'rgba(156,61,46,0.24)' : 'transparent',
                                                            opacity: empty ? 0.35 : 1,
                                                          }}
                                                        >
                                                          <Icon name="repeat" size={14} color={repeatIconActive ? colors.brick : colors.inkMute} stroke={2}/>
                                                        </Pressable>
                                                        <Pressable onPress={() => removeLastStitch(si, ri)} hitSlop={8}>
                                                          <Icon name="backspace" size={14} color={colors.inkMute}/>
                                                        </Pressable>
                                                        <Pressable onPress={() => confirmRemoveRow(si, ri)} hitSlop={8}>
                                                          <Icon name="trash" size={14} color={colors.inkMute}/>
                                                        </Pressable>
                                                      </View>
                                                    </View>
                                                    {/* Body */}
                                                    {isMarkingThisRow ? (() => {
                                                      const tiles = expandStitches(row.stitches)
                                                      return (
                                                        <View>
                                                          <View style={{
                                                            flexDirection: 'row', alignItems: 'center', gap: 9,
                                                            marginBottom: 16,
                                                            backgroundColor: '#FBEFEA',
                                                            borderWidth: 1, borderColor: 'rgba(156,61,46,0.2)',
                                                            borderRadius: 11, paddingVertical: 8, paddingHorizontal: 11,
                                                          }}>
                                                            <View style={{
                                                              width: 22, height: 22, borderRadius: 11,
                                                              backgroundColor: colors.brick,
                                                              alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                              <Text style={{ fontFamily: fonts.display, fontSize: 13, color: '#FBF6EC', lineHeight: 16 }}>
                                                                {marking!.step === 'start' ? '1' : '2'}
                                                              </Text>
                                                            </View>
                                                            <Text style={{
                                                              flex: 1, fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink, letterSpacing: -0.05,
                                                            }}>
                                                              {marking!.step === 'start' ? t('wizard.step3MarkStartInRow') : t('wizard.step3MarkEndInRow')}
                                                            </Text>
                                                          </View>
                                                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, columnGap: 4 }}>
                                                            {tiles.map((id: string, idx: number) => {
                                                              let state: 'tap' | 'start' | 'dim' = 'tap'
                                                              if (idx === marking!.start) state = 'start'
                                                              else if (marking!.step === 'end' && marking!.start !== null && idx < marking!.start) state = 'dim'
                                                              return (
                                                                <StitchTile
                                                                  key={idx}
                                                                  id={id}
                                                                  state={state}
                                                                  onPress={() => handleMarkTap(idx)}
                                                                />
                                                              )
                                                            })}
                                                          </View>
                                                          <Text style={{
                                                            fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                                                            marginTop: 12, lineHeight: 15,
                                                          }}>
                                                            {marking!.step === 'start' ? t('wizard.step3MarkStartHint') : t('wizard.step3MarkEndHint')}
                                                          </Text>
                                                        </View>
                                                      )
                                                    })() : row.segments ? (
                                                      <RepeatRowBody segments={row.segments}/>
                                                    ) : !empty ? (
                                                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                                                        {row.stitches.flatMap((si_item: StitchInstance, idx: number) => {
                                                          const def = stitchMap[si_item.stitchId]
                                                          if (!def) return []
                                                          const chipColor = STITCH_BRICK.has(si_item.stitchId) ? colors.brick
                                                                          : STITCH_MUSTARD.has(si_item.stitchId) ? colors.mustard
                                                                          : colors.forest
                                                          return Array.from({ length: si_item.count }, (_, i) => (
                                                            <View key={`${idx}-${i}`} style={{
                                                              width: 26, height: 36, borderRadius: 6,
                                                              backgroundColor: colors.cream2,
                                                              borderWidth: 1.2, borderColor: chipColor,
                                                              alignItems: 'center', justifyContent: 'center',
                                                              gap: 1, paddingVertical: 2,
                                                            }}>
                                                              <StitchGlyph symbol={def.symbol} size={13} color={chipColor} strokeWidth={1.8}/>
                                                              <Text style={{
                                                                fontFamily: fonts.mono, fontSize: 7.5, color: chipColor,
                                                                fontWeight: '700', letterSpacing: -0.3, lineHeight: 9,
                                                              }}>{def.abbr}</Text>
                                                            </View>
                                                          ))
                                                        })}
                                                      </View>
                                                    ) : (
                                                      <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, fontStyle: 'italic', paddingTop: 6, paddingBottom: 2 }}>
                                                        {t('wizard.step3EmptyRow')}
                                                      </Text>
                                                    )}
                                                  </Pressable>
                                                </ScaleDecorator>
                                              )
                                            }}
                                          />

                                          {/* Add row chooser */}
                                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                                            <Pressable
                                              onPress={() => addRow(si)}
                                              style={{ flex: 1.1, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.brick, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                            >
                                              <Icon name="plus" size={14} color={colors.brick}/>
                                              <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: colors.brick }}>{t('wizard.step3NewRow')}</Text>
                                            </Pressable>
                                            <Pressable
                                              onPress={() => { setRowPickerSeqIdx(si); setShowRowPicker(true) }}
                                              style={{ flex: 1, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                            >
                                              <Icon name="library" size={14} color={colors.mustardDk}/>
                                              <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink }}>{t('wizard.step3RowFromLib')}</Text>
                                              <View style={{ backgroundColor: colors.cream2, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                                                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, fontWeight: '700', letterSpacing: 0.5 }}>{libraryRows.length}</Text>
                                              </View>
                                            </Pressable>
                                          </View>
                                        </View>
                                      )}
                                    </View>
                                  </ScaleDecorator>
                                )
                              }}
                            />

                            {/* Add sequence chooser — New sequence / Seq. from lib */}
                            <View
                              style={{ flexDirection: 'row', gap: 8, marginTop: 4, opacity: marking !== null ? 0.3 : 1 }}
                              pointerEvents={marking !== null ? 'none' : 'auto'}
                            >
                              <Pressable
                                onPress={addSeq}
                                style={{ flex: 1.1, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.brick, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                              >
                                <Icon name="plus" size={14} color={colors.brick}/>
                                <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: colors.brick }}>{t('wizard.step3NewSequence')}</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => setShowSeqPicker(true)}
                                style={{ flex: 1, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.card, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                              >
                                <Icon name="library" size={14} color={colors.mustardDk}/>
                                <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink }}>{t('wizard.step3SeqFromLib')}</Text>
                                <View style={{ backgroundColor: colors.cream2, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, fontWeight: '700', letterSpacing: 0.5 }}>{librarySequences.length + libraryPatterns.length}</Text>
                                </View>
                              </Pressable>
                            </View>
                          </View>
                        )}
                      </View>
                    </ScaleDecorator>
                  )
                }}
              />

              {/* Add another part */}
              <Pressable
                onPress={addPart}
                style={{
                  borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.rule,
                  backgroundColor: 'transparent',
                  borderRadius: 16, paddingVertical: 14,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Icon name="plus" size={16} color={colors.brick}/>
                <Text style={{ fontFamily: fonts.bodySb, fontSize: 14, color: colors.brick }}>
                  {t('libraryCreate.addAnotherPart')}
                </Text>
              </Pressable>

              {/* Tip */}
              <View style={{
                marginTop: 16, paddingVertical: 10, paddingHorizontal: 12,
                backgroundColor: colors.cream2, borderRadius: 12,
                flexDirection: 'row', gap: 8, alignItems: 'flex-start',
              }}>
                <Icon name="bulb" size={14} color={colors.mustardDk}/>
                <Text style={{
                  fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft,
                  flex: 1, lineHeight: 18,
                }}>
                  <Text style={{ fontWeight: '700', color: colors.ink }}>{t('common.tip')} </Text>
                  {t('libraryCreate.tipParts')}
                </Text>
              </View>

            </NestableScrollContainer>

            {/* Stitch dock — pinned above save footer when a row is active */}
            {dockVisible && (
              <View style={{
                backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.rule,
                paddingTop: 10, paddingBottom: 10, paddingHorizontal: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.brick, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                    {t('wizard.step3TapToAdd', {
                      name: parts[activeRow!.partIdx]?.sequences[activeRow!.seqIdx]?.name ?? '',
                      rowNumber: activeRow!.rowIdx + 1,
                    })}
                  </Text>
                  <Pressable onPress={() => setShowStitchPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.brick, fontWeight: '700' }}>
                      {t('wizard.step3AllStitches', { count: totalStitchCount })}
                    </Text>
                    <Icon name="chevR" size={12} color={colors.brick}/>
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {dockStitches.map((s, idx) => {
                    const tileColor = [colors.brick, colors.mustard, colors.forest][idx % 3]!
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => addStitchToRow(activeRow!.partIdx, activeRow!.seqIdx, activeRow!.rowIdx, s.id)}
                        style={{ flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.rule, borderRadius: 10, paddingVertical: 6, alignItems: 'center', gap: 3 }}
                      >
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: tileColor, alignItems: 'center', justifyContent: 'center' }}>
                          <StitchGlyph symbol={s.symbol} size={16} color="#FBF6EC"/>
                        </View>
                        <Text style={{ fontSize: 9.5, fontFamily: fonts.mono, color: colors.inkSoft, fontWeight: '700' }}>{s.abbr}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )}

            {/* Marking instruction bar — replaces dock while marking */}
            {marking && (
              <View style={{
                backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.rule,
                paddingVertical: 12, paddingHorizontal: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name="repeat" size={16} color={colors.brick} stroke={2}/>
                  <Text style={{ flex: 1, fontFamily: fonts.bodySb, fontSize: 13.5, color: colors.ink }}>
                    <Text style={{ fontFamily: fonts.mono, color: colors.brick, fontWeight: '700' }}>
                      {t('wizard.step3MarkStepIndicator', { current: marking.step === 'start' ? 1 : 2, total: 2 })}
                    </Text>
                    {'  '}
                    {marking.step === 'start' ? t('wizard.step3MarkStart') : t('wizard.step3MarkEnd')}
                  </Text>
                  <Pressable
                    onPress={cancelMarking}
                    style={{
                      borderWidth: 1, borderColor: colors.rule, borderRadius: 9,
                      paddingHorizontal: 12, paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.bodySb, fontSize: 12.5, color: colors.inkSoft }}>
                      {t('wizard.step3MarkCancel')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Footer save bar */}
            <View style={[styles.footer, { borderTopColor: colors.rule, backgroundColor: colors.bg }]}>
              {ready ? (
                <Btn variant="primary" size="lg" icon="save" full onPress={handleSave}>
                  {t('libraryCreate.savePatternToLibrary')}
                </Btn>
              ) : (
                <View style={[styles.disabledSaveBtn, {
                  backgroundColor: '#E8D6CF',
                  borderColor: colors.brick,
                  borderRadius: radius.md,
                }]}>
                  <Icon name="save" size={18} color={colors.brick}/>
                  <Text style={{
                    fontFamily: fonts.bodySb, fontSize: 16, color: colors.brick,
                    letterSpacing: -0.05,
                  }}>
                    {!name.trim() ? t('libraryCreate.nameFirst') : t('libraryCreate.addSeqFirst')}
                  </Text>
                </View>
              )}
            </View>

          </View>
        </View>
      </GestureHandlerRootView>

      {/* Stitch picker modal */}
      <StitchPickerModal
        visible={showStitchPicker}
        onClose={() => setShowStitchPicker(false)}
        onSelect={handlePickerSelect}
        onDefineCustom={() => { setShowStitchPicker(false); setShowDefineCustom(true) }}
        craftFilter={craft}
      />

      {/* Define custom stitch */}
      <DefineCustomStitchScreen
        visible={showDefineCustom}
        onClose={() => setShowDefineCustom(false)}
        onSaved={(_id) => {
          setShowDefineCustom(false)
          setShowStitchPicker(true)
        }}
        defaultCraft={craft}
      />

      {/* Row library picker */}
      <RowPickerModal
        visible={showRowPicker}
        onClose={() => setShowRowPicker(false)}
        onSelect={(row) => {
          if (rowPickerSeqIdx !== null) addRowFromLib(rowPickerSeqIdx, row)
        }}
        onBuildNew={() => {
          setShowRowPicker(false)
          if (rowPickerSeqIdx !== null) addRow(rowPickerSeqIdx)
        }}
        craftFilter={craft}
      />

      {/* Sequence/Pattern library picker */}
      <SeqPickerModal
        visible={showSeqPicker}
        onClose={() => setShowSeqPicker(false)}
        onSelectSequence={addSeqFromLib}
        onSelectPattern={addPatternFromLib}
        onBuildNew={() => { setShowSeqPicker(false); addSeq() }}
        craftFilter={craft}
      />

      {/* Remove-row dialog */}
      {confirmDialog && part && (() => {
        const diagSeq = part.sequences[confirmDialog.seqIdx]
        const diagRow = diagSeq?.rows[confirmDialog.rowIdx]
        const totalSts = diagRow?.stitches.reduce((s, inst) => s + inst.count, 0) ?? 0
        const MAX_CHIPS = 14
        const chips: {stitchId: string}[] = []
        for (const inst of diagRow?.stitches ?? []) {
          for (let i = 0; i < inst.count && chips.length < MAX_CHIPS; i++) {
            chips.push({ stitchId: inst.stitchId })
          }
        }
        const overflow = totalSts > MAX_CHIPS ? totalSts - MAX_CHIPS : 0
        return (
          <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmDialog(null)}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <BlurView
                intensity={14}
                tint="dark"
                style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(43,24,16,0.42)' }]}
              />
              <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setConfirmDialog(null)}/>
              <View style={[styles.dialogCard, { backgroundColor: colors.bg, borderColor: colors.rule }]}>
                <View style={styles.dialogHeader}>
                  <View style={[styles.dialogIcon, { backgroundColor: colors.brick, shadowColor: colors.brick }]}>
                    <Icon name="trash" size={26} color="#FBF6EC"/>
                  </View>
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{
                      fontFamily: fonts.display, fontSize: 24, color: colors.brick,
                      letterSpacing: -0.25, lineHeight: 26, textAlign: 'center',
                    }}>
                      {t('wizard.removeRowTitle')}
                    </Text>
                    <Text style={{
                      fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
                      letterSpacing: 2, textTransform: 'uppercase',
                    }}>
                      {t('wizard.removeRowNoUndo', { count: totalSts })}
                    </Text>
                  </View>
                </View>
                <View style={{ paddingTop: 14, paddingHorizontal: 20, paddingBottom: 4 }}>
                  <View style={{
                    backgroundColor: colors.card,
                    borderWidth: 1, borderColor: colors.rule,
                    borderRadius: 12,
                    paddingVertical: 10, paddingHorizontal: 12,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Text style={{ fontFamily: fonts.bodySb, fontSize: 13, color: colors.ink }}>
                        {diagRow?.label}
                      </Text>
                      <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute }}>
                        · {t('common.sts', { count: totalSts })}
                      </Text>
                      <View style={{ flex: 1 }}/>
                      <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.6 }}>
                        {diagSeq?.name}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                      {chips.map((chip, i) => {
                        const def = stitchMap[chip.stitchId]
                        if (!def) return null
                        const c = STITCH_BRICK.has(chip.stitchId) ? colors.brick
                                : STITCH_MUSTARD.has(chip.stitchId) ? colors.mustard
                                : colors.forest
                        return (
                          <View key={i} style={{
                            width: 22, height: 26, borderRadius: 6,
                            backgroundColor: colors.cream2,
                            borderWidth: 1.2, borderColor: c,
                            alignItems: 'center', justifyContent: 'center',
                            opacity: 0.7,
                          }}>
                            <StitchGlyph symbol={def.symbol} size={12} color={c} strokeWidth={1.8}/>
                          </View>
                        )
                      })}
                      {overflow > 0 && (
                        <View style={{
                          height: 26, borderRadius: 6,
                          backgroundColor: colors.cream2,
                          borderWidth: 1, borderColor: colors.rule,
                          alignItems: 'center', justifyContent: 'center',
                          paddingHorizontal: 6, opacity: 0.7,
                        }}>
                          <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.inkMute, fontWeight: '700' }}>
                            +{overflow}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={{
                    marginTop: 10, fontSize: 13, color: colors.inkSoft,
                    fontFamily: fonts.body, lineHeight: 19,
                    textAlign: 'center', paddingHorizontal: 4,
                  }}>
                    {t('wizard.removeRowBody')}
                  </Text>
                </View>
                <View style={{ padding: 20, paddingTop: 16, gap: 8 }}>
                  <Pressable
                    onPress={executeRemoveRow}
                    style={[styles.destructiveBtn, { backgroundColor: colors.brick, shadowColor: colors.brick }]}
                  >
                    <Icon name="trash" size={16} color="#FBF6EC"/>
                    <Text style={{ fontFamily: fonts.bodySb, fontSize: 15, color: '#FBF6EC', letterSpacing: -0.1 }}>
                      {t('wizard.removeRowConfirm')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setConfirmDialog(null)}
                    style={[styles.cancelBtn, { borderColor: colors.rule }]}
                  >
                    <Text style={{ fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.ink, letterSpacing: -0.1 }}>
                      {t('common.keepIt')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )
      })()}

      {/* Remove-sequence dialog */}
      {confirmSeqDialog && part && (() => {
        const diagSeq = part.sequences[confirmSeqDialog.seqIdx]
        const rowCount = diagSeq?.rows.length ?? 0
        const totalSts = diagSeq?.rows.reduce(
          (sum, r) => sum + r.stitches.reduce((s2, st) => s2 + st.count, 0), 0,
        ) ?? 0
        const seqColor = [colors.mustard, colors.brick, colors.forest][confirmSeqDialog.seqIdx % 3]!
        const MAX_CHIPS_PER_ROW = 24
        return (
          <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmSeqDialog(null)}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <BlurView
                intensity={14}
                tint="dark"
                style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(43,24,16,0.42)' }]}
              />
              <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setConfirmSeqDialog(null)}/>
              <View style={[styles.dialogCard, { backgroundColor: colors.bg, borderColor: colors.rule }]}>
                <View style={styles.dialogHeader}>
                  <View style={[styles.dialogIcon, { backgroundColor: colors.brick, shadowColor: colors.brick }]}>
                    <Icon name="trash" size={26} color="#FBF6EC"/>
                  </View>
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{
                      fontFamily: fonts.display, fontSize: 24, color: colors.brick,
                      letterSpacing: -0.25, lineHeight: 26, textAlign: 'center',
                    }}>
                      {t('wizard.removeSeqTitle')}
                    </Text>
                    <Text style={{
                      fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
                      letterSpacing: 2, textTransform: 'uppercase',
                    }}>
                      {t('wizard.removeSeqNoUndo', { count: rowCount, rows: rowCount, stsLabel: t('wizard.removeSeqStitchLabel', { count: totalSts }) })}
                    </Text>
                  </View>
                </View>
                <View style={{ paddingTop: 14, paddingHorizontal: 20, paddingBottom: 4 }}>
                  <View style={{
                    backgroundColor: colors.card,
                    borderWidth: 1, borderColor: colors.rule,
                    borderRadius: 12,
                    paddingVertical: 10, paddingHorizontal: 12,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <View style={{
                        width: 24, height: 24, borderRadius: 7,
                        backgroundColor: seqColor,
                        alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Text style={{ fontFamily: fonts.display, fontSize: 13, color: '#FBF6EC' }}>
                          {confirmSeqDialog.seqIdx + 1}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1, fontFamily: fonts.bodySb, fontSize: 13.5, color: colors.ink,
                        }}
                      >
                        {diagSeq?.name}
                      </Text>
                      <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, flexShrink: 0 }}>
                        {t('common.rows', { count: rowCount })}
                      </Text>
                    </View>
                    <View style={{ gap: 5 }}>
                      {diagSeq?.rows.map((row) => {
                        const chips: {stitchId: string}[] = []
                        for (const inst of row.stitches) {
                          for (let i = 0; i < inst.count && chips.length < MAX_CHIPS_PER_ROW; i++) {
                            chips.push({ stitchId: inst.stitchId })
                          }
                        }
                        const rowTotal = row.stitches.reduce((s, inst) => s + inst.count, 0)
                        const overflow = rowTotal > MAX_CHIPS_PER_ROW ? rowTotal - MAX_CHIPS_PER_ROW : 0
                        const shortLabel = row.label.replace(/^Row\s+/i, 'R')
                        return (
                          <View key={row.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                            <Text style={{
                              fontFamily: fonts.mono, fontSize: 9, color: colors.inkMute,
                              fontWeight: '700', width: 30, flexShrink: 0,
                            }}>
                              {shortLabel}
                            </Text>
                            {row.stitches.length === 0 ? (
                              <Text style={{
                                fontFamily: fonts.mono, fontSize: 9.5,
                                color: colors.inkMute, fontStyle: 'italic',
                              }}>{t('wizard.rowEmpty')}</Text>
                            ) : (
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, flex: 1 }}>
                                {chips.map((chip, i) => {
                                  const def = stitchMap[chip.stitchId]
                                  if (!def) return null
                                  const c = STITCH_BRICK.has(chip.stitchId) ? colors.brick
                                          : STITCH_MUSTARD.has(chip.stitchId) ? colors.mustard
                                          : colors.forest
                                  return (
                                    <View key={i} style={{
                                      width: 14, height: 17, borderRadius: 4,
                                      backgroundColor: colors.cream2,
                                      borderWidth: 1, borderColor: c,
                                      alignItems: 'center', justifyContent: 'center',
                                      opacity: 0.7,
                                    }}>
                                      <StitchGlyph symbol={def.symbol} size={8} color={c} strokeWidth={1.6}/>
                                    </View>
                                  )
                                })}
                                {overflow > 0 && (
                                  <View style={{
                                    height: 17, borderRadius: 4,
                                    backgroundColor: colors.cream2,
                                    borderWidth: 1, borderColor: colors.rule,
                                    alignItems: 'center', justifyContent: 'center',
                                    paddingHorizontal: 4, opacity: 0.7,
                                  }}>
                                    <Text style={{
                                      fontFamily: fonts.mono, fontSize: 8,
                                      color: colors.inkMute, fontWeight: '700',
                                    }}>+{overflow}</Text>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        )
                      })}
                    </View>
                  </View>
                  <Text style={{
                    marginTop: 10, fontSize: 13, color: colors.inkSoft,
                    fontFamily: fonts.body, lineHeight: 19,
                    textAlign: 'center', paddingHorizontal: 4,
                  }}>
                    {t('wizard.removeSeqBody')}
                  </Text>
                </View>
                <View style={{ padding: 20, paddingTop: 16, gap: 8 }}>
                  <Pressable
                    onPress={executeRemoveSeq}
                    style={[styles.destructiveBtn, { backgroundColor: colors.brick, shadowColor: colors.brick }]}
                  >
                    <Icon name="trash" size={16} color="#FBF6EC"/>
                    <Text style={{ fontFamily: fonts.bodySb, fontSize: 15, color: '#FBF6EC', letterSpacing: -0.1 }}>
                      {t('wizard.removeSeqConfirm')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setConfirmSeqDialog(null)}
                    style={[styles.cancelBtn, { borderColor: colors.rule }]}
                  >
                    <Text style={{ fontFamily: fonts.bodySb, fontSize: 14.5, color: colors.ink, letterSpacing: -0.1 }}>
                      {t('common.keepIt')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )
      })()}
    </Modal>
  )
}

function FormLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  const { colors, fonts } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{
        fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute,
        letterSpacing: 1.8, textTransform: 'uppercase',
      }}>{children}</Text>
      {hint ? (
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 0.5 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, marginTop: 60, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  draftBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  previewCard: {
    borderRadius: 18, padding: 14, borderWidth: 1.5, marginBottom: 22,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 4,
  },
  field: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
  craftBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1,
  },
  footer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32,
    borderTopWidth: 1,
  },
  disabledSaveBtn: {
    flex: 1, height: 58,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderStyle: 'dashed',
  },
  dialogCard: {
    width: 320, maxWidth: '92%',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: 'rgba(43,24,16,1)',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.35,
    shadowRadius: 60,
    elevation: 20,
    marginTop: -48,
  },
  dialogHeader: {
    paddingTop: 22, paddingHorizontal: 22, paddingBottom: 14,
    backgroundColor: '#FBEFEA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(156,61,46,0.15)',
    alignItems: 'center', gap: 12,
  },
  dialogIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    transform: [{ rotate: '-4deg' }],
  },
  destructiveBtn: {
    height: 48, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  cancelBtn: {
    height: 44, borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
})
