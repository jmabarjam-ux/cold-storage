'use client'

import { useEffect, useState } from 'react'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      const hh = now.getHours().toString().padStart(2, '0')
      const mm = now.getMinutes().toString().padStart(2, '0')
      const ss = now.getSeconds().toString().padStart(2, '0')
      setTime(`${hh}:${mm}:${ss} WIB`)
    }

    // Set immediately, then tick every second
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 shadow-sm">
      <h1 className="text-white font-semibold text-xl tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-xs hidden sm:inline">🕐</span>
        <span className="text-slate-200 text-sm font-mono tabular-nums">{time}</span>
      </div>
    </header>
  )
}
