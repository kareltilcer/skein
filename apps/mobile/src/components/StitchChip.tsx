import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import StitchGlyph from './StitchGlyph'
import type { StitchDef } from '../types'

type Size = 'lg' | 'sm' | 'xs'

type Props = {
  stitch: StitchDef
  size?: Size
}

const SIZE_MAP = {
  lg: { w: 76,  h: 96,  glyphSz: 38, fontSize: 11 },
  sm: { w: 52,  h: 64,  glyphSz: 26, fontSize: 10 },
  xs: { w: 40,  h: 52,  glyphSz: 20, fontSize: 9  },
}

export default function StitchChip({ stitch, size = 'sm' }: Props) {
  const { fonts, radius } = useTheme()
  const dim = SIZE_MAP[size]

  return (
    <View style={[
      styles.chip,
      {
        width: dim.w,
        height: dim.h,
        borderRadius: radius.sm,
        backgroundColor: stitch.color,
      },
    ]}>
      <StitchGlyph symbol={stitch.symbol} size={dim.glyphSz} color="#2B1810"/>
      <Text style={[styles.abbr, { fontSize: dim.fontSize, fontFamily: fonts.mono }]}>
        {stitch.abbr}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  abbr: {
    color: '#2B1810',
    fontWeight: '600',
    textAlign: 'center',
  },
})
