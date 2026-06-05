import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useLibraryStore,
  useSettingsStore,
  uuid,
  appendStitchPreservingSegments,
  removeLastStitchPreservingSegments,
  expandStitches,
  segmentsFromMark,
  type Craft,
  type LibraryRow,
  type Row,
  type RowSegment,
  type StitchDef,
} from '@skein/shared'
import Modal from '../../components/ui/Modal'
import Chip from '../../components/ui/Chip'
import Section from '../../components/ui/Section'
import StitchTile from '../../components/ui/StitchTile'
import RowToolbar from '../../components/ui/RowToolbar'
import RepeatRowBody, { RowNotation } from '../../components/ui/RepeatRowBody'
import StitchPickerDock from '../../components/ui/StitchPickerDock'
import StitchPickerModal from '../../components/ui/StitchPickerModal'
import { useStitchMap } from '../../hooks/useStitchMap'
import s from './BuilderView.module.css'

type Marking = { step: 'start' | 'end'; start: number | null } | null

export default function NewRowView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const existing = useLibraryStore((st) => (id ? st.rows.find((r) => r.id === id) : undefined))
  const addRow = useLibraryStore((st) => st.addRow)
  const updateRow = useLibraryStore((st) => st.updateRow)
  const defaultCraft = useSettingsStore((st) => st.defaultCraft)
  const recents = useSettingsStore((st) => st.recentStitchIds)
  const recordStitchUsed = useSettingsStore((st) => st.recordStitchUsed)
  const stitchMap = useStitchMap()

  const isEditing = !!existing
  const [name, setName] = React.useState(existing?.label ?? '')
  const [craft, setCraft] = React.useState<Craft>(existing?.craft ?? defaultCraft)
  const [row, setRow] = React.useState<Row>(() => ({
    id: 'draft',
    label: existing?.label ?? '',
    stitches: existing?.stitches ?? [],
    ...(existing?.segments ? { segments: existing.segments } : {}),
  }))
  const [marking, setMarking] = React.useState<Marking>(null)
  const [pickerOpen, setPickerOpen] = React.useState(false)

  const stsCount = row.stitches.reduce((a, x) => a + x.count, 0)
  const hasRepeat = !!row.segments
  const ready = name.trim().length > 0 && stsCount > 0

  function addStitch(stitchId: string) {
    setRow((r) => appendStitchPreservingSegments(r, stitchId) as Row)
    recordStitchUsed(stitchId)
  }

  function undoLast() {
    if (row.stitches.length === 0) return
    setRow((r) => removeLastStitchPreservingSegments(r) as Row)
  }

  function startMarking() {
    if (row.stitches.length === 0) return
    if (row.segments) {
      const { segments: _drop, ...rest } = row
      setRow(rest as Row)
    }
    setMarking({ step: 'start', start: null })
  }

  function handleMarkTap(idx: number) {
    if (!marking) return
    if (marking.step === 'start') {
      setMarking({ step: 'end', start: idx })
      return
    }
    const start = marking.start
    if (start == null || idx < start) return
    const segments = segmentsFromMark(row.stitches, start, idx)
    setRow((r) => ({ ...r, segments } as Row))
    setMarking(null)
  }

  function save() {
    if (!ready) return
    const payload: LibraryRow = {
      id: existing?.id ?? uuid(),
      label: name.trim(),
      craft,
      stitches: row.stitches,
      ...(row.segments ? { segments: row.segments } : {}),
      isBuiltIn: false,
    }
    if (isEditing) updateRow(payload)
    else addRow(payload)
    navigate('/library')
  }

  const flatIds = React.useMemo(() => expandStitches(row.stitches), [row.stitches])

  // Notation read-out — used when no segments are present (segments handled by RowNotation).
  const notation = React.useMemo(() => {
    if (row.stitches.length === 0) return ''
    return row.stitches.map((si) => {
      const def = stitchMap[si.stitchId]
      const abbr = def?.abbr ?? si.stitchId
      return si.count > 1 ? `${abbr}${si.count}` : abbr
    }).join(', ')
  }, [row.stitches, stitchMap])

  return (
    <div className={s.shell}>
      <Modal.DefinerHeader
        kind={t(isEditing ? 'libraryCreate.editRowBadge' : 'libraryCreate.draftRow', isEditing ? 'Row · editing' : 'Row · draft')}
        ready={ready}
        onClose={() => navigate('/library')}
        onSave={save}
        saveLabel={t('common.save', 'Save')}
      />

      <div className={s.titleBlock}>
        <h1 className={s.title}>
          {isEditing
            ? t('libraryCreate.editRowTitle', 'Edit row')
            : t('libraryCreate.newRowTitle', 'New row')}
        </h1>
        <p className={s.sub}>
          {isEditing
            ? t('libraryCreate.editRowSub', 'Adjust the stitches; the notation updates automatically.')
            : t('libraryCreate.newRowSub', 'A single line of stitches — saved once, reused across every project.')}
        </p>
      </div>

      <div className={s.scrollBody}>
        {/* Live preview */}
        <div className={s.previewCard}>
          <div className={s.previewHead}>
            <span className={s.eyebrow}>{t('libraryCreate.livePreview', 'Live preview')}</span>
            <span className={s.previewBadge}>
              {t('libraryCreate.newStsBadge', { count: stsCount, defaultValue: `NEW · ${stsCount} STS` })}
            </span>
          </div>
          <div className={[s.previewName, name ? '' : s.previewNamePlaceholder].filter(Boolean).join(' ')}>
            {name || t('libraryCreate.untitledRow', 'Untitled row')}
          </div>
          {flatIds.length > 0 && (
            <div className={s.previewStrip}>
              {flatIds.slice(0, 16).map((stitchId, i) => (
                <StitchTile key={i} id={stitchId} size={22} />
              ))}
              {flatIds.length > 16 && (
                <span className={s.previewMore}>+{flatIds.length - 16}</span>
              )}
            </div>
          )}
          {notation && (
            <div className={s.previewNotation}>{notation}</div>
          )}
        </div>

        {/* Identity */}
        <Section label={t('libraryCreate.identityLabel', 'Name & craft')} hint={t('libraryCreate.identityHint', 'shown in your library')}>
          <input
            className={s.nameInput}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder={t('libraryCreate.namePlaceholderRow', 'e.g. Eyelet rib')}
            autoFocus={!isEditing}
            maxLength={60}
          />
          <div className={s.craftRow}>
            <Chip active={craft === 'knit'} icon="needle" onClick={() => setCraft('knit')}>{t('craft.knit', 'Knit')}</Chip>
            <Chip active={craft === 'crochet'} icon="loop" onClick={() => setCraft('crochet')}>{t('craft.crochet', 'Crochet')}</Chip>
          </div>
        </Section>

        {/* Builder */}
        <Section
          label={t('libraryCreate.buildRow', 'Build the row')}
          hint={t('libraryCreate.buildRowHint', { count: stsCount, defaultValue: `${stsCount} stitches` })}
        >
          <div className={s.builder}>
            {marking ? (
              <>
                <div className={s.markBanner}>
                  <span className={s.markStep}>{marking.step === 'start' ? '1' : '2'}</span>
                  <span className={s.markText}>
                    {marking.step === 'start'
                      ? t('wizard.step3MarkStartInRow', 'Tap the first stitch that repeats')
                      : t('wizard.step3MarkEndInRow', 'Now tap the last stitch that repeats')}
                  </span>
                  <button type="button" className={s.markCancel} onClick={() => setMarking(null)}>
                    {t('wizard.step3MarkCancel', 'Cancel')}
                  </button>
                </div>
                <div className={s.tilesRow}>
                  {flatIds.map((stitchId, idx) => {
                    let state: 'tap' | 'start' | 'dim' = 'tap'
                    if (idx === marking.start) state = 'start'
                    else if (marking.step === 'end' && marking.start !== null && idx < marking.start) state = 'dim'
                    return (
                      <StitchTile
                        key={idx}
                        id={stitchId}
                        state={state}
                        onClick={() => handleMarkTap(idx)}
                      />
                    )
                  })}
                </div>
                <p className={s.markHint}>
                  {marking.step === 'start'
                    ? t('wizard.step3MarkStartHint', 'Stitches before your tap stay as a fixed edge.')
                    : t('wizard.step3MarkEndHint', 'Stitches after your tap become the "to last N" edge — set automatically.')}
                </p>
              </>
            ) : hasRepeat && row.segments ? (
              <BuilderSegments segments={row.segments} />
            ) : (
              <div className={s.tilesRow}>
                {flatIds.map((stitchId, idx) => (
                  <StitchTile key={idx} id={stitchId} />
                ))}
                <span className={s.caretSlot} aria-hidden>
                  <span className={s.caret} />
                </span>
              </div>
            )}

            {!marking && (
              <div className={s.toolbarRow}>
                <RowToolbar
                  onMarkRepeat={startMarking}
                  onBackspace={undoLast}
                  onDelete={() => setRow((r) => ({ ...r, stitches: [] }))}
                  repeatActive={hasRepeat}
                  disabledRepeat={stsCount === 0}
                  disabledBackspace={stsCount === 0}
                />
              </div>
            )}
          </div>
        </Section>

        {/* Written notation */}
        {stsCount > 0 && (
          <Section
            label={t('libraryCreate.notationLabel', 'Written as')}
            hint={t('libraryCreate.notationHint', 'auto · editable')}
          >
            <div className={s.notationCard}>
              {hasRepeat && row.segments ? (
                <RowNotation segments={row.segments} />
              ) : (
                <span className={s.notationText}>{notation}</span>
              )}
            </div>
            <p className={s.notationFoot}>
              {t('libraryCreate.notationFootnote', 'We write it for you. Tap a stitch above to edit.')}
            </p>
          </Section>
        )}

        <p className={s.signoff}>{t('libraryCreate.signoffRow', '✻ one row, endlessly reusable ✻')}</p>
      </div>

      {!marking && (
        <StitchPickerDock
          craft={craft}
          recents={recents}
          target={t('libraryCreate.dockTargetRow', 'this row')}
          onPick={(stitch: StitchDef) => addStitch(stitch.id)}
          onOpenPicker={() => setPickerOpen(true)}
        />
      )}

      <StitchPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(stitch) => addStitch(stitch.id)}
        onDefineCustom={() => navigate('/library/new/custom-stitch')}
        defaultCraftFilter={craft}
      />
    </div>
  )
}

// ── Render existing segments inline (chart-style, non-tappable) ──
function BuilderSegments({ segments }: { segments: RowSegment[] }) {
  return <RepeatRowBody segments={segments} />
}
