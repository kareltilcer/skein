import React, { createContext, useContext } from 'react'
import { getColors, type ColorTokens } from '../tokens/colors'
import { FontFamily, FontSize } from '../tokens/typography'
import { Spacing, Radius } from '../tokens/spacing'
import type { Theme } from '../types'

type ThemeContextValue = {
  theme: Theme
  colors: ColorTokens
  fonts: typeof FontFamily
  fontSize: typeof FontSize
  spacing: typeof Spacing
  radius: typeof Radius
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  theme,
  children,
}: {
  theme: Theme
  children: React.ReactNode
}) {
  const value: ThemeContextValue = {
    theme,
    colors: getColors(theme),
    fonts: FontFamily,
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
