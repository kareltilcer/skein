import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  STITCH_PICKER_GROUPS,
  PICKER_FILTER_CHIPS,
  getPickerGroups,
  type PickerFilter,
  type Craft,
  type StitchDef,
} from '@skein/shared'
import Modal from './Modal'
import Btn from './Btn'
import Icon from './Icon'
import StitchGlyph from './StitchGlyph'
import { useStitchMap } from '../../hooks/useStitchMap'
import s from './StitchPickerModal.module.css'

type Props = {
  open: boolean
  onClose: () => void
  /** Fired when the user taps a stitch tile. */
  onSelect: (stitch: StitchDef) => void
  /** Fired when the user taps "Define a custom stitch". The host owns navigation. */
  onDefineCustom?: () => void
  /** Preselect the corresponding filter chip when opening. */
  defaultCraftFilter?: Craft
}

const PALETTE_TOKENS = ['brick', 'mustard', 'forest', 'brickDk'] as const

export default function StitchPickerModal({
  open, onClose, onSelect, onDefineCustom, defaultCraftFilter,
}: Props) {
  const { t } = useTranslation()
  const stitchMap = useStitchMap()
  const [filter, setFilter] = React.useState<PickerFilter>(defaultCraftFilter ?? 'all')

  // Reset filter each time the picker opens, so the user lands on their craft.
  React.useEffect(() => {
    if (open) setFilter(defaultCraftFilter ?? 'all')
  }, [open, defaultCraftFilter])

  const visibleGroups = React.useMemo(() => getPickerGroups(filter), [filter])
  const totalCount = React.useMemo(() => STITCH_PICKER_GROUPS.reduce((a, g) => a + g.ids.length, 0), [])

  return (
    <Modal open={open} onClose={onClose} align="bottom" width={680}>
      <div className={s.head}>
        <div>
          <h2 className={s.title}>{t('stitchPicker.title', 'Pick a stitch')}</h2>
          <div className={s.sub}>{t('stitchPicker.sub', 'Tap to add · {{count}} predefined + custom', { count: totalCount })}</div>
        </div>
        <button type="button" onClick={onClose} className={s.closeBtn} aria-label={t('action.close', 'Close')}>
          <Icon name="x" size={22} />
        </button>
      </div>

      <div className={s.filters}>
        {PICKER_FILTER_CHIPS.map((chip) => {
          const active = filter === chip.id
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={[s.filterChip, active ? s.filterChipActive : ''].filter(Boolean).join(' ')}
            >
              {t(`stitchPicker.filter.${chip.id}`, chip.label)}
            </button>
          )
        })}
      </div>

      <Modal.Body className={s.gridBody}>
        {filter === 'custom' ? (
          <div className={s.customRoll}>
            <h3 className={s.customRollTitle}>{t('stitchPicker.customTitle', 'Roll your own.')}</h3>
            <p className={s.customRollBody}>
              {t('stitchPicker.customBody', "Got a stitch that's not in the list? Define it once, reuse it forever.")}
            </p>
            <Btn icon="plus" size="md" onClick={() => { onDefineCustom?.(); onClose() }}>
              {t('stitchPicker.defineCta', 'Define a custom stitch')}
            </Btn>
          </div>
        ) : (
          <>
            {visibleGroups.map((group) => {
              const items = group.ids.map((id) => stitchMap[id]).filter((d): d is StitchDef => Boolean(d))
              if (items.length === 0) return null
              return (
                <section key={group.id} className={s.group}>
                  <header className={s.groupHead}>
                    <span className={s.groupLabel}>{group.label}</span>
                    <span className={s.groupCount}>{items.length}</span>
                  </header>
                  <div className={s.tiles}>
                    {items.map((stitch, i) => {
                      const token = PALETTE_TOKENS[i % PALETTE_TOKENS.length]
                      return (
                        <button
                          key={stitch.id}
                          type="button"
                          className={s.tile}
                          onClick={() => { onSelect(stitch); onClose() }}
                        >
                          <span
                            className={s.tileGlyph}
                            style={{ background: `var(--color-${token})` }}
                          >
                            <StitchGlyph symbol={stitch.symbol} color="#FBF6EC" size={20} />
                          </span>
                          <span className={s.tileAbbr}>{stitch.abbr}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
            {onDefineCustom && (
              <button type="button" className={s.defineCustom} onClick={() => { onDefineCustom(); onClose() }}>
                <Icon name="plus" size={14} />
                <span>{t('stitchPicker.defineCta', 'Define a custom stitch')}</span>
              </button>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  )
}
