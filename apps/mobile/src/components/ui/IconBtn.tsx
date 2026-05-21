import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'
import Icon from './Icon'

type Props = {
  name: string
  onPress?: () => void
  size?: number
  color?: string
}

export default function IconBtn({ name, onPress, size = 36, color }: Props) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
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
      <Icon name={name as any} size={18} color={color ?? colors.ink}/>
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
