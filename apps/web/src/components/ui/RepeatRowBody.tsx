import React from 'react'
import { useTranslation } from 'react-i18next'
import { expandStitches, type RowSegment, type RepeatRule, type StitchInstance, type StitchDef } from '@skein/shared'
import { useStitchMap } from '../../hooks/useStitchMap'
import { useTheme } from '../../theme/ThemeProvider'
import Icon from './Icon'
import StitchTile from './StitchTile'
import s from './RepeatRowBody.module.css'

// "(...) to last N sts" → user-facing strings
export function useRuleText() {
  const { t } = useTranslation()
  return React.useMemo(() => ({
    badge(rule: RepeatRule | undefined): string {
      if (!rule || rule.kind === 'toEnd') return t('wizard.step3RepeatBadgeToEnd', 'to end')
      return t('wizard.step3RepeatBadgeToLast', { n: rule.n, defaultValue: `to last ${rule.n}` })
    },
    long(rule: RepeatRule | undefined): string {
      if (!rule || rule.kind === 'toEnd') return t('wizard.step3RepeatRuleToEnd', 'to end of row')
      return t('wizard.step3RepeatRuleToLast', {
        count: rule.n,
        n: rule.n,
        defaultValue: `to last ${rule.n} st${rule.n === 1 ? '' : 's'}`,
      })
    },
  }), [t])
}

function collapseRunsToText(stitches: StitchInstance[], stitchMap: Record<string, StitchDef>): string {
  return stitches
    .map((inst) => {
      const def = stitchMap[inst.stitchId]
      const ab = def?.abbr ?? inst.stitchId
      return inst.count > 1 ? `${ab}${inst.count}` : ab
    })
    .join(', ')
}

// ─── Tall square bracket framing the repeat group ──────────────
export function RepeatBracket({ side }: { side: 'open' | 'close' }) {
  return <span className={[s.bracket, side === 'open' ? s.bracketOpen : s.bracketClose].join(' ')} />
}

// ─── Bracketed group + derived "to last N" badge ───────────────
export function RepeatGroup({
  stitches, rule,
}: {
  stitches: StitchInstance[]
  rule: RepeatRule
}) {
  const { colors } = useTheme()
  const ruleText = useRuleText()
  const ids = expandStitches(stitches)
  return (
    <div className={s.group}>
      <div className={s.groupRow}>
        <RepeatBracket side="open" />
        <div className={s.groupTiles}>
          {ids.map((id, i) => <StitchTile key={i} id={id} state="inrepeat" />)}
        </div>
        <RepeatBracket side="close" />
      </div>
      <div className={s.ruleBadge}>
        <Icon name="repeat" size={11} color={colors.brick} />
        <span style={{ color: colors.brick }}>{ruleText.badge(rule)}</span>
      </div>
    </div>
  )
}

// ─── Written notation: "p2, (k2, p2) to last 2 sts" ────────────
export function RowNotation({ segments }: { segments: RowSegment[] }) {
  const { colors } = useTheme()
  const ruleText = useRuleText()
  const stitchMap = useStitchMap()
  const parts: React.ReactNode[] = []
  segments.forEach((seg, i) => {
    if (i > 0) parts.push(<span key={`sep${i}`} style={{ color: colors.inkMute }}>, </span>)
    if (seg.type === 'fixed') {
      parts.push(<span key={`f${i}`}>{collapseRunsToText(seg.stitches, stitchMap)}</span>)
    } else {
      parts.push(
        <span key={`r${i}`}>
          <span style={{ color: colors.brick, fontWeight: 700 }}>(</span>
          {collapseRunsToText(seg.stitches, stitchMap)}
          <span style={{ color: colors.brick, fontWeight: 700 }}>)</span>
          <span style={{ color: colors.brick, fontWeight: 700 }}> {ruleText.long(seg.rule)}</span>
        </span>,
      )
    }
  })
  return <div className={s.notation}>{parts}</div>
}

// ─── Full body: chart tiles + dashed-rule separator + notation ─
export default function RepeatRowBody({ segments }: { segments: RowSegment[] }) {
  return (
    <div>
      <div className={s.tiles}>
        {segments.map((seg, i) => {
          if (seg.type === 'fixed') {
            const ids = expandStitches(seg.stitches)
            return (
              <div key={i} className={s.fixedGroup}>
                {ids.map((id, j) => <StitchTile key={j} id={id} />)}
              </div>
            )
          }
          return <RepeatGroup key={i} stitches={seg.stitches} rule={seg.rule} />
        })}
      </div>
      <div className={s.sep}>
        <RowNotation segments={segments} />
      </div>
    </div>
  )
}
