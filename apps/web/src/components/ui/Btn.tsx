import React from 'react'
import s from './Btn.module.css'
import Icon, { type IconName } from './Icon'

type Variant = 'primary' | 'mustard' | 'ghost' | 'soft' | 'chip'
type Size = 'sm' | 'md' | 'lg'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconAfter?: IconName
  full?: boolean
}

export default function Btn({
  variant = 'primary', size = 'md', icon, iconAfter, full, className, children, ...rest
}: Props) {
  const cls = [s.btn, s[variant], s[size], full ? s.full : '', className ?? ''].filter(Boolean).join(' ')
  return (
    <button type="button" {...rest} className={cls}>
      {icon ? <Icon name={icon} size={size === 'lg' ? 22 : 18} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={size === 'lg' ? 22 : 18} /> : null}
    </button>
  )
}
