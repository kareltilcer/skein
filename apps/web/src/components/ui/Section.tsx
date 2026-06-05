import React from 'react'
import s from './Section.module.css'

type Props = {
  label: React.ReactNode
  hint?: React.ReactNode
  required?: boolean
  children: React.ReactNode
  className?: string
}

/** Form section: mono uppercase eyebrow, optional REQUIRED badge, optional right-aligned hint, then content. */
export default function Section({ label, hint, required, children, className }: Props) {
  return (
    <section className={[s.section, className ?? ''].filter(Boolean).join(' ')}>
      <header className={s.head}>
        <div className={s.labelRow}>
          <span className={s.label}>{label}</span>
          {required && (
            <span className={s.required}>
              <span className={s.requiredStar}>✱</span> REQUIRED
            </span>
          )}
        </div>
        {hint && <span className={s.hint}>{hint}</span>}
      </header>
      {children}
    </section>
  )
}
