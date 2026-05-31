import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../theme/ThemeContext'
import { useSettingsStore } from '../store/settingsStore'
import { formatNeedleSize } from '../tokens/needleSizes'
import YarnThumb from './YarnThumb'
import type { Project } from '../types'

type Props = {
  project: Project
  onPress?: () => void
}

export default function ProjectCard({ project, onPress }: Props) {
  const { t } = useTranslation()
  const { colors, fonts } = useTheme()
  const needleUnit = useSettingsStore((s) => s.needleSizeUnit)
  const done    = project.status === 'finished'
  const parts   = project.parts
  const needleStr = project.needleSize
    ? [formatNeedleSize(project.craft, project.needleSize, needleUnit), project.needleType]
        .filter(Boolean).join(' ')
    : ''
  const sub     = [project.yarnWeight, needleStr]
    .filter((s) => s && s.length > 0)
    .join(' · ')

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.rule,
          opacity: done ? 0.7 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.thumbBox, { backgroundColor: colors.cream2 }]}>
        <YarnThumb color={project.yarnColor || colors.brick} size={56}/>
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text
            style={{ flex: 1, fontFamily: fonts.bodyBd, fontSize: 17, color: colors.ink, letterSpacing: -0.2 }}
            numberOfLines={1}
          >
            {project.name}
          </Text>
          {done ? (
            <View style={[styles.doneBadge, { borderColor: colors.forest }]}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.forest, letterSpacing: 0.4 }}>
                {t('projectCard.doneTag')}
              </Text>
            </View>
          ) : null}
        </View>

        {sub ? (
          <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.inkMute, marginTop: 2 }} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}

        <View style={styles.partsRow}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute, letterSpacing: 0.85, textTransform: 'uppercase', marginRight: 2 }}>
            {t('projectCard.parts', { count: parts.length })}
          </Text>
          {parts.map((part) => (
            <View key={part.id} style={[styles.partPill, { backgroundColor: colors.cream2 }]}>
              <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft }} numberOfLines={1}>
                {part.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, borderWidth: 1 },
  thumbBox:  { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info:      { flex: 1, minWidth: 0 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  partsRow:  { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  partPill:  { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
})
