import React from 'react'
import s from './PageHeader.module.css'
import Eyebrow from './Eyebrow'

type Props = {
  eyebrow?: string
  title: React.ReactNode
  sub?: React.ReactNode
  right?: React.ReactNode
}

export default function PageHeader({ eyebrow, title, sub, right }: Props) {
  return (
    <div className={s.head}>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className={s.title}>{title}</h1>
        {sub && <p className={s.sub}>{sub}</p>}
      </div>
      {right && <div className={s.right}>{right}</div>}
    </div>
  )
}
