'use client'

import { useEffect } from 'react'

export default function Pinger() {
  useEffect(() => {
    fetch('/api/ping', { method: 'POST' }).catch(() => {})
  }, [])
  return null
}
