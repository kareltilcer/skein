import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  useLibraryStore,
  useSettingsStore,
  uuid,
  appendStitchPreservingSegments,
  removeLastStitchPreservingSegments,
  expandStitches,
  segmentsFromMark,
  type LibraryRow,
  type LibrarySequence,
  type StitchInstance,
  type RowSegment,
  type Craft,
  type StitchDef,
} from '@skein/shared'
import Btn from '../../components/ui/Btn'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import Tip from '../../components/ui/Tip'
import StitchTile from '../../components/ui/StitchTile'
import RepeatRowBody from '../../components/ui/RepeatRowBody'
import RowToolbar from '../../components/ui/RowToolbar'
import ReuseChooser from '../../components/ui/ReuseChooser'
import StitchPickerDock from '../../components/ui/StitchPickerDock'
import StitchPickerModal from '../../components/ui/StitchPickerModal'
import s from './Step3.module.css'

// Local versions of the draft types — kept narrow so this component doesn't
// import from the wizard's private shape.
export type DraftRow = { id: string; label: string; stitches: StitchInstance[]; segments?: RowSegment[] }
export type DraftSequence = { id: string; name: string; rows: DraftRow[]; totalRepeats: number; loop: boolean }
export type DraftPart = { id: string; name: string; color: string; notes?: string; sequences: DraftSequence[]; loop?: boolean }

type Props = {
  parts: DraftPart[]
  craft: Craft
  onPartsChange: (parts: DraftPart[]) => void
}

type Marking = { partIdx: number; seqIdx: number; rowIdx: number; step: 'start' | 'end'; start: number | null } | null
type RowFocus = { partIdx: number; seqIdx: number; rowIdx: number } | null

