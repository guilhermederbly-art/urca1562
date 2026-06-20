'use client'

import { useEffect, useRef, useState } from 'react'

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const audio = new Audio('/sounds/sirius.mp3')
    audio.loop = true
    audio.volume = 0.3
    audioRef.current = audio

    const start = () => {
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }

    // Start when splash screen "Entrar" is clicked
    document.addEventListener('f1-start-music', start, { once: true })

    // Also try autoplay immediately (works if user already interacted this session)
    audio.play().then(() => setPlaying(true)).catch(() => {})

    return () => {
      audio.pause()
      document.removeEventListener('f1-start-music', start)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !muted
    setMuted(!muted)
  }

  return (
    <button
      onClick={toggle}
      title={muted ? 'Ativar música' : 'Silenciar música'}
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 50,
        width: '2.75rem',
        height: '2.75rem',
        borderRadius: '50%',
        border: '1px solid var(--f1-border)',
        backgroundColor: 'var(--f1-card)',
        color: muted ? 'var(--f1-muted)' : 'var(--f1-red)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1.1rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        transition: 'color 0.2s, border-color 0.2s',
      }}
    >
      {muted ? '🔇' : (
        <span style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '16px' }}>
          {playing ? (
            <>
              <span style={{ ...bar, animationDelay: '0s' }} />
              <span style={{ ...bar, animationDelay: '0.2s' }} />
              <span style={{ ...bar, animationDelay: '0.4s' }} />
              <span style={{ ...bar, animationDelay: '0.1s' }} />
              <span style={{ ...bar, animationDelay: '0.3s' }} />
            </>
          ) : '♪'}
        </span>
      )}
      <style>{`
        @keyframes equalizer {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1); }
        }
      `}</style>
    </button>
  )
}

const bar: React.CSSProperties = {
  display: 'inline-block',
  width: '3px',
  height: '12px',
  backgroundColor: 'var(--f1-red)',
  borderRadius: '2px',
  animation: 'equalizer 0.8s ease-in-out infinite',
  transformOrigin: 'bottom',
}
