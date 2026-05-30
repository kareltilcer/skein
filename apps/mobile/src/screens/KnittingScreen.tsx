import React, { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'

import { useRouter } from 'expo-router'
import { useTheme } from '../theme/ThemeContext'
import { useProjectStore, totalRows, completedRows } from '../store/projectStore'
import { useSettingsStore } from '../store/settingsStore'
import { STITCH_MAP } from '../tokens/stitches'
import Screen from '../components/ui/Screen'
import IconBtn from '../components/ui/IconBtn'
import ProgressBar from '../components/ui/ProgressBar'
import HoldButton from '../components/HoldButton'
import StitchGlyph from '../components/StitchGlyph'
import Icon from '../components/ui/Icon'
import type { StitchInstance } from '../types'

type Props = { projectId: string }

function StitchChipBig({ stitchId, color }: { stitchId: string; color: string }) {
  const { fonts } = useTheme()
  const def = STITCH_MAP[stitchId]
  if (!def) return null
  return (
    <View style={[styles.bigChip, { backgroundColor: color, borderRadius: 18, shadowColor: color }]}>
      <StitchGlyph symbol={def.symbol} color="#FBF6EC" size={38} strokeWidth={2.6}/>
      <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: '#FBF6EC', fontWeight: '700', letterSpacing: 0.3 }}>
        {def.abbr}
      </Text>
    </View>
  )
}

function groupRuns(stitches: StitchInstance[]): { stitchId: string; count: number }[] {
  const out: { stitchId: string; count: number }[] = []
  for (const si of stitches) {
    const last = out[out.length - 1]
    if (last && last.stitchId === si.stitchId) {
      last.count += si.count
    } else {
      out.push({ stitchId: si.stitchId, count: si.count })
    }
  }
  return out
}

