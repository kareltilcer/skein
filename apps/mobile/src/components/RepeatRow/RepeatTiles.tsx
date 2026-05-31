import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../theme/ThemeContext'
import StitchGlyph from '../StitchGlyph'
import Icon from '../ui/Icon'
import { stitchHue } from './stitchHue'
import type { RepeatRule, RowSegment, StitchInstance, StitchDef } from '../../types'
import { expandStitches } from './segments'
import { useStitchMap } from '../../hooks/useStitchMap'

export type TileState = 'normal' | 'dim' | 'inrepeat' | 'start' | 'end' | 'tap'

const TILE_W = 28
const TILE_H = 40

export function StitchTile({
  id, state = 'normal', onPress,
}: {
  id: string
  state?: TileState
  onPress?: () => void
}) {
  const { t } = useTranslation()
  const { theme, colors, fonts } = useTheme()
  const stitchMap = useStitchMap()
  const dark = theme === 'dark'
  const def = stitchMap[id]
  const symbol = def?.symbol ?? 'dot'
  const abbr   = def?.abbr   ?? id
  const c = stitchHue(colors, id)
  const anchor = state === 'start' || state === 'end'
  const inRep  = state === 'inrepeat' || anchor

  const body = (
    <View style={{ position: 'relative', flexShrink: 0 }}>
      {anchor && (
        <View style={{
          position: 'absolute', top: -15, left: '50%', marginLeft: -18,
          backgroundColor: colors.brick, borderRadius: 5,
          paddingHorizontal: 5, paddingVertical: 1, zIndex: 2,
          shadowColor: colors.brick,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.4,
          shadowRadius: 7,
          elevation: 3,
          alignItems: 'center', justifyContent: 'center', minWidth: 36,
        }}>
          <Text style={{
            fontFamily: fonts.mono, fontSize: 7.5, fontWeight: '700',
            color: '#FBF6EC', letterSpacing: 1, lineHeight: 9,
          }}>
            {state === 'start' ? t('wizard.step3RowAnchorStart') : t('wizard.step3RowAnchorEnd')}
          </Text>
        </View>
      )}
      <View style={{
        width: TILE_W, height: TILE_H, borderRadius: 7,
        backgroundColor: inRep
          ? (dark ? 'rgba(255,122,77,0.16)' : 'rgba(156,61,46,0.09)')
          : colors.cream2,
        borderWidth: anchor ? 2 : inRep ? 1.5 : 1.2,
        borderColor: anchor || inRep ? colors.brick : c,
        opacity: state === 'dim' ? 0.34 : 1,
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 2,
        ...(state === 'tap' ? {
          shadowColor: dark ? 'rgba(255,194,95,0.4)' : 'rgba(212,146,59,0.4)',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 3,
          elevation: 2,
        } : {}),
      }}>
        <StitchGlyph symbol={symbol} color={c} size={Math.round(TILE_H * 0.34)} strokeWidth={1.9}/>
        <Text style={{
          fontFamily: fonts.mono, fontSize: 8, color: c, fontWeight: '700',
          lineHeight: 9, letterSpacing: -0.2, marginTop: 1,
        }}>{abbr}</Text>
      </View>
    </View>
  )

  if (onPress) {
    return <Pressable onPress={onPress} hitSlop={3}>{body}</Pressable>
  }
  return body
}

export function RepeatBracket({ side }: { side: 'open' | 'close' }) {
  const { colors } = useTheme()
  const edge = { borderColor: colors.brick }
  return (
    <View style={{
      width: 8, height: TILE_H + 4, flexShrink: 0,
      borderTopWidth: 2.5, borderBottomWidth: 2.5,
      borderLeftWidth: side === 'open' ? 2.5 : 0,
      borderRightWidth: side === 'close' ? 2.5 : 0,
      borderTopLeftRadius:     side === 'open'  ? 5 : 0,
      borderBottomLeftRadius:  side === 'open'  ? 5 : 0,
      borderTopRightRadius:    side === 'close' ? 5 : 0,
      borderBottomRightRadius: side === 'close' ? 5 : 0,
      ...edge,
    }}/>
  )
}

export function useRuleText() {
  const { t } = useTranslation()
  return {
    badge(rule: RepeatRule | undefined): string {
      if (!rule || rule.kind === 'toEnd') return t('wizard.step3RepeatBadgeToEnd')
      return t('wizard.step3RepeatBadgeToLast', { n: rule.n })
    },
    long(rule: RepeatRule | undefined): string {
      if (!rule || rule.kind === 'toEnd') return t('wizard.step3RepeatRuleToEnd')
      return t('wizard.step3RepeatRuleToLast', { count: rule.n, n: rule.n })
    },
  }
}

export function collapseRunsToText(
  stitches: StitchInstance[],
  stitchMap: Record<string, StitchDef>,
): string {
  return stitches
    .map(inst => {
      const def = stitchMap[inst.stitchId]
      const ab = def?.abbr ?? inst.stitchId
      return inst.count > 1 ? `${ab}${inst.count}` : ab
    })
    .join(', ')
}

export function RepeatGroup({ stitches, rule }: { stitches: StitchInstance[]; rule: RepeatRule }) {
  const { theme, colors, fonts } = useTheme()
  const dark = theme === 'dark'
  const ruleText = useRuleText()
  const ids = expandStitches(stitches)

  return (
    <View style={{ alignItems: 'center', flexShrink: 0 }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: dark ? 'rgba(255,122,77,0.07)' : 'rgba(156,61,46,0.05)',
        borderRadius: 9, paddingHorizontal: 4, paddingVertical: 2,
      }}>
        <RepeatBracket side="open"/>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {ids.map((id, i) => <StitchTile key={i} id={id} state="inrepeat"/>)}
        </View>
        <RepeatBracket side="close"/>
      </View>
      <View style={{
        marginTop: 5,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999,
        backgroundColor: dark ? 'rgba(255,122,77,0.16)' : '#FBEFEA',
        borderWidth: 1,
        borderColor: dark ? 'rgba(255,122,77,0.3)' : 'rgba(156,61,46,0.2)',
      }}>
        <Icon name="repeat" size={11} color={colors.brick} stroke={2}/>
        <Text style={{
          fontFamily: fonts.mono, fontSize: 9.5, fontWeight: '700',
          color: colors.brick, letterSpacing: 0.2,
        }}>{ruleText.badge(rule)}</Text>
      </View>
    </View>
  )
}

export function RowNotation({ segments }: { segments: RowSegment[] }) {
  const { colors, fonts } = useTheme()
  const ruleText = useRuleText()
  const stitchMap = useStitchMap()
  const parts: React.ReactNode[] = []
  segments.forEach((seg, i) => {
    if (i > 0) parts.push(<Text key={`sep${i}`} style={{ color: colors.inkMute }}>, </Text>)
    if (seg.type === 'fixed') {
      parts.push(<Text key={`f${i}`}>{collapseRunsToText(seg.stitches, stitchMap)}</Text>)
    } else {
      parts.push(
        <Text key={`r${i}`}>
          <Text style={{ color: colors.brick, fontWeight: '700' }}>(</Text>
          {collapseRunsToText(seg.stitches, stitchMap)}
          <Text style={{ color: colors.brick, fontWeight: '700' }}>)</Text>
          <Text style={{ color: colors.brick, fontWeight: '700' }}> {ruleText.long(seg.rule)}</Text>
        </Text>,
      )
    }
  })
  return (
    <Text style={{
      fontFamily: fonts.mono, fontSize: 11.5, color: colors.inkSoft,
      lineHeight: 17, letterSpacing: -0.1,
    }}>{parts}</Text>
  )
}
