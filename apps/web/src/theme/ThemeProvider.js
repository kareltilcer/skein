import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { getColors, useSettingsStore, } from '@skein/shared';
// Caprasimo is the brand display face — apply it everywhere, regardless of
// locale. Latin-Extended characters are covered by Caprasimo; for the few
// scripts it doesn't cover (e.g. Japanese), the browser falls back to the
// next family in the stack.
const WEB_FONT = {
    display: "'Caprasimo', 'Cooper Std', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
    mono: "'DM Mono', ui-monospace, monospace",
};
const ThemeContext = React.createContext(null);
function applyVars(theme, colors, fonts) {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(colors)) {
        root.style.setProperty(`--color-${key}`, value);
    }
    root.style.setProperty('--font-display', fonts.display);
    root.style.setProperty('--font-body', fonts.body);
    root.style.setProperty('--font-mono', fonts.mono);
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    // Drive theme-aware CSS via [data-theme="dark"]; cleaner than a global class.
    root.dataset.theme = theme;
}
function resolve(pref, system) {
    return pref === 'auto' ? system : pref;
}
export function ThemeProvider({ children }) {
    const themePref = useSettingsStore((s) => s.theme);
    const [system, setSystem] = React.useState(() => {
        if (typeof window === 'undefined' || !window.matchMedia)
            return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    React.useEffect(() => {
        if (!window.matchMedia)
            return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e) => setSystem(e.matches ? 'dark' : 'light');
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    const theme = resolve(themePref, system);
    const colors = React.useMemo(() => getColors(theme), [theme]);
    React.useEffect(() => {
        applyVars(theme, colors, WEB_FONT);
    }, [theme, colors]);
    const value = React.useMemo(() => ({ theme, colors, fonts: WEB_FONT }), [theme, colors]);
    return _jsx(ThemeContext.Provider, { value: value, children: children });
}
export function useTheme() {
    const ctx = React.useContext(ThemeContext);
    if (!ctx)
        throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}
