import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useProjectStore,
  useSettingsStore,
  useLibraryStore,
  uuid,
  sizesFor,
  formatNeedleSize,
  YARN_WEIGHTS,
  YARN_COLORS,
  PART_COLORS,
  PROJECT_NAME_MAX,
  KNIT_NEEDLE_TYPES,
  validateProjectName,
  STATE_TO_COLOR_TOKEN,
  type Craft,
  type Project,
  type Part,
  type Sequence,
  type Row,
  type StitchInstance,
  type RowSegment,
  type LibrarySequence,
} from '@skein/shared'
import PageHeader from '../../components/ui/PageHeader'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import FieldLabel from '../../components/ui/FieldLabel'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import Tip from '../../components/ui/Tip'
import Step3 from './Step3'
import s from './SetupWizard.module.css'


// Default fallback copy when an i18n key is missing.
function defaultNameMsg(state: ReturnType<typeof validateProjectName>): string {
  switch (state) {
    case 'empty':    return "Give it a name — anything will do."
    case 'ok':       return "Looks good. Future-you will thank you."
    case 'mid':      return "Plenty of room."
    case 'near':     return "Getting close to the limit."
    case 'over':     return "Whoops — too long. Trim a few."
    case 'required': return "This one's required — give your project a name to cast on."
  }
}

type DraftRow = { id: string; label: string; stitches: StitchInstance[]; segments?: RowSegment[]; isMarker?: boolean }
type DraftSequence = { id: string; name: string; rows: DraftRow[]; totalRepeats: number; loop: boolean }
type DraftPart = { id: string; name: string; color: string; notes?: string; sequences: DraftSequence[]; loop?: boolean }
type Draft = {
  name: string
  craft: Craft
  yarnWeight: string
  needleSize: string
  needleType: string
  yarnColor: string
  notes: string
  parts: DraftPart[]
  /** Flips true the first time the user explicitly adds/edits a part — the empty-state hero stops showing. */
  partsCustomized?: boolean
}

function emptyDraft(craft: Craft): Draft {
  const sizes = sizesFor(craft)
  return {
    name: '',
    craft,
    yarnWeight: 'Worsted',
    needleSize: sizes.find((s) => s.mm === '4.5')?.mm ?? sizes[0]?.mm ?? '',
    needleType: 'Straight',
    yarnColor: YARN_COLORS[0]!,
    notes: '',
    parts: [
      { id: uuid(), name: 'Main', color: PART_COLORS[0]!, sequences: [] },
    ],
  }
}

function fromLibrarySeq(libSeq: LibrarySequence): DraftSequence {
  return {
    id: uuid(),
    name: libSeq.name,
    rows: libSeq.rows.map((r) => ({ ...r, id: uuid() })),
    totalRepeats: libSeq.totalRepeats || 1,
    loop: libSeq.loop,
  }
}

