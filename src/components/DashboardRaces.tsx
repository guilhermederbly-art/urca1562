'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Race } from '@/lib/types/database'
import { getCircuitInfo, getRaceFlag } from '@/lib/circuitData'
import Spinner from './Spinner'

interface Props {
  openRace: Race | null
  liveRace: Race | null
  recentlyFinishedRace: Race | null
  activeRaces: Race[]
  finishedRaces: Race[]
  predictedRaceIds: Set<string>
  isAdmin?: boolean
}

interface PredictionRow {
  username: string
  pole: string
  p1: string
  p2: string
  p3: string
  random_pos: string
  bortoleto_position: number | string
  challenge_answer: string
}

function useCountdown(target: string) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const ms = new Date(target).getTime() - now
  return ms > 0 ? ms : 0
}

function CountdownTimer({ target }: { target: string }) {
  const ms = useCountdown(target)
  if (ms === 0) return null
  const totalSec = Math.floor(ms / 1000)
  const days  = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins  = Math.floor((totalSec % 3600) / 60)
  const secs  = totalSec % 60
  const pad   = (n: number) => String(n).padStart(2, '0')
  const color   = totalSec < 7200 ? '#e8002d' : totalSec < 86400 ? '#ffc000' : '#d4d4d4'
  const compound = totalSec < 7200 ? 'SOFT' : totalSec < 86400 ? 'MEDIUM' : 'HARD'
  return (
    <div className="mt-1.5">
      <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--f1-muted)', textTransform: 'uppercase', marginBottom: '1px' }}>
        Fecha em <span style={{ color }}>● {compound}</span>
      </div>
      <div style={{ fontWeight: 900, fontSize: '1.1rem', color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {days > 0 ? `${days}d ${pad(hours)}h ${pad(mins)}m` : `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`}
      </div>
    </div>
  )
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'Em breve',   color: '#8a8aa0', bg: 'rgba(138,138,160,0.1)' },
  open:     { label: 'Aberta',     color: '#00d2be', bg: 'rgba(0,210,190,0.1)'   },
  closed:   { label: 'Fechado',    color: '#ffc000', bg: 'rgba(255,192,0,0.1)'   },
  finished: { label: 'Finalizada', color: '#8a8aa0', bg: 'rgba(138,138,160,0.1)' },
}

