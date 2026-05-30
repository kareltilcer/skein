import type { ResolvedTheme } from '../types'

export const lightColors = {
  bg:          '#F2EBDD',
  bgAlt:       '#E8DEC8',
  card:        '#FBF6EC',
  ink:         '#2B1810',
  inkSoft:     '#5A4434',
  inkMute:     '#8A7560',
  brick:       '#9C3D2E',
  brickDk:     '#7A2C1F',
  mustard:     '#D4923B',
  mustardDk:   '#A66B1F',
  forest:      '#3F6B4A',
  forestDk:    '#2A4D33',
  cream2:      '#EFE4CC',
  rule:        '#D8C9AE',
  skinShadow:  'rgba(43,24,16,0.08)',
  white:       '#FFFFFF',
  tabBg:       'rgba(242,235,221,0.92)',
} as const

export const darkColors = {
  bg:          '#120805',
  bgAlt:       '#1A0E08',
  card:        '#1E110A',
  ink:         '#F8D9B0',
  inkSoft:     '#D4A878',
  inkMute:     '#8A6E50',
  brick:       '#FF7A4D',
  brickDk:     '#D6562E',
  mustard:     '#FFC25F',
  mustardDk:   '#D89A38',
  forest:      '#88B98C',
  forestDk:    '#5D8A63',
  cream2:      '#2A180E',
  rule:        'rgba(255,217,134,0.10)',
  skinShadow:  'rgba(0,0,0,0.55)',
  white:       '#FFFFFF',
  tabBg:       'rgba(18,8,5,0.92)',
} as const

export type ColorTokens = {
  bg:          string
  bgAlt:       string
  card:        string
  ink:         string
  inkSoft:     string
  inkMute:     string
  brick:       string
  brickDk:     string
  mustard:     string
  mustardDk:   string
  forest:      string
  forestDk:    string
  cream2:      string
  rule:        string
  skinShadow:  string
  white:       string
  tabBg:       string
}

export function getColors(theme: ResolvedTheme): ColorTokens {
  return theme === 'dark' ? darkColors : lightColors
}
