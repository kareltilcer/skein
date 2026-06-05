export const SUPPORTED_LANGUAGES = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'cs', native: 'Čeština', english: 'Czech' },
  { code: 'de', native: 'Deutsch', english: 'German' },
] as const

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export function isSupportedLanguage(code: string | null | undefined): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some((l) => l.code === code)
}

export function languageLabel(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.native ?? 'English'
}
