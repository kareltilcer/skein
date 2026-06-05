import React from 'react'
import s from './Card.module.css'

type Props = {
  pad?: 'sm' | 'md' | 'lg'
  hover?: boolean
  active?: boolean
  onClick?: () => void
  className?: string
  children: React.ReactNode
  as?: 'div' | 'button' | 'a'
  href?: string
  style?: React.CSSProperties
}

export default function Card({
  pad = 'md', hover, active, onClick, className, children, as, href, style,
}: Props) {
  const padCls = pad === 'sm' ? s.padSm : pad === 'lg' ? s.padLg : s.padMd
  const cls = [s.card, padCls, hover ? s.hover : '', active ? s.active : '', onClick ? s.button : '', className ?? ''].filter(Boolean).join(' ')

  if (as === 'a' || href) {
    return <a href={href} className={cls} style={style} onClick={onClick}>{children}</a>
  }
  if (onClick || as === 'button') {
    return <button type="button" className={cls} style={style} onClick={onClick}>{children}</button>
  }
  return <div className={cls} style={style}>{children}</div>
}
