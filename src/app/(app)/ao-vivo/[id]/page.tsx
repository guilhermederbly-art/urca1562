'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface LiveResult {
  pole: string; p1: string; p2: string; p3: string; random: string; bortoleto: string
}

interface LeaderboardRow {
  username: string
  total: number
  pole: number; p1: number; p2: number; p3: number; random: number; bortoleto: number
  picks: LiveResult
  rank?: number
  prevRank?: number
}

interface LiveData {
  ok: boolean
  isDemo: boolean
  raceName: string
  randomPosition: number | null
  hasData: boolean
  currentPositions: { position: number; abbreviation: string }[]
  liveResult: LiveResult
  leaderboard: LeaderboardRow[]
  lastUpdated: string
  error?: string
}

const POLL_INTERVAL = 10_000

export default function AoVivoPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const demo = searchParams.get('demo') === 'true'
  const [data, setData] = useState<LiveData | null>(null)
  const [prevRanks, setPrevRanks] = useState<Map<string, number>>(new Map())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [error, setError] = useState('')
  const lastUpdatedRef = useRef<string | null>(null)

  async function fetchLive() {
    try {
      const url = `/api/races/live?raceId=${id}${demo ? '&demo=true' : ''}`
      const res = await fetch(url)
      const json: LiveData = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro'); return }

      // Track rank movement
      if (data?.leaderboard) {
        const cur = new Map(data.leaderboard.map((r, i) => [r.username, i + 1]))
        setPrevRanks(cur)
      }

      const ranked = json.leaderboard.map((row, i) => ({ ...row, rank: i + 1 }))
      setData({ ...json, leaderboard: ranked })
      lastUpdatedRef.current = json.lastUpdated
      setSecondsAgo(0)
    } catch {
      setError('Falha na conexão')
    }
  }

  useEffect(() => {
    fetchLive()
    const poll = setInterval(fetchLive, POLL_INTERVAL)
    return () => clearInterval(poll)
  }, [id])

  // Countdown since last update
  useEffect(() => {
    const tick = setInterval(() => setSecondsAgo(s => s + 1), 1000)
    return () => clearInterval(tick)
  }, [])

  function rankDelta(username: string, currentRank: number) {
    const prev = prevRanks.get(username)
    if (prev === undefined || prev === currentRank) return null
    return prev - currentRank // positive = moved up
  }

  function ptChip(pts: number, maxPts: number, pick: string) {
    const exact = pts === maxPts
    const partial = pts > 0 && pts < maxPts
    const color = exact ? '#22c55e' : partial ? '#ffc000' : '#8a8aa0'
    const bg = exact ? 'rgba(34,197,94,0.12)' : partial ? 'rgba(255,192,0,0.12)' : 'rgba(138,138,160,0.08)'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
        <span style={{ fontSize: '0.65rem', color: '#8a8aa0', fontWeight: 700 }}>{pick}</span>
        <span style={{
          fontSize: '0.7rem', fontWeight: 900, color,
          backgroundColor: bg, borderRadius: 3,
          padding: '1px 5px', marginTop: 1,
        }}>
          {pts > 0 ? `+${pts}` : '0'}
        </span>
      </div>
    )
  }

  if (error) return (
    <main className="container mx-auto max-w-4xl px-4 py-12 text-center">
      <p style={{ color: 'var(--f1-red)' }}>{error}</p>
      <Link href="/dashboard" className="btn-secondary mt-4 inline-flex">← Voltar</Link>
    </main>
  )

  if (!data) return (
    <main className="container mx-auto max-w-4xl px-4 py-12 text-center">
      <p style={{ color: 'var(--f1-muted)' }}>Carregando dados ao vivo...</p>
    </main>
  )

  return (
    <main className="container mx-auto max-w-4xl px-4 py-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{
              background: demo ? '#7c3aed' : 'var(--f1-red)', color: 'white',
              fontSize: '0.65rem', fontWeight: 900,
              padding: '2px 8px', borderRadius: 3,
              letterSpacing: '0.12em', animation: demo ? 'none' : 'pulse 1.5s ease-in-out infinite',
              flexShrink: 0,
            }}>
              {demo ? '🎮 SIMULAÇÃO' : '🔴 AO VIVO'}
            </span>
            <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>
              att. {secondsAgo}s atrás · próx. {Math.max(0, Math.round((POLL_INTERVAL / 1000) - secondsAgo))}s
            </span>
          </div>
          <Link href="/dashboard" className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">← Voltar</Link>
        </div>
        <div>
          <h1 className="text-lg font-black text-white leading-tight">{data.raceName}</h1>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {data.randomPosition && (
              <span className="text-xs font-bold" style={{ color: 'var(--f1-gold)' }}>
                🎲 Posição aleatória: P{data.randomPosition}
              </span>
            )}
            {demo && (
              <span className="text-xs" style={{ color: '#a78bfa' }}>
                Posições aleatórias — apenas visualização
              </span>
            )}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
      </div>

      {!data.hasData ? (
        <div className="card p-12 text-center flex flex-col items-center gap-3">
          <div style={{ fontSize: '2rem' }}>🏁</div>
          <p className="font-bold text-white">Aguardando início da corrida</p>
          <p className="text-xs" style={{ color: 'var(--f1-muted)' }}>
            Os dados ao vivo aparecerão assim que a corrida começar.
          </p>
        </div>
      ) : (
        <>
          {/* Current race positions */}
          <div className="card overflow-hidden">
            <div className="striped-accent-thick" />
            <div className="px-5 pt-3 pb-1">
              <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--f1-red)' }}>
                Posições na corrida
              </h2>
            </div>
            <div className="px-5 pb-4">
              {/* Podium highlight */}
              <div className="flex gap-3 mb-3 mt-2">
                {[1, 2, 3].map(pos => {
                  const driver = data.currentPositions.find(p => p.position === pos)
                  const podiumColor = pos === 1 ? '#ffd700' : pos === 2 ? '#c0c0c0' : '#cd7f32'
                  const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'
                  return (
                    <div key={pos} style={{
                      flex: 1, textAlign: 'center', padding: '10px 4px',
                      borderRadius: 4, border: `1px solid ${podiumColor}33`,
                      backgroundColor: `${podiumColor}11`,
                    }}>
                      <div style={{ fontSize: '1.2rem' }}>{medal}</div>
                      <div className="font-black text-white" style={{ fontSize: '0.95rem' }}>
                        {driver?.abbreviation ?? '—'}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Remaining positions */}
              <div className="flex flex-wrap gap-1.5">
                {data.currentPositions.filter(p => p.position > 3).map(p => (
                  <span key={p.position} style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    color: p.position === data.randomPosition ? 'var(--f1-gold)' : 'var(--f1-muted)',
                    backgroundColor: p.position === data.randomPosition ? 'rgba(255,192,0,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${p.position === data.randomPosition ? 'rgba(255,192,0,0.3)' : 'var(--f1-border)'}`,
                    borderRadius: 3, padding: '2px 6px',
                  }}>
                    P{p.position} {p.abbreviation}
                    {p.position === data.randomPosition ? ' 🎲' : ''}
                  </span>
                ))}
              </div>

              {/* Live result row */}
              <div className="mt-3 pt-3 border-t flex gap-3 flex-wrap" style={{ borderColor: 'var(--f1-border)' }}>
                {[
                  { label: 'Pole', val: data.liveResult.pole },
                  { label: 'P1', val: data.liveResult.p1 },
                  { label: 'P2', val: data.liveResult.p2 },
                  { label: 'P3', val: data.liveResult.p3 },
                  { label: `🎲 P${data.randomPosition}`, val: data.liveResult.random },
                  { label: '🇧🇷 BOR', val: data.liveResult.bortoleto },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--f1-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live leaderboard */}
          <div className="card overflow-hidden">
            <div className="striped-accent-thick" />
            <div className="px-5 pt-3 pb-2 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--f1-red)' }}>
                Ranking ao vivo
              </h2>
              <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>
                {data.leaderboard.length} participante{data.leaderboard.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="text-sm" style={{ minWidth: 480, width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--f1-border)', background: 'rgba(0,0,0,0.3)' }}>
                    <th className="text-center py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)', position: 'sticky', left: 0, background: '#0d0d14', zIndex: 2, width: 36, paddingLeft: 12, paddingRight: 4 }}>#</th>
                    <th className="text-left py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)', position: 'sticky', left: 36, background: '#0d0d14', zIndex: 2, paddingLeft: 8, paddingRight: 8, minWidth: 90 }}>Nome</th>
                    <th className="text-center px-2 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)', position: 'sticky', left: 126, background: '#0d0d14', zIndex: 2, minWidth: 44, boxShadow: '2px 0 6px rgba(0,0,0,0.4)' }}>Pts</th>
                    <th className="text-center px-2 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>Pole</th>
                    <th className="text-center px-2 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>P1</th>
                    <th className="text-center px-2 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>P2</th>
                    <th className="text-center px-2 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>P3</th>
                    <th className="text-center px-2 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>🎲</th>
                    <th className="text-center px-2 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>🇧🇷</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((row, i) => {
                    const delta = rankDelta(row.username, i + 1)
                    const isFirst = i === 0
                    // Cores sólidas para sticky funcionar corretamente
                    const stickyBg = isFirst ? '#1e1b10' : '#1a1a27'
                    const rowBg = isFirst ? '#1c1a0f' : 'transparent'
                    return (
                      <tr key={row.username} style={{ borderBottom: '1px solid var(--f1-border)', background: rowBg, transition: 'background 0.3s' }}>
                        {/* Rank — sticky */}
                        <td style={{ position: 'sticky', left: 0, background: stickyBg, zIndex: 1, paddingLeft: 12, paddingRight: 4, paddingTop: 10, paddingBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <span className="font-black text-white" style={{ fontSize: '0.85rem' }}>{i + 1}</span>
                            {delta !== null && (
                              <span style={{ fontSize: '0.55rem', fontWeight: 900, color: delta > 0 ? '#22c55e' : '#ef4444', lineHeight: 1 }}>
                                {delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Username — sticky */}
                        <td style={{ position: 'sticky', left: 36, background: stickyBg, zIndex: 1, paddingLeft: 8, paddingRight: 8, paddingTop: 10, paddingBottom: 10, maxWidth: 90 }}>
                          <span className="font-bold text-white" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 80 }}>{row.username}</span>
                        </td>

                        {/* Total — sticky */}
                        <td style={{ position: 'sticky', left: 126, background: stickyBg, zIndex: 1, textAlign: 'center', paddingLeft: 8, paddingRight: 8, boxShadow: '2px 0 6px rgba(0,0,0,0.4)' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: isFirst ? '#ffd700' : 'white' }}>{row.total}</span>
                        </td>

                        {/* Category chips */}
                        <td className="text-center px-1 py-2">{ptChip(row.pole, 2, row.picks.pole)}</td>
                        <td className="text-center px-1 py-2">{ptChip(row.p1, 3, row.picks.p1)}</td>
                        <td className="text-center px-1 py-2">{ptChip(row.p2, 3, row.picks.p2)}</td>
                        <td className="text-center px-1 py-2">{ptChip(row.p3, 3, row.picks.p3)}</td>
                        <td className="text-center px-1 py-2">{ptChip(row.random, 4, row.picks.random)}</td>
                        <td className="text-center px-1 py-2">{ptChip(row.bortoleto, 4, row.picks.bortoleto)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