export default function Step3({ parts, craft, onPartsChange }: Props) {
  const { t } = useTranslation()
  const [activePartIdx, setActivePartIdx] = React.useState(0)
  const [activeRow, setActiveRow] = React.useState<RowFocus>(null)
  const [marking, setMarking] = React.useState<Marking>(null)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [rowPickerSeq, setRowPickerSeq] = React.useState<number | null>(null)
  const [seqPickerOpen, setSeqPickerOpen] = React.useState(false)
  const [confirmRow, setConfirmRow] = React.useState<{ seqIdx: number; rowIdx: number } | null>(null)
  const [confirmSeq, setConfirmSeq] = React.useState<{ seqIdx: number } | null>(null)

  const libraryRows = useLibraryStore((st) => st.rows)
  const librarySequences = useLibraryStore((st) => st.sequences)
  const recents = useSettingsStore((st) => st.recentStitchIds)
  const recordStitchUsed = useSettingsStore((st) => st.recordStitchUsed)

  const safeIdx = Math.min(activePartIdx, parts.length - 1)
  const part = parts[safeIdx]

  // ── State helpers ──
  function patchPart(idx: number, patch: Partial<DraftPart>) {
    onPartsChange(parts.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  }
  function patchSeq(partIdx: number, seqIdx: number, patch: Partial<DraftSequence>) {
    const p = parts[partIdx]
    if (!p) return
    patchPart(partIdx, { sequences: p.sequences.map((sq, i) => (i === seqIdx ? { ...sq, ...patch } : sq)) })
  }
  function patchRow(partIdx: number, seqIdx: number, rowIdx: number, patch: Partial<DraftRow>) {
    const sq = parts[partIdx]?.sequences[seqIdx]
    if (!sq) return
    patchSeq(partIdx, seqIdx, { rows: sq.rows.map((r, i) => (i === rowIdx ? { ...r, ...patch } : r)) })
  }

  function addSequence(partIdx: number) {
    const p = parts[partIdx]
    if (!p) return
    const newSeq: DraftSequence = {
      id: uuid(),
      name: t('wizard.sequenceLabel', { n: p.sequences.length + 1, defaultValue: `Sequence ${p.sequences.length + 1}` }),
      rows: [],
      totalRepeats: 1,
      loop: false,
    }
    patchPart(partIdx, { sequences: [...p.sequences, newSeq] })
  }

  function addRow(partIdx: number, seqIdx: number) {
    const sq = parts[partIdx]?.sequences[seqIdx]
    if (!sq) return
    const newRow: DraftRow = {
      id: uuid(),
      label: t('wizard.rowLabel', { n: sq.rows.length + 1, defaultValue: `Row ${sq.rows.length + 1}` }),
      stitches: [],
    }
    patchSeq(partIdx, seqIdx, { rows: [...sq.rows, newRow] })
    setActiveRow({ partIdx, seqIdx, rowIdx: sq.rows.length })
  }

  function addRowFromLibrary(partIdx: number, seqIdx: number, libRow: LibraryRow) {
    const sq = parts[partIdx]?.sequences[seqIdx]
    if (!sq) return
    const newRow: DraftRow = {
      id: uuid(),
      label: libRow.label,
      stitches: libRow.stitches,
      ...(libRow.segments ? { segments: libRow.segments } : {}),
    }
    patchSeq(partIdx, seqIdx, { rows: [...sq.rows, newRow] })
    setActiveRow({ partIdx, seqIdx, rowIdx: sq.rows.length })
    setRowPickerSeq(null)
  }

  function addSeqFromLibrary(partIdx: number, libSeq: LibrarySequence) {
    const p = parts[partIdx]
    if (!p) return
    const newSeq: DraftSequence = {
      id: uuid(),
      name: libSeq.name,
      rows: libSeq.rows.map((r) => ({ id: uuid(), label: r.label, stitches: r.stitches, ...(r.segments ? { segments: r.segments } : {}) })),
      totalRepeats: libSeq.totalRepeats || 1,
      loop: libSeq.loop,
    }
    patchPart(partIdx, { sequences: [...p.sequences, newSeq] })
    setSeqPickerOpen(false)
  }

  function deleteRow(partIdx: number, seqIdx: number, rowIdx: number) {
    const sq = parts[partIdx]?.sequences[seqIdx]
    if (!sq) return
    patchSeq(partIdx, seqIdx, { rows: sq.rows.filter((_, i) => i !== rowIdx) })
    if (activeRow?.seqIdx === seqIdx && activeRow.partIdx === partIdx && activeRow.rowIdx === rowIdx) setActiveRow(null)
  }
  function deleteSequence(partIdx: number, seqIdx: number) {
    const p = parts[partIdx]
    if (!p) return
    patchPart(partIdx, { sequences: p.sequences.filter((_, i) => i !== seqIdx) })
    if (activeRow?.seqIdx === seqIdx && activeRow.partIdx === partIdx) setActiveRow(null)
  }

  function addStitch(stitch: StitchDef) {
    if (!activeRow) return
    const { partIdx, seqIdx, rowIdx } = activeRow
    const row = parts[partIdx]?.sequences[seqIdx]?.rows[rowIdx]
    if (!row) return
    const nextRow = appendStitchPreservingSegments(row, stitch.id) as DraftRow
    patchRow(partIdx, seqIdx, rowIdx, nextRow)
    recordStitchUsed(stitch.id)
  }

  function startMarking(seqIdx: number, rowIdx: number) {
    const row = part?.sequences[seqIdx]?.rows[rowIdx]
    if (!row || row.stitches.length === 0) return
    if (row.segments) {
      const { segments: _drop, ...rest } = row
      patchRow(safeIdx, seqIdx, rowIdx, rest as DraftRow)
    }
    setMarking({ partIdx: safeIdx, seqIdx, rowIdx, step: 'start', start: null })
  }
  function handleMarkTap(tileIdx: number) {
    if (!marking) return
    const row = parts[marking.partIdx]?.sequences[marking.seqIdx]?.rows[marking.rowIdx]
    if (!row) return
    if (marking.step === 'start') {
      setMarking({ ...marking, step: 'end', start: tileIdx })
      return
    }
    const start = marking.start
    if (start == null || tileIdx < start) return
    const segments = segmentsFromMark(row.stitches, start, tileIdx)
    patchRow(marking.partIdx, marking.seqIdx, marking.rowIdx, { segments })
    setMarking(null)
  }

  if (!part) return null

  return (
    <div className={s.wrap}>
      {/* Part switcher */}
      {parts.length > 1 && (
        <div className={s.partTabs}>
          {parts.map((p, i) => {
            const active = i === safeIdx
            return (
              <button
                key={p.id}
                type="button"
                className={[s.partTab, active ? s.partTabActive : ''].filter(Boolean).join(' ')}
                onClick={() => { setActivePartIdx(i); setActiveRow(null); setMarking(null) }}
              >
                <span>{p.name}</span>
                <span className={s.partTabCount}>{p.sequences.length}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Stacked sequence cards */}
      <div className={s.seqStack}>
        {part.sequences.map((seq, seqIdx) => (
          <SequenceCard
            key={seq.id}
            seq={seq}
            seqIdx={seqIdx}
            partIdx={safeIdx}
            activeRow={activeRow}
            marking={marking}
            onActivateRow={(rowIdx) => { setActiveRow({ partIdx: safeIdx, seqIdx, rowIdx }); setMarking(null) }}
            onRenameSeq={(name) => patchSeq(safeIdx, seqIdx, { name })}
            onRowLabel={(rowIdx, label) => patchRow(safeIdx, seqIdx, rowIdx, { label })}
            onAddRow={() => addRow(safeIdx, seqIdx)}
            onAddRowFromLib={() => setRowPickerSeq(seqIdx)}
            onDeleteRow={(rowIdx) => setConfirmRow({ seqIdx, rowIdx })}
            onUndoLast={(rowIdx) => {
              const row = part.sequences[seqIdx]?.rows[rowIdx]
              if (!row || row.stitches.length === 0) return
              const next = removeLastStitchPreservingSegments(row) as DraftRow
              patchRow(safeIdx, seqIdx, rowIdx, next)
            }}
            onStartMarking={(rowIdx) => startMarking(seqIdx, rowIdx)}
            onHandleMarkTap={handleMarkTap}
            onDeleteSeq={() => setConfirmSeq({ seqIdx })}
            libraryRowCount={libraryRows.filter((r) => r.craft === craft).length}
          />
        ))}

        <button type="button" className={s.addSeq} onClick={() => addSequence(safeIdx)}>
          <Icon name="plus" size={16} />
          <span>{t('wizard.step3AddSeq', 'Add a sequence')}</span>
        </button>

        <ReuseChooser
          kind="sequence"
          libraryCount={librarySequences.filter((sq) => sq.craft === craft).length}
          onNew={() => addSequence(safeIdx)}
          onPickFromLibrary={() => setSeqPickerOpen(true)}
        />

        <Tip>{t('wizard.step3Tip', 'Tap any row to focus it — the stitch dock fills that row.')}</Tip>
      </div>

      {/* Dock or mark instruction bar pinned to bottom */}
      {marking ? (
        <div className={s.markBar}>
          <Icon name="repeat" size={16} />
          <span className={s.markBarStep}>
            {t('wizard.step3MarkStepIndicator', { current: marking.step === 'start' ? 1 : 2, total: 2, defaultValue: marking.step === 'start' ? '1/2' : '2/2' })}
          </span>
          <span className={s.markBarText}>
            {marking.step === 'start'
              ? t('wizard.step3MarkStart', 'Tap the first stitch of the repeat')
              : t('wizard.step3MarkEnd', 'Tap the last stitch of the repeat')}
          </span>
          <button type="button" className={s.markBarCancel} onClick={() => setMarking(null)}>
            {t('wizard.step3MarkCancel', 'Cancel')}
          </button>
        </div>
      ) : (
        <StitchPickerDock
          craft={craft}
          recents={recents}
          target={activeRow ? part.sequences[activeRow.seqIdx]?.rows[activeRow.rowIdx]?.label ?? t('wizard.step3DockTargetGeneric', 'a row') : t('wizard.step3DockTargetGeneric', 'a row')}
          onPick={(stitch) => {
            if (!activeRow) return
            addStitch(stitch)
          }}
          onOpenPicker={() => setPickerOpen(true)}
        />
      )}

      <StitchPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(stitch) => addStitch(stitch)}
        defaultCraftFilter={craft}
      />

      <Modal
        open={rowPickerSeq !== null}
        onClose={() => setRowPickerSeq(null)}
        title={t('wizard.step3PickRow', 'Pick a row from your library')}
        width={620}
      >
        <div className={s.pickerList}>
          {libraryRows.filter((r) => r.craft === craft).map((r) => (
            <button
              key={r.id}
              type="button"
              className={s.pickerRow}
              onClick={() => { if (rowPickerSeq !== null) addRowFromLibrary(safeIdx, rowPickerSeq, r) }}
            >
              <span className={s.pickerName}>{r.label}</span>
              <span className={s.pickerMeta}>{r.stitches.reduce((a, s) => a + s.count, 0)} {t('library.stsAbbr', 'sts')}</span>
              <Icon name="plus" size={16} />
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={seqPickerOpen}
        onClose={() => setSeqPickerOpen(false)}
        title={t('wizard.step3PickSeq', 'Pick a sequence from your library')}
        width={620}
      >
        <div className={s.pickerList}>
          {librarySequences.filter((sq) => sq.craft === craft).map((sq) => (
            <button
              key={sq.id}
              type="button"
              className={s.pickerRow}
              onClick={() => addSeqFromLibrary(safeIdx, sq)}
            >
              <span className={s.pickerName}>{sq.name}</span>
              <span className={s.pickerMeta}>{sq.rows.length} {t('library.rows', 'rows')}</span>
              <Icon name="plus" size={16} />
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={!!confirmRow}
        onClose={() => setConfirmRow(null)}
        width={460}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirmRow(null)}>{t('common.keepIt', 'Keep it')}</Btn>
            <Btn
              icon="trash"
              onClick={() => {
                if (confirmRow) deleteRow(safeIdx, confirmRow.seqIdx, confirmRow.rowIdx)
                setConfirmRow(null)
              }}
            >
              {t('wizard.step3RemoveRowConfirm', 'Yes, remove row')}
            </Btn>
          </>
        }
      >
        <Modal.DangerHeader
          title={t('wizard.step3RemoveRowTitle', 'Remove this row?')}
          caption={(() => {
            const stsLost = confirmRow ? part.sequences[confirmRow.seqIdx]?.rows[confirmRow.rowIdx]?.stitches.reduce((a, s) => a + s.count, 0) ?? 0 : 0
            return t('wizard.step3RemoveRowCaption', { count: stsLost, defaultValue: `No undo · ${stsLost} stitches lost` })
          })()}
        />
        <p className={s.confirmBody}>
          {t('wizard.step3RemoveRowBody', "The row above and below will shift up — neighboring rows aren't affected.")}
        </p>
      </Modal>

      <Modal
        open={!!confirmSeq}
        onClose={() => setConfirmSeq(null)}
        width={460}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirmSeq(null)}>{t('common.keepIt', 'Keep it')}</Btn>
            <Btn
              icon="trash"
              onClick={() => {
                if (confirmSeq) deleteSequence(safeIdx, confirmSeq.seqIdx)
                setConfirmSeq(null)
              }}
            >
              {t('wizard.step3RemoveSeqConfirm', 'Yes, delete sequence')}
            </Btn>
          </>
        }
      >
        <Modal.DangerHeader
          title={t('wizard.step3RemoveSeqTitle', 'Delete this whole sequence?')}
          caption={(() => {
            if (!confirmSeq) return ''
            const seq = part.sequences[confirmSeq.seqIdx]
            if (!seq) return ''
            const sts = seq.rows.reduce((a, r) => a + r.stitches.reduce((x, s) => x + s.count, 0), 0)
            return t('wizard.step3RemoveSeqCaption', { rows: seq.rows.length, sts, defaultValue: `No undo · ${seq.rows.length} rows · ${sts} stitches lost` })
          })()}
        />
        <p className={s.confirmBody}>
          {t('wizard.step3RemoveSeqBody', "Every row inside moves with it. Other sequences shift up — they aren't affected.")}
        </p>
      </Modal>
    </div>
  )
}

// ─── Sequence card ─────────────────────────────────────────────
type SequenceCardProps = {
  seq: DraftSequence
  seqIdx: number
  partIdx: number
  activeRow: RowFocus
  marking: Marking
  onActivateRow: (rowIdx: number) => void
  onRenameSeq: (name: string) => void
  onRowLabel: (rowIdx: number, label: string) => void
  onAddRow: () => void
  onAddRowFromLib: () => void
  onDeleteRow: (rowIdx: number) => void
  onUndoLast: (rowIdx: number) => void
  onStartMarking: (rowIdx: number) => void
  onHandleMarkTap: (tileIdx: number) => void
  onDeleteSeq: () => void
  libraryRowCount: number
}

function SequenceCard({
  seq, seqIdx, partIdx, activeRow, marking,
  onActivateRow, onRenameSeq, onRowLabel,
  onAddRow, onAddRowFromLib, onDeleteRow, onUndoLast, onStartMarking, onHandleMarkTap,
  onDeleteSeq, libraryRowCount,
}: SequenceCardProps) {
  const { t } = useTranslation()
  const editing = activeRow !== null && activeRow.partIdx === partIdx && activeRow.seqIdx === seqIdx
  const totalSts = seq.rows.reduce((a, r) => a + r.stitches.reduce((x, st) => x + st.count, 0), 0)
  const hasRepeat = seq.rows.some((r) => r.segments)

  return (
    <article className={[s.seqCard, editing ? s.seqCardEditing : ''].filter(Boolean).join(' ')}>
      <header className={s.seqHead}>
        <span className={s.seqNum}>{seqIdx + 1}</span>
        <div className={s.seqBody}>
          <input
            className={s.seqName}
            value={seq.name}
            onChange={(e) => onRenameSeq(e.target.value)}
          />
          <span className={s.seqMeta}>
            {t('wizard.step3SeqMeta', {
              rows: seq.rows.length,
              sts: totalSts,
              defaultValue: `${seq.rows.length} rows · ${totalSts}${hasRepeat ? '+' : ''} sts${hasRepeat ? ' · has repeat' : ''}`,
            })}
          </span>
        </div>
        {editing ? (
          <button type="button" className={s.seqDelete} onClick={onDeleteSeq}>
            <Icon name="trash" size={13} />
            <span>{t('wizard.step3SeqDelete', 'Delete')}</span>
          </button>
        ) : (
          <Icon name="chevDown" size={16} />
        )}
      </header>

      <div className={s.rowsList}>
        {seq.rows.map((row, rowIdx) => {
          const isMarking = !!marking && marking.partIdx === partIdx && marking.seqIdx === seqIdx && marking.rowIdx === rowIdx
          const isActive = editing && activeRow?.rowIdx === rowIdx
          const sts = row.stitches.reduce((a, st) => a + st.count, 0)
          return (
            <div
              key={row.id}
              className={[s.rowCard, isActive ? s.rowCardActive : ''].filter(Boolean).join(' ')}
              onClick={() => onActivateRow(rowIdx)}
            >
              <header className={s.rowHead}>
                <Icon name="grip" size={14} />
                <input
                  className={s.rowLabel}
                  value={row.label}
                  onChange={(e) => onRowLabel(rowIdx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className={s.rowSts}>· {sts} sts</span>
                <span style={{ flex: 1 }} />
                <RowToolbar
                  repeatActive={!!row.segments || isMarking}
                  disabledRepeat={sts === 0}
                  disabledBackspace={sts === 0}
                  onMarkRepeat={() => onStartMarking(rowIdx)}
                  onBackspace={() => onUndoLast(rowIdx)}
                  onDelete={() => onDeleteRow(rowIdx)}
                />
              </header>
              {sts === 0 ? (
                <p className={s.rowEmpty}>{t('wizard.step3RowEmpty', 'empty · tap a stitch below to start')}</p>
              ) : isMarking ? (
                <div className={s.tilesRow}>
                  {expandStitches(row.stitches).map((id, i) => {
                    let state: 'tap' | 'start' | 'dim' = 'tap'
                    if (marking && i === marking.start) state = 'start'
                    else if (marking && marking.step === 'end' && marking.start !== null && i < marking.start) state = 'dim'
                    return (
                      <StitchTile
                        key={i}
                        id={id}
                        state={state}
                        onClick={() => onHandleMarkTap(i)}
                      />
                    )
                  })}
                </div>
              ) : row.segments ? (
                <RepeatRowBody segments={row.segments} />
              ) : (
                <div className={s.tilesRow}>
                  {expandStitches(row.stitches).map((id, i) => <StitchTile key={i} id={id} />)}
                </div>
              )}
            </div>
          )
        })}

        <ReuseChooser
          kind="row"
          libraryCount={libraryRowCount}
          onNew={onAddRow}
          onPickFromLibrary={onAddRowFromLib}
        />
      </div>
    </article>
  )
}
