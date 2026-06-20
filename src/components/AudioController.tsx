'use client'

import { useEffect, useRef, useState } from 'react'

export default function AudioController() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [showSplash, setShowSplash] = useState(false)
  const [fading, setFading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const audio = new Audio('/sounds/sirius.mp3')
    audio.loop = true
    audio.volume = 0.3
    audioRef.current = audio

    if (sessionStorage.getItem('f1_entered')) {
      // Já entrou antes — tenta autoplay, senão aguarda primeiro clique
      audio.play()
        .then(() => setPlaying(true))
        .catch(() => {
          const start = () => {
            audio.play().then(() => setPlaying(true)).catch(() => {})
          }
          document.addEventListener('click', start, { once: true })
          document.addEventListener('keydown', start, { once: true })
        })
    } else {
      // Primeira visita — mostra splash
      setShowSplash(true)
    }

    return () => { audio.pause() }
  }, [])

  // Botão "ENTRAR" — audio.play() direto no clique, gesto de usuário garantido
  const handleEnter = () => {
    sessionStorage.setItem('f1_entered', '1')
    const audio = audioRef.current
    if (audio) {
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }
    setFading(true)
    setTimeout(() => setShowSplash(false), 600)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !muted
    setMuted(!muted)
  }

  return (
    <>
      {/* Splash screen */}
      {showSplash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'var(--f1-dark)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.6s ease',
          pointerEvents: fading ? 'none' : 'all',
        }}>
          <div className="striped-accent-thick" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />

          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                backgroundColor: 'var(--f1-red)', color: 'white',
                fontWeight: 900, fontStyle: 'italic', fontSize: '2.5rem',
                padding: '0.3rem 0.9rem',
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}>F1</div>
              <span style={{ fontWeight: 900, fontStyle: 'italic', fontSize: '2.5rem', letterSpacing: '0.2em', color: 'white', textTransform: 'uppercase' }}>
                BOLÃO
              </span>
            </div>
            <p style={{ color: 'var(--f1-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.35em' }}>
              Temporada 2026
            </p>
          </div>

          <button onClick={handleEnter} className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 3rem', letterSpacing: '0.15em' }}>
            ▶ &nbsp;ENTRAR
          </button>

          <div className="striped-accent-thick" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
        </div>
      )}

      {/* Botão mute/unmute */}
      <button onClick={toggleMute} title={muted ? 'Ativar música' : 'Silenciar música'} style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50,
        width: '2.75rem', height: '2.75rem', borderRadius: '50%',
        border: '1px solid var(--f1-border)', backgroundColor: 'var(--f1-card)',
        color: muted ? 'var(--f1-muted)' : 'var(--f1-red)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '1.1rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        transition: 'color 0.2s',
      }}>
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
    </>
  )
}

const bar: React.CSSProperties = {
  display: 'inline-block',
  width: '3px', height: '12px',
  backgroundColor: 'var(--f1-red)',
  borderRadius: '2px',
  animation: 'equalizer 0.8s ease-in-out infinite',
  transformOrigin: 'bottom',
}
