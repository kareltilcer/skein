import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useLibraryStore,
  expandStitches,
} from '@skein/shared'
import IconBtn from '../../components/ui/IconBtn'
import Btn from '../../components/ui/Btn'
import SwatchTile from '../../components/ui/SwatchTile'
import Icon from '../../components/ui/Icon'
import s from './DetailView.module.css'

export default function PatternDetailView() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const pat = useLibraryStore((st) => st.patterns.find((p) => p.id === id))
  const allSequences = useLibraryStore((st) => st.sequences)

  if (!pat) {
    return (
      <div className={s.notFound}>
        <IconBtn name="back" onClick={() => navigate('/library')} aria-label={t('action.back', 'Back')} />
        <p>{t('library.notFound', 'Item not found.')}</p>
      </div>
    )
  }

  const containedSequences = pat.sequenceIds
    .map((sid) => allSequences.find((s) => s.id === sid))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))

  const firstSeq = containedSequences[0]
  const firstIds = firstSeq?.rows[0] ? expandStitches(firstSeq.rows[0].stitches) : ['k', 'p', 'k', 'p']

  return (
    <div className={s.wrap}>
      <header className={s.topBar}>
        <IconBtn name="back" onClick={() => navigate('/library')} aria-label={t('action.back', 'Back')} />
        <span className={s.eyebrow}>{t('library.detailTitlePattern', 'Pattern')}</span>
        <span aria-hidden style={{ width: 36 }} />
      </header>

      <section className={s.hero}>
        <SwatchTile pattern={firstIds} size={72} />
        <div className={s.heroBody}>
          <h1 className={s.title}>{pat.name}</h1>
          <div className={s.chips}>
            <span className={s.chip}>{t(`craft.${pat.craft}`, pat.craft)}</span>
            <span className={s.chip}>
              {t('library.seqsMeta', { count: pat.sequenceIds.length, craft: '', defaultValue: `${pat.sequenceIds.length} sequences` }).trim()}
            </span>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.sectionHead}>
          <span className={s.sectionLabel}>{t('library.detailSequencesHeader', 'Sequences in this pattern')}</span>
        </div>
        <div className={s.seqList}>
          {containedSequences.map((seq, idx) => (
            <button
              key={seq.id}
              type="button"
              className={s.seqRow}
              onClick={() => navigate(`/library/sequence/${seq.id}`)}
            >
              <span className={s.seqIdx}>{idx + 1}</span>
              <span className={s.seqName}>{seq.name}</span>
              <span className={s.seqMeta}>
                {seq.rows.length} {t('library.rows', 'rows')}
                {seq.totalRepeats > 1 ? ` · ×${seq.totalRepeats}` : ''}
              </span>
              <Icon name="chevR" size={16} />
            </button>
          ))}
          {containedSequences.length === 0 && (
            <p className={s.empty}>{t('library.detailPatternEmpty', 'This pattern has no sequences yet.')}</p>
          )}
        </div>
      </section>

      <footer className={s.foot}>
        <Btn icon="edit" onClick={() => navigate(`/library/pattern/${pat.id}/edit`)}>{t('library.editCtaPattern', 'Edit pattern')}</Btn>
      </footer>
    </div>
  )
}
