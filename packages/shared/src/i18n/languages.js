export const SUPPORTED_LANGUAGES = [
    { code: 'en', native: 'English', english: 'English' },
    { code: 'cs', native: 'Čeština', english: 'Czech' },
    { code: 'de', native: 'Deutsch', english: 'German' },
];
export const DEFAULT_LANGUAGE = 'en';
export function isSupportedLanguage(code) {
    return SUPPORTED_LANGUAGES.some((l) => l.code === code);
}
export function languageLabel(code) {
    return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.native ?? 'English';
}
