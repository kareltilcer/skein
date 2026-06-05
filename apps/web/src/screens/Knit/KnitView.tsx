import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useProjectStore,
  useSettingsStore,
  getColors,
  totalRows,
  completedRows,
  stitchHue,
  groupRuns,
  expandStitches,
  type Sequence,
} from '@skein/shared'
import IconBtn from '../../components/ui/IconBtn'
import Icon from '../../components/ui/Icon'
import HoldBtn from '../../components/ui/HoldBtn'
import Modal from '../../components/ui/Modal'
import PartmenuPopover from '../../components/ui/PartmenuPopover'
import RepeatRowBody from '../../components/ui/RepeatRowBody'
import StitchTile from '../../components/ui/StitchTile'
import StitchGlyph from '../../components/ui/StitchGlyph'
import { useStitchMap } from '../../hooks/useStitchMap'
import { useTheme } from '../../theme/ThemeProvider'
import s from './KnitView.module.css'

const PART_COLORS = ['var(--color-brick)', 'var(--color-mustard)', 'var(--color-forest)']

export default function KnitView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const project = useProjectStore((st) => st.projects.find((p) => p.id === id))
  const advanceRow = useProjectStore((st) => st.advanceRow)
  const retreatRow = useProjectStore((st) => st.retreatRow)
  const jumpTo = useProjectStore((st) => st.jumpTo)
  const updateProject = useProjectStore((st) => st.updateProject)
  const holdTime = useSettingsStore((st) => st.holdTimeMs)
  const { theme } = useTheme()
  const colors = React.useMemo(() => getColors(theme), [theme])
  const stitchMap = useStitchMap()

  const menuTriggerRef = React.useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [partPickerOpen, setPartPickerOpen] = React.useState(false)

  React.useEffect(() => {
    if (!project) return
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); advanceRow(project!.id) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); retreatRow(project!.id) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [project, advanceRow, retreatRow])

  if (!project) {
    return (
      <div className={s.main} style={{ padding: 40 }}>
        <IconBtn name="back" onClick={() => navigate('/')} aria-label={t('action.back', 'Back')} />
        <p style={{ marginTop: 40, textAlign: 'center', color: 'var(--color-inkMute)' }}>
          {t('knitting.notFound', 'Project not found.')}
        </p>
      </div>
    )
  }

  const part = project.parts[project.currentPartIndex]
  const seq = part?.sequences[project.currentSequenceIndex] as Sequence | undefined
  const row = seq?.rows[project.currentRowIndex]
  const total = totalRows(project)
  const done = completedRows(project)
  const pct = total > 0 ? done / total : 0

  const stitchInstances = row?.stitches ?? []
  const totalSts = stitchInstances.reduce((a, x) => a + x.count, 0)
  const notation = groupRuns(stitchInstances).map((r) => {
    const def = stitchMap[r.id]
    const label = def && def.abbr !== '—' ? def.abbr : r.id
    return r.count > 1 ? `${label}${r.count}` : label
  }).join(', ')

  function markFinished() {
    updateProject(project!.id, { status: project!.status === 'finished' ? 'active' : 'finished' })
    setMenuOpen(false)
  }

  function switchPart(targetPartIdx: number) {
    jumpTo(project!.id, targetPartIdx, 0, 0, 1)
    setPartPickerOpen(false)
    setMenuOpen(false)
  }

  return (
    <div className={s.shell}>
      <div className={s.main}>
        <header className={s.topBar}>
          <IconBtn name="back" onClick={() => navigate('/')} aria-label={t('action.back', 'Back')} />
          <div className={s.topMeta}>
            <h1 className={s.projectName}>{project.name}</h1>
            {part && (
              <span className={s.partCaption}>
                {part.name} · {project.status === 'finished' ? t('knitting.finished', 'finished') : t('knitting.inProgress', 'in progress')}
              </span>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              ref={menuTriggerRef}
              type="button"
              className={s.menuBtn}
              onClick={() => setMenuOpen((x) => !x)}
              aria-label={t('action.menu', 'Menu')}
            >
              <Icon name="more" size={18} />
            </button>
            <PartmenuPopover
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              anchorRef={menuTriggerRef}
              minWidth={220}
              items={[
                {
                  key: 'edit',
                  icon: 'edit',
                  label: t('knitting.menu.editProject', 'Edit project'),
                  // Edit-project flow lands in a follow-up; the button is here so the menu structure matches design.
                  onSelect: () => undefined,
                },
                {
                  key: 'finish',
                  icon: project.status === 'finished' ? 'undo' : 'flag',
                  label: project.status === 'finished'
                    ? t('knitting.menu.markActive', 'Move back to needles')
                    : t('knitting.menu.markFinished', 'Mark as finished'),
                  onSelect: markFinished,
                  accent: project.status !== 'finished',
                },
                ...(project.parts.length > 1 ? [{
                  key: 'switch' as const,
                  icon: 'layers' as const,
                  label: t('knitting.menu.switchPart', 'Switch part'),
                  onSelect: () => setPartPickerOpen(true),
                  divider: true,
                }] : []),
              ]}
            />
          </div>
        </header>

        {seq && (
          <div className={s.seqCard}>
            <div>
              <div className={s.eyebrow}>
                {t('knitting.sequenceOf', { current: project.currentSequenceIndex + 1, total: part?.sequences.length ?? 1, defaultValue: `Sequence ${project.currentSequenceIndex + 1} of ${part?.sequences.length ?? 1}` })}
              </div>
              <div className={s.seqCardName}>{seq.name}</div>
            </div>
            <div className={s.repeatBadge}>
              <Icon name="repeat" size={14} />
              <span>{t('knitting.repeatLabel', 'Repeat')} {project.currentRepeat}/{seq.totalRepeats}</span>
            </div>
          </div>
        )}

        <div className={s.counterRow}>
          <div className={s.counterLeft}>
            <div>
              <div className={s.eyebrow}>{t('knitting.rowLabel', 'Row')}</div>
              <span className={s.counterNum}>{project.currentRowIndex + 1}</span>
            </div>
            <span className={s.counterTotal}>/ {seq?.rows.length ?? 1}</span>
          </div>
          <div className={s.counterRight}>
            <div className={s.pctLabel}>{Math.round(pct * 100)}%</div>
            <div className={s.progress}><div className={s.progressFill} style={{ width: `${pct * 100}%` }} /></div>
          </div>
        </div>

        <div className={s.hero}>
          <div className={s.heroHead}>
            <span>{t('knitting.thisRow', { count: totalSts, defaultValue: `This row · ${totalSts} sts` })}</span>
            <span>{t('knitting.readArrow', 'read →')}</span>
          </div>

          {row?.segments ? (
            <div className={s.heroSegments}>
              <RepeatRowBody segments={row.segments} />
            </div>
          ) : (
            <div className={s.chipFlow}>
              {stitchInstances.length === 0 && (
                <div className={s.emptyRow}>{t('knitting.emptyRow', 'This row has no stitches yet.')}</div>
              )}
              {stitchInstances.flatMap((si, i) =>
                Array.from({ length: si.count }, (_, j) => {
                  const def = stitchMap[si.stitchId]
                  if (!def) return null
                  const tile = stitchHue(colors, si.stitchId)
                  return (
                    <div key={`${i}-${j}`} className={s.bigChip} style={{ background: tile }}>
                      <StitchGlyph symbol={def.symbol} color="#FBF6EC" size={42} strokeWidth={2.6} />
                      <span>{def.abbr}</span>
                    </div>
                  )
                }),
              )}
            </div>
          )}

          {notation && !row?.segments && <div className={s.notation}>{notation}</div>}
        </div>

        <div className={s.controls}>
          <div className={s.backHold}>
            <HoldBtn
              icon="chevL"
              holdMs={holdTime}
              variant="ghost"
              onComplete={() => retreatRow(project.id)}
            />
          </div>
          <div className={s.holdWrap}>
            <HoldBtn
              label={t('knitting.rowDone', 'Row done')}
              sub={t('knitting.holdSeconds', { seconds: (holdTime / 1000).toFixed(1), defaultValue: `Hold ${(holdTime / 1000).toFixed(1)}s` })}
              holdMs={holdTime}
              onComplete={() => advanceRow(project.id)}
            />
          </div>
        </div>
        <p className={s.holdHint}>
          {t('knitting.holdHint', "Press & hold so your cat can't ruin everything · or tap Space / ←")}
        </p>
      </div>

      <aside className={s.rail}>
        <div className={s.railHead}>
          <span className={s.railTitle}>{t('knitting.pattern', 'Full pattern')}</span>
          <span className={s.railSubCount}>
            {t('knitting.seqCount', { count: project.parts.reduce<number>((a, p) => a + p.sequences.length, 0), defaultValue: `${project.parts.reduce<number>((a, p) => a + p.sequences.length, 0)} sequences` })}
          </span>
        </div>
        <p className={s.railSub}>{t('knitting.railSub', "The whole part, top to bottom. Your spot is marked.")}</p>

        {project.parts.map((p, pIdx) => (
          <div key={p.id} className={s.partGroup}>
            <div className={s.partHead}>
              <span className={s.partDot} style={{ background: p.color || PART_COLORS[pIdx % PART_COLORS.length] }} />
              <span className={s.partName}>{p.name}</span>
            </div>
            {p.sequences.map((sq, sIdx) => {
              const isActiveSeq = pIdx === project.currentPartIndex && sIdx === project.currentSequenceIndex
              return (
                <div key={sq.id} className={s.seqGroup}>
                  <div className={s.seqHead}>
                    <span className={s.seqIdx}>S{sIdx + 1}</span>
                    <span className={s.seqName}>{sq.name}</span>
                    {sq.totalRepeats > 1 && (
                      <span className={s.repeatPill}>
                        <Icon name="repeat" size={10} />
                        {isActiveSeq ? `${project.currentRepeat}/${sq.totalRepeats}` : `×${sq.totalRepeats}`}
                      </span>
                    )}
                  </div>
                  {sq.rows.map((rw, rIdx) => {
                    const isActive = isActiveSeq && rIdx === project.currentRowIndex
                    const isDone =
                      (pIdx < project.currentPartIndex)
                      || (pIdx === project.currentPartIndex && sIdx < project.currentSequenceIndex)
                      || (isActiveSeq && rIdx < project.currentRowIndex)
                    const ids = expandStitches(rw.stitches).slice(0, 12)
                    return (
                      <button
                        key={rw.id}
                        type="button"
                        className={[s.railRow, isActive ? s.railRowActive : '', isDone ? s.railRowDone : ''].filter(Boolean).join(' ')}
                        onClick={() => jumpTo(project.id, pIdx, sIdx, rIdx, project.currentRepeat)}
                      >
                        <div className={s.railRowHead}>
                          {isDone
                            ? <Icon name="check" size={13} />
                            : <span className={[s.railRowDot, isActive ? s.railRowDotActive : ''].filter(Boolean).join(' ')} />}
                          <span className={s.railRowLabel}>{rw.label || `Row ${rIdx + 1}`}</span>
                          <span className={s.railRowSts}>· {rw.stitches.reduce((a, st) => a + st.count, 0)} sts</span>
                        </div>
                        <div className={s.railRowStrip}>
                          {ids.map((id, i) => <StitchTile key={i} id={id} size={17} />)}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}

        {/* "Edit this pattern" placeholder — full edit flow lands in a follow-up. */}
      </aside>

      <Modal
        open={partPickerOpen}
        onClose={() => setPartPickerOpen(false)}
        title={t('knitting.menu.switchPart', 'Switch part')}
        width={480}
      >
        <div className={s.partPickerList}>
          {project.parts.map((p, idx) => {
            const active = idx === project.currentPartIndex
            return (
              <button
                key={p.id}
                type="button"
                className={[s.partPickerRow, active ? s.partPickerRowActive : ''].filter(Boolean).join(' ')}
                onClick={() => switchPart(idx)}
              >
                <span className={s.partPickerTile} style={{ background: p.color || PART_COLORS[idx % PART_COLORS.length] }}>{idx + 1}</span>
                <span className={s.partPickerName}>{p.name}</span>
                <span className={s.partPickerMeta}>
                  {t('knitting.partSeqCount', { count: p.sequences.length, defaultValue: `${p.sequences.length} sequences` })}
                </span>
                {active && <Icon name="check" size={16} />}
              </button>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
