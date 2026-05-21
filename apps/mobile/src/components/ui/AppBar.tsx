import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'

type Props = {
  title: string
  sub?: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
  big?: boolean
}

export default function AppBar({ title, sub, leading, trailing, big = false }: Props) {
  const { colors, fonts, fontSize } = useTheme()
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.slot}>{leading}</View>
        {!big && (
          <Text style={{ fontFamily: fonts.bodySb, fontSize: fontSize.md, color: colors.ink, letterSpacing: -0.2 }}>
            {title}
          </Text>
        )}
        <View style={[styles.slot, styles.slotRight]}>{trailing}</View>
      </View>
      {big && (
        <View style={styles.bigHeading}>
          <Text style={{ fontFamily: fonts.display, fontSize: fontSize['3xl'], color: colors.brick, letterSpacing: -0.4, lineHeight: fontSize['3xl'] * 1.05 }}>
            {title}
          </Text>
          {sub ? (
            <Text style={{ fontSize: fontSize.sm, color: colors.inkSoft, marginTop: 6, fontFamily: fonts.body }}>
              {sub}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 },
  slot:      { width: 36, alignItems: 'flex-start' },
  slotRight: { alignItems: 'flex-end' },
  bigHeading:{ marginTop: 10 },
})
