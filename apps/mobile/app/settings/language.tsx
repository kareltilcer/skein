import React, { useMemo, useState } from 'react'
import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../src/theme/ThemeContext'
import { useSettingsStore } from '../../src/store/settingsStore'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../src/i18n/languages'
import Screen from '../../src/components/ui/Screen'
import Icon from '../../src/components/ui/Icon'
import IconBtn from '../../src/components/ui/IconBtn'

const SEARCH_THRESHOLD = 12

export default function LanguagePickerScreen() {
  const { t } = useTranslation()
  const { colors, fonts, fontSize, spacing, radius } = useTheme()
  const router = useRouter()
  const current = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    if (!query.trim()) return SUPPORTED_LANGUAGES
    const q = query.trim().toLowerCase()
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.native.toLowerCase().includes(q) ||
        l.english.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    )
  }, [query])

  const showSearch = SUPPORTED_LANGUAGES.length >= SEARCH_THRESHOLD

  const pick = (code: LanguageCode) => {
    setLanguage(code)
    router.back()
  }

  return (
    <Screen>
      <View style={[styles.topBar, { paddingHorizontal: spacing[5] }]}>
        <IconBtn name="back" onPress={() => router.back()}/>
        <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.md, color: colors.ink }}>
          {t('settings.languagePickerTitle')}
        </Text>
        <View style={{ width: 36 }}/>
      </View>

      <Text style={{
        fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute,
        letterSpacing: 1.6, textTransform: 'uppercase',
        paddingHorizontal: spacing[5], marginTop: spacing[2], marginBottom: spacing[3],
      }}>
        {t('settings.languagePickerSub')}
      </Text>

      {showSearch && (
        <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.rule, borderRadius: radius.md }]}>
            <Icon name="search" size={16} color={colors.inkMute}/>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('common.search')}
              placeholderTextColor={colors.inkMute}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ flex: 1, fontFamily: fonts.body, fontSize: fontSize.sm, color: colors.ink }}
            />
          </View>
        </View>
      )}

      <FlatList
        data={list}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: 60, gap: spacing[2] }}
        renderItem={({ item }) => {
          const active = item.code === current
          return (
            <Pressable
              onPress={() => pick(item.code)}
              style={[styles.row, {
                backgroundColor: colors.card,
                borderColor: active ? colors.brick : colors.rule,
                borderWidth: active ? 1.5 : 1,
                borderRadius: radius.md,
              }]}
            >
              <View style={[styles.indicator, { borderColor: active ? colors.brick : colors.rule }]}>
                {active && <View style={[styles.indicatorDot, { backgroundColor: colors.brick }]}/>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.sm, color: colors.ink }}>
                  {item.native}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.inkMute, marginTop: 2 }}>
                  {item.english}
                </Text>
              </View>
              <Text style={{
                fontFamily: fonts.mono, fontSize: 10, color: colors.inkMute,
                letterSpacing: 1.5, textTransform: 'uppercase',
              }}>
                {item.code}
              </Text>
            </Pressable>
          )
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 4 },
  searchBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  row:           { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  indicator:     { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  indicatorDot:  { width: 10, height: 10, borderRadius: 5 },
})
