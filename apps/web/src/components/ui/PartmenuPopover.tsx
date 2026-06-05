import React from 'react'
import Icon, { type IconName } from './Icon'
import s from './PartmenuPopover.module.css'

export type PartmenuItem = {
  key: string
  icon: IconName
  label: React.ReactNode
  onSelect: () => void
  /** Apply destructive (brick-tinted) treatment. */
  danger?: boolean
  /** Apply accent (forest-tinted) treatment — e.g. "Mark as finished". */
  accent?: boolean
  /** Render a divider above this item. */
  divider?: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  /** Anchor element (the button that opens the menu). Used to scope click-outside. */
  anchorRef: React.RefObject<HTMLElement | null>
  items: PartmenuItem[]
  /** Optional minimum width override (default 200px). */
  minWidth?: number
  /** Pointer-notch alignment — `right` (default) places the notch over the trailing edge. */
  notchAlign?: 'left' | 'right'
}

/**
 * Animated rounded-card popover with a pointer notch — used for library item
 * overflow (Edit / Delete) and the knit-screen PartMenu. Click-outside dismisses;
 * Escape dismisses.
 */
export default function PartmenuPopover({
  open, onClose, anchorRef, items, minWidth = 200, notchAlign = 'right',
}: Props) {
  const popoverRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      const t = e.target as Node
      if (popoverRef.current?.contains(t)) return
      if (anchorRef.current?.contains(t)) return
      onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null

  return (
    <div
      ref={popoverRef}
      className={[s.popover, notchAlign === 'left' ? s.notchLeft : s.notchRight].join(' ')}
      style={{ minWidth }}
      role="menu"
    >
      <span className={s.notch} aria-hidden />
      {items.map((item, idx) => (
        <React.Fragment key={item.key}>
          {item.divider && idx > 0 && <div className={s.divider} aria-hidden />}
          <button
            type="button"
            role="menuitem"
            onClick={() => { item.onSelect(); onClose() }}
            className={[
              s.item,
              item.danger ? s.itemDanger : '',
              item.accent ? s.itemAccent : '',
            ].filter(Boolean).join(' ')}
          >
            <span className={s.itemIcon}>
              <Icon name={item.icon} size={17} />
            </span>
            <span className={s.itemLabel}>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}
