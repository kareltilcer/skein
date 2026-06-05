import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useLibraryStore,
  expandStitches,
} from '@skein/shared'
import IconBtn from '../../components/ui/IconBtn'
import Btn from '../../components/ui/Btn'
import StitchTile from '../../components/ui/StitchTile'
import RepeatRowBody from '../../components/ui/RepeatRowBody'
import s from './DetailView.module.css'

export default function RowDetailView() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const row = useLibraryStore((st) => st.rows.find((r) => r.id === id))

  if (!row) {
    return (
      <div className={s.notFound}>
        <IconBtn name="back" onClick={() => navigate('/library')} aria-label={t('action.back', 'Back')} />
        <p>{t('library.notFound', 'Item not found.')}</p>
      </div>
    )
  }

  const ids = expandStitches(row.stitches)
  const total = ids.length

  return (
    <div className={s.wrap}>
      <header className={s.topBar}>
        <IconBtn name="back" onClick={() => navigate('/library')} aria-label={t('action.back', 'Back')} />
        <span className={s.eyebrow}>{t('library.detailTitleRow', 'Row')}</span>
        <span aria-hidden style={{ width: 36 }} />
      </header>

      <section className={s.hero}>
        <div className={s.heroRow}>
          {ids.slice(0, 4).map((stitchId, i) => <StitchTile key={i} id={stitchId} />)}
        </div>
        <div className={s.heroBody}>
          <h1 className={s.title}>{row.label}</h1>
          <div className={s.chips}>
            <span className={s.chip}>{t(`craft.${row.craft}`, row.craft)}</span>
            <span className={s.chip}>{total} {t('library.stsAbbr', 'sts')}</span>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.sectionHead}>
          <span className={s.sectionLabel}>{t('library.detailChart', 'Chart')}</span>
        </div>
        {row.segments
          ? <RepeatRowBody segments={row.segments} />
          : <div className={s.tiles}>{ids.map((stitchId, i) => <StitchTile key={i} id={stitchId} />)}</div>}
      </section>

      <footer className={s.foot}>
        <Btn icon="edit" onClick={() => navigate(`/library/row/${row.id}/edit`)}>{t('library.editCtaRow', 'Edit row')}</Btn>
      </footer>
    </div>
  )
}
