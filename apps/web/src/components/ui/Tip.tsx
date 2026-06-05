import s from './Tip.module.css'
import Icon from './Icon'

export default function Tip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className={s.tip} style={style}>
      <span className={s.icon}><Icon name="bulb" size={16} /></span>
      <div>{children}</div>
    </div>
  )
}
