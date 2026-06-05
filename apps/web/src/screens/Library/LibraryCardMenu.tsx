import React from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../../components/ui/Icon'
import PartmenuPopover from '../../components/ui/PartmenuPopover'
import s from './LibraryView.module.css'

type Props = {
  /** Localized singular noun (e.g. "sequence", "row", "pattern") — used in menu labels. */
  kindLabel: string
  onEdit: () => void
  onDelete: () => void
}

/** Tiny ⋯ button + PartmenuPopover used on every library card.  */
export default function LibraryCardMenu({ kindLabel, onEdit, onDelete }: Props) {
  const { t } = useTranslation()
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)

  return (
    <div className={s.menuWrap}>
      <button
        ref={triggerRef}
        type="button"
        className={[s.menuBtn, open ? s.menuBtnOpen : ''].filter(Boolean).join(' ')}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        aria-label={t('action.menu', 'Menu')}
        aria-expanded={open}
      >
        <Icon name="more" size={18} />
      </button>
      <PartmenuPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        items={[
          {
            key: 'edit',
            icon: 'edit',
            label: t('library.menuEdit', { kind: kindLabel, defaultValue: `Edit ${kindLabel}` }),
            onSelect: onEdit,
          },
          {
            key: 'delete',
            icon: 'trash',
            label: t('library.menuDelete', { kind: kindLabel, defaultValue: `Delete ${kindLabel}` }),
            onSelect: onDelete,
            danger: true,
            divider: true,
          },
        ]}
      />
    </div>
  )
}
