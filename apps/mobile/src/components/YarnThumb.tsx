import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export default function YarnThumb({ color, size = 40 }: Props) {
  const accent = lighten(color)
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Circle cx="28" cy="30" r="18" fill={color}/>
      <Path d="M14 24 Q 28 18 42 24" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <Path d="M12 32 Q 28 26 44 32" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <Path d="M14 40 Q 28 34 42 40" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <Path d="M20 16 Q 28 22 36 16" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <Path d="M44 24 Q 52 18 50 10" stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      <Circle cx="50" cy="9" r="2" fill={color}/>
    </Svg>
  )
}

function lighten(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, ((n >> 16) & 0xff) + 60)
  const g = Math.min(255, ((n >> 8)  & 0xff) + 60)
  const b = Math.min(255, ((n)       & 0xff) + 60)
  return `rgb(${r},${g},${b})`
}
