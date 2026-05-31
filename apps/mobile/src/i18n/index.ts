import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import { useSettingsStore } from '../store/settingsStore'
import { DEFAULT_LANGUAGE, isSupportedLanguage, type LanguageCode } from './languages'
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

useSettingsStore.subscribe((state, prev) => {
  if (state.language !== prev.language && state.language) {
    void i18n.changeLanguage(state.language)
  }
})

export function detectSystemLanguage(): LanguageCode {
  const locales = Localization.getLocales()
  for (const l of locales) {
    const code = l.languageCode
    if (isSupportedLanguage(code)) return code
  }
  return DEFAULT_LANGUAGE
}

export default i18n
