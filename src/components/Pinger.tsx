'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function Pinger() {
  const pathname = usePathname()
  useEffect(() => {
    fetch('/api/ping', { method: 'POST' }).catch(() => {})
  }, [pathname])
  return null
}
