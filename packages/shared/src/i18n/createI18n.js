import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import cs from './locales/cs.json';
import de from './locales/de.json';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './languages';
import { useSettingsStore } from '../stores/settingsStore';
const resources = {
    en: { translation: en },
    cs: { translation: cs },
    de: { translation: de },
};
let initialized = false;
/**
 * Initialize i18next + wire it up to the shared settingsStore.
 *
 * Apps must call this once at startup. The detectSystemLanguage callback is
 * platform-specific (expo-localization on mobile, navigator.language on web)
 * so it stays out of @skein/shared.
 */
export function createI18n() {
    if (initialized)
        return i18n;
    initialized = true;
    i18n
        .use(initReactI18next)
        .init({
        resources,
        lng: useSettingsStore.getState().language || DEFAULT_LANGUAGE,
        fallbackLng: DEFAULT_LANGUAGE,
        interpolation: { escapeValue: false },
        returnNull: false,
        compatibilityJSON: 'v4',
    });
    // On persistence hydration, switch i18n to the stored language so we don't
    // flash defaults to a returning user who picked a non-English language.
    useSettingsStore.persist.onFinishHydration((state) => {
        if (state?.language && state.language !== i18n.language) {
            void i18n.changeLanguage(state.language);
        }
    });
    useSettingsStore.subscribe((state, prev) => {
        if (state.language !== prev.language && state.language) {
            void i18n.changeLanguage(state.language);
        }
    });
    return i18n;
}
/**
 * Returns true if `label` matches the i18n template `key` (with the numeric
 * placeholder) in *any* supported language. Use this instead of locale-pinned
 * regexes when detecting auto-generated default labels.
 */
export function matchesNumberedTemplate(key, label) {
    const trimmed = label.trim();
    for (const lang of SUPPORTED_LANGUAGES) {
        const template = i18n.getResource(lang.code, 'translation', key);
        if (!template)
            continue;
        const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\\\{n\\\}\\\}/g, '\\d+');
        if (new RegExp(`^${escaped}$`, 'i').test(trimmed))
            return true;
    }
    return false;
}
export { i18n };
