// Mobile-side i18n init. The actual i18next setup lives in @skein/shared so
// web uses the same string table; only platform-specific bits (OS-language
// detection via expo-localization) stay here.
import * as Localization from 'expo-localization'
import { createI18n, DEFAULT_LANGUAGE, isSupportedLanguage, type LanguageCode } from '@skein/shared'

const i18n = createI18n()

export function detectSystemLanguage(): LanguageCode {
  const locales = Localization.getLocales()
  for (const l of locales) {
    const code = l.languageCode
    if (isSupportedLanguage(code)) return code
  }
  return DEFAULT_LANGUAGE
}

export { matchesNumberedTemplate } from '@skein/shared'
export default i18n
