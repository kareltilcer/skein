import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useProjectStore,
  useSettingsStore,
  formatNeedleSize,
  type Project,
} from '@skein/shared'
import Btn from '../../components/ui/Btn'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import SearchField from '../../components/ui/SearchField'
import Icon from '../../components/ui/Icon'
import YarnThumb from '../../components/ui/YarnThumb'
import s from './HomeView.module.css'

function ProjectTile({ p, onClick }: { p: Project; onClick: () => void }) {
  const { t } = useTranslation()
  const unit = useSettingsStore((st) => st.needleSizeUnit)
  const done = p.status === 'finished'
  return (
    <Card hover pad="md" onClick={onClick} className={s.card}>
      <div className={s.cardHeader}>
        <YarnThumb color={p.yarnColor} size={64} />
        <div className={s.cardHeaderText}>
          <div className={s.cardNameRow}>
            <h3 className={s.cardName}>{p.name}</h3>
            {done && <span className={s.doneTag}>{t('projectCard.doneTag', 'DONE')}</span>}
          </div>
          <div className={s.cardMeta}>
            {p.yarnWeight} · {formatNeedleSize(p.craft, p.needleSize, unit)}
          </div>
        </div>
      </div>
      <div className={s.partsRow}>
        <span className={s.partsCount}>
          {t('projectCard.parts', { count: p.parts.length, defaultValue: `${p.parts.length} parts` })}
        </span>
        {p.parts.map((part) => (
          <span key={part.id} className={s.partChip} title={part.name}>
            <span className={s.partDot} style={{ background: part.color }} />
            {part.name}
          </span>
        ))}
      </div>
    </Card>
  )
}

export default function HomeView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const projects = useProjectStore((st) => st.projects)
  const [query, setQuery] = React.useState('')
  const [finishedOpen, setFinishedOpen] = React.useState(false)

  const filtered = projects.filter((p) =>
    !query
    || p.name.toLowerCase().includes(query.toLowerCase())
    || p.notes.toLowerCase().includes(query.toLowerCase()),
  )
  const active = filtered.filter((p) => p.status === 'active')
  const finished = filtered.filter((p) => p.status === 'finished')

  const subtitle =
    t('home.subActive', { count: active.length, defaultValue: `${active.length} on the needles` })
    + (finished.length
      ? t('home.subFinishedSuffix', { count: finished.length, defaultValue: ` · ${finished.length} in the basket` })
      : '')
    + t('home.subTrail', '.')

  return (
    <div className={s.wrap}>
      <PageHeader
        eyebrow={t('home.eyebrow', 'Workshop')}
        title={t('home.title', 'Hey, Knitter')}
        sub={subtitle}
        right={<SearchField placeholder={t('home.searchPlaceholder', 'Search projects…')} value={query} onChange={(e) => setQuery(e.target.value)} />}
      />

      {/* Brick→brickDk "Cast on" hero banner — design's primary CTA. */}
      <button type="button" className={s.featured} onClick={() => navigate('/project/new')}>
        <span className={s.featuredIcon}>
          <Icon name="plus" size={32} color="#FBF6EC" />
        </span>
        <div className={s.featuredBody}>
          <div className={s.featuredTitle}>{t('home.castOn', 'Cast on a project')}</div>
          <div className={s.featuredSub}>{t('home.castOnSub', 'Build your pattern step by step.')}</div>
        </div>
        <Icon name="chevR" size={22} color="#FBF6EC" />
      </button>

      {active.length === 0 && projects.length === 0 && (
        <Card pad="lg" className={s.emptyCard}>
          <h3 className={s.emptyTitle}>{t('home.emptyTitle', 'Nothing on the needles yet')}</h3>
          <p className={s.emptySub}>{t('home.emptyHint', 'No projects yet. Cast on your first one above!')}</p>
          <Btn icon="plus" onClick={() => navigate('/project/new')}>{t('action.castOn', 'Cast on')}</Btn>
        </Card>
      )}

      {active.length > 0 && (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>
              {t('home.onTheNeedles', 'On the needles')} · {active.length}
            </span>
            <span className={s.eyebrowRight}>{t('home.recent', 'Recent')}</span>
          </div>
          <div className={s.grid}>
            {active.map((p) => (
              <ProjectTile key={p.id} p={p} onClick={() => navigate(`/project/${p.id}`)} />
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section className={s.section}>
          <button type="button" className={s.finishedToggle} onClick={() => setFinishedOpen((o) => !o)}>
            <span className={s.finishedIcon}>
              <Icon name="check" size={16} />
            </span>
            <span className={s.finishedLabel}>
              {t('home.finished', 'Finished')} · {finished.length}
            </span>
            <Icon name={finishedOpen ? 'chevDown' : 'chevR'} size={16} />
          </button>
          {finishedOpen && (
            <div className={s.grid}>
              {finished.map((p) => (
                <ProjectTile key={p.id} p={p} onClick={() => navigate(`/project/${p.id}`)} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
