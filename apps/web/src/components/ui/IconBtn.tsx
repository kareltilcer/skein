import React from 'react'
import s from './IconBtn.module.css'
import Icon, { type IconName } from './Icon'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  name: IconName
  tone?: 'soft' | 'plain' | 'brick'
  size?: 'sm' | 'md' | 'lg'
  iconSize?: number
  color?: string
}

export default function IconBtn({
  name, tone = 'soft', size = 'md', iconSize, color, className, ...rest
}: Props) {
  const cls = [s.btn, s[tone], s[size], className ?? ''].filter(Boolean).join(' ')
  return (
    <button type="button" {...rest} className={cls}>
      <Icon name={name} size={iconSize ?? (size === 'lg' ? 24 : size === 'sm' ? 16 : 20)} color={color} />
    </button>
  )
}
