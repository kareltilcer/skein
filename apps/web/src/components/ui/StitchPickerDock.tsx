import { useTranslation } from 'react-i18next'
import {
  computeDockIds,
  type Craft,
  type StitchDef,
} from '@skein/shared'
import Icon from './Icon'
import StitchGlyph from './StitchGlyph'
import { useStitchMap } from '../../hooks/useStitchMap'
import s from './StitchPickerDock.module.css'

type Props = {
  craft: Craft
  recents: string[]
  /** Label inserted into the "Tap to add to {target}" caption. */
  target: string
  onPick: (stitch: StitchDef) => void
  onOpenPicker: () => void
}

const ACCENT_TOKENS = ['brick', 'mustard', 'forest'] as const

/**
 * Bottom-pinned 6-tile stitch dock with an "All N stitches" overflow link.
 * Used by the wizard Step 3 + library builders.
 */
export default function StitchPickerDock({
  craft, recents, target, onPick, onOpenPicker,
}: Props) {
  const { t } = useTranslation()
  const stitchMap = useStitchMap()
  const ids = computeDockIds(craft, recents, stitchMap)
  const dockStitches = ids.map((id) => stitchMap[id]).filter((d): d is StitchDef => Boolean(d))
  const totalForCraft = Object.values(stitchMap).filter((d): d is StitchDef => !!d && d.type === craft).length

  return (
    <div className={s.dock}>
      <div className={s.head}>
        <span className={s.caption}>
          {t('stitchDock.tapToAdd', { target, defaultValue: `Tap to add to ${target}` })} ✱
        </span>
        <button type="button" className={s.allLink} onClick={onOpenPicker}>
          <span>{t('stitchDock.allStitches', { count: totalForCraft, defaultValue: `All ${totalForCraft} stitches` })}</span>
          <Icon name="chevR" size={12} />
        </button>
      </div>
      <div className={s.tiles}>
        {dockStitches.map((stitch, i) => {
          const token = ACCENT_TOKENS[i % ACCENT_TOKENS.length]
          return (
            <button
              key={stitch.id}
              type="button"
              className={s.tile}
              onClick={() => onPick(stitch)}
            >
              <span className={s.glyph} style={{ background: `var(--color-${token})` }}>
                <StitchGlyph symbol={stitch.symbol} color="#FBF6EC" size={16} />
              </span>
              <span className={s.abbr}>{stitch.abbr}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
