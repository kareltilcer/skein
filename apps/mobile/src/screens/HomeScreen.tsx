import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'

import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import Svg, { Circle, Path } from 'react-native-svg'
import { useTheme } from '../theme/ThemeContext'
import { useProjectStore } from '../store/projectStore'
import Screen from '../components/ui/Screen'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import ProjectCard from '../components/ProjectCard'
import type { Project } from '../types'

function SkeinLogoSmall({ fg = '#9C3D2E', accent = '#D4923B', size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Circle cx="28" cy="30" r="18" fill={fg}/>
      <Path d="M14 24 Q 28 18 42 24" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <Path d="M12 32 Q 28 26 44 32" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <Path d="M44 24 Q 52 18 50 10" stroke={fg} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      <Circle cx="50" cy="9" r="2" fill={fg}/>
    </Svg>
  )
}

export default function HomeScreen() {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  const router = useRouter()
  const projects = useProjectStore((s) => s.projects)
  const [finishedOpen, setFinishedOpen] = useState(false)

  const active   = projects.filter((p) => p.status === 'active')
  const finished = projects.filter((p) => p.status === 'finished')

  const openProject = (p: Project) => router.push(`/project/${p.id}`)
  const goSetup     = () => router.push('/setup')

  const subTitle =
    t('home.subActive', { count: active.length })
    + (finished.length ? t('home.subFinishedSuffix', { count: finished.length }) : '')
    + t('home.subTrail')

  return (
    <Screen>
      <AppBar
        big
        title={t('home.title')}
        sub={subTitle}
        leading={<SkeinLogoSmall fg={colors.brick} accent={colors.mustard}/>}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing[5], paddingBottom: 100, gap: spacing[3] }}
      >
        {/* Cast-on CTA */}
        <Pressable onPress={goSetup} style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
          {({ pressed }) => (
            <LinearGradient
              colors={[colors.brick, colors.brickDk]}
              style={[styles.ctaCard, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.ctaIcon, { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.md }]}>
                <Icon name="plus" size={24} color="#FBF6EC"/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: fontSize.xl, color: '#FBF6EC', letterSpacing: -0.3 }}>
                  {t('home.castOn')}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: fontSize.xs, color: '#FBF6EC', opacity: 0.85, marginTop: 2 }}>
                  {t('home.castOnSub')}
                </Text>
              </View>
              <Icon name="chevR" size={20} color="#FBF6EC"/>
            </LinearGradient>
          )}
        </Pressable>

        {/* Active projects */}
        {active.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, letterSpacing: 2, textTransform: 'uppercase' }}>
                {t('home.onTheNeedles')} · {active.length}
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute }}>{t('home.recent')}</Text>
            </View>
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} onPress={() => openProject(p)}/>
            ))}
          </>
        ) : (
          <View style={[styles.emptyHint, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.lg }]}>
            <Text style={{ fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.inkMute, textAlign: 'center' }}>
              {t('home.emptyHint')}
            </Text>
          </View>
        )}

        {/* Finished — collapsible */}
        {finished.length > 0 && (
          <>
            <Pressable
              onPress={() => setFinishedOpen((o) => !o)}
              style={[styles.finishedToggle, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.md }]}
            >
              <View style={styles.finishedLeft}>
                <View style={[styles.finishedIcon, { backgroundColor: colors.cream2, borderRadius: radius.sm }]}>
                  <Icon name="check" size={16} color={colors.forest}/>
                </View>
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkSoft, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {t('home.finished')} · {finished.length}
                </Text>
              </View>
              <Icon name={finishedOpen ? 'chevDown' : 'chevR'} size={16} color={colors.inkMute}/>
            </Pressable>
            {finishedOpen && finished.map((p) => (
              <ProjectCard key={p.id} project={p} onPress={() => openProject(p)}/>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  ctaCard:        { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22 },
  ctaIcon:        { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  sectionHeader:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 },
  emptyHint:      { padding: 24, borderWidth: 1, marginTop: 8 },
  finishedToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, marginTop: 8 },
  finishedLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  finishedIcon:   { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
})
