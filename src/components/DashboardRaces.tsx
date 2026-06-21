'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Race } from '@/lib/types/database'

interface Props {
  openRace: Race | null
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/races/predictions?raceId=${race.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setPredictions(data.predictions)
          setRandomPos(data.random_position)
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
          {loading && (
            <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--f1-muted)' }}>
              Carregando...
            </div>
          )}
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

// ── Linha de corrida ──────────────────────────────────────────────────────────
function RaceRow({
  race,
  predicted,
  isPast,
  isAdmin,
  onViewPredictions,
}: {
  race: Race
  predicted: boolean
  isPast?: boolean
  isAdmin?: boolean
  onViewPredictions: (race: Race) => void
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
        <div className="font-bold text-white truncate" style={{ fontSize: '0.9375rem' }}>
          {race.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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

      <div className="flex-shrink-0 px-3 hidden sm:flex">
        <span className="status-pill" style={{ color: status.color, backgroundColor: status.bg }}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 pr-3 py-3">
        {/* Botão ao vivo — apenas corrida fechada com sessão OpenF1 */}
        {race.status === 'closed' && race.openf1_race_session_key && (
          <Link
            href={`/ao-vivo/${race.id}`}
            className="text-xs font-bold px-3 py-1.5 rounded border"
            style={{ borderColor: 'var(--f1-red)', color: 'var(--f1-red)' }}
          >
            🔴 Ao vivo
          </Link>
        )}

        {/* Botão ver palpites — apenas quando palpites fechados */}
        {(race.status === 'closed' || race.status === 'finished') && (
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
export default function DashboardRaces({ openRace, activeRaces, finishedRaces, predictedRaceIds, isAdmin }: Props) {
  const [showPast, setShowPast] = useState(false)
  const [modalRace, setModalRace] = useState<Race | null>(null)
  const predicted = (id: string) => predictedRaceIds.has(id)

  return (
    <div className="flex flex-col gap-4">

      {modalRace && (
        <PredictionsModal race={modalRace} onClose={() => setModalRace(null)} />
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
                <div className="font-black text-white text-base leading-tight">{openRace.name}</div>
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
                href={`/ao-vivo/${openRace.id}?demo=true`}
                className="text-xs font-bold px-3 py-1.5 rounded border"
                style={{ borderColor: '#7c3aed', color: '#a78bfa' }}
              >
                🎮 Simulação
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Próximas corridas ────────────────────────────────── */}
      {activeRaces.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeRaces.map(race => (
            <RaceRow key={race.id} race={race} predicted={predicted(race.id)} isAdmin={isAdmin} onViewPredictions={setModalRace} />
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
                <RaceRow key={race.id} race={race} predicted={predicted(race.id)} isPast isAdmin={isAdmin} onViewPredictions={setModalRace} />
              ))}
            </div>
          )}
        </div>
      )}

      {!openRace && activeRaces.length === 0 && finishedRaces.length === 0 && (
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
