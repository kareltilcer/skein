import React, { createContext, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getColors, type ColorTokens } from '../tokens/colors'
import { FontFamily, FontSize, resolveDisplayFont } from '../tokens/typography'
import { Spacing, Radius } from '../tokens/spacing'
import type { ResolvedTheme } from '../types'

type ThemeContextValue = {
  theme: ResolvedTheme
  colors: ColorTokens
  fonts: { [K in keyof typeof FontFamily]: string }
  fontSize: typeof FontSize
  spacing: typeof Spacing
  radius: typeof Radius
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  theme,
  children,
}: {
  theme: ResolvedTheme
  children: React.ReactNode
}) {
  const { i18n } = useTranslation()
  const fonts = useMemo(
    () => ({ ...FontFamily, display: resolveDisplayFont(i18n.language) }),
    [i18n.language],
  )
  const value: ThemeContextValue = {
    theme,
    colors: getColors(theme),
    fonts,
    fontSize: FontSize,
    spacing: Spacing,
    radius: Radius,
  }
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
