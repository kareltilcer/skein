import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useSettingsStore,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  type LanguageCode,
} from '@skein/shared'
import Btn from '../../components/ui/Btn'
import Icon from '../../components/ui/Icon'
import SkeinLogo from '../../components/ui/SkeinLogo'
import s from './WelcomeView.module.css'

export default function WelcomeView() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const setLanguage = useSettingsStore((st) => st.setLanguage)
  const markSeen = useSettingsStore((st) => st.markWelcomeSeen)
  const savedLang = useSettingsStore((st) => st.language)
  const code = isSupportedLanguage(savedLang) ? savedLang : 'en'

  const pillRef = React.useRef<HTMLButtonElement>(null)
  const [langOpen, setLangOpen] = React.useState(false)

  function pickLang(c: LanguageCode) {
    setLanguage(c)
    i18n.changeLanguage(c)
    setLangOpen(false)
  }

  function castOn() {
    markSeen()
    navigate('/project/new')
  }
  function peekLibrary() {
    markSeen()
    navigate('/library')
  }

  // Close lang popover on Esc / outside click.
  React.useEffect(() => {
    if (!langOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setLangOpen(false) }
    function onPointer(e: PointerEvent) {
      const t = e.target as Node
      if (pillRef.current?.contains(t)) return
      const pop = document.getElementById('welcome-lang-popover')
      if (pop?.contains(t)) return
      setLangOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer, true)
    }
  }, [langOpen])

  return (
    <div className={s.wrap}>
      <header className={s.topBar}>
        <div className={s.langPillWrap}>
          <button
            ref={pillRef}
            type="button"
            className={s.langPill}
            onClick={() => setLangOpen((o) => !o)}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
          >
            <Icon name="globe" size={14} />
            <span className={s.langCode}>{code}</span>
            <Icon name="chevDown" size={12} />
          </button>
          {langOpen && (
            <div id="welcome-lang-popover" className={s.langPopover} role="listbox">
              <div className={s.langTitle}>{t('welcome.languageModalTitle', 'Choose your language')}</div>
              <div className={s.langList}>
                {SUPPORTED_LANGUAGES.map((l) => {
                  const active = l.code === code
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => pickLang(l.code)}
                      className={[s.langRow, active ? s.langRowActive : ''].filter(Boolean).join(' ')}
                      role="option"
                      aria-selected={active}
                    >
                      <span className={s.langRowCode}>{l.code}</span>
                      <span className={s.langRowName}>{l.native}</span>
                      {active && <Icon name="check" size={16} />}
                    </button>
                  )
                })}
              </div>
              <div className={s.langHint}>{t('welcome.languageSwitchHint', 'You can switch anytime in Settings.')}</div>
            </div>
          )}
        </div>
      </header>

      <section className={s.center}>
        <div className={s.logoWrap}>
          <SkeinLogo size={132} />
          <span className={s.motifStar} aria-hidden>* * *</span>
          <span className={s.motifSlash} aria-hidden>// // //</span>
        </div>

        <h1 className={s.greeting}>{t('welcome.greeting', 'Welcome to YarnLog.')}</h1>
        <p className={s.tagline}>{t('welcome.tagline', 'stitch happens.')}</p>
        <p className={s.body}>{t('welcome.body', 'Build a pattern, hit start, and we\'ll keep your place — row by row, repeat by repeat. Both hands free for the needles.')}</p>

        <div className={s.cta}>
          <Btn size="lg" icon="plus" onClick={castOn}>{t('welcome.ctaCastOn', 'Cast on first project')}</Btn>
          <Btn size="lg" variant="ghost" icon="book" onClick={peekLibrary}>{t('welcome.ctaLibrary', 'Peek at the library')}</Btn>
        </div>

        <p className={s.note}>{t('welcome.note', 'no account needed · ever')}</p>
      </section>
    </div>
  )
}
