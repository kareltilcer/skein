import React, { useRef, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import Animated, {
  useSharedValue, useAnimatedProps, useAnimatedStyle,
  withTiming, cancelAnimation, runOnJS, Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../theme/ThemeContext'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedRect = Animated.createAnimatedComponent(Rect) as any

type Variant = 'primary' | 'ghost'

type Props = {
  variant?: Variant
  label?: string
  sub?: string
  icon?: React.ReactNode
  holdMs?: number
  color?: string
  ringColor?: string
  textColor?: string
  borderColor?: string
  height?: number
  width?: number
  ringStrokeWidth?: number
  pressScale?: number
  onComplete?: () => void
}

export default function HoldButton({
  variant = 'primary',
  label, sub, icon,
  holdMs = 3000,
  color,
  ringColor,
  textColor = '#FBF6EC',
  borderColor,
  height = 88,
  width,
  ringStrokeWidth,
  pressScale,
  onComplete,
}: Props) {
  const { colors, fonts } = useTheme()
  const accent = color ?? colors.brick
  const ring = ringColor ?? colors.mustard
  const sw = ringStrokeWidth ?? (variant === 'ghost' ? 5 : 6)
  const scaleTarget = pressScale ?? (variant === 'ghost' ? 0.96 : 0.985)

  const isGhost = variant === 'ghost'
  const bg = isGhost ? colors.card : accent
  const stroke = isGhost ? (borderColor ?? `${accent}33`) : 'transparent'

  const [autoWidth, setAutoWidth] = React.useState(width ?? 320)
  const measuredWidth = width ?? autoWidth

  const progress = useSharedValue(0)
  const scale = useSharedValue(1)
  const isHolding = useRef(false)
  const isMounted = useRef(true)
  useEffect(() => () => { isMounted.current = false }, [])

  const r = Math.min(measuredWidth, height) / 2
  const perimeter = 2 * Math.abs(measuredWidth - height) + 2 * Math.PI * (r - sw / 2)

  const handleComplete = () => {
    isHolding.current = false
    progress.value = 0
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onComplete?.()
    // onComplete may navigate/unmount us; only animate if we're still alive.
    if (isMounted.current) {
      scale.value = withTiming(1, { duration: 120 })
    }
  }

  const animatedRingProps = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - progress.value),
    opacity: progress.value > 0 ? 1 : 0,
  }))

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const startHold = () => {
    if (isHolding.current) return
    isHolding.current = true
    progress.value = 0
    scale.value = withTiming(scaleTarget, { duration: 120, easing: Easing.out(Easing.quad) })
    progress.value = withTiming(1, {
      duration: holdMs,
      easing: Easing.linear,
    }, (finished?: boolean) => {
      if (finished) runOnJS(handleComplete)()
    })
  }

  const stopHold = () => {
    if (!isHolding.current) return
    isHolding.current = false
    cancelAnimation(progress)
    progress.value = withTiming(0, { duration: 200 })
    scale.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) })
  }

  const shadowStyle = isGhost
    ? null
    : {
      shadowColor: accent,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.32,
      shadowRadius: 20,
      elevation: 8,
    }

  const wrapper = (
    <Animated.View style={[{ height, width: measuredWidth }, containerStyle]}>
      <Pressable
        onPressIn={startHold}
        onPressOut={stopHold}
        style={[
          styles.pill,
          {
            height,
            borderRadius: r,
            backgroundColor: bg,
            borderWidth: isGhost ? 1.5 : 0,
            borderColor: stroke,
          },
          shadowStyle,
        ]}
      >
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        {label ? (
          <Text style={{
            fontFamily: fonts.display,
            color: textColor,
            fontSize: 28,
            letterSpacing: -0.3,
          }}>
            {label}
          </Text>
        ) : null}
        {sub ? (
          <Text style={{
            fontFamily: fonts.body,
            color: textColor,
            fontSize: 12,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            opacity: 0.85,
            marginTop: 2,
          }}>
            {sub}
          </Text>
        ) : null}
      </Pressable>

      <Svg
        width={measuredWidth}
        height={height}
        viewBox={`0 0 ${measuredWidth} ${height}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        <AnimatedRect
          x={sw / 2}
          y={sw / 2}
          width={measuredWidth - sw}
          height={height - sw}
          rx={r - sw / 2}
          fill="none"
          stroke={ring}
          strokeWidth={sw}
          strokeDasharray={perimeter}
          strokeLinecap="round"
          animatedProps={animatedRingProps}
        />
      </Svg>
    </Animated.View>
  )

  if (width) {
    return wrapper
  }
  return (
    <View
      style={{ width: '100%' }}
      onLayout={(e) => setAutoWidth(e.nativeEvent.layout.width)}
    >
      {wrapper}
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
