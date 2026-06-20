'use client'

import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem('f1_entered')) {
      setVisible(true)
    }
  }, [])

  const enter = () => {
    sessionStorage.setItem('f1_entered', '1')
    document.dispatchEvent(new Event('f1-start-music'))
    setFading(true)
    setTimeout(() => setVisible(false), 600)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'var(--f1-dark)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}
    >
      <div className="striped-accent-thick" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            backgroundColor: 'var(--f1-red)',
            color: 'white',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '2.5rem',
            padding: '0.3rem 0.9rem',
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          }}>
            F1
          </div>
          <span style={{
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '2.5rem',
            letterSpacing: '0.2em',
            color: 'white',
            textTransform: 'uppercase',
          }}>
            BOLÃO
          </span>
        </div>
        <p style={{
          color: 'var(--f1-muted)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.35em',
        }}>
          Temporada 2026
        </p>
      </div>

      <button
        onClick={enter}
        className="btn-primary"
        style={{ fontSize: '1rem', padding: '0.9rem 3rem', letterSpacing: '0.15em' }}
      >
        ▶ &nbsp;ENTRAR
      </button>

      <div className="striped-accent-thick" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
    </div>
  )
}
