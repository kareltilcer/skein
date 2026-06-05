import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@skein/shared'
import Icon, { type IconName } from '../components/ui/Icon'
import SkeinLogo from '../components/ui/SkeinLogo'
import s from './Sidebar.module.css'

type Props = { collapsed: boolean }

function NavItem({ to, icon, label, end }: { to: string; icon: IconName; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => [s.navItem, isActive ? s.active : ''].filter(Boolean).join(' ')}>
      <Icon name={icon} size={20} />
      <span className={s.navLabel}>{label}</span>
    </NavLink>
  )
}

export default function Sidebar({ collapsed }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const themePref = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  return (
    <aside className={[s.aside, collapsed ? s.collapsed : ''].filter(Boolean).join(' ')}>
      <div className={s.brand}>
        <SkeinLogo size={32} tone="onBrick" />
        <span className={s.word}>{t('app.name', 'YarnLog')}</span>
      </div>

      <button type="button" className={s.cta} onClick={() => navigate('/project/new')}>
        <Icon name="plus" size={18} />
        <span>{t('action.castOn', 'Cast on')}</span>
      </button>

      <nav className={s.nav}>
        <NavItem to="/" end icon="home" label={t('nav.projects', 'Projects')} />
        <NavItem to="/library" icon="library" label={t('nav.library', 'Library')} />
        <NavItem to="/settings" icon="gear" label={t('nav.settings', 'Settings')} />
      </nav>

      <div className={s.spacer} />

      <div className={s.toggle}>
        {(['light', 'dark', 'auto'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            className={[s.toggleBtn, themePref === opt ? s.toggleActive : ''].filter(Boolean).join(' ')}
            onClick={() => setTheme(opt)}
            aria-label={opt}
            title={opt}
          >
            <Icon name={opt === 'light' ? 'sun' : opt === 'dark' ? 'moon' : 'globe'} size={16} />
          </button>
        ))}
      </div>

      <div className={s.account}>
        <div className={s.avatar}>M</div>
        <div className={s.accountMeta}>
          <span className={s.accountName}>{t('account.local', 'Local only')}</span>
          <span className={s.accountSync}>{t('account.syncOff', 'No sync · offline')}</span>
        </div>
      </div>
    </aside>
  )
}
