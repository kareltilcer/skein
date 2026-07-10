import { createI18n, DEFAULT_LANGUAGE, isSupportedLanguage, } from '@skein/shared';
const i18n = createI18n();
export function detectSystemLanguage() {
    const candidates = [
        navigator.language,
        ...(navigator.languages ?? []),
    ];
    for (const tag of candidates) {
        if (!tag)
            continue;
        const code = tag.toLowerCase().split('-')[0];
        if (isSupportedLanguage(code))
            return code;
    }
    return DEFAULT_LANGUAGE;
}
export default i18n;
