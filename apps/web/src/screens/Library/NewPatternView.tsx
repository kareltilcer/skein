import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useLibraryStore,
  useSettingsStore,
  uuid,
  type Craft,
  type LibraryPattern,
} from '@skein/shared'
import Modal from '../../components/ui/Modal'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Icon from '../../components/ui/Icon'
import Section from '../../components/ui/Section'
import ReuseChooser from '../../components/ui/ReuseChooser'
import s from './BuilderView.module.css'
import patStyles from './NewPatternView.module.css'

export default function NewPatternView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const existing = useLibraryStore((st) => (id ? st.patterns.find((p) => p.id === id) : undefined))
  const allSequences = useLibraryStore((st) => st.sequences)
  const addPattern = useLibraryStore((st) => st.addPattern)
  const updatePattern = useLibraryStore((st) => st.updatePattern)
  const defaultCraft = useSettingsStore((st) => st.defaultCraft)

  const isEditing = !!existing
  const [name, setName] = React.useState(existing?.name ?? '')
  const [craft, setCraft] = React.useState<Craft>(existing?.craft ?? defaultCraft)
  const [sequenceIds, setSequenceIds] = React.useState<string[]>(existing?.sequenceIds ?? [])
  const [pickerOpen, setPickerOpen] = React.useState(false)

  const ready = name.trim().length > 0 && sequenceIds.length > 0
  const containedSequences = sequenceIds
    .map((sid) => allSequences.find((s) => s.id === sid))
    .filter((sq): sq is NonNullable<typeof sq> => Boolean(sq))

  function save() {
    if (!ready) return
    const payload: LibraryPattern = {
      id: existing?.id ?? uuid(),
      name: name.trim(),
      craft,
      sequenceIds,
      isBuiltIn: false,
    }
    if (isEditing) updatePattern(payload)
    else addPattern(payload)
    navigate('/library')
  }

  function addSeq(seqId: string) {
    setSequenceIds((ids) => ids.includes(seqId) ? ids : [...ids, seqId])
  }
  function removeSeq(idx: number) {
    setSequenceIds((ids) => ids.filter((_, i) => i !== idx))
  }
  function move(from: number, to: number) {
    setSequenceIds((ids) => {
      const next = [...ids]
      const [moved] = next.splice(from, 1)
      if (!moved) return ids
      next.splice(to, 0, moved)
      return next
    })
  }

  const eligible = allSequences.filter((sq) => sq.craft === craft)

  return (
    <div className={s.shell}>
      <Modal.DefinerHeader
        kind={t(isEditing ? 'libraryCreate.editPatternBadge' : 'libraryCreate.draftPattern', isEditing ? 'Pattern · editing' : 'Pattern · draft')}
        ready={ready}
        onClose={() => navigate('/library')}
        onSave={save}
        saveLabel={t('common.save', 'Save')}
      />

      <div className={s.titleBlock}>
        <h1 className={s.title}>
          {isEditing
            ? t('libraryCreate.editPatternTitle', 'Edit pattern')
            : t('libraryCreate.newPatternTitle', 'New pattern')}
        </h1>
        <p className={s.sub}>
          {t('libraryCreate.newPatternSub', 'The whole make — sequences in order. Your master recipe.')}
        </p>
      </div>

      <div className={s.scrollBody}>
        <Section label={t('libraryCreate.identityLabel', 'Name & craft')}>
          <input
            className={s.nameInput}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder={t('libraryCreate.namePlaceholderPat', 'e.g. Raglan pullover')}
            autoFocus={!isEditing}
            maxLength={60}
          />
          <div className={s.craftRow}>
            <Chip active={craft === 'knit'} icon="needle" onClick={() => setCraft('knit')}>{t('craft.knit', 'Knit')}</Chip>
            <Chip active={craft === 'crochet'} icon="loop" onClick={() => setCraft('crochet')}>{t('craft.crochet', 'Crochet')}</Chip>
          </div>
        </Section>

        <Section
          label={t('libraryCreate.sequencesInPattern', 'Sequences in this pattern')}
          hint={t('libraryCreate.sequencesCount', { count: sequenceIds.length, defaultValue: `${sequenceIds.length} sequences` })}
        >
          <div className={patStyles.list}>
            {containedSequences.map((seq, idx) => (
              <article key={`${seq.id}-${idx}`} className={patStyles.row}>
                <Icon name="grip" size={16} />
                <span className={patStyles.idx}>{idx + 1}</span>
                <span className={patStyles.name}>{seq.name}</span>
                <span className={patStyles.meta}>
                  {seq.rows.length} {t('library.rows', 'rows')}
                  {seq.totalRepeats > 1 ? ` · ×${seq.totalRepeats}` : ''}
                </span>
                <button type="button" className={patStyles.moveBtn} onClick={() => move(idx, Math.max(0, idx - 1))} disabled={idx === 0} aria-label="Move up">
                  <Icon name="chevL" size={14} />
                </button>
                <button type="button" className={patStyles.moveBtn} onClick={() => move(idx, Math.min(sequenceIds.length - 1, idx + 1))} disabled={idx === sequenceIds.length - 1} aria-label="Move down">
                  <Icon name="chevR" size={14} />
                </button>
                <button type="button" className={patStyles.removeBtn} onClick={() => removeSeq(idx)} aria-label={t('action.remove', 'Remove')}>
                  <Icon name="trash" size={14} />
                </button>
              </article>
            ))}
            {containedSequences.length === 0 && (
              <p className={patStyles.empty}>
                {t('libraryCreate.patternEmpty', 'No sequences yet. Add ones you\'ve already saved.')}
              </p>
            )}
            <ReuseChooser
              kind="sequence"
              libraryCount={eligible.length}
              onPickFromLibrary={() => setPickerOpen(true)}
            />
          </div>
        </Section>

        <p className={s.signoff}>{t('libraryCreate.signoffPat', '✻ a recipe to follow ✻')}</p>
      </div>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t('libraryCreate.pickSequence', 'Pick a sequence to add')}
        width={620}
      >
        <div className={patStyles.pickerList}>
          {eligible.length === 0 && (
            <p className={patStyles.empty}>
              {t('libraryCreate.noEligibleSequences', 'No saved sequences match this craft yet.')}
            </p>
          )}
          {eligible.map((sq) => (
            <button
              key={sq.id}
              type="button"
              className={patStyles.pickerRow}
              onClick={() => { addSeq(sq.id); setPickerOpen(false) }}
            >
              <span className={patStyles.pickerName}>{sq.name}</span>
              <span className={patStyles.pickerMeta}>
                {sq.rows.length} {t('library.rows', 'rows')}
              </span>
              <Icon name="plus" size={16} />
            </button>
          ))}
          <Btn variant="ghost" icon="plus" onClick={() => { setPickerOpen(false); navigate('/library/new/sequence') }}>
            {t('libraryCreate.buildNewSeq', 'Build a new sequence')}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
