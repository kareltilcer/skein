import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../theme/ThemeContext'
import ProgressBar from './ui/ProgressBar'
import YarnThumb from './YarnThumb'
import { totalRows, completedRows } from '../store/projectStore'
import type { Project } from '../types'

type Props = {
  project: Project
  onPress?: () => void
}

export default function ProjectCard({ project, onPress }: Props) {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, radius, spacing } = useTheme()
  const total    = totalRows(project)
  const done     = completedRows(project)
  const pct      = total > 0 ? done / total : 0
  const seq      = project.parts[project.currentPartIndex]?.sequences[project.currentSequenceIndex]

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.rule,
          borderRadius: radius.lg,
          padding: spacing[4],
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.md, color: colors.ink, letterSpacing: -0.2 }} numberOfLines={1}>
            {project.name}
          </Text>
          {seq ? (
            <Text style={{ fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.inkMute, marginTop: 2 }}>
              {seq.name}
            </Text>
          ) : null}
        </View>
        <YarnThumb color={project.yarnColor || colors.brick} size={44}/>
      </View>

      <View style={[styles.counters, { marginTop: spacing[3] }]}>
        <Text style={{ fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.inkSoft }}>
          {total > 0
            ? t('projectCard.rowOf', { current: done + 1, total })
            : t('projectCard.rowOfUnknown', { current: done + 1 })}
        </Text>
        {seq && seq.totalRepeats > 1 ? (
          <View style={[styles.repeatBadge, { backgroundColor: colors.brick }]}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: '#FBF6EC' }}>
              ×{project.currentRepeat}/{seq.totalRepeats}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: spacing[2] }}>
        <ProgressBar progress={pct}/>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card:        { borderWidth: 1 },
  row:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  info:        { flex: 1, paddingRight: 12 },
  counters:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  repeatBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
})
