import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useLibraryStore,
  type Craft,
  type LibraryPattern,
  type LibraryRow,
  type LibrarySequence,
} from '@skein/shared'
import PageHeader from '../../components/ui/PageHeader'
import SearchField from '../../components/ui/SearchField'
import Segmented from '../../components/ui/Segmented'
import Chip from '../../components/ui/Chip'
import Card from '../../components/ui/Card'
import Btn from '../../components/ui/Btn'
// Note: the inline "name + craft" Modal is replaced by full-screen builder routes.
import SwatchTile from '../../components/ui/SwatchTile'
import StitchGlyph from '../../components/ui/StitchGlyph'
import Modal from '../../components/ui/Modal'
import { STITCH_MAP } from '@skein/shared'
import LibraryCardMenu from './LibraryCardMenu'
import s from './LibraryView.module.css'

type Tab = 'patterns' | 'sequences' | 'rows'
type Filter = 'all' | Craft

function craftMatches(filter: Filter, craft: Craft): boolean {
  return filter === 'all' || filter === craft
}

function notationFromStitches(ids: string[]): string {
  const out: string[] = []
  let prev = ''
  let count = 0
  for (const id of ids) {
    if (id === prev) { count++; continue }
    if (prev) out.push(count > 1 ? `${prev}${count}` : prev)
    prev = id
    count = 1
  }
  if (prev) out.push(count > 1 ? `${prev}${count}` : prev)
  return out.join(', ')
}

function expandRow(row: { stitches: { stitchId: string; count: number }[] }): string[] {
  const out: string[] = []
  for (const s of row.stitches) for (let i = 0; i < s.count; i++) out.push(s.stitchId)
  return out
}

