import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useCustomStitchStore,
  useSettingsStore,
  type Craft,
  type CountsAs,
  type TileColorKey,
} from '@skein/shared'
import Modal from '../../components/ui/Modal'
import Chip from '../../components/ui/Chip'
import Section from '../../components/ui/Section'
import StitchGlyph from '../../components/ui/StitchGlyph'
import s from './BuilderView.module.css'
import csStyles from './CustomStitchView.module.css'

const SYMBOL_PALETTE = [
  'vline', 'vline2', 'vlineX', 'dash', 'vee', 'vee2',
  'triUp', 'plus', 'dot', 'ring', 'ringBig', 'oval',
  'cross', 'slashR', 'slashL', 'cableL', 'cableR',
  'tee', 'teeBar', 'teeBar2', 'fan', 'flower',
]

const TILE_COLORS: { id: TileColorKey; label: string }[] = [
  { id: 'brick',     label: 'Brick' },
  { id: 'mustard',   label: 'Mustard' },
  { id: 'forest',    label: 'Forest' },
  { id: 'brickDk',   label: 'Maroon' },
  { id: 'mustardDk', label: 'Ochre' },
  { id: 'forestDk',  label: 'Moss' },
]

const COUNTS_AS_OPTIONS: { id: CountsAs; label: string; math: string }[] = [
  { id: 'inc', label: 'Increase',   math: '+1 st' },
  { id: 'one', label: 'One-to-one', math: '1 → 1' },
  { id: 'dec', label: 'Decrease',   math: '−1 st' },
]

