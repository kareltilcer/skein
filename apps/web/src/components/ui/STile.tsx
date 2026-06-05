import { STITCH_MAP } from '@skein/shared'
import StitchGlyph from './StitchGlyph'
import s from './STile.module.css'

type Props = {
  id: string
  w?: number
  h?: number
  active?: boolean
  dim?: boolean
  big?: boolean
}

export default function STile({ id, w, h, active, dim, big }: Props) {
  const def = STITCH_MAP[id]
  const cls = [s.tile, active ? s.active : '', dim ? s.dim : '', big ? s.big : ''].filter(Boolean).join(' ')
  const style: React.CSSProperties = {}
  if (w) style.width = w
  if (h) style.height = h
  return (
    <div className={cls} style={style} title={def?.name ?? id}>
      <StitchGlyph symbol={def?.symbol ?? 'dot'} size={big ? 48 : 22} />
    </div>
  )
}
