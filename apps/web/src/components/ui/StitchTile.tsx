import { useTranslation } from 'react-i18next'
import { stitchHue } from '@skein/shared'
import { useStitchMap } from '../../hooks/useStitchMap'
import { useTheme } from '../../theme/ThemeProvider'
import StitchGlyph from './StitchGlyph'
import s from './StitchTile.module.css'

export type TileState = 'normal' | 'dim' | 'inrepeat' | 'start' | 'end' | 'tap'

type Props = {
  id: string
  state?: TileState
  onClick?: () => void
  /** Width override — defaults to 28px. The chart cell scales together (h ≈ w × 1.43). */
  size?: number
}

export default function StitchTile({ id, state = 'normal', onClick, size = 28 }: Props) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const stitchMap = useStitchMap()
  const def = stitchMap[id]
  const symbol = def?.symbol ?? 'dot'
  const abbr   = def?.abbr   ?? id
  const c = stitchHue(colors, id)
  const anchor = state === 'start' || state === 'end'
  const inRep  = state === 'inrepeat' || anchor

  const cls = [
    s.tile,
    inRep ? s.inRepeat : '',
    anchor ? s.anchor : '',
    state === 'dim' ? s.dim : '',
    state === 'tap' ? s.tap : '',
    onClick ? s.tappable : '',
  ].filter(Boolean).join(' ')

  const h = Math.round(size * 1.43)

  const body = (
    <div className={s.wrap}>
      {anchor && (
        <span className={s.anchorBadge} style={{ background: colors.brick }}>
          {state === 'start'
            ? t('wizard.step3RowAnchorStart', 'START')
            : t('wizard.step3RowAnchorEnd', 'END')}
        </span>
      )}
      <div
        className={cls}
        style={{
          width: size,
          height: h,
          borderColor: anchor || inRep ? colors.brick : c,
        }}
      >
        <StitchGlyph symbol={symbol} color={c} size={Math.round(h * 0.34)} strokeWidth={1.9} />
        <span className={s.abbr} style={{ color: c }}>{abbr}</span>
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={s.button}>
        {body}
      </button>
    )
  }
  return body
}
