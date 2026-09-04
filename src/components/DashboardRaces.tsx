'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
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

// Contagem regressiva em chips [11d][16h][01m] — só renderiza no cliente,
// evitando mismatch de hidratação e Date.now() durante o render
function CountdownChips({ target }: { target: string }) {
  // Relógio de 1s via useSyncExternalStore: no servidor devolve null (não
  // renderiza, evitando mismatch de hidratação) e no cliente assina o interval
  const nowSec = useSyncExternalStore<number | null>(
    cb => { const id = setInterval(cb, 1000); return () => clearInterval(id) },
    () => Math.floor(Date.now() / 1000),
    () => null,
  )
  if (nowSec === null) return null
  const ms = new Date(target).getTime() - nowSec * 1000
  if (ms <= 0) return null
  const totalSec = Math.floor(ms / 1000)
  const days  = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins  = Math.floor((totalSec % 3600) / 60)
  const secs  = totalSec % 60
  const pad   = (n: number) => String(n).padStart(2, '0')
  const chips = days > 0
    ? [`${days}d`, `${pad(hours)}h`, `${pad(mins)}m`]
    : [`${pad(hours)}h`, `${pad(mins)}m`, `${pad(secs)}s`]
  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      <span className="text-xs font-black uppercase" style={{ color: 'var(--f1-muted)', letterSpacing: '0.15em' }}>
        Fecha em
      </span>
      {chips.map((c, i) => (
        <span
          key={i}
          className="text-sm font-black text-white px-2.5 py-1 rounded"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--f1-border)', fontVariantNumeric: 'tabular-nums' }}
        >
          {c}
        </span>
      ))}
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
      <div className="card w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden" style={{ borderRadius: '4px' }}>
        <div className="striped-accent-thick flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--f1-border)' }}>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--f1-red)' }}>Circuito</div>
            <div className="font-black text-white">{race.name}</div>
          </div>
          <button onClick={onClose} className="text-xl font-bold leading-none" style={{ color: 'var(--f1-muted)' }}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
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
    </div>
  )
}

