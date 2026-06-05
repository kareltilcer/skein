type Props = {
  size?: number
  /**
   * `theme` (default) — follows the active palette (brick ball + mustard wraps).
   * `onBrick` — for use on top of a brick-colored surface (cream ball + mustard wraps).
   * `mono` — single-color silhouette for very small uses.
   */
  tone?: 'theme' | 'onBrick' | 'mono'
  fg?: string
  accent?: string
}

export default function SkeinLogo({ size = 40, tone = 'theme', fg, accent }: Props) {
  const ball = fg ?? (
    tone === 'onBrick' ? '#FBF6EC' :
    tone === 'mono'    ? 'currentColor' :
    'var(--color-brick)'
  )
  const strand = accent ?? (
    tone === 'mono' ? 'currentColor' :
    'var(--color-mustard)'
  )
  // Trailing thread reads as the same yarn as the ball (matches design + mobile).
  const thread = ball
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden>
      <circle cx="28" cy="30" r="18" fill={ball} />
      <path d="M14 24 Q 28 18 42 24" stroke={strand} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M12 32 Q 28 26 44 32" stroke={strand} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M14 40 Q 28 34 42 40" stroke={strand} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M20 16 Q 28 22 36 16" stroke={strand} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M44 24 Q 52 18 50 10" stroke={thread} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="9" r="2" fill={thread} />
    </svg>
  )
}