function draftToProject(d: Draft): Project {
  const now = new Date().toISOString()
  return {
    id: uuid(),
    name: d.name.trim(),
    craft: d.craft,
    yarnWeight: d.yarnWeight,
    needleSize: d.needleSize,
    needleType: d.needleType,
    yarnColor: d.yarnColor,
    notes: d.notes,
    status: 'active',
    parts: d.parts.map<Part>((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      notes: p.notes,
      loop: p.loop,
      sequences: p.sequences.map<Sequence>((sq) => ({
        id: sq.id,
        name: sq.name,
        rows: sq.rows.map<Row>((r) => ({ ...r })),
        totalRepeats: sq.totalRepeats,
        loop: sq.loop,
      })),
    })),
    currentPartIndex: 0,
    currentSequenceIndex: 0,
    currentRepeat: 1,
    currentRowIndex: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export default function SetupWizard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const defaultCraft = useSettingsStore((st) => st.defaultCraft)
  const needleUnit = useSettingsStore((st) => st.needleSizeUnit)
  const addProject = useProjectStore((st) => st.addProject)
  const libSequences = useLibraryStore((st) => st.sequences)

  const [draft, setDraft] = React.useState<Draft>(() => emptyDraft(defaultCraft))
  const [step, setStep] = React.useState(0)

  const [seqPickerForPart, setSeqPickerForPart] = React.useState<string | null>(null)
  const [requiredError, setRequiredError] = React.useState(false)

  // Part-sheet state for Step 2 (add / edit).
  const [partSheetMode, setPartSheetMode] = React.useState<null | 'add' | { kind: 'edit'; id: string }>(null)
  const [sheetName, setSheetName] = React.useState('')
  const [sheetColor, setSheetColor] = React.useState<string>(PART_COLORS[0]!)
  const [sheetNotes, setSheetNotes] = React.useState('')

  const sizes = sizesFor(draft.craft)
  const nameLen = draft.name.length
  const nameValid = draft.name.trim().length > 0
  const nameState = validateProjectName(nameLen, requiredError, PROJECT_NAME_MAX)
  const nameTokenKey = STATE_TO_COLOR_TOKEN[nameState]
  const nameStateColor = `var(--color-${nameTokenKey})`

  React.useEffect(() => {
    if (requiredError && nameLen > 0) setRequiredError(false)
  }, [requiredError, nameLen])

  function update(patch: Partial<Draft>) { setDraft((d) => ({ ...d, ...patch })) }

  function setPart(partId: string, patch: Partial<DraftPart>) {
    setDraft((d) => ({
      ...d,
      parts: d.parts.map((p) => p.id === partId ? { ...p, ...patch } : p),
    }))
  }

  function reorderPart(fromIdx: number, toIdx: number) {
    setDraft((d) => {
      const next = [...d.parts]
      const [moved] = next.splice(fromIdx, 1)
      if (!moved) return d
      next.splice(toIdx, 0, moved)
      return { ...d, parts: next }
    })
  }

  function addSeqToPart(partId: string, libSeq: LibrarySequence) {
    setPart(partId, {
      sequences: [...(draft.parts.find((p) => p.id === partId)?.sequences ?? []), fromLibrarySeq(libSeq)],
    })
  }
  function updateSeqInPart(partId: string, seqId: string, patch: Partial<DraftSequence>) {
    const part = draft.parts.find((p) => p.id === partId)
    if (!part) return
    setPart(partId, { sequences: part.sequences.map((sq) => sq.id === seqId ? { ...sq, ...patch } : sq) })
  }

  function next() {
    if (step === 0 && !nameValid) {
      setRequiredError(true)
      return
    }
    setStep((s) => Math.min(3, s + 1))
  }

  // ─── Part sheet helpers ───────────────────────────────────────
  function openAddSheet() {
    const used = new Set(draft.parts.map((p) => p.color))
    const nextColor = PART_COLORS.find((c) => !used.has(c)) ?? PART_COLORS[draft.parts.length % PART_COLORS.length]!
    setSheetName('')
    setSheetColor(nextColor)
    setSheetNotes('')
    setPartSheetMode('add')
  }
  function openEditSheet(part: DraftPart) {
    setSheetName(part.name)
    setSheetColor(part.color)
    setSheetNotes(part.notes ?? '')
    setPartSheetMode({ kind: 'edit', id: part.id })
  }
  function closePartSheet() { setPartSheetMode(null) }
  function confirmPartAdd() {
    if (!sheetName.trim()) return
    setDraft((d) => {
      // First explicit add replaces the implicit default "Main" placeholder so
      // the slot number reads 1, not 2 — same behavior as mobile.
      const replacingDefault = !d.partsCustomized && d.parts.length === 1
      const newPart: DraftPart = {
        id: uuid(),
        name: sheetName.trim(),
        color: sheetColor,
        ...(sheetNotes.trim() ? { notes: sheetNotes.trim() } : {}),
        sequences: [],
      }
      return {
        ...d,
        parts: replacingDefault ? [newPart] : [...d.parts, newPart],
        partsCustomized: true,
      }
    })
    closePartSheet()
  }
  function confirmPartEdit() {
    if (partSheetMode === null || partSheetMode === 'add') return
    const id = partSheetMode.id
    setDraft((d) => ({
      ...d,
      parts: d.parts.map((p) => p.id === id
        ? { ...p, name: sheetName.trim() || p.name, color: sheetColor, notes: sheetNotes.trim() || undefined }
        : p,
      ),
      partsCustomized: true,
    }))
    closePartSheet()
  }
  function confirmPartRemove() {
    if (partSheetMode === null || partSheetMode === 'add') return
    if (draft.parts.length <= 1) return
    const id = partSheetMode.id
    setDraft((d) => ({ ...d, parts: d.parts.filter((p) => p.id !== id) }))
    closePartSheet()
  }
  function back() {
    if (step === 0) navigate('/')
    else setStep((s) => Math.max(0, s - 1))
  }
  function finish() {
    const project = draftToProject(draft)
    addProject(project)
    navigate(`/project/${project.id}`)
  }

  const stepLabels = [
    t('wizard.step.basics', 'Basics'),
    t('wizard.step.parts', 'Parts'),
    t('wizard.step.sequences', 'Sequences'),
    t('wizard.step.arrange', 'Arrange'),
  ]
  const stepSubs = [
    t('wizard.step.basicsSub', 'Name, yarn & tool'),
    t('wizard.step.partsSub', 'Break it into pieces'),
    t('wizard.step.sequencesSub', 'Plan the rows'),
    t('wizard.step.arrangeSub', 'Order & repeats'),
  ]

  return (
    <div className={s.shell}>
      <aside className={s.rail}>
        <PageHeader eyebrow={t('wizard.eyebrow', 'Cast on')} title={t('wizard.title', 'New project')} />
        {stepLabels.map((label, i) => {
          const active = i === step
          const done = i < step
          return (
            <button
              key={label}
              type="button"
              className={[s.railItem, active ? s.railActive : '', done ? s.railDone : ''].filter(Boolean).join(' ')}
              onClick={() => (i < step || (i === step + 1 && step === 0 && nameValid)) ? setStep(i) : null}
            >
              <span className={s.railIdx}>
                {done ? <Icon name="check" size={18} /> : i + 1}
              </span>
              <span className={s.railText}>
                <span className={s.railTitle}>{label}</span>
                <span className={s.railSub}>{stepSubs[i]}</span>
              </span>
            </button>
          )
        })}
      </aside>

      <div className={s.body}>
        <div className={s.content}>
          {step === 0 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>{t('wizard.basics.title', 'Tell us about your project')}</h2>

              {/* Name with required-state visual */}
              <div className={s.field}>
                <FieldLabel required={requiredError && !nameValid} hint={`${nameLen}/${PROJECT_NAME_MAX}`}>
                  {t('wizard.basics.name', 'Project name')}
                </FieldLabel>
                <div className={[s.nameWrap, requiredError && !nameValid ? s.nameWrapError : nameValid ? s.nameWrapValid : ''].filter(Boolean).join(' ')}>
                  <input
                    autoFocus
                    className={s.input}
                    style={{ background: 'transparent', border: 0, padding: 0, height: 'auto', width: '100%', fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-ink)' }}
                    value={draft.name}
                    maxLength={PROJECT_NAME_MAX}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder={t('wizard.basics.namePlaceholder', 'e.g. Sunday cardigan')}
                  />
                  {requiredError && !nameValid && (
                    <span className={s.nameBang} aria-hidden>!</span>
                  )}
                </div>
                <div className={s.meterRow}>
                  <div className={s.meterTrack}>
                    <div className={s.meterFill} style={{ width: `${Math.min(100, (nameLen / PROJECT_NAME_MAX) * 100)}%`, background: nameStateColor }} />
                  </div>
                  <span className={s.meterCount} style={{ color: nameStateColor }}>{nameLen} / {PROJECT_NAME_MAX}</span>
                </div>
                <div className={s.meterMsg} style={{ color: nameStateColor }}>
                  {t(`wizard.nameState${nameState[0]!.toUpperCase() + nameState.slice(1)}`, defaultNameMsg(nameState))}
                </div>
              </div>

              {/* Craft */}
              <div className={s.field}>
                <FieldLabel>{t('wizard.basics.craft', 'Craft')}</FieldLabel>
                <div className={s.pillRow}>
                  {(['knit', 'crochet'] as Craft[]).map((c) => (
                    <Chip key={c} active={draft.craft === c} size="lg" icon={c === 'knit' ? 'needle' : 'loop'} onClick={() => update({ craft: c, needleSize: sizesFor(c)[0]?.mm ?? '' })}>
                      {t(`craft.${c}`, c)}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Yarn weight */}
              <div className={s.field}>
                <FieldLabel>{t('wizard.basics.weight', 'Yarn weight')}</FieldLabel>
                <div className={s.pillRow}>
                  {YARN_WEIGHTS.map((w) => (
                    <Chip key={w} active={draft.yarnWeight === w} onClick={() => update({ yarnWeight: w })}>{w}</Chip>
                  ))}
                </div>
              </div>

              {/* Needle / hook card with stepper */}
              <div className={s.field}>
                <FieldLabel hint={draft.craft === 'knit' ? t('wizard.needleSizeSub', 'mm with US equivalent') : t('wizard.hookSizeSub', 'mm')}>
                  {draft.craft === 'knit' ? t('wizard.basics.needle', 'Needle size') : t('wizard.basics.hook', 'Hook size')}
                </FieldLabel>
                <NeedleSizeCard
                  draft={draft}
                  sizes={sizes}
                  needleUnit={needleUnit}
                  onChange={(mm) => update({ needleSize: mm })}
                />
                {draft.craft === 'knit' && (
                  <div className={s.pillRow} style={{ marginTop: 8 }}>
                    {KNIT_NEEDLE_TYPES.map((nt) => (
                      <Chip key={nt} active={draft.needleType === nt} onClick={() => update({ needleType: nt })}>{nt}</Chip>
                    ))}
                  </div>
                )}
              </div>

              {/* Color */}
              <div className={s.field}>
                <FieldLabel>{t('wizard.basics.color', 'Yarn color')}</FieldLabel>
                <div className={s.colorRow}>
                  {YARN_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update({ yarnColor: c })}
                      className={[s.colorDot, draft.yarnColor === c ? s.colorActive : ''].filter(Boolean).join(' ')}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                  <button type="button" className={s.colorDotAdd} aria-label={t('wizard.basics.addColor', 'Add a custom color')}>
                    <Icon name="plus" size={16} />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className={s.field}>
                <FieldLabel>{t('wizard.basics.notes', 'Notes')}</FieldLabel>
                <textarea
                  className={s.input}
                  style={{ minHeight: 80, padding: 14, lineHeight: 1.4 }}
                  value={draft.notes}
                  onChange={(e) => update({ notes: e.target.value })}
                  placeholder={t('wizard.basics.notesPlaceholder', 'Anything you want to remember…')}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>{t('wizard.parts.title', 'Break it into parts')}</h2>

              {!draft.partsCustomized && draft.parts.length === 1 ? (
                <>
                  <div className={s.partsEmpty}>
                    <div className={s.partsEmptyMotif}>
                      <span className={s.motifTileFull} />
                      <span className={s.motifTileDashed}><Icon name="plus" size={12} /></span>
                      <span className={[s.motifTileDashed, s.motifTileFade].join(' ')}><Icon name="plus" size={12} /></span>
                    </div>
                    <h3 className={s.partsEmptyTitle}>
                      {t('wizard.step2EmptyTitle', 'Just the one piece?')}
                    </h3>
                    <p className={s.partsEmptyBody}>
                      {t('wizard.step2EmptyBody', "Scarves, dishcloths, blankets, simple hats — they're a single piece, and YarnLog's happy with that. Add more parts only if your project splits into separate pieces, like sleeves, panels, or a pocket.")}
                    </p>
                    <button type="button" className={s.partsEmptyCta} onClick={openAddSheet}>
                      <Icon name="plus" size={14} />
                      <span>{t('wizard.addPart', 'Add a part')}</span>
                    </button>
                    <span className={s.partsEmptyNote}>
                      {t('wizard.step2DecorativeNote', '✻ one part is a whole project ✻')}
                    </span>
                  </div>
                  <Tip>
                    <b style={{ color: 'var(--color-ink)' }}>{t('common.notSure', 'Not sure?')}</b>{' '}
                    {t('wizard.step2EmptyTipBody', 'Knit a sample first, then come back and split it if you need to. You can add parts at any time.')}
                  </Tip>
                </>
              ) : (
                <>
                  <Tip>{t('wizard.parts.tip', 'A "part" is a sub-piece — e.g. body, sleeve, collar. Tap a row to edit; drag the grip to reorder.')}</Tip>

                  <div className={s.partsList}>
                    {draft.parts.map((p, idx) => (
                      <div
                        key={p.id}
                        className={s.partRow}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(idx)) }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { const from = Number(e.dataTransfer.getData('text/plain')); if (!Number.isNaN(from)) reorderPart(from, idx) }}
                        onClick={() => openEditSheet(p)}
                      >
                        <Icon name="grip" size={18} />
                        <div className={s.partTile} style={{ background: p.color }}>{idx + 1}</div>
                        <div className={s.partBody}>
                          <span className={s.partTitle}>{p.name}</span>
                          <span className={s.partMeta}>
                            {t('wizard.partMeta', { count: p.sequences.length, defaultValue: `${p.sequences.length} sequences` })}
                          </span>
                        </div>
                        <Icon name="edit" size={16} />
                      </div>
                    ))}
                  </div>

                  <Btn icon="plus" variant="ghost" onClick={openAddSheet}>{t('wizard.parts.add', 'Add another part')}</Btn>
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>{t('wizard.seqs.title', 'Plan every sequence')}</h2>
              <Step3
                parts={draft.parts}
                craft={draft.craft}
                onPartsChange={(parts) => setDraft((d) => ({ ...d, parts }))}
              />
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>{t('wizard.arrange.title', 'Arrange the part')}</h2>
              <Tip>{t('wizard.arrange.tip', "Drag sequences to set the knitting order, dial in repeats, and toggle loop if it tubes.")}</Tip>

              {draft.parts.map((p) => {
                const totalRows = p.sequences.reduce((a, sq) => a + sq.rows.length * sq.totalRepeats, 0)
                return (
                  <div key={p.id} className={s.arrangePart}>
                    <div className={s.arrangePartHead}>
                      <span className={s.arrangePartDot} style={{ background: p.color }} />
                      <span className={s.arrangePartName}>{p.name}</span>
                      <span className={s.arrangePartSub}>{t('wizard.arrange.inOrder', '· sequences in order')}</span>
                    </div>

                    {p.sequences.map((sq) => (
                      <div key={sq.id} className={s.arrangeSeqRow}>
                        <Icon name="grip" size={18} />
                        <span className={s.arrangeSeqIdx}>{p.sequences.indexOf(sq) + 1}</span>
                        <div className={s.arrangeSeqBody}>
                          <span className={s.arrangeSeqName}>{sq.name}</span>
                          <span className={s.arrangeSeqMeta}>
                            {t('wizard.arrange.rowsTimes', {
                              rows: sq.rows.length,
                              rep: sq.totalRepeats,
                              total: sq.rows.length * sq.totalRepeats,
                              defaultValue: `${sq.rows.length} rows × ${sq.totalRepeats} = ${sq.rows.length * sq.totalRepeats} total`,
                            })}
                          </span>
                        </div>
                        <div className={s.repeatStepper}>
                          <Icon name="repeat" size={14} />
                          <span className={s.repeatStepperLabel}>{t('wizard.arrange.repeats', 'Repeat ×')}</span>
                          <button type="button" className={s.repeatStepperBtn} onClick={() => updateSeqInPart(p.id, sq.id, { totalRepeats: Math.max(1, sq.totalRepeats - 1) })}>−</button>
                          <span className={s.repeatStepperValue}>{sq.totalRepeats}</span>
                          <button type="button" className={s.repeatStepperBtn} onClick={() => updateSeqInPart(p.id, sq.id, { totalRepeats: sq.totalRepeats + 1 })}>+</button>
                        </div>
                      </div>
                    ))}

                    {/* Loop toggle */}
                    <label className={s.loopRow}>
                      <span className={s.loopIcon}><Icon name="refresh" size={18} /></span>
                      <span className={s.loopBody}>
                        <span className={s.loopTitle}>{t('wizard.arrange.loopPart', 'Loop the whole part')}</span>
                        <span className={s.loopSub}>{t('wizard.arrange.loopSub', 'After the last sequence, cycle back to #1. Great for tubes & socks.')}</span>
                      </span>
                      <span className={[s.toggle, p.loop ? s.toggleOn : ''].filter(Boolean).join(' ')}>
                        <input
                          type="checkbox"
                          checked={!!p.loop}
                          onChange={(e) => setPart(p.id, { loop: e.target.checked })}
                          className={s.toggleInput}
                        />
                        <span className={s.toggleKnob} />
                      </span>
                    </label>

                    {/* Tally banner */}
                    <div className={s.tally}>
                      <span className={s.tallyEyebrow}>{p.name} · {t('wizard.arrange.finalTally', 'final tally')}</span>
                      <div className={s.tallyMain}>
                        <span className={s.tallyNumber}>{totalRows}</span>
                        <span className={s.tallyLabel}>{t('wizard.arrange.rowsTotal', 'rows total')}</span>
                      </div>
                      <span className={s.tallyBreakdown}>
                        {p.sequences.map((sq, i) => (
                          <span key={sq.id}>
                            {i > 0 ? ' · ' : ''}
                            {sq.totalRepeats > 1
                              ? `${sq.rows.length}×${sq.totalRepeats} ${sq.name.toLowerCase()}`
                              : `${sq.rows.length} ${sq.name.toLowerCase()}`}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        <div className={s.foot}>
          <Btn variant="ghost" onClick={back}>{step === 0 ? t('action.cancel', 'Cancel') : t('action.back', 'Back')}</Btn>
          <div className={s.pips}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={[
                  s.pip,
                  i < step ? s.pipDone : '',
                  i === step ? s.pipCurrent : '',
                ].filter(Boolean).join(' ')}
              />
            ))}
          </div>
          {step < 3 ? (
            step === 0 && !nameValid ? (
              <button type="button" className={s.nextBlocked} onClick={next}>
                <span className={s.nextBlockedBang}>!</span>
                <span>{t('wizard.blockedAddName', 'Add a project name first')}</span>
              </button>
            ) : (
              <Btn onClick={next} iconAfter="chevR">
                {t('action.next', 'Next')}: {stepLabels[step + 1]}
              </Btn>
            )
          ) : (
            <Btn onClick={finish} variant="mustard" icon="play">{t('wizard.finish', 'Cast on!')}</Btn>
          )}
        </div>
      </div>

      {/* ─── Part add/edit bottom sheet ─────────────────────────── */}
      {(() => {
        if (partSheetMode === null) return null
        const isEdit = partSheetMode !== 'add'
        const editingId = isEdit ? partSheetMode.id : null
        const editingIdx = editingId ? draft.parts.findIndex((p) => p.id === editingId) : -1
        const editingPart = editingId ? draft.parts.find((p) => p.id === editingId) : undefined
        const slotNumber = isEdit
          ? Math.max(1, editingIdx + 1)
          : (!draft.partsCustomized && draft.parts.length === 1 ? 1 : draft.parts.length + 1)
        return (
          <Modal open onClose={closePartSheet} align="bottom" width={620}>
            <div className={s.sheetHeader}>
              <span className={s.sheetEyebrow}>
                {isEdit
                  ? t('wizard.partSheetEditingSlot', { current: editingIdx + 1, total: draft.parts.length, defaultValue: `Editing part ${editingIdx + 1} of ${draft.parts.length}` })
                  : t('wizard.partSheetNewSlot', { slot: slotNumber, defaultValue: `New part · slot ${slotNumber}` })}
              </span>
              <h3 className={s.sheetTitle}>
                {isEdit
                  ? t('wizard.partSheetEditTitle', { name: editingPart?.name ?? '', defaultValue: 'Edit part' })
                  : t('wizard.partSheetAddTitle', 'Add a part')}
              </h3>
            </div>
            <Modal.Body>
              <div className={s.sheetIdentity}>
                <div className={s.sheetPreview}>
                  <div className={s.sheetPreviewTile} style={{ background: sheetColor }}>{slotNumber}</div>
                  <span className={s.sheetPreviewLabel}>{t('wizard.preview', 'Preview')}</span>
                </div>
            <div style={{ flex: 1 }}>
              <span className={s.sheetFieldLabel}>{t('wizard.partName', 'Part name')}</span>
              <input
                className={s.sheetNameInput}
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder={t('wizard.partNamePlaceholder', 'e.g. Left sleeve')}
                autoFocus
              />
            </div>
          </div>

          <span className={s.sheetFieldLabel} style={{ marginTop: 22 }}>{t('wizard.tileColor', 'Tile color')}</span>
          <div className={s.sheetColorRow}>
            {PART_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSheetColor(c)}
                className={[s.colorDot, sheetColor === c ? s.colorActive : ''].filter(Boolean).join(' ')}
                style={{ background: c, width: 42, height: 42 }}
                aria-label={c}
              />
            ))}
          </div>

          <span className={s.sheetFieldLabel} style={{ marginTop: 22 }}>{t('wizard.notes', 'Notes')}</span>
          <textarea
            className={s.input}
            style={{ minHeight: 64, padding: 14, lineHeight: 1.4 }}
            value={sheetNotes}
            onChange={(e) => setSheetNotes(e.target.value)}
            placeholder={t('wizard.partNotesPlaceholder', 'optional · just for you')}
          />

              {isEdit && draft.parts.length > 1 && (
                <div className={s.sheetDanger}>
                  <button type="button" className={s.sheetRemoveBtn} onClick={confirmPartRemove}>
                    <Icon name="trash" size={16} />
                    <span>{t('wizard.removeThisPart', 'Remove this part')}</span>
                  </button>
                  <span className={s.sheetRemoveNote}>
                    {t('wizard.removeWarning', { count: editingPart?.sequences.length ?? 0, defaultValue: 'Its sequences will stay in your Library.' })}
                  </span>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Btn variant="ghost" onClick={closePartSheet}>{t('common.cancel', 'Cancel')}</Btn>
              <Btn
                icon={isEdit ? 'check' : 'plus'}
                onClick={isEdit ? confirmPartEdit : confirmPartAdd}
                disabled={!sheetName.trim()}
              >
                {isEdit
                  ? t('wizard.saveChanges', 'Save changes')
                  : t('wizard.addPartConfirm', 'Add part')}
              </Btn>
            </Modal.Footer>
          </Modal>
        )
      })()}

      <Modal
        open={!!seqPickerForPart}
        onClose={() => setSeqPickerForPart(null)}
        title={t('wizard.seqs.pickerTitle', 'Pick a sequence')}
        width={620}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {libSequences.filter((sq) => sq.craft === draft.craft).map((sq) => (
            <button
              key={sq.id}
              type="button"
              onClick={() => { if (seqPickerForPart) addSeqToPart(seqPickerForPart, sq); setSeqPickerForPart(null) }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 12,
                background: 'transparent',
                color: 'var(--color-ink)',
                cursor: 'pointer',
                border: '1px solid var(--color-rule)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 600 }}>{sq.name}</span>
              <span style={{ color: 'var(--color-inkSoft)' }}>{sq.rows.length} {t('wizard.seqs.rows', 'rows')}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

// ─── Needle / hook size card with stepper ──────────────────────
type NeedleSizeCardProps = {
  draft: Draft
  sizes: ReturnType<typeof sizesFor>
  needleUnit: 'mm' | 'us'
  onChange: (mm: string) => void
}

function NeedleSizeCard({ draft, sizes, needleUnit, onChange }: NeedleSizeCardProps) {
  const idx = Math.max(0, sizes.findIndex((sz) => sz.mm === draft.needleSize))
  const entry = sizes[idx]
  if (!entry) return null
  const display = formatNeedleSize(draft.craft, entry.mm, needleUnit)
  const typical = (entry as { typical?: string }).typical
  return (
    <div className={s.needleCard}>
      <div className={s.needleIconBox}>
        <Icon name={draft.craft === 'knit' ? 'needle' : 'loop'} size={20} />
      </div>
      <div className={s.needleBody}>
        <span className={s.needleValue}>{display}</span>
        {typical && <span className={s.needleHint}>typical for {typical}</span>}
      </div>
      <div className={s.needleStepper}>
        <button
          type="button"
          className={s.needleStepBtn}
          onClick={() => idx > 0 && onChange(sizes[idx - 1]!.mm)}
          disabled={idx === 0}
          aria-label="Smaller"
        >−</button>
        <button
          type="button"
          className={s.needleStepBtn}
          onClick={() => idx < sizes.length - 1 && onChange(sizes[idx + 1]!.mm)}
          disabled={idx === sizes.length - 1}
          aria-label="Bigger"
        >+</button>
      </div>
    </div>
  )
}