// ── Linha de corrida (timeline) ───────────────────────────────────────────────
function RaceRow({
  race,
  isPast,
  onViewPredictions,
  onViewDetails,
}: {
  race: Race
  isPast?: boolean
  onViewPredictions: (race: Race) => void
  onViewDetails: (race: Race) => void
}) {
  const status = isPast
    ? { label: 'Finalizada', color: '#8a8aa0', bg: 'rgba(138,138,160,0.1)' }
    : STATUS_CONFIG[race.status]

  return (
    <div className="relative">
      {/* Ponto do trilho da timeline */}
      <span
        aria-hidden
        className="hidden sm:block absolute rounded-full"
        style={{
          width: '9px', height: '9px', left: '-27px', top: '50%', transform: 'translateY(-50%)',
          background: '#3a3a50', boxShadow: '0 0 0 3px var(--f1-dark)',
        }}
      />

      <div className="card flex items-stretch overflow-hidden">
        <div
          className="flex-shrink-0 flex items-center justify-center w-16"
          style={{ background: 'rgba(0,0,0,0.25)', borderRight: '1px solid var(--f1-border)' }}
        >
          <span className="round-badge" style={{ fontSize: '1.5rem' }}>{race.round_number}</span>
        </div>

        <div className="flex-1 min-w-0 px-4 py-3.5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-white" style={{ fontSize: '0.9375rem' }}>
              {getRaceFlag(race.name, race.circuit)} {race.name}
            </span>
            <span className="status-pill inline-flex" style={{ color: status.color, backgroundColor: status.bg, border: `1px solid ${status.color}33` }}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: 'var(--f1-muted)' }}>
            <span>{race.circuit}</span>
            <span style={{ color: 'var(--f1-border-light)' }}>•</span>
            <span>{format(new Date(race.race_start_time), "dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pr-4">
          {race.status === 'closed' && !isPast && (
            <Link
              href={`/ao-vivo/${race.id}`}
              className="hidden sm:inline-flex text-xs font-black uppercase tracking-widest px-3 py-2 rounded"
              style={{ border: '1px solid rgba(232,0,45,0.5)', color: 'var(--f1-red)' }}
            >
              🔴 Ao vivo
            </Link>
          )}
          {(race.status === 'closed' || race.status === 'finished' || isPast) && (
            <button
              onClick={() => onViewPredictions(race)}
              className="inline-flex text-xs font-black uppercase tracking-widest px-3 py-2 rounded"
              style={{ border: '1px solid var(--f1-border-light)', color: 'var(--f1-muted)' }}
            >
              👁 Palpites
            </button>
          )}
          {(race.status === 'finished' || isPast) && (
            <Link
              href={`/races/${race.id}`}
              className="hidden sm:inline-flex text-xs font-black uppercase tracking-widest px-3 py-2 rounded"
              style={{ border: '1px solid rgba(255,192,0,0.4)', color: 'var(--f1-gold)' }}
            >
              Resultado
            </Link>
          )}
          <button
            onClick={() => onViewDetails(race)}
            className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded"
            style={{ border: '1px solid var(--f1-border-light)', color: 'white', background: 'rgba(255,255,255,0.03)' }}
          >
            Detalhes
          </button>
        </div>
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

  const [syncing, setSyncing] = useState(false)
  async function syncCalendar() {
    setSyncing(true)
    try { await fetch('/api/races/import-calendar', { method: 'POST' }) } catch {}
    setSyncing(false)
    router.refresh()
  }

  const featuredRace = openRace ?? null

  return (
    <div className="flex flex-col gap-5">

      {modalRace && (
        <PredictionsModal race={modalRace} onClose={() => setModalRace(null)} />
      )}
      {detailsRace && (
        <CircuitDetailsModal race={detailsRace} onClose={() => setDetailsRace(null)} />
      )}

      {/* ── Corrida ao vivo (destaque) ───────────────────────── */}
      {liveRace && (
        <div
          className="rounded overflow-hidden p-5"
          style={{
            border: '1px solid rgba(232,0,45,0.6)',
            borderLeft: '4px solid var(--f1-red)',
            background: 'linear-gradient(135deg, rgba(232,0,45,0.14) 0%, var(--f1-card) 60%)',
          }}
        >
          <span
            className="inline-flex text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded mb-4"
            style={{ background: 'var(--f1-red)', color: 'white', letterSpacing: '0.14em', animation: 'pulse 1.5s ease-in-out infinite' }}
          >
            🔴 Ao vivo agora
          </span>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded"
                style={{ background: 'rgba(232,0,45,0.15)', border: '1px solid rgba(232,0,45,0.35)' }}
              >
                <span className="text-xs font-bold uppercase" style={{ color: 'var(--f1-red)', letterSpacing: '0.1em' }}>R</span>
                <span className="text-xl font-black text-white leading-none">{liveRace.round_number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-base leading-tight">
                  {getRaceFlag(liveRace.name, liveRace.circuit)} {liveRace.name}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--f1-muted)' }}>
                  <span>{liveRace.circuit}</span>
                  {liveRace.random_position && (
                    <>
                      <span style={{ color: 'var(--f1-border-light)' }}>•</span>
                      <span className="font-bold" style={{ color: 'var(--f1-gold)' }}>🎲 P{liveRace.random_position}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
              <Link
                href={`/ao-vivo/${liveRace.id}`}
                className="btn-primary justify-center"
                style={{ fontSize: '0.875rem', padding: '0.65rem 1.75rem', fontWeight: 900 }}
              >
                🔴 Acompanhar ao vivo
              </Link>
              <button
                onClick={() => setModalRace(liveRace)}
                className="text-xs font-black uppercase tracking-widest px-3 py-2 rounded"
                style={{ border: '1px solid var(--f1-border-light)', color: 'var(--f1-muted)' }}
              >
                👁 Ver palpites
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Última corrida ───────────────────────────────────── */}
      {recentlyFinishedRace && !liveRace && (
        <div
          className="rounded overflow-hidden p-5"
          style={{
            border: '1px solid rgba(255,192,0,0.4)',
            borderLeft: '4px solid var(--f1-gold)',
            background: 'var(--f1-card)',
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded mb-4"
            style={{ background: 'rgba(255,192,0,0.12)', color: 'var(--f1-gold)', border: '1px solid rgba(255,192,0,0.35)', letterSpacing: '0.14em' }}
          >
            🏆 Última corrida
          </span>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded"
                style={{ background: 'rgba(255,192,0,0.08)', border: '1px solid rgba(255,192,0,0.3)' }}
              >
                <span className="text-xs font-bold uppercase" style={{ color: 'var(--f1-gold)', letterSpacing: '0.1em' }}>R</span>
                <span className="text-xl font-black text-white leading-none">{recentlyFinishedRace.round_number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-base leading-tight">
                  {getRaceFlag(recentlyFinishedRace.name, recentlyFinishedRace.circuit)} {recentlyFinishedRace.name}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--f1-muted)' }}>
                  <span>{recentlyFinishedRace.circuit}</span>
                  <span style={{ color: 'var(--f1-border-light)' }}>•</span>
                  <span>{format(new Date(recentlyFinishedRace.race_start_time), "dd 'de' MMMM", { locale: ptBR })}</span>
                </div>
              </div>
            </div>

            <Link
              href={`/races/${recentlyFinishedRace.id}`}
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest px-5 py-3 rounded w-full sm:w-auto"
              style={{ border: '1px solid rgba(255,192,0,0.5)', color: 'var(--f1-gold)', background: 'rgba(255,192,0,0.06)', letterSpacing: '0.12em' }}
            >
              🏆 Ver pontuação
            </Link>
          </div>
        </div>
      )}

      {/* ── Próxima corrida (palpite aberto) ─────────────────── */}
      {featuredRace && (
        <div
          className="rounded overflow-hidden p-5"
          style={{
            border: '1px solid rgba(232,0,45,0.55)',
            borderLeft: '4px solid var(--f1-red)',
            background: 'linear-gradient(135deg, rgba(232,0,45,0.1) 0%, var(--f1-card) 55%)',
          }}
        >
          <span
            className="inline-flex text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded mb-4"
            style={{ border: '1px solid rgba(232,0,45,0.6)', color: 'var(--f1-red)', background: 'rgba(232,0,45,0.08)', letterSpacing: '0.14em' }}
          >
            Próxima corrida
          </span>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div
                className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded"
                style={{ background: 'rgba(232,0,45,0.12)', border: '1px solid rgba(232,0,45,0.35)' }}
              >
                <span className="text-xs font-bold uppercase" style={{ color: 'var(--f1-red)', letterSpacing: '0.1em' }}>R</span>
                <span className="text-xl font-black text-white leading-none">{featuredRace.round_number}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-base leading-tight">
                  {getRaceFlag(featuredRace.name, featuredRace.circuit)} {featuredRace.name}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--f1-muted)' }}>
                  <span>{featuredRace.circuit}</span>
                  <span style={{ color: 'var(--f1-border-light)' }}>•</span>
                  <span>{format(new Date(featuredRace.race_start_time), "d 'de' MMMM", { locale: ptBR })}</span>
                  {featuredRace.random_position && (
                    <>
                      <span style={{ color: 'var(--f1-border-light)' }}>•</span>
                      <span className="font-bold" style={{ color: 'var(--f1-gold)' }}>🎲 P{featuredRace.random_position}</span>
                    </>
                  )}
                </div>
                <CountdownChips target={featuredRace.fp1_start_time ?? featuredRace.qualifying_start_time} />
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-52">
              {!predicted(featuredRace.id) ? (
                <Link
                  href={`/races/${featuredRace.id}`}
                  className="btn-primary justify-center"
                  style={{ fontSize: '0.875rem', padding: '0.7rem 1.5rem', fontWeight: 900 }}
                >
                  Fazer palpite
                </Link>
              ) : (
                <>
                  <div className="text-center text-xs font-black uppercase tracking-wider" style={{ color: '#00d2be' }}>
                    ✓ Palpite enviado
                  </div>
                  <Link
                    href={`/races/${featuredRace.id}`}
                    className="btn-primary justify-center"
                    style={{ fontSize: '0.875rem', padding: '0.7rem 1.5rem', fontWeight: 900 }}
                  >
                    Editar palpite
                  </Link>
                </>
              )}
              <Link
                href={`/ao-vivo/${featuredRace.id}`}
                className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest px-3 py-2.5 rounded"
                style={{ border: '1px solid rgba(34,197,94,0.5)', color: '#22c55e', letterSpacing: '0.12em' }}
              >
                📡 Ao vivo
              </Link>
              <button
                onClick={() => setDetailsRace(featuredRace)}
                className="text-xs font-black uppercase tracking-widest px-3 py-2.5 rounded"
                style={{ border: '1px solid var(--f1-border-light)', color: 'white', background: 'rgba(255,255,255,0.03)', letterSpacing: '0.12em' }}
              >
                Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Próximas corridas (timeline) ─────────────────────── */}
      {activeRaces.length > 0 && (
        <div className="relative flex flex-col gap-3 sm:pl-7 mt-1">
          <span
            aria-hidden
            className="hidden sm:block absolute top-2 bottom-2 pointer-events-none"
            style={{ left: '4px', width: '1px', background: 'var(--f1-border)' }}
          />
          {activeRaces.map(race => (
            <RaceRow key={race.id} race={race} onViewPredictions={setModalRace} onViewDetails={setDetailsRace} />
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
            <div className="relative flex flex-col gap-3 sm:pl-7 mt-2">
              <span
                aria-hidden
                className="hidden sm:block absolute top-2 bottom-2 pointer-events-none"
                style={{ left: '4px', width: '1px', background: 'var(--f1-border)' }}
              />
              {finishedRaces.map(race => (
                <RaceRow key={race.id} race={race} isPast onViewPredictions={setModalRace} onViewDetails={setDetailsRace} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Aviso + sincronizar calendário ───────────────────── */}
      <div className="card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span
            className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
            style={{ border: '1px solid rgba(232,0,45,0.4)', color: 'var(--f1-red)' }}
            aria-hidden
          >
            🔄
          </span>
          <div className="text-sm" style={{ color: 'var(--f1-muted)' }}>
            <div>As datas podem sofrer alterações.</div>
            <div>Fique atento às atualizações!</div>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={syncCalendar}
            disabled={syncing}
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest px-5 py-3 rounded"
            style={{ border: '1px solid var(--f1-border-light)', color: 'white', background: 'rgba(255,255,255,0.03)', letterSpacing: '0.12em', opacity: syncing ? 0.6 : 1 }}
          >
            📅 {syncing ? 'Sincronizando...' : 'Sincronizar calendário'}
          </button>
        )}
      </div>

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
