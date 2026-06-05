import s from './FieldLabel.module.css'

type Props = { children: React.ReactNode; hint?: string; required?: boolean }

export default function FieldLabel({ children, hint, required }: Props) {
  return (
    <div className={s.label}>
      {children}
      {required && <span className={s.required}>•</span>}
      {hint && <span className={s.hint}>· {hint}</span>}
    </div>
  )
}