export default function CustomStitchView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const defaultCraft = useSettingsStore((st) => st.defaultCraft)
  const addCustomStitch = useCustomStitchStore((st) => st.addCustomStitch)

  const [abbr, setAbbr] = React.useState('')
  const [name, setName] = React.useState('')
  const [craft, setCraft] = React.useState<Craft>(defaultCraft)
  const [symbol, setSymbol] = React.useState<string>('vline')
  const [tileColorKey, setTileColorKey] = React.useState<TileColorKey>('brick')
  const [countsAs, setCountsAs] = React.useState<CountsAs>('one')
  const [notation, setNotation] = React.useState('')

  const ready = abbr.trim().length > 0 && name.trim().length > 0

  function save() {
    if (!ready) return
    addCustomStitch({
      abbr: abbr.trim(),
      name: name.trim(),
      type: craft,
      symbol,
      tileColorKey,
      countsAs,
      ...(notation.trim() ? { notation: notation.trim() } : {}),
    })
    navigate(-1)
  }

  const tileBg = `var(--color-${tileColorKey})`

  return (
    <div className={s.shell}>
      <Modal.DefinerHeader
        kind={t('customStitch.draft', 'Custom · draft')}
        ready={ready}
        onClose={() => navigate(-1)}
        onSave={save}
        saveLabel={t('common.save', 'Save')}
      />

      <div className={s.titleBlock}>
        <h1 className={s.title}>{t('customStitch.title', 'Define a stitch')}</h1>
        <p className={s.sub}>
          {t('customStitch.sub', "For anything not in the standard set — grandma's secret rib, your favorite bobble variation.")}
        </p>
      </div>

      <div className={s.scrollBody}>
        {/* Live preview */}
        <div className={csStyles.previewCard}>
          <div className={csStyles.previewTile} style={{ background: tileBg }}>
            <StitchGlyph symbol={symbol} color="#FBF6EC" size={48} strokeWidth={2.4} />
            <span className={csStyles.previewAbbr}>{abbr || '—'}</span>
            <span className={csStyles.previewBadge}>NEW</span>
          </div>
          <div className={csStyles.previewBody}>
            <span className={s.eyebrow}>{t('libraryCreate.livePreview', 'Live preview')}</span>
            <div className={[csStyles.previewName, name ? '' : csStyles.previewNameMute].filter(Boolean).join(' ')}>
              {name || t('customStitch.untitled', 'Untitled stitch')}
            </div>
            <div className={csStyles.previewChips}>
              <span className={csStyles.previewChip}>{abbr || '—'}</span>
              <span className={csStyles.previewChip}>{t(`craft.${craft}`, craft)}</span>
              <span className={csStyles.previewChip}>
                {COUNTS_AS_OPTIONS.find((o) => o.id === countsAs)?.math}
              </span>
            </div>
          </div>
        </div>

        <Section
          label={t('customStitch.identityLabel', 'Abbreviation & name')}
          hint={t('customStitch.identityHint', 'shown in charts')}
        >
          <div className={csStyles.identityRow}>
            <div className={csStyles.abbrCol}>
              <input
                className={csStyles.abbrInput}
                value={abbr}
                onChange={(e) => setAbbr(e.target.value.slice(0, 8))}
                placeholder="fr"
                maxLength={8}
                autoFocus
              />
              <span className={csStyles.counter}>{abbr.length}/8</span>
            </div>
            <div className={csStyles.nameCol}>
              <input
                className={s.nameInput}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 36))}
                placeholder={t('customStitch.namePlaceholder', "Fisherman's rib")}
                maxLength={36}
              />
              <span className={csStyles.counter}>{name.length}/36</span>
            </div>
          </div>
        </Section>

        <Section label={t('customStitch.craftLabel', 'Craft')}>
          <div className={s.craftRow}>
            <Chip active={craft === 'knit'} icon="needle" onClick={() => setCraft('knit')}>{t('craft.knit', 'Knit')}</Chip>
            <Chip active={craft === 'crochet'} icon="loop" onClick={() => setCraft('crochet')}>{t('craft.crochet', 'Crochet')}</Chip>
          </div>
        </Section>

        <Section
          label={t('customStitch.symbolLabel', 'Chart symbol')}
          hint={t('customStitch.symbolHint', { count: SYMBOL_PALETTE.length, defaultValue: `${SYMBOL_PALETTE.length} marks` })}
        >
          <div className={csStyles.symbolGrid}>
            {SYMBOL_PALETTE.map((sym) => {
              const active = symbol === sym
              return (
                <button
                  key={sym}
                  type="button"
                  className={[csStyles.symbolBtn, active ? csStyles.symbolBtnActive : ''].filter(Boolean).join(' ')}
                  onClick={() => setSymbol(sym)}
                  style={active ? { background: tileBg } : undefined}
                >
                  <StitchGlyph symbol={sym} color={active ? '#FBF6EC' : 'var(--color-inkSoft)'} size={20} strokeWidth={2.1} />
                </button>
              )
            })}
          </div>
        </Section>

        <Section label={t('customStitch.tileColorLabel', 'Tile color')}>
          <div className={csStyles.tileColorRow}>
            {TILE_COLORS.map((tc) => {
              const active = tileColorKey === tc.id
              return (
                <button
                  key={tc.id}
                  type="button"
                  className={csStyles.tileColorBtn}
                  onClick={() => setTileColorKey(tc.id)}
                >
                  <span
                    className={[csStyles.tileColorSwatch, active ? csStyles.tileColorSwatchActive : ''].filter(Boolean).join(' ')}
                    style={{ background: `var(--color-${tc.id})` }}
                  />
                  <span className={csStyles.tileColorLabel}>{tc.label}</span>
                </button>
              )
            })}
          </div>
        </Section>

        <Section
          label={t('customStitch.countsAsLabel', 'Counts as')}
          hint={t('customStitch.countsAsHint', 'affects row totals')}
        >
          <div className={csStyles.countsAsRow}>
            {COUNTS_AS_OPTIONS.map((opt) => {
              const active = countsAs === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={[csStyles.countsAsBtn, active ? csStyles.countsAsBtnActive : ''].filter(Boolean).join(' ')}
                  onClick={() => setCountsAs(opt.id)}
                >
                  <span className={csStyles.countsAsName}>{opt.label}</span>
                  <span className={csStyles.countsAsMath}>{opt.math}</span>
                </button>
              )
            })}
          </div>
        </Section>

        <Section
          label={t('customStitch.notationLabel', 'How to work it')}
          hint={t('customStitch.notationHint', 'optional · for your memory')}
        >
          <textarea
            className={csStyles.notationField}
            value={notation}
            onChange={(e) => setNotation(e.target.value.slice(0, 240))}
            placeholder={t('customStitch.notationPlaceholder', 'A line or two on how to make this stitch…')}
            maxLength={240}
          />
          <div className={csStyles.counterRow}>
            <span>{t('customStitch.markdownNote', 'Plain text is fine.')}</span>
            <span>{notation.length}/240</span>
          </div>
        </Section>

        <p className={s.signoff}>{t('customStitch.signoff', '✻ one of one, just yours ✻')}</p>
      </div>
    </div>
  )
}