// ── Modal de palpites ─────────────────────────────────────────────────────────
function PredictionsModal({
  race,
  onClose,
}: {
  race: Race
  onClose: () => void
}) {
  const [predictions, setPredictions] = useState<PredictionRow[] | null>(null)
  const [randomPos, setRandomPos] = useState<number | null>(null)
  const [challengeQuestion, setChallengeQuestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/races/predictions?raceId=${race.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setPredictions(data.predictions)
          setRandomPos(data.random_position)
          setChallengeQuestion(data.challenge_question ?? null)
        } else {
          setError(data.error ?? 'Erro ao carregar palpites')
        }
      })
      .catch(() => setError('Erro ao carregar palpites'))
      .finally(() => setLoading(false))
  }, [race.id])

  const cols = [
    { key: 'pole',               label: 'Pole' },
    { key: 'p1',                 label: 'P1' },
    { key: 'p2',                 label: 'P2' },
    { key: 'p3',                 label: 'P3' },
    { key: 'random_pos',         label: `P${randomPos ?? '?'} 🎲` },
    { key: 'bortoleto_position', label: 'BOR 🇧🇷' },
    ...(challengeQuestion ? [{ key: 'challenge_answer', label: '⚡' }] : []),
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="card w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ borderRadius: '4px' }}
      >
        {/* Header */}
        <div className="striped-accent-thick" />
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--f1-border)' }}>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--f1-red)' }}>
              Palpites da rodada
            </div>
            <div className="font-black text-white">{race.name}</div>
            {challengeQuestion && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
                <span style={{ color: 'var(--f1-gold)' }}>⚡</span> {challengeQuestion}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-xl font-bold leading-none"
            style={{ color: 'var(--f1-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-1">
          {loading && <Spinner />}
          {error && (
            <div className="p-6 text-sm text-center" style={{ color: 'var(--f1-red)' }}>{error}</div>
          )}
          {predictions && predictions.length === 0 && (
            <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--f1-muted)' }}>
              Nenhum palpite registrado para esta corrida.
            </div>
          )}
          {predictions && predictions.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--f1-border)', background: 'rgba(0,0,0,0.3)' }}>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>
                    Piloto
                  </th>
                  {cols.map(c => (
                    <th key={c.key} className="text-center px-3 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid var(--f1-border)' }}
                  >
                    <td className="px-5 py-3 font-bold text-white">{p.username}</td>
                    {cols.map(c => (
                      <td key={c.key} className="text-center px-3 py-3 font-mono text-xs font-bold" style={{ color: 'var(--f1-muted)' }}>
                        {String(p[c.key as keyof PredictionRow])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function processCircuitSvg(raw: string): string {
  let s = raw
  // Remove blocks we don't want
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '')
  s = s.replace(/<text[\s\S]*?<\/text>/gi, '')
  s = s.replace(/<image[\s\S]*?\/>/gi, '')
  s = s.replace(/<image[\s\S]*?<\/image>/gi, '')
  // Clean SVG opening tag: strip width, height, style, class (keep viewBox)
  s = s.replace(/(<svg[^>]*)\s+width="[^"]*"/g, '$1')
  s = s.replace(/(<svg[^>]*)\s+height="[^"]*"/g, '$1')
  s = s.replace(/(<svg[^>]*)\s+style="[^"]*"/g, '$1')
  s = s.replace(/(<svg[^>]*)\s+class="[^"]*"/g, '$1')
  // Add responsive attrs
  s = s.replace('<svg', '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"')
  // Strip inline styles/classes from children
  s = s.replace(/\bstyle="[^"]*"/g, '')
  s = s.replace(/\bclass="[^"]*"/g, '')
  // vector-effect:non-scaling-stroke keeps stroke width in screen pixels
  // regardless of the SVG viewBox scale — fixes thick/thin inconsistency
  s = s.replace('</svg>', `<style>
    path,polyline,polygon,circle,ellipse,line{fill:none!important;stroke:#e8002d!important;stroke-width:3px!important;vector-effect:non-scaling-stroke!important;stroke-linejoin:round;stroke-linecap:round}
    rect{fill:none!important;stroke:none!important}
    text,image{display:none!important}
  </style></svg>`)
  return s
}

// ── Modal de detalhes do circuito ─────────────────────────────────────────────
function CircuitDetailsModal({ race, onClose }: { race: Race; onClose: () => void }) {
  const info = getCircuitInfo(race.name, race.circuit)
  // SVGs gerados via GPS do OpenF1; Madrid usa PNG do poster como fallback
  const imgSrc = info ? `/circuits/${info._key}.svg` : null
  const imgFallback = info ? `/circuits/${info._key}.png` : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-sm overflow-hidden" style={{ borderRadius: '4px' }}>
        <div className="striped-accent-thick" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--f1-border)' }}>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--f1-red)' }}>Circuito</div>
            <div className="font-black text-white">{race.name}</div>
          </div>
          <button onClick={onClose} className="text-xl font-bold leading-none" style={{ color: 'var(--f1-muted)' }}>✕</button>
        </div>

        {/* Traçado */}
        <div style={{ background: '#000', overflow: 'hidden', lineHeight: 0 }}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt="Traçado do circuito"
              style={{ width: '100%', display: 'block' }}
              onError={(e) => { (e.target as HTMLImageElement).src = imgFallback ?? '' }}
            />
          ) : (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="text-sm" style={{ color: 'var(--f1-muted)' }}>Traçado não disponível</p>
            </div>
          )}
        </div>

        {info && (
          <div className="p-4 flex flex-col gap-3">
            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2 py-2 border-b" style={{ borderColor: 'var(--f1-border)' }}>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-muted)', fontSize: '9px' }}>Voltas</div>
                <div className="font-black text-white text-xl">{info.laps}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-muted)', fontSize: '9px' }}>Extensão</div>
                <div className="font-black text-white text-sm leading-tight">{info.length.toFixed(3)}<span className="font-normal text-xs" style={{ color: 'var(--f1-muted)' }}> km</span></div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-muted)', fontSize: '9px' }}>Curvas</div>
                <div className="font-black text-white text-xl">{info.corners}</div>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-muted)', fontSize: '9px' }}>Tipo</div>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{
                  fontSize: '9px',
                  background: info.type === 'Urbano' ? 'rgba(59,130,246,0.15)' : info.type === 'Misto' ? 'rgba(245,158,11,0.15)' : 'rgba(100,100,100,0.2)',
                  color: info.type === 'Urbano' ? '#60a5fa' : info.type === 'Misto' ? '#fbbf24' : 'var(--f1-muted)',
                  border: `1px solid ${info.type === 'Urbano' ? 'rgba(59,130,246,0.35)' : info.type === 'Misto' ? 'rgba(245,158,11,0.35)' : 'rgba(100,100,100,0.35)'}`,
                }}>{info.type}</span>
              </div>
            </div>

            {/* Volta mais rápida */}
            <div className="rounded p-3" style={{ background: 'rgba(232,0,45,0.07)', border: '1px solid rgba(232,0,45,0.2)' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)' }}>
                Volta mais rápida da história
              </div>
              <div className="font-black text-white text-lg">{info.lapRecord.time}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
                {info.lapRecord.driver} · {info.lapRecord.year}
              </div>
            </div>

            {/* Maior vencedor */}
            <div className="rounded p-3" style={{ background: 'rgba(255,192,0,0.07)', border: '1px solid rgba(255,192,0,0.2)' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-gold)' }}>
                Maior vencedor
              </div>
              <div className="font-bold text-white text-sm">{info.mostWins.driver}</div>
              {info.mostWins.wins > 0 && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
                  {info.mostWins.wins} {info.mostWins.wins === 1 ? 'vitória' : 'vitórias'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Linha de corrida ──────────────────────────────────────────────────────────
function RaceRow({
  race,
  predicted,
  isPast,
  isAdmin,
  onViewPredictions,
  onViewDetails,
}: {
  race: Race
  predicted: boolean
  isPast?: boolean
  isAdmin?: boolean
  onViewPredictions: (race: Race) => void
  onViewDetails: (race: Race) => void
}) {
  const isOpen = race.status === 'open'
  const isClosed = race.status === 'closed' || race.status === 'finished' || isPast
  const status = isPast
    ? { label: 'Finalizada', color: '#8a8aa0', bg: 'rgba(138,138,160,0.1)' }
    : STATUS_CONFIG[race.status]

  return (
    <div
      className="card flex items-center gap-0 transition-colors"
      style={{ borderLeft: isOpen ? '3px solid var(--f1-red)' : '3px solid transparent' }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center w-14 self-stretch"
        style={{
          backgroundColor: isOpen ? 'rgba(232,0,45,0.08)' : 'rgba(0,0,0,0.2)',
          borderRight: '1px solid var(--f1-border)',
        }}
      >
        <span className="round-badge">{race.round_number}</span>
      </div>

      <div className="flex-1 min-w-0 px-4 py-3">
        <div className="mb-0.5">
          <span className="font-bold text-white" style={{ fontSize: '0.9375rem' }}>
            {getRaceFlag(race.name, race.circuit)} {race.name}
          </span>
          {' '}
          <span className="status-pill inline-flex" style={{ color: status.color, backgroundColor: status.bg }}>
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>{race.circuit}</span>
          <span style={{ color: 'var(--f1-border-light)' }}>·</span>
          <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>
            {format(new Date(race.race_start_time), 'dd MMM yyyy', { locale: ptBR })}
          </span>
          {race.random_position && isOpen && (
            <>
              <span style={{ color: 'var(--f1-border-light)' }}>·</span>
              <span className="text-xs font-bold" style={{ color: 'var(--f1-gold)' }}>
                🎲 P{race.random_position}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 pr-3 py-3">
        {/* Botão detalhes */}
        <button
          onClick={() => onViewDetails(race)}
          className="text-xs font-bold px-3 py-1.5 rounded border"
          style={{ borderColor: 'var(--f1-border)', color: 'var(--f1-muted)' }}
        >
          Detalhes
        </button>

        {/* Botão ao vivo — apenas corrida fechada */}
        {race.status === 'closed' && (
          <Link
            href={`/ao-vivo/${race.id}`}
            className="text-xs font-bold px-3 py-1.5 rounded border"
            style={{ borderColor: 'var(--f1-red)', color: 'var(--f1-red)' }}
          >
            🔴 Ao vivo
          </Link>
        )}


        {/* Botão ver palpites — apenas quando fechado (não quando finalizado) */}
        {race.status === 'closed' && (
          <button
            onClick={() => onViewPredictions(race)}
            className="text-xs font-bold px-3 py-1.5 rounded border"
            style={{ borderColor: 'var(--f1-border)', color: 'var(--f1-muted)' }}
          >
            👁 Ver palpites
          </button>
        )}

        {isOpen && !predicted && (
          <Link href={`/races/${race.id}`} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>
            Palpitar
          </Link>
        )}
        {isOpen && predicted && (
          <Link href={`/races/${race.id}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>
            Editar
          </Link>
        )}
        {!isOpen && (race.status === 'finished') && (
          <Link href={`/races/${race.id}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>
            Resultado
          </Link>
        )}
        {!isOpen && !isClosed && predicted && (
          <span className="text-xs font-bold uppercase tracking-wider px-3" style={{ color: '#00d2be' }}>
            ✓ Enviado
          </span>
        )}
        {!isOpen && !isClosed && !predicted && race.status !== 'upcoming' && (
          <span className="text-xs font-bold uppercase tracking-wider px-3" style={{ color: 'var(--f1-muted)' }}>—</span>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DashboardRaces({ openRace, liveRace, recentlyFinishedRace, activeRaces, finishedRaces, predictedRaceIds, isAdmin }: Props) {
  const [showPast, setShowPast] = useState(false)
  const [modalRace, setModalRace] = useState<Race | null>(null)
  const [detailsRace, setDetailsRace] = useState<Race | null>(null)
  const predicted = (id: string) => predictedRaceIds.has(id)
  const router = useRouter()

  // Auto-refresh when a closed race's start time arrives (so live card appears automatically)
  useEffect(() => {
    const now = Date.now()
    const nextStart = activeRaces
      .filter(r => r.status === 'closed')
      .map(r => new Date(r.race_start_time).getTime())
      .filter(t => t > now)
      .sort((a, b) => a - b)[0]

    if (!nextStart) return
    const delay = nextStart - now
    const timer = setTimeout(() => router.refresh(), delay)
    return () => clearTimeout(timer)
  }, [activeRaces, router])

  return (
    <div className="flex flex-col gap-4">

      {modalRace && (
        <PredictionsModal race={modalRace} onClose={() => setModalRace(null)} />
      )}
      {detailsRace && (
        <CircuitDetailsModal race={detailsRace} onClose={() => setDetailsRace(null)} />
      )}

      {/* ── Corrida ao vivo (destaque) ───────────────────────── */}
      {liveRace && (
        <div
          className="card overflow-hidden"
          style={{
            borderLeft: '4px solid var(--f1-red)',
            background: 'linear-gradient(135deg, rgba(232,0,45,0.15) 0%, rgba(13,13,20,0) 60%)',
          }}
        >
          <div className="flex items-center gap-2 px-5 pt-4 pb-0">
            <span
              className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: 'var(--f1-red)', color: 'white', letterSpacing: '0.12em', animation: 'pulse 1.5s ease-in-out infinite' }}
            >
              🔴 Ao vivo agora
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 pt-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded"
                style={{ background: 'rgba(232,0,45,0.15)', border: '1px solid rgba(232,0,45,0.3)' }}
              >
                <span className="text-xs font-bold uppercase" style={{ color: 'var(--f1-red)', letterSpacing: '0.1em' }}>R</span>
                <span className="text-xl font-black text-white leading-none">{liveRace.round_number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-base leading-tight">{getRaceFlag(liveRace.name, liveRace.circuit)} {liveRace.name}</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>{liveRace.circuit}</span>
                  {liveRace.random_position && (
                    <>
                      <span style={{ color: 'var(--f1-border-light)' }}>·</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--f1-gold)' }}>🎲 P{liveRace.random_position}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center sm:flex-col sm:items-end gap-2 flex-shrink-0">
              <Link
                href={`/ao-vivo/${liveRace.id}`}
                className="btn-primary"
                style={{ fontSize: '0.875rem', padding: '0.6rem 1.5rem', fontWeight: 900, background: 'var(--f1-red)' }}
              >
                🔴 Acompanhar ao vivo
              </Link>
              <button
                onClick={() => setModalRace(liveRace)}
                className="text-xs font-bold px-3 py-1.5 rounded border"
                style={{ borderColor: 'var(--f1-border)', color: 'var(--f1-muted)' }}
              >
                👁 Ver palpites
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Última corrida encerrada ────────────────────────── */}
      {recentlyFinishedRace && !liveRace && (
        <div
          className="card overflow-hidden"
          style={{ borderLeft: '4px solid var(--f1-gold)' }}
        >
          <div className="flex items-center gap-2 px-5 pt-4 pb-0">
            <span
              className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,192,0,0.15)', color: 'var(--f1-gold)', border: '1px solid rgba(255,192,0,0.3)', letterSpacing: '0.12em' }}
            >
              🏆 Última corrida
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 pt-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded"
                style={{ background: 'rgba(255,192,0,0.1)', border: '1px solid rgba(255,192,0,0.25)' }}
              >
                <span className="text-xs font-bold uppercase" style={{ color: 'var(--f1-gold)', letterSpacing: '0.1em' }}>R</span>
                <span className="text-xl font-black text-white leading-none">{recentlyFinishedRace.round_number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-base leading-tight">{getRaceFlag(recentlyFinishedRace.name, recentlyFinishedRace.circuit)} {recentlyFinishedRace.name}</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>{recentlyFinishedRace.circuit}</span>
                  <span style={{ color: 'var(--f1-border-light)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>
                    {format(new Date(recentlyFinishedRace.race_start_time), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center sm:flex-col sm:items-end gap-2 flex-shrink-0">
              <Link
                href={`/races/${recentlyFinishedRace.id}`}
                className="btn-primary"
                style={{ fontSize: '0.875rem', padding: '0.6rem 1.5rem', fontWeight: 900, background: 'var(--f1-gold)', color: '#000' }}
              >
                🏆 Ver pontuação
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Corrida em destaque (aberta) ────────────────────── */}
      {openRace && (
        <div
          className="card overflow-hidden"
          style={{
            borderLeft: '4px solid var(--f1-red)',
            background: 'linear-gradient(135deg, rgba(232,0,45,0.12) 0%, rgba(13,13,20,0) 60%)',
          }}
        >
          <div className="flex items-center gap-2 px-5 pt-4 pb-0">
            <span
              className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: 'var(--f1-red)', color: 'white', letterSpacing: '0.12em' }}
            >
              🏁 Palpite aberto
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 pt-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded"
                style={{ background: 'rgba(232,0,45,0.15)', border: '1px solid rgba(232,0,45,0.3)' }}
              >
                <span className="text-xs font-bold uppercase" style={{ color: 'var(--f1-red)', letterSpacing: '0.1em' }}>R</span>
                <span className="text-xl font-black text-white leading-none">{openRace.round_number}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-base leading-tight">{getRaceFlag(openRace.name, openRace.circuit)} {openRace.name}</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>{openRace.circuit}</span>
                  <span style={{ color: 'var(--f1-border-light)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>
                    {format(new Date(openRace.race_start_time), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  {openRace.random_position && (
                    <span className="text-xs font-bold" style={{ color: 'var(--f1-gold)' }}>
                      · 🎲 P{openRace.random_position}
                    </span>
                  )}
                </div>
                <CountdownTimer target={openRace.fp1_start_time ?? openRace.qualifying_start_time} />
              </div>
            </div>

            <div className="flex items-center sm:flex-col sm:items-end gap-2 flex-shrink-0">
              {!predicted(openRace.id) ? (
                <Link
                  href={`/races/${openRace.id}`}
                  className="btn-primary"
                  style={{ fontSize: '0.875rem', padding: '0.6rem 1.5rem', fontWeight: 900 }}
                >
                  Palpitar
                </Link>
              ) : (
                <div className="text-center">
                  <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: '#00d2be' }}>
                    ✓ Palpite enviado
                  </div>
                  <Link
                    href={`/races/${openRace.id}`}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.875rem' }}
                  >
                    Editar
                  </Link>
                </div>
              )}
              <Link
                href={`/ao-vivo/${openRace.id}`}
                className="text-xs font-bold px-3 py-1.5 rounded border"
                style={{ borderColor: '#22c55e', color: '#22c55e' }}
              >
                📡 Ao Vivo
              </Link>
<button
                onClick={() => setDetailsRace(openRace)}
                className="text-xs font-bold px-3 py-1.5 rounded border"
                style={{ borderColor: 'var(--f1-border)', color: 'var(--f1-muted)' }}
              >
                Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Próximas corridas ────────────────────────────────── */}
      {activeRaces.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeRaces.map(race => (
            <RaceRow key={race.id} race={race} predicted={predicted(race.id)} isAdmin={isAdmin} onViewPredictions={setModalRace} onViewDetails={setDetailsRace} />
          ))}
        </div>
      )}

      {/* ── Corridas anteriores (colapsadas) ─────────────────── */}
      {finishedRaces.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast(p => !p)}
            className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
            style={{ color: 'var(--f1-muted)', borderTop: '1px solid var(--f1-border)', marginTop: '0.25rem' }}
          >
            <span style={{ transform: showPast ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
            {showPast ? 'Ocultar' : `Ver ${finishedRaces.length} corrida${finishedRaces.length > 1 ? 's' : ''} anterior${finishedRaces.length > 1 ? 'es' : ''}`}
          </button>
          {showPast && (
            <div className="flex flex-col gap-2 mt-2">
              {finishedRaces.map(race => (
                <RaceRow key={race.id} race={race} predicted={predicted(race.id)} isPast isAdmin={isAdmin} onViewPredictions={setModalRace} onViewDetails={setDetailsRace} />
              ))}
            </div>
          )}
        </div>
      )}

      {!openRace && !liveRace && !recentlyFinishedRace && activeRaces.length === 0 && (
        <div className="card p-16 text-center">
          <p className="text-sm uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>
            Nenhuma corrida cadastrada ainda
          </p>
          <Link href="/admin" className="btn-primary inline-flex mt-4" style={{ fontSize: '0.75rem' }}>
            Importar calendário
          </Link>
        </div>
      )}
    </div>
  )
}
