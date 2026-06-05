import React from 'react'
import s from './Chip.module.css'
import Icon, { type IconName } from './Icon'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  tone?: 'default' | 'brick'
  size?: 'md' | 'lg'
  icon?: IconName
}

export default function Chip({
  active, tone = 'default', size = 'md', icon, className, children, ...rest
}: Props) {
  const cls = [
    s.chip,
    active ? s.active : '',
    tone === 'brick' ? s.brick : '',
    size === 'lg' ? s.lg : '',
    className ?? '',
  ].filter(Boolean).join(' ')
  return (
    <button type="button" {...rest} className={cls}>
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </button>
  )
}
