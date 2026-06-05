import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import s from './RowToolbar.module.css'

type Props = {
  onMarkRepeat?: () => void
  onBackspace?: () => void
  onDelete?: () => void
  /** When true, the repeat icon renders in its "this row already has a repeat" state. */
  repeatActive?: boolean
  /** Disable individual actions (e.g. backspace when the row is empty). */
  disabledBackspace?: boolean
  disabledRepeat?: boolean
}

/** Toolbar that appears on every row card: mark-repeat / backspace / trash. */
export default function RowToolbar({
  onMarkRepeat, onBackspace, onDelete,
  repeatActive = false,
  disabledBackspace = false,
  disabledRepeat = false,
}: Props) {
  const { t } = useTranslation()
  return (
    <div className={s.bar}>
      <button
        type="button"
        onClick={onMarkRepeat}
        disabled={disabledRepeat}
        title={t('wizard.step3RowToolbarRepeat', 'Mark a repeat')}
        className={[s.btn, repeatActive ? s.repeatActive : ''].filter(Boolean).join(' ')}
      >
        <Icon name="repeat" size={14} />
      </button>
      <button
        type="button"
        onClick={onBackspace}
        disabled={disabledBackspace}
        title={t('wizard.step3RowToolbarBackspace', 'Remove last stitch')}
        className={s.btn}
      >
        <Icon name="backspace" size={14} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        title={t('wizard.step3RowToolbarDelete', 'Delete row')}
        className={s.btn}
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  )
}
