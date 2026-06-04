import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import { useSettingsStore } from '../store/settingsStore'
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, isSupportedLanguage, type LanguageCode } from './languages'
import en from './locales/en.json'
import cs from './locales/cs.json'
import de from './locales/de.json'

const resources = {
  en: { translation: en },
  cs: { translation: cs },
  de: { translation: de },
} as const

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: useSettingsStore.getState().language || DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: 'v4',
  })

// On persistence hydration, switch i18n to the stored language so we don't
// flash defaults to a returning user who picked a non-English language.
useSettingsStore.persist.onFinishHydration((state) => {
  if (state?.language && state.language !== i18n.language) {
    void i18n.changeLanguage(state.language)
  }
})

useSettingsStore.subscribe((state, prev) => {
  if (state.language !== prev.language && state.language) {
    void i18n.changeLanguage(state.language)
  }
})

/**
 * Returns true if `label` matches the i18n template `key` (with the numeric
 * placeholder) in *any* supported language. Use this instead of locale-pinned
 * regexes when detecting auto-generated default labels.
 */
export function matchesNumberedTemplate(key: string, label: string): boolean {
  const trimmed = label.trim()
  for (const lang of SUPPORTED_LANGUAGES) {
    const template = i18n.getResource(lang.code, 'translation', key) as string | undefined
    if (!template) continue
    const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\\\{n\\\}\\\}/g, '\\d+')
    if (new RegExp(`^${escaped}$`, 'i').test(trimmed)) return true
  }
  return false
}

export function detectSystemLanguage(): LanguageCode {
  const locales = Localization.getLocales()
  for (const l of locales) {
    const code = l.languageCode
    if (isSupportedLanguage(code)) return code
  }
  return DEFAULT_LANGUAGE
}

export default i18n