export default function KnittingScreen({ projectId }: Props) {
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  const router = useRouter()
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const advanceRow = useProjectStore((s) => s.advanceRow)
  const retreatRow = useProjectStore((s) => s.retreatRow)
  const holdTimeMs = useSettingsStore((s) => s.holdTimeMs)

  if (!project) {
    return (
      <Screen>
        <Text style={{ color: colors.inkMute, textAlign: 'center', marginTop: 40 }}>Project not found.</Text>
      </Screen>
    )
  }

  const part     = project.parts[project.currentPartIndex]
  const seq      = part?.sequences[project.currentSequenceIndex]
  const row      = seq?.rows[project.currentRowIndex]
  const total    = totalRows(project)
  const done     = completedRows(project)
  const pct      = total > 0 ? done / total : 0

  const stitchInstances = row?.stitches ?? []
  const totalSts = useMemo(
    () => stitchInstances.reduce((a, s) => a + s.count, 0),
    [stitchInstances],
  )
  const notation = useMemo(() => {
    const runs = groupRuns(stitchInstances)
    return runs.map((r) => {
      const def = STITCH_MAP[r.stitchId]
      const label = def && def.abbr !== '—' ? def.abbr : r.stitchId
      return r.count > 1 ? `${label}${r.count}` : label
    }).join(', ')
  }, [stitchInstances])

  const colorFor = (id: string) => {
    if (['k', 'sl', 'kfb', 'm1', 'c4f', 'c4b', 'sc', 'hdc'].includes(id)) return colors.brick
    if (['p', 'p2tog', 'mb', 'dc', 'ch', 'slst'].includes(id)) return colors.mustard
    return colors.forest
  }

  return (
    <Screen>
      {/* compact top bar */}
      <View style={styles.topBar}>
        <IconBtn name="back" onPress={() => router.back()}/>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 1.8, textTransform: 'uppercase' }}>
            {project.name}{part ? ` · ${part.name}` : ''}
          </Text>
        </View>
        <IconBtn name="more"/>
      </View>

      {/* sequence + repeat indicator */}
      {seq && (
        <View style={[styles.seqCard, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.lg, marginHorizontal: spacing[5], marginTop: 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 1.6, textTransform: 'uppercase' }}>
              Sequence {project.currentSequenceIndex + 1} of {part?.sequences.length ?? 1}
            </Text>
            <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.base, color: colors.ink, marginTop: 2 }}>
              {seq.name}
            </Text>
          </View>
          <View style={[styles.repeatBadge, { backgroundColor: colors.mustard, borderRadius: radius.full }]}>
            <Icon name="repeat" size={14} color={colors.ink}/>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.ink, fontWeight: '700', letterSpacing: 0.5 }}>
              {project.currentRepeat}/{seq.totalRepeats}
            </Text>
          </View>
        </View>
      )}

      {/* row counter */}
      <View style={[styles.counterRow, { marginHorizontal: spacing[5], marginTop: 14 }]}>
        <View style={styles.counterLeft}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, letterSpacing: 1.6, textTransform: 'uppercase' }}>Row</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 56, color: colors.brick, lineHeight: 60, letterSpacing: -2 }}>
            {project.currentRowIndex + 1}
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.inkSoft, lineHeight: 28 }}>
            {' '}/ {seq?.rows.length ?? 1}
          </Text>
        </View>
        <View style={styles.counterRight}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {Math.round(pct * 100)}%
          </Text>
          <View style={{ width: 100, marginTop: 6 }}>
            <ProgressBar progress={pct}/>
          </View>
        </View>
      </View>

      {/* stitch hero card */}
      <View style={[styles.heroCard, {
        backgroundColor: colors.card,
        borderColor: colors.rule,
        borderRadius: 22,
        marginHorizontal: spacing[4],
        marginTop: 4,
        flex: 1,
      }]}>
        <View style={styles.heroHeader}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 1.6, textTransform: 'uppercase' }}>
            This row · {totalSts} sts
          </Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute }}>read →</Text>
        </View>

        <ScrollView contentContainerStyle={styles.chipFlow}>
          {stitchInstances.flatMap((si, i) =>
            Array.from({ length: si.count }, (_, j) => (
              <StitchChipBig key={`${i}-${j}`} stitchId={si.stitchId} color={colorFor(si.stitchId)}/>
            )),
          )}
          {totalSts === 0 && (
            <Text style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.inkMute, textAlign: 'center', padding: 20 }}>
              No stitches defined for this row.
            </Text>
          )}
        </ScrollView>

        {notation ? (
          <View style={[styles.notation, { backgroundColor: colors.cream2, borderRadius: radius.md }]}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.inkSoft, textAlign: 'center', letterSpacing: 0.3 }}>
              {notation}
            </Text>
          </View>
        ) : null}
      </View>

      {/* hold buttons */}
      <View style={[styles.controls, { paddingTop: 14, paddingBottom: spacing[8], paddingHorizontal: spacing[4] }]}>
        <View style={styles.holdRow}>
          <HoldButton
            variant="ghost"
            width={64}
            height={84}
            color={colors.brick}
            ringColor={colors.mustard}
            holdMs={holdTimeMs}
            icon={<Icon name="chevL" size={28} color={colors.brick} stroke={2.4}/>}
            onComplete={() => retreatRow(project.id)}
          />
          <View style={{ flex: 1 }}>
            <HoldButton
              label="Row done"
              sub={`hold ${(holdTimeMs / 1000).toFixed(1)} sec`}
              holdMs={holdTimeMs}
              color={colors.brick}
              ringColor={colors.mustard}
              height={84}
              onComplete={() => advanceRow(project.id)}
            />
          </View>
        </View>
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 1.2, marginTop: 10, textAlign: 'center' }}>
          press {'&'} hold so your cat can't ruin everything
        </Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  seqCard:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
  repeatBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  counterRow:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  counterLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  counterRight:{ alignItems: 'flex-end', gap: 6 },
  heroCard:    { borderWidth: 1.5, paddingTop: 18, paddingHorizontal: 14, paddingBottom: 16 },
  heroHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  chipFlow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  notation:    { padding: 10, marginTop: 12 },
  bigChip:     {
    width: 76, height: 96, alignItems: 'center', justifyContent: 'center', gap: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.27,
    shadowRadius: 10,
    elevation: 3,
  },
  controls:    { gap: 0, alignItems: 'center' },
  holdRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
})
