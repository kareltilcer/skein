import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/ThemeContext'

type Props = {
  children: React.ReactNode
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}

export default function Screen({ children, edges = ['top', 'bottom', 'left', 'right'] }: Props) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.bg,
          paddingTop:    edges.includes('top')    ? insets.top    : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft:   edges.includes('left')   ? insets.left   : 0,
          paddingRight:  edges.includes('right')  ? insets.right  : 0,
        },
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
