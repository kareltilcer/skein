import React from 'react'
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../../theme/ThemeContext'
import Icon from './Icon'

type Variant = 'primary' | 'mustard' | 'ghost' | 'soft' | 'chip'
type Size = 'sm' | 'md' | 'lg'

type Props = {
  children: React.ReactNode
  onPress?: () => void
  variant?: Variant
  size?: Size
  icon?: string
  full?: boolean
  disabled?: boolean
  loading?: boolean
}

export default function Btn({
  children, onPress, variant = 'primary', size = 'md',
  icon, full, disabled, loading,
}: Props) {
  const { colors, fonts, radius } = useTheme()

  const sizes = {
    sm: { height: 36, paddingH: 14, fontSize: 14 },
    md: { height: 48, paddingH: 20, fontSize: 15 },
    lg: { height: 58, paddingH: 24, fontSize: 17 },
  }
  const sz = sizes[size]

  const variantStyles: Record<Variant, { bg: string | null; fg: string; border?: string; gradient?: [string, string] }> = {
    primary: { bg: null, fg: '#FBF6EC', gradient: [colors.brick, colors.brickDk] },
    mustard: { bg: colors.mustard, fg: colors.ink },
    ghost:   { bg: 'transparent', fg: colors.ink, border: colors.rule },
    soft:    { bg: colors.card, fg: colors.ink, border: colors.rule },
    chip:    { bg: colors.cream2, fg: colors.ink },
  }
  const vs = variantStyles[variant]

  const containerStyle = [
    full ? { width: '100%' as const } : {},
  ]

  if (vs.gradient) {
    return (
      <Pressable onPress={onPress} disabled={disabled || loading} style={containerStyle}>
        {({ pressed }) => (
          <LinearGradient
            colors={vs.gradient!}
            style={[styles.inner, {
              height: sz.height, paddingHorizontal: sz.paddingH,
              borderRadius: radius.md, opacity: pressed ? 0.85 : 1,
            }, full ? { width: '100%' } : {}]}
          >
            {loading ? (
              <ActivityIndicator color={vs.fg} size="small"/>
            ) : (
              <>
                {icon ? <Icon name={icon as any} size={18} color={vs.fg}/> : null}
                <Text style={{ color: vs.fg, fontSize: sz.fontSize, fontFamily: fonts.bodySb, letterSpacing: -0.1 }}>
                  {children}
                </Text>
              </>
            )}
          </LinearGradient>
        )}
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.inner,
        {
          height: sz.height, paddingHorizontal: sz.paddingH, borderRadius: radius.md,
          backgroundColor: vs.bg ?? 'transparent',
          opacity: pressed ? 0.75 : 1,
        },
        vs.border ? { borderWidth: 1.5, borderColor: vs.border } : {},
        full ? { width: '100%' } : {},
        disabled ? { opacity: 0.5 } : {},
        containerStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.fg} size="small"/>
      ) : (
        <>
          {icon ? <Icon name={icon as any} size={18} color={vs.fg}/> : null}
          <Text style={{ color: vs.fg, fontSize: sz.fontSize, fontFamily: fonts.bodySb, letterSpacing: -0.1 }}>
            {children}
          </Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
})
