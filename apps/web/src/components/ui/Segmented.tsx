import s from './Segmented.module.css'

type Item = { id: string; label: string; count?: number }

type Props = {
  items: Item[]
  value: string
  onChange: (id: string) => void
  size?: 'md' | 'lg'
}

export default function Segmented({ items, value, onChange, size = 'md' }: Props) {
  const wrapCls = [s.wrap, size === 'lg' ? s.lg : ''].filter(Boolean).join(' ')
  return (
    <div className={wrapCls} role="tablist">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={value === it.id}
          className={[s.item, value === it.id ? s.active : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(it.id)}
        >
          {it.label}
          {typeof it.count === 'number' && <span className={s.count}>{it.count}</span>}
        </button>
      ))}
    </div>
  )
}
