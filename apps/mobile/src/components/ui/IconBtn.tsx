import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'
import Icon, { type IconName } from './Icon'

type Props = {
  name: IconName
  onPress?: () => void
  size?: number
  color?: string
  accessibilityLabel?: string
}

export default function IconBtn({ name, onPress, size = 36, color, accessibilityLabel }: Props) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.card,
          borderColor: colors.rule,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon name={name} size={18} color={color ?? colors.ink}/>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
