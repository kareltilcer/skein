import React from 'react'
import s from './SearchField.module.css'
import Icon from './Icon'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { width?: number | string }

export default function SearchField({ width, style, className, ...rest }: Props) {
  return (
    <label className={[s.wrap, className ?? ''].filter(Boolean).join(' ')} style={{ width, ...style }}>
      <span className={s.icon}><Icon name="search" size={18} /></span>
      <input type="search" className={s.input} {...rest} />
    </label>
  )
}
