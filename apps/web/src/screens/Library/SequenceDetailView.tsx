import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useLibraryStore,
  expandStitches,
  type StitchInstance,
} from '@skein/shared'
import IconBtn from '../../components/ui/IconBtn'
import Btn from '../../components/ui/Btn'
import SwatchTile from '../../components/ui/SwatchTile'
import StitchTile from '../../components/ui/StitchTile'
import RepeatRowBody from '../../components/ui/RepeatRowBody'
import s from './DetailView.module.css'

export default function SequenceDetailView() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const seq = useLibraryStore((st) => st.sequences.find((sq) => sq.id === id))

  if (!seq) {
    return (
      <div className={s.notFound}>
        <IconBtn name="back" onClick={() => navigate('/library')} aria-label={t('action.back', 'Back')} />
        <p>{t('library.notFound', 'Item not found.')}</p>
      </div>
    )
  }

  const ids0 = seq.rows[0] ? expandStitches(seq.rows[0].stitches) : ['k', 'p', 'k', 'p']

  return (
    <div className={s.wrap}>
      <header className={s.topBar}>
        <IconBtn name="back" onClick={() => navigate('/library')} aria-label={t('action.back', 'Back')} />
        <span className={s.eyebrow}>{t('library.detailTitleSequence', 'Sequence')}</span>
        <span aria-hidden style={{ width: 36 }} />
      </header>

      <section className={s.hero}>
        <SwatchTile pattern={ids0} size={72} />
        <div className={s.heroBody}>
          <h1 className={s.title}>{seq.name}</h1>
          <div className={s.chips}>
            <span className={s.chip}>{t(`craft.${seq.craft}`, seq.craft)}</span>
            <span className={s.chip}>{t('library.rowsMeta', { count: seq.rows.length, craft: '', defaultValue: `${seq.rows.length} rows` }).trim()}</span>
            {seq.totalRepeats > 1 && <span className={s.chip}>×{seq.totalRepeats}</span>}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.sectionHead}>
          <span className={s.sectionLabel}>{t('library.detailRowsHeader', 'The rows')}</span>
          <span className={s.sectionHint}>{t('library.detailReadDirection', 'repeats top → bottom')}</span>
        </div>
        <div className={s.rowsList}>
          {seq.rows.map((row, i) => (
            <article key={row.id} className={s.rowCard}>
              <header className={s.rowCardHead}>
                <span className={s.rowLabel}>{row.label || t('library.detailRowNumber', { n: i + 1, defaultValue: `Row ${i + 1}` })}</span>
                <span className={s.rowCount}>{stitchTotal(row.stitches)} {t('library.stsAbbr', 'sts')}</span>
              </header>
              {row.segments
                ? <RepeatRowBody segments={row.segments} />
                : <RowTiles stitches={row.stitches} />}
            </article>
          ))}
        </div>
      </section>

      <footer className={s.foot}>
        <Btn icon="edit" onClick={() => navigate(`/library/sequence/${seq.id}/edit`)}>{t('library.editCta', 'Edit sequence')}</Btn>
      </footer>
    </div>
  )
}

function RowTiles({ stitches }: { stitches: StitchInstance[] }) {
  const ids = expandStitches(stitches)
  return (
    <div className={s.tiles}>
      {ids.map((id, i) => <StitchTile key={i} id={id} />)}
    </div>
  )
}

function stitchTotal(stitches: StitchInstance[]): number {
  return stitches.reduce((sum, x) => sum + x.count, 0)
}
