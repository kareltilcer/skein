// Caprasimo has no glyphs for ě/č/ř/ž/ů/ď/ť/ň — it's used for English headings only.
// Non-English locales fall back to Noto Serif Display (full Unicode). Text inputs
// always use Noto so anything the user types renders, regardless of UI language.
//
// Values are mobile font keys (the names registered with expo-fonts). Web maps
// each key to its CSS font-family in apps/web/src/theme.
export const FontFamily = {
    display: 'Caprasimo_400Regular',
    displayAlt: 'NotoSerifDisplay_700Bold',
    displayInput: 'NotoSerifDisplay_700Bold',
    body: 'DMSans_400Regular',
    bodyMd: 'DMSans_500Medium',
    bodySb: 'DMSans_600SemiBold',
    bodyBd: 'DMSans_700Bold',
    mono: 'DMMono_400Regular',
};
export function resolveDisplayFont(language) {
    return language?.startsWith('en') ? FontFamily.display : FontFamily.displayAlt;
}
export const FontSize = {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 36,
    '4xl': 48,
    '5xl': 72,
    '6xl': 96,
};
export const LineHeight = {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
};
