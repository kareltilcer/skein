import React, { useState } from 'react'
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Circle, Path } from 'react-native-svg'
import { useTheme } from '../theme/ThemeContext'
import { useSettingsStore } from '../store/settingsStore'
import Btn from '../components/ui/Btn'
import Icon from '../components/ui/Icon'
import IconBtn from '../components/ui/IconBtn'

const LANGUAGES = [
  { code: 'en', name: 'English',    welcome: 'Welcome to Skein.',        body: "Build a pattern, hit start, and we'll keep your place — row by row, repeat by repeat. Both hands free for the needles.",                 cta: 'Cast on first project',  alt: 'Peek at the library',   note: 'no account needed · ever'    },
  { code: 'es', name: 'Español',    welcome: 'Bienvenida a Skein.',       body: 'Crea un patrón, dale a empezar, y nosotros guardamos tu lugar — fila por fila, repetición por repetición.',                             cta: 'Empezar primer proyecto',alt: 'Ver la biblioteca',     note: 'sin cuenta · nunca'          },
  { code: 'fr', name: 'Français',   welcome: 'Bienvenue sur Skein.',      body: "Crée un motif, lance la séance, et nous gardons ta place — rang par rang, répétition par répétition.",                                   cta: 'Démarrer un projet',     alt: 'Voir la bibliothèque',  note: 'aucun compte requis · jamais'},
  { code: 'de', name: 'Deutsch',    welcome: 'Willkommen bei Skein.',     body: 'Bau ein Muster, leg los, und wir merken uns deine Stelle — Reihe für Reihe, Wiederholung für Wiederholung.',                             cta: 'Erstes Projekt starten', alt: 'Bibliothek ansehen',    note: 'kein konto nötig · niemals'  },
  { code: 'it', name: 'Italiano',   welcome: 'Benvenuta in Skein.',       body: 'Crea un motivo, parti, e teniamo noi il segno — riga per riga, ripetizione per ripetizione.',                                            cta: 'Avvia primo progetto',   alt: 'Sfoglia la libreria',   note: 'nessun account · mai'        },
  { code: 'pt', name: 'Português',  welcome: 'Olá, é o Skein.',           body: 'Cria um padrão, começa, e nós guardamos o teu lugar — linha a linha, repetição a repetição.',                                           cta: 'Começar projeto',        alt: 'Ver biblioteca',        note: 'sem conta · nunca'           },
  { code: 'ja', name: '日本語',      welcome: 'Skeinへようこそ。',           body: 'パターンを作って、始めるだけ。あとは段ごと・くり返しごとに進行を覚えています。',                                                                   cta: '最初のプロジェクト',     alt: 'ライブラリを見る',       note: 'アカウント不要・ずっと'       },
  { code: 'nl', name: 'Nederlands', welcome: 'Welkom bij Skein.',         body: 'Bouw een patroon, druk op start, en wij houden je plek bij — rij voor rij, herhaling voor herhaling.',                                  cta: 'Eerste project starten', alt: 'Bekijk de bibliotheek', note: 'geen account nodig · ooit'   },
]

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
  const { colors, fonts, fontSize, spacing } = useTheme()
  const router = useRouter()
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const markWelcomeSeen = useSettingsStore((s) => s.markWelcomeSeen)
  const savedLang = useSettingsStore((s) => s.language)

  const [langOpen, setLangOpen] = useState(false)
  const [code, setCode] = useState(savedLang ?? 'en')
  const L = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]!

  const goSetup = () => {
    markWelcomeSeen()
    setLanguage(code)
    router.push('/setup')
  }
  const goLibrary = () => {
    markWelcomeSeen()
    setLanguage(code)
    router.replace('/(tabs)/library')
  }
  const pickLang = (c: string) => {
    setCode(c)
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
          {L.welcome}
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: fontSize.md, color: colors.mustardDk, marginTop: 10, letterSpacing: 1.5 }}>
          stitch happens.
        </Text>
        <Text style={[styles.body, { fontFamily: fonts.body, color: colors.inkSoft }]}>
          {L.body}
        </Text>

        <View style={[styles.ctaGroup, { marginTop: spacing[8] }]}>
          <Btn variant="primary" size="lg" icon="plus" full onPress={goSetup}>
            {L.cta}
          </Btn>
          <View style={{ height: spacing[2] }}/>
          <Btn variant="ghost" size="md" icon="book" full onPress={goLibrary}>
            {L.alt}
          </Btn>
        </View>

        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: spacing[8] }}>
          {L.note}
        </Text>
      </View>

      {/* language picker modal */}
      <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setLangOpen(false)}/>
        <View style={[styles.langSheet, { backgroundColor: colors.card, borderColor: colors.rule }]}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, letterSpacing: 3, textTransform: 'uppercase', padding: 12 }}>
            Choose your language
          </Text>
          <ScrollView>
            {LANGUAGES.map((l) => {
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
                    {l.name}
                  </Text>
                  {active ? <Icon name="check" size={16} color={colors.brick}/> : null}
                </Pressable>
              )
            })}
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute, padding: 12, borderTopWidth: 1, borderTopColor: colors.rule }}>
              You can switch anytime in Settings.
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
