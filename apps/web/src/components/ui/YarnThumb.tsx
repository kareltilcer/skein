type Props = { color: string; size?: number }

function lighten(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, ((n >> 16) & 0xff) + 60)
  const g = Math.min(255, ((n >> 8)  & 0xff) + 60)
  const b = Math.min(255, ((n)       & 0xff) + 60)
  return `rgb(${r},${g},${b})`
}

export default function YarnThumb({ color, size = 40 }: Props) {
  const accent = lighten(color)
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden>
      <circle cx="28" cy="30" r="18" fill={color} />
      <path d="M14 24 Q 28 18 42 24" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M12 32 Q 28 26 44 32" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M14 40 Q 28 34 42 40" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M20 16 Q 28 22 36 16" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M44 24 Q 52 18 50 10" stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="9" r="2" fill={color} />
    </svg>
  )
}