function PatternCardView({
  p, sequences, onDelete, onView, onEdit,
}: {
  p: LibraryPattern
  sequences: LibrarySequence[]
  onDelete: () => void
  onView: () => void
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const first = sequences.find((sq) => p.sequenceIds.includes(sq.id))
  const ids = first ? expandRow(first.rows[0] ?? { stitches: [] }) : ['k', 'p', 'k', 'p']
  return (
    <Card pad="md" hover onClick={onView} className={s.card}>
      <SwatchTile pattern={ids.length > 0 ? ids : ['k', 'p', 'k', 'p']} size={68} />
      <div className={s.cardBody}>
        <h3 className={s.cardName}>{p.name}</h3>
        <div className={s.cardMeta}>
          {t(`craft.${p.craft}`, p.craft)} · {p.sequenceIds.length} {t('library.sequences', 'sequences')}
        </div>
      </div>
      <LibraryCardMenu
        kindLabel={t('library.kindPattern', 'pattern')}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Card>
  )
}

function SequenceCardView({
  seq, onDelete, onView, onEdit,
}: {
  seq: LibrarySequence
  onDelete: () => void
  onView: () => void
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const ids = expandRow(seq.rows[0] ?? { stitches: [] })
  return (
    <Card pad="md" hover onClick={onView} className={s.card}>
      <SwatchTile pattern={ids.length > 0 ? ids : ['k']} size={68} />
      <div className={s.cardBody}>
        <h3 className={s.cardName}>{seq.name}</h3>
        <div className={s.cardMeta}>
          {t(`craft.${seq.craft}`, seq.craft)} · {seq.rows.length} {t('library.rows', 'rows')}
          {seq.totalRepeats > 1 ? ` · ×${seq.totalRepeats}` : ''}
        </div>
      </div>
      <LibraryCardMenu
        kindLabel={t('library.kindSequence', 'sequence')}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Card>
  )
}

function RowCardView({
  row, onDelete, onView, onEdit,
}: {
  row: LibraryRow
  onDelete: () => void
  onView: () => void
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const ids = expandRow(row).slice(0, 8)
  return (
    <Card pad="md" hover onClick={onView} className={s.card}>
      <div className={s.cardBody}>
        <h3 className={s.cardName}>{row.label}</h3>
        <div className={s.cardMeta}>
          {t(`craft.${row.craft}`, row.craft)} · {notationFromStitches(expandRow(row))}
        </div>
        <div className={s.rowGlyphs}>
          {ids.map((id, i) => (
            <div key={i} className={s.rowGlyphCell}>
              <StitchGlyph symbol={STITCH_MAP[id]?.symbol ?? 'dot'} size={16} />
            </div>
          ))}
        </div>
      </div>
      <LibraryCardMenu
        kindLabel={t('library.kindRow', 'row')}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Card>
  )
}

export default function LibraryView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const sequences = useLibraryStore((s) => s.sequences)
  const patterns = useLibraryStore((s) => s.patterns)
  const rows = useLibraryStore((s) => s.rows)
  const deleteRow = useLibraryStore((s) => s.deleteRow)
  const deleteSequence = useLibraryStore((s) => s.deleteSequence)
  const deletePattern = useLibraryStore((s) => s.deletePattern)

  const [tab, setTab] = React.useState<Tab>('patterns')
  const [filter, setFilter] = React.useState<Filter>('all')
  const [query, setQuery] = React.useState('')

  const [confirmDelete, setConfirmDelete] = React.useState<{ kind: Tab; id: string; name: string } | null>(null)

  const fp = patterns.filter((p) => craftMatches(filter, p.craft) && (!query || p.name.toLowerCase().includes(query.toLowerCase())))
  const fs = sequences.filter((p) => craftMatches(filter, p.craft) && (!query || p.name.toLowerCase().includes(query.toLowerCase())))
  const fr = rows.filter((r) => craftMatches(filter, r.craft) && (!query || r.label.toLowerCase().includes(query.toLowerCase())))

  function createItem() {
    if (tab === 'patterns')  navigate('/library/new/pattern')
    if (tab === 'sequences') navigate('/library/new/sequence')
    if (tab === 'rows')      navigate('/library/new/row')
  }

  function performDelete() {
    if (!confirmDelete) return
    if (confirmDelete.kind === 'patterns') deletePattern(confirmDelete.id)
    if (confirmDelete.kind === 'sequences') deleteSequence(confirmDelete.id)
    if (confirmDelete.kind === 'rows') deleteRow(confirmDelete.id)
    setConfirmDelete(null)
  }

  const tabs = [
    { id: 'patterns',  label: t('library.tabPatterns', 'Patterns'),   count: fp.length },
    { id: 'sequences', label: t('library.tabSequences', 'Sequences'), count: fs.length },
    { id: 'rows',      label: t('library.tabRows', 'Rows'),           count: fr.length },
  ]

  const tabLabel = tabs.find((x) => x.id === tab)?.label ?? ''

  function navigateToDetail(kind: Tab, id: string) {
    if (kind === 'patterns')  navigate(`/library/pattern/${id}`)
    if (kind === 'sequences') navigate(`/library/sequence/${id}`)
    if (kind === 'rows')      navigate(`/library/row/${id}`)
  }

  function navigateToEdit(kind: Tab, id: string) {
    if (kind === 'patterns')  navigate(`/library/pattern/${id}/edit`)
    if (kind === 'sequences') navigate(`/library/sequence/${id}/edit`)
    if (kind === 'rows')      navigate(`/library/row/${id}/edit`)
  }

  return (
    <div className={s.wrap}>
      <PageHeader
        eyebrow={t('library.eyebrow', 'Library')}
        title={t('library.title', 'Library')}
        sub={t('library.sub', 'Reuse what you\'ve already built.')}
        right={<Btn icon="plus" onClick={createItem}>{t('library.new', 'New')} {tabLabel}</Btn>}
      />

      <div className={s.toolbar}>
        <Segmented items={tabs} value={tab} onChange={(v) => setTab(v as Tab)} />
        <SearchField placeholder={t('library.searchPlaceholder', 'Search by name, stitch, vibe…')} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className={s.filters}>
        {(['all', 'knit', 'crochet'] as Filter[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{t(`craft.${f}`, f)}</Chip>
        ))}
      </div>

      {tab === 'patterns' && (
        fp.length === 0
          ? <div className={s.empty}>{t('library.emptyState', 'No items yet.')}</div>
          : (
            <div className={s.grid}>
              {fp.map((p) => (
                <PatternCardView
                  key={p.id}
                  p={p}
                  sequences={sequences}
                  onView={() => navigateToDetail('patterns', p.id)}
                  onEdit={() => navigateToEdit('patterns', p.id)}
                  onDelete={() => setConfirmDelete({ kind: 'patterns', id: p.id, name: p.name })}
                />
              ))}
            </div>
          )
      )}
      {tab === 'sequences' && (
        fs.length === 0
          ? <div className={s.empty}>{t('library.emptyState', 'No items yet.')}</div>
          : (
            <div className={s.grid}>
              {fs.map((seq) => (
                <SequenceCardView
                  key={seq.id}
                  seq={seq}
                  onView={() => navigateToDetail('sequences', seq.id)}
                  onEdit={() => navigateToEdit('sequences', seq.id)}
                  onDelete={() => setConfirmDelete({ kind: 'sequences', id: seq.id, name: seq.name })}
                />
              ))}
            </div>
          )
      )}
      {tab === 'rows' && (
        fr.length === 0
          ? <div className={s.empty}>{t('library.emptyState', 'No items yet.')}</div>
          : (
            <div className={s.grid}>
              {fr.map((row) => (
                <RowCardView
                  key={row.id}
                  row={row}
                  onView={() => navigateToDetail('rows', row.id)}
                  onEdit={() => navigateToEdit('rows', row.id)}
                  onDelete={() => setConfirmDelete({ kind: 'rows', id: row.id, name: row.label })}
                />
              ))}
            </div>
          )
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>{t('common.keepIt', 'Keep it')}</Btn>
            <Btn variant="primary" icon="trash" onClick={performDelete}>{t('action.delete', 'Delete')}</Btn>
          </>
        }
        width={460}
      >
        <Modal.DangerHeader
          title={
            confirmDelete?.kind === 'patterns' ? t('library.deletePatternTitle', 'Delete this pattern?')
            : confirmDelete?.kind === 'sequences' ? t('library.deleteSequenceTitle', 'Delete this sequence?')
            : t('library.deleteRowTitle', 'Delete this row?')
          }
          caption={t('common.noUndo', 'No undo')}
        />
        <p className={s.deleteBody}>
          {t('library.deleteConfirm', { name: confirmDelete?.name ?? '', defaultValue: `Remove "${confirmDelete?.name ?? ''}" from your library?` })}
        </p>
      </Modal>
    </div>
  )
}
