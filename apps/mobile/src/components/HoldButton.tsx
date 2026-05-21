import React, { useRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, cancelAnimation, runOnJS,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../theme/ThemeContext'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedRect = Animated.createAnimatedComponent(Rect) as any

type Props = {
  label: string
  sub?: string
  holdMs?: number
  color?: string
  ringColor?: string
  textColor?: string
  height?: number
  onComplete?: () => void
}

const RING_H = 88
const RING_SW = 6

export default function HoldButton({
  label, sub,
  holdMs = 3000,
  color,
  ringColor = '#FFD986',
  textColor = '#FBF6EC',
  height = RING_H,
  onComplete,
}: Props) {
  const { colors } = useTheme()
  const btnColor = color ?? colors.brick

  const [width, setWidth] = React.useState(320)
  const progress = useSharedValue(0)
  const isHolding = useRef(false)

  const r = height / 2
  const perimeter = 2 * Math.max(0, width - height) + 2 * Math.PI * (r - RING_SW / 2)

  const handleComplete = () => {
    isHolding.current = false
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onComplete?.()
  }

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - progress.value),
    opacity: progress.value > 0 ? 1 : 0,
  }))

  const startHold = () => {
    if (isHolding.current) return
    isHolding.current = true
    progress.value = 0
    progress.value = withTiming(1, {
      duration: holdMs,
      easing: Easing.linear,
    }, (finished?: boolean) => {
      if (finished) {
        runOnJS(handleComplete)()
      }
    })
  }

  const stopHold = () => {
    if (!isHolding.current) return
    isHolding.current = false
    cancelAnimation(progress)
    progress.value = withTiming(0, { duration: 200 })
  }

  return (
    <View
      style={{ width: '100%' }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={{ position: 'relative', height, width }}>
        {/* Button body */}
        <Pressable
          onPressIn={startHold}
          onPressOut={stopHold}
          style={[
            styles.pill,
            { height, borderRadius: r, backgroundColor: btnColor },
          ]}
        >
          <Text style={[styles.label, { fontFamily: 'Caprasimo_400Regular', color: textColor }]}>
            {label}
          </Text>
          {sub ? (
            <Text style={[styles.sub, { color: textColor }]}>{sub}</Text>
          ) : null}
        </Pressable>

        {/* Progress ring */}
        <Svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transform: [{ rotate: '-90deg' }] }}
          pointerEvents="none"
        >
          <AnimatedRect
            x={RING_SW / 2}
            y={RING_SW / 2}
            width={width - RING_SW}
            height={height - RING_SW}
            rx={r - RING_SW / 2}
            fill="none"
            stroke={ringColor}
            strokeWidth={RING_SW}
            strokeDasharray={perimeter}
            strokeLinecap="round"
            animatedProps={animatedProps}
          />
        </Svg>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 28,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
})
