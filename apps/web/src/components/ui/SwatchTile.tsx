import StitchGlyph from './StitchGlyph'
import s from './SwatchTile.module.css'
import { STITCH_MAP } from '@skein/shared'

type Props = {
  pattern: string[]
  size?: number
}

export default function SwatchTile({ pattern, size = 88 }: Props) {
  const ids = pattern.length >= 4 ? pattern.slice(0, 4) : [...pattern, ...pattern, ...pattern, ...pattern].slice(0, 4)
  return (
    <div className={s.swatch} style={{ width: size, height: size }}>
      {ids.map((id, i) => (
        <div key={i} className={s.cell}>
          <StitchGlyph symbol={STITCH_MAP[id]?.symbol ?? 'dot'} size={size / 3.2} />
        </div>
      ))}
    </div>
  )
}
