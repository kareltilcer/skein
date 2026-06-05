import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  useSettingsStore,
  resetSkeinData,
  SUPPORTED_LANGUAGES,
  languageLabel,
  type Theme,
} from '@skein/shared'
import PageHeader from '../../components/ui/PageHeader'
import Btn from '../../components/ui/Btn'
import Icon, { type IconName } from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import Tip from '../../components/ui/Tip'
import s from './SettingsView.module.css'

const THEME_OPTIONS: { id: Theme; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark',  label: 'Dark' },
  { id: 'auto',  label: 'Auto' },
]

type AccordionKey = 'defaultCraft' | 'needleUnit' | 'holdTime' | null

function AccordionRow({
  icon, iconColor, title, sub, value, open, onToggle, children,
}: {
  icon: IconName
  iconColor?: string
  title: string
  sub?: string
  value?: React.ReactNode
  open: boolean
  onToggle: () => void
  children?: React.ReactNode
}) {
  return (
    <>
      <button type="button" className={s.row} onClick={onToggle} aria-expanded={open}>
        <div className={s.rowLeft}>
          <span className={s.iconBg} style={iconColor ? { color: iconColor } : undefined}>
            <Icon name={icon} size={20} />
          </span>
          <div>
            <div className={s.rowTitle}>{title}</div>
            {sub && <div className={s.rowSub}>{sub}</div>}
          </div>
        </div>
        <div className={s.rowRight}>
          {value !== undefined && <span className={s.rowValue}>{value}</span>}
          <Icon name={open ? 'chevDown' : 'chevR'} size={16} />
        </div>
      </button>
      {open && children && <div className={s.expanded}>{children}</div>}
    </>
  )
}

