import s from './Eyebrow.module.css'

export default function Eyebrow({ children, color, style }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) {
  return <div className={s.eyebrow} style={{ ...(color ? { color } : null), ...style }}>{children}</div>
}
