import React, { useState } from 'react'
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import Svg, { Circle, Path } from 'react-native-svg'
import { useTheme } from '../theme/ThemeContext'
import { useSettingsStore } from '../store/settingsStore'
import { SUPPORTED_LANGUAGES, isSupportedLanguage } from '../i18n/languages'
import Btn from '../components/ui/Btn'
import Icon from '../components/ui/Icon'
import IconBtn from '../components/ui/IconBtn'

function SkeinLogo({ size = 120, fg = '#9C3D2E', accent = '#D4923B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Circle cx="28" cy="30" r="18" fill={fg}/>
      <Path d="M14 24 Q 28 18 42 24" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <Path d="M12 32 Q 28 26 44 32" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <Path d="M14 40 Q 28 34 42 40" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <Path d="M20 16 Q 28 22 36 16" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <Path d="M44 24 Q 52 18 50 10" stroke={fg} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      <Circle cx="50" cy="9" r="2" fill={fg}/>
    </Svg>
  )
}

export default function EmptyScreen() {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing } = useTheme()
  const router = useRouter()
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const markWelcomeSeen = useSettingsStore((s) => s.markWelcomeSeen)
  const savedLang = useSettingsStore((s) => s.language)

  const [langOpen, setLangOpen] = useState(false)
  const code = isSupportedLanguage(savedLang) ? savedLang : 'en'

  const goSetup = () => {
    markWelcomeSeen()
    router.push('/setup')
  }
  const goLibrary = () => {
    markWelcomeSeen()
    router.replace('/(tabs)/library')
  }
  const pickLang = (c: string) => {
    setLanguage(c)
    setLangOpen(false)
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => setLangOpen(true)}
          style={[styles.langPill, { backgroundColor: colors.card, borderColor: colors.rule }]}
        >
          <Icon name="globe" size={14} color={colors.inkSoft}/>
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.ink, letterSpacing: 1, textTransform: 'uppercase' }}>
            {code}
          </Text>
          <Icon name="chevDown" size={12} color={colors.inkMute}/>
        </Pressable>
        <IconBtn name="settings" onPress={() => router.replace('/(tabs)/settings')}/>
      </View>

      {/* centered content */}
      <View style={styles.center}>
        <SkeinLogo size={120} fg={colors.brick} accent={colors.mustard}/>

        <Text style={[styles.welcome, { fontFamily: fonts.display, color: colors.brick, marginTop: spacing[7] }]}>
          {t('welcome.greeting')}
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: fontSize.md, color: colors.mustardDk, marginTop: 10, letterSpacing: 1.5 }}>
          {t('welcome.tagline')}
        </Text>
        <Text style={[styles.body, { fontFamily: fonts.body, color: colors.inkSoft }]}>
          {t('welcome.body')}
        </Text>

        <View style={[styles.ctaGroup, { marginTop: spacing[8] }]}>
          <Btn variant="primary" size="lg" icon="plus" full onPress={goSetup}>
            {t('welcome.ctaCastOn')}
          </Btn>
          <View style={{ height: spacing[2] }}/>
          <Btn variant="ghost" size="md" icon="book" full onPress={goLibrary}>
            {t('welcome.ctaLibrary')}
          </Btn>
        </View>

        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: spacing[8] }}>
          {t('welcome.note')}
        </Text>
      </View>

      {/* language picker modal */}
      <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setLangOpen(false)}/>
        <View style={[styles.langSheet, { backgroundColor: colors.card, borderColor: colors.rule }]}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 3, textTransform: 'uppercase', padding: 12 }}>
            {t('welcome.languageModalTitle')}
          </Text>
          <ScrollView>
            {SUPPORTED_LANGUAGES.map((l) => {
              const active = l.code === code
              return (
                <Pressable
                  key={l.code}
                  onPress={() => pickLang(l.code)}
                  style={[
                    styles.langRow,
                    { backgroundColor: active ? colors.cream2 : 'transparent' },
                  ]}
                >
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: active ? colors.brick : colors.inkMute, letterSpacing: 1, textTransform: 'uppercase', minWidth: 24 }}>
                    {l.code}
                  </Text>
                  <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink, fontWeight: active ? '700' : '500' }}>
                    {l.native}
                  </Text>
                  {active ? <Icon name="check" size={16} color={colors.brick}/> : null}
                </Pressable>
              )
            })}
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, padding: 12, borderTopWidth: 1, borderTopColor: colors.rule }}>
              {t('welcome.languageSwitchHint')}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  langPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, height: 36 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 48 },
  welcome:  { fontSize: 44, lineHeight: 48, letterSpacing: -1, textAlign: 'center' },
  body:     { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 18, maxWidth: 300 },
  ctaGroup: { width: '100%' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(43,24,16,0.4)' },
  langSheet:{ position: 'absolute', top: 100, right: 20, left: 60, borderRadius: 18, borderWidth: 1, maxHeight: 420, overflow: 'hidden' },
  langRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
})
