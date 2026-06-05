import React from 'react'
import s from './Modal.module.css'
import Icon, { type IconName } from './Icon'
import IconBtn from './IconBtn'

type Align = 'center' | 'bottom' | 'top'

type ModalProps = {
  open: boolean
  onClose: () => void
  /** When provided, renders the legacy header bar with X close button. Use Modal.DangerHeader / DefinerHeader inside children for custom headers. */
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number
  align?: Align
  /** Disable the default scrim click-to-close. Useful while a destructive action is in flight. */
  dismissOnScrimClick?: boolean
  className?: string
}

function ModalRoot({
  open, onClose, title, children, footer, width, align = 'center',
  dismissOnScrimClick = true, className,
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const scrimClass = [
    s.scrim,
    align === 'bottom' ? s.scrimBottom : '',
    align === 'top' ? s.scrimTop : '',
  ].filter(Boolean).join(' ')

  const modalClass = [
    s.modal,
    align === 'bottom' ? s.sheet : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={scrimClass}
      onClick={dismissOnScrimClick ? onClose : undefined}
      role="presentation"
    >
      <div
        className={modalClass}
        style={width ? { maxWidth: width } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        {align === 'bottom' && <div className={s.sheetHandle} aria-hidden />}
        {title !== undefined && (
          <div className={s.head}>
            <div className={s.title}>{title}</div>
            <IconBtn name="x" tone="plain" onClick={onClose} aria-label="Close" />
          </div>
        )}
        <div className={s.body}>{children}</div>
        {footer && <div className={s.foot}>{footer}</div>}
      </div>
    </div>
  )
}

// ─── Danger header: brick disc on a tinted band, big title, mono caption ─
type DangerHeaderProps = {
  title: React.ReactNode
  caption?: React.ReactNode
  icon?: IconName
}

function DangerHeader({ title, caption, icon = 'trash' }: DangerHeaderProps) {
  return (
    <div className={s.dangerHead}>
      <div className={s.dangerDisc}>
        <Icon name={icon} size={26} color="#FBF6EC" />
      </div>
      <div className={s.dangerTitle}>{title}</div>
      {caption && <div className={s.dangerCaption}>{caption}</div>}
    </div>
  )
}

// ─── Definer header: X / "{Kind} · draft" pill / Save text button ─
type DefinerHeaderProps = {
  kind: string
  ready: boolean
  onClose: () => void
  onSave: () => void
  saveLabel?: string
}

function DefinerHeader({ kind, ready, onClose, onSave, saveLabel = 'Save' }: DefinerHeaderProps) {
  return (
    <div className={s.definerHead}>
      <IconBtn name="x" tone="plain" onClick={onClose} aria-label="Close" />
      <span className={s.draftPill}>{kind} · draft</span>
      <button
        type="button"
        onClick={ready ? onSave : undefined}
        disabled={!ready}
        className={s.definerSave}
      >
        {saveLabel}
      </button>
    </div>
  )
}

// ─── Body and Footer slots — used when the default head/foot props don't fit ─
function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={[s.body, className ?? ''].filter(Boolean).join(' ')}>{children}</div>
}

function Footer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={[s.foot, className ?? ''].filter(Boolean).join(' ')}>{children}</div>
}

type ModalComponent = typeof ModalRoot & {
  DangerHeader: typeof DangerHeader
  DefinerHeader: typeof DefinerHeader
  Body: typeof Body
  Footer: typeof Footer
}

const Modal = ModalRoot as ModalComponent
Modal.DangerHeader = DangerHeader
Modal.DefinerHeader = DefinerHeader
Modal.Body = Body
Modal.Footer = Footer

export default Modal
