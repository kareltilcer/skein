import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'

type Props = {
  progress: number // 0–1
  height?: number
  color?: string
}

export default function ProgressBar({ progress, height = 4, color }: Props) {
  const { colors, radius } = useTheme()
  return (
    <View style={[styles.track, { height, borderRadius: radius.full, backgroundColor: colors.cream2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
            height,
            borderRadius: radius.full,
            backgroundColor: color ?? colors.brick,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill:  {},
})