export default function SettingsView() {
  const { t, i18n } = useTranslation()
  const theme = useSettingsStore((st) => st.theme)
  const setTheme = useSettingsStore((st) => st.setTheme)
  const language = useSettingsStore((st) => st.language)
  const setLanguage = useSettingsStore((st) => st.setLanguage)
  const defaultCraft = useSettingsStore((st) => st.defaultCraft)
  const setDefaultCraft = useSettingsStore((st) => st.setDefaultCraft)
  const needleUnit = useSettingsStore((st) => st.needleSizeUnit)
  const setNeedleUnit = useSettingsStore((st) => st.setNeedleSizeUnit)
  const holdTime = useSettingsStore((st) => st.holdTimeMs)
  const setHoldTime = useSettingsStore((st) => st.setHoldTimeMs)

  const [open, setOpen] = React.useState<AccordionKey>(null)
  const [langOpen, setLangOpen] = React.useState(false)
  const [confirmReset, setConfirmReset] = React.useState(false)
  const [resetting, setResetting] = React.useState(false)

  function toggle(key: NonNullable<AccordionKey>) {
    setOpen((cur) => (cur === key ? null : key))
  }

  return (
    <div className={s.wrap}>
      <PageHeader
        eyebrow={t('settings.eyebrow', 'The cozy customization corner')}
        title={t('settings.title', 'Settings')}
        sub={t('settings.sub', 'Make YarnLog yours. Theme, language, and an optional account — no pestering, ever.')}
      />

      {/* ─── Appearance ──────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.sectionTitle}>{t('settings.section.appearance', 'Appearance')}</div>
        <div className={s.themeChips}>
          {THEME_OPTIONS.map((o) => {
            const active = theme === o.id
            const isDark = o.id === 'dark'
            const isAuto = o.id === 'auto'
            return (
              <button
                key={o.id}
                type="button"
                className={[s.themeOption, active ? s.themeOptionActive : ''].filter(Boolean).join(' ')}
                onClick={() => setTheme(o.id)}
              >
                <span
                  className={s.preview}
                  style={{
                    background: isAuto
                      ? 'linear-gradient(120deg, #F2EBDD 0 50%, #120805 50% 100%)'
                      : isDark ? '#120805' : '#F2EBDD',
                  }}
                >
                  <span
                    className={s.previewAccent}
                    style={{
                      background: isAuto
                        ? 'linear-gradient(120deg, #9C3D2E 0 50%, #FF7A4D 50% 100%)'
                        : isDark ? '#FF7A4D' : '#9C3D2E',
                    }}
                  />
                  {isDark && <span className={s.previewBadge}><Icon name="moon" size={12} /></span>}
                  {isAuto && <span className={s.previewBadge}><Icon name="sparkle" size={11} color="#FBF6EC" /></span>}
                </span>
                <span className={s.themeOptionLabel}>{t(`settings.theme.${o.id}`, o.label)}</span>
                {isAuto && <span className={s.themeOptionSub}>{t('settings.theme.autoMatchesOS', 'Matches OS')}</span>}
              </button>
            )
          })}
        </div>
        <Tip>
          <b style={{ color: 'var(--color-ink)' }}>{t('settings.theme.darkBold', 'Dark mode')}</b>{' '}
          {t('settings.theme.darkBody', 'shifts everything to a deep warm red so your eyes stay relaxed during late-night knit-alongs.')}{' '}
          <b style={{ color: 'var(--color-ink)' }}>{t('settings.theme.autoBold', 'Auto')}</b>{' '}
          {t('settings.theme.autoBody', 'follows your system — light by day, dark at night.')}
        </Tip>
      </section>

      {/* ─── Basics ──────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.sectionTitle}>{t('settings.section.basics', 'Basics')}</div>

        <button
          type="button"
          className={s.row}
          onClick={() => setLangOpen(true)}
        >
          <div className={s.rowLeft}>
            <span className={s.iconBg} style={{ color: 'var(--color-forest)' }}><Icon name="globe" size={20} /></span>
            <div>
              <div className={s.rowTitle}>{t('settings.language', 'Language')}</div>
              <div className={s.rowSub}>{languageLabel(language)}</div>
            </div>
          </div>
          <Icon name="chevR" size={16} />
        </button>

        <AccordionRow
          icon="needle"
          iconColor="var(--color-brick)"
          title={t('settings.defaultCraft', 'Default craft')}
          sub={t('settings.defaultCraftSub', 'Pre-selected when starting new projects.')}
          value={defaultCraft === 'knit' ? t('craft.knit', 'Knit') : t('craft.crochet', 'Crochet')}
          open={open === 'defaultCraft'}
          onToggle={() => toggle('defaultCraft')}
        >
          <div className={s.chipRow}>
            {(['knit', 'crochet'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDefaultCraft(c)}
                className={[s.chip, defaultCraft === c ? s.chipActive : ''].filter(Boolean).join(' ')}
              >
                <Icon name={c === 'knit' ? 'needle' : 'loop'} size={14} />
                {t(`craft.${c}`, c)}
              </button>
            ))}
          </div>
        </AccordionRow>

        <AccordionRow
          icon="grid"
          iconColor="var(--color-mustardDk)"
          title={t('settings.needleUnit', 'Needle units')}
          sub={t('settings.needleUnitSub', 'How needle/hook sizes display by default.')}
          value={needleUnit === 'mm' ? t('settings.needleMetricMm', 'Metric · mm') : t('settings.needleMetricUs', 'US')}
          open={open === 'needleUnit'}
          onToggle={() => toggle('needleUnit')}
        >
          <div className={s.chipRow}>
            {(['mm', 'us'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setNeedleUnit(u)}
                className={[s.chip, needleUnit === u ? s.chipActive : ''].filter(Boolean).join(' ')}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </AccordionRow>

        <AccordionRow
          icon="bulb"
          iconColor="var(--color-mustardDk)"
          title={t('settings.holdTime', 'Hold time')}
          sub={t('settings.holdTimeSub', 'How long to press "Row done" before the count advances.')}
          value={t('common.secondsLong', { seconds: (holdTime / 1000).toFixed(1), defaultValue: `${(holdTime / 1000).toFixed(1)} seconds` })}
          open={open === 'holdTime'}
          onToggle={() => toggle('holdTime')}
        >
          <div className={s.chipRow}>
            {[1000, 1400, 2000, 3000].map((ms) => (
              <button
                key={ms}
                type="button"
                onClick={() => setHoldTime(ms)}
                className={[s.chip, holdTime === ms ? s.chipActive : ''].filter(Boolean).join(' ')}
              >
                {(ms / 1000).toFixed(ms < 2000 ? 1 : 0)}s
              </button>
            ))}
          </div>
        </AccordionRow>
      </section>

      {/* ─── Cloud backup hero ───────────────────────────────── */}
      <section className={s.cloudCard}>
        <div className={s.cloudHead}>
          <span className={s.cloudDisc}><Icon name="cloud" size={22} color="#FBF6EC" /></span>
          <div>
            <h3 className={s.cloudTitle}>{t('settings.cloud', 'Cloud backup')}</h3>
            <span className={s.cloudCaption}>{t('settings.cloudCaption', 'Totally optional. Always.')}</span>
          </div>
        </div>
        <p className={s.cloudBody}>
          {t('settings.cloudBody', "Add an account to sync projects across devices and back up your pattern library. We won't pester you.")}
        </p>
        <div className={s.cloudCta}>
          <Btn variant="mustard" disabled>{t('settings.createAccount', 'Create account')}</Btn>
          <span className={s.cloudLink}>{t('settings.alreadyHave', 'already have one?')} <a>{t('settings.signIn', 'Sign in')}</a></span>
        </div>
      </section>

      {/* ─── More ────────────────────────────────────────────── */}
      <section className={s.section}>
        <div className={s.sectionTitle}>{t('settings.section.more', 'More')}</div>
        <div className={s.moreGroup}>
          <button type="button" className={s.miniRow} disabled>
            <Icon name="save" size={18} />
            <span className={s.miniLabel}>{t('settings.exportPdf', 'Export pattern as PDF')}</span>
            <span className={s.miniSoon}>{t('settings.soon', 'Soon')}</span>
          </button>
          <button type="button" className={[s.miniRow, s.miniRowAccent].join(' ')} disabled>
            <Icon name="sparkle" size={18} />
            <span className={s.miniLabel}>{t('settings.pro', 'YarnLog Pro · ad-free forever')}</span>
            <span className={s.miniSoon}>{t('settings.soon', 'Soon')}</span>
          </button>
          <button type="button" className={s.miniRow}>
            <Icon name="user" size={18} />
            <span className={s.miniLabel}>{t('settings.tellFriend', 'Tell a friend (please?)')}</span>
            <Icon name="chevR" size={14} />
          </button>
          <button type="button" className={s.miniRow}>
            <Icon name="book" size={18} />
            <span className={s.miniLabel}>{t('settings.glossary', 'The little knitting glossary')}</span>
            <Icon name="chevR" size={14} />
          </button>
        </div>
      </section>

      {/* ─── Danger ──────────────────────────────────────────── */}
      <section className={s.danger}>
        <div className={s.dangerTitle}>{t('settings.reset.title', 'Start fresh')}</div>
        <p className={s.dangerBody}>
          {t('settings.reset.sub', 'Wipes projects, custom stitches, and library customizations. Your preferences stay.')}
        </p>
        <Btn variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
          {t('settings.reset.cta', 'Reset all data')}
        </Btn>
      </section>

      <p className={s.footer}>{t('settings.footer', 'YarnLog 1.0 · made with yarn & code')}</p>

      <Modal
        open={langOpen}
        onClose={() => setLangOpen(false)}
        title={t('settings.language', 'Language')}
      >
        <div className={s.langList}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLanguage(l.code); i18n.changeLanguage(l.code); setLangOpen(false) }}
              className={[s.langRow, language === l.code ? s.langRowActive : ''].filter(Boolean).join(' ')}
            >
              <span>{l.native}</span>
              {language === l.code && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={confirmReset}
        onClose={() => !resetting && setConfirmReset(false)}
        width={460}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirmReset(false)} disabled={resetting}>
              {t('common.keepIt', 'Keep it')}
            </Btn>
            <Btn
              icon="trash"
              disabled={resetting}
              onClick={async () => {
                setResetting(true)
                await resetSkeinData()
                setResetting(false)
                setConfirmReset(false)
              }}
            >
              {resetting ? t('settings.reset.resetting', 'Resetting…') : t('settings.reset.confirm', 'Yes, reset')}
            </Btn>
          </>
        }
      >
        <Modal.DangerHeader
          title={t('settings.reset.title', 'Start fresh')}
          caption={t('settings.reset.noUndo', 'No undo')}
        />
        <p className={s.resetBody}>
          {t('settings.reset.warn', 'This removes all your projects and library customizations. There is no undo.')}
        </p>
      </Modal>
    </div>
  )
}
