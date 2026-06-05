import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import s from './ReuseChooser.module.css'

type Kind = 'row' | 'sequence'

type Props = {
  kind: Kind
  libraryCount: number
  onNew?: () => void
  onPickFromLibrary?: () => void
}

/**
 * Dashed-brick "New {kind}" + card "Sequence/Row from lib · {count}" pair.
 * Used at the bottom of every sequence card in the wizard, library builder, and
 * sequence picker contexts so the user always has a clear choice between rolling
 * fresh vs. reusing something they've saved.
 */
export default function ReuseChooser({ kind, libraryCount, onNew, onPickFromLibrary }: Props) {
  const { t } = useTranslation()
  const newLabel = kind === 'row'
    ? t('reuseChooser.newRow', 'New row')
    : t('reuseChooser.newSequence', 'New sequence')
  const libLabel = kind === 'row'
    ? t('reuseChooser.rowFromLib', 'Row from lib')
    : t('reuseChooser.seqFromLib', 'Seq. from lib')
  return (
    <div className={s.row}>
      <button type="button" onClick={onNew} className={s.new}>
        <Icon name="plus" size={14} />
        <span>{newLabel}</span>
      </button>
      <button type="button" onClick={onPickFromLibrary} className={s.lib}>
        <Icon name="library" size={14} />
        <span>{libLabel}</span>
        <span className={s.count}>{libraryCount}</span>
      </button>
    </div>
  )
}
