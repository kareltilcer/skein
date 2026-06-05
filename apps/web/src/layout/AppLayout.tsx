import React from 'react'
import Sidebar from './Sidebar'
import s from './AppLayout.module.css'

type Props = { immersive?: boolean; children: React.ReactNode }

export default function AppLayout({ immersive, children }: Props) {
  const [collapsed, setCollapsed] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 1080)

  React.useEffect(() => {
    function onResize() { setCollapsed(window.innerWidth < 1080) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className={s.shell}>
      <Sidebar collapsed={collapsed} />
      <main className={[s.main, immersive ? s.immersive : ''].filter(Boolean).join(' ')}>
        {immersive ? children : <div className={s.container}>{children}</div>}
      </main>
    </div>
  )
}
