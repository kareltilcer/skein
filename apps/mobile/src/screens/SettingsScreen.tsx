import React from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../theme/ThemeContext'
import { useSettingsStore } from '../store/settingsStore'
import { lightColors, darkColors } from '../tokens/colors'
import Screen from '../components/ui/Screen'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import Btn from '../components/ui/Btn'
import type { Theme } from '../types'

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English (US)', es: 'Español', fr: 'Français', de: 'Deutsch',
  it: 'Italiano', pt: 'Português', ja: '日本語', nl: 'Nederlands',
}

function SectionLabel({ children }: { children: string }) {
  const { colors, fonts } = useTheme()
  return (
    <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.inkMute, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
      {children}
    </Text>
  )
}

function ThemeCard({ mode, active, onPress }: { mode: Theme; active: boolean; onPress: () => void }) {
  const { colors, fonts, radius } = useTheme()
  const swatch  = mode === 'dark' ? darkColors.bg   : lightColors.bg
  const accent  = mode === 'dark' ? darkColors.brick : lightColors.brick
  const label   = mode === 'dark' ? 'Dark'  : 'Light'
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.themeCard,
        {
          backgroundColor: colors.card,
          borderColor:     active ? colors.brick : colors.rule,
          borderWidth:     active ? 2 : 1,
          borderRadius:    radius.md,
          flex:            1,
        },
      ]}
    >
      <View style={[styles.themeSwatch, { backgroundColor: swatch, borderRadius: radius.sm }]}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: accent }}/>
        {mode === 'dark' && (
          <View style={styles.moonBadge}>
            <Icon name="moon" size={12} color={accent}/>
          </View>
        )}
      </View>
      <Text style={{ fontFamily: fonts.bodySb, fontSize: 12, color: active ? colors.brick : colors.ink, marginTop: 8 }}>
        {label}
      </Text>
    </Pressable>
  )
}

function SettingsRow({ icon, iconColor, title, value }: { icon: string; iconColor: string; title: string; value: string }) {
  const { colors, fonts, fontSize, radius } = useTheme()
  return (
    <View style={[styles.settingsRow, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.md }]}>
      <View style={[styles.iconBadge, { backgroundColor: colors.cream2, borderRadius: 10 }]}>
        <Icon name={icon as any} size={20} color={iconColor}/>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.sm, color: colors.ink }}>{title}</Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 2 }}>{value}</Text>
      </View>
      <Icon name="chevR" size={16} color={colors.inkMute}/>
    </View>
  )
}

function MiniRow({ icon, label, accent, last }: { icon: string; label: string; accent?: string; last?: boolean }) {
  const { colors, fonts, fontSize } = useTheme()
  return (
    <Pressable style={[styles.miniRow, { borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.rule }]}>
      <Icon name={icon as any} size={18} color={accent ?? colors.inkSoft}/>
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.ink, fontWeight: accent ? '700' : '500' }}>
        {label}
      </Text>
      <Icon name="chevR" size={14} color={colors.inkMute}/>
    </Pressable>
  )
}

export default function SettingsScreen() {
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  const theme         = useSettingsStore((s) => s.theme)
  const language      = useSettingsStore((s) => s.language)
  const holdTimeMs    = useSettingsStore((s) => s.holdTimeMs)
  const defaultCraft  = useSettingsStore((s) => s.defaultCraft)
  const setTheme      = useSettingsStore((s) => s.setTheme)

  return (
    <Screen>
      <AppBar big title="Settings" sub="The cozy customization corner."/>
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: 100 }}>

        {/* Appearance */}
        <View>
          <SectionLabel>Appearance</SectionLabel>
          <View style={styles.themeRow}>
            <ThemeCard mode="light" active={theme === 'light'} onPress={() => setTheme('light')}/>
            <ThemeCard mode="dark"  active={theme === 'dark'}  onPress={() => setTheme('dark')}/>
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.md, marginTop: spacing[2] }]}>
            <Icon name="bulb" size={16} color={colors.mustardDk}/>
            <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, lineHeight: 18 }}>
              <Text style={{ color: colors.ink, fontWeight: '700' }}>Dark mode</Text> shifts everything to a deep warm red so your eyes stay relaxed during late-night knit-alongs.
            </Text>
          </View>
        </View>

        {/* Settings rows */}
        <View style={{ gap: spacing[2] }}>
          <SettingsRow icon="globe"  iconColor={colors.forest}    title="Language"             value={LANGUAGE_NAMES[language] ?? 'English (US)'}/>
          <SettingsRow icon="needle" iconColor={colors.brick}     title="Default craft"        value={defaultCraft === 'knit' ? 'Knit' : 'Crochet'}/>
          <SettingsRow icon="bulb"   iconColor={colors.mustardDk} title="Hold time to advance" value={`${(holdTimeMs / 1000).toFixed(1)} seconds`}/>
        </View>

        {/* Cloud backup */}
        <LinearGradient
          colors={[colors.cream2, colors.card]}
          style={[styles.cloudCard, { borderColor: colors.rule, borderRadius: radius.xl }]}
        >
          <View style={styles.cloudHeader}>
            <View style={[styles.cloudIcon, { backgroundColor: colors.brick, borderRadius: radius.md }]}>
              <Icon name="cloud" size={22} color="#FBF6EC"/>
            </View>
            <View>
              <Text style={{ fontFamily: fonts.display, fontSize: fontSize.xl, color: colors.brick }}>Cloud backup</Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, letterSpacing: 0.5 }}>Totally optional. Always.</Text>
            </View>
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 19, marginBottom: spacing[4] }}>
            Add an account to sync projects across devices and back up your pattern library. We won't pester you.
          </Text>
          <Btn variant="mustard" size="md" full>Create account</Btn>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, textAlign: 'center', marginTop: spacing[2] }}>
            already have one? <Text style={{ color: colors.brick, fontWeight: '700' }}>Sign in</Text>
          </Text>
        </LinearGradient>

        {/* More */}
        <View>
          <SectionLabel>More</SectionLabel>
          <View style={[styles.moreGroup, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.md }]}>
            <MiniRow icon="save"    label="Export pattern as PDF"/>
            <MiniRow icon="sparkle" label="Skein Pro · ad-free forever" accent={colors.mustardDk}/>
            <MiniRow icon="user"    label="Tell a friend (please?)"/>
            <MiniRow icon="book"    label="The little knitting glossary" last/>
          </View>
        </View>

        {/* Footer */}
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginTop: spacing[2] }}>
          Skein 1.0 · made with yarn {'&'} code
        </Text>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  themeRow:    { flexDirection: 'row', gap: 8 },
  themeCard:   { alignItems: 'center', padding: 10 },
  themeSwatch: { width: '100%', height: 56, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  moonBadge:   { position: 'absolute', top: 6, right: 8 },
  infoCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderWidth: 1 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 14 },
  iconBadge:   { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  cloudCard:   { padding: 20, borderWidth: 1 },
  cloudHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cloudIcon:   { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  moreGroup:   { borderWidth: 1, overflow: 'hidden' },
  miniRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
})
