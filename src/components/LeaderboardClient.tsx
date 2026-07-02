'use client'

import { useState, useEffect } from 'react'
import Spinner from './Spinner'

interface Entry {
  userId: string
  username: string
  total: number
  delta: number | undefined
}

interface H2HRace { id: string; name: string; round: number; mine: number; theirs: number; winner: string }
interface H2HData {
  me:    { username: string; total: number }
  them:  { username: string; total: number }
  myWins: number; theirWins: number; ties: number
  races: H2HRace[]
}

function H2HModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<H2HData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/h2h?userId=${userId}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden" style={{ borderRadius: '4px' }}>
        <div className="striped-accent-thick flex-shrink-0" />
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--f1-border)' }}>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--f1-red)' }}>Head-to-head</span>
          <button onClick={onClose} className="text-xl font-bold leading-none" style={{ color: 'var(--f1-muted)' }}>✕</button>
        </div>

        <div className="overflow-auto flex-1">
          {loading && <Spinner />}
          {!loading && !data && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--f1-muted)' }}>
              Nenhum dado disponível ainda.
            </div>
          )}
          {data && (
            <>
              <div className="grid grid-cols-3 px-5 py-5 border-b" style={{ borderColor: 'var(--f1-border)' }}>
                <div className="text-center">
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)' }}>Você</div>
                  <div className="text-3xl font-black text-white">{data.me.total}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>pts</div>
                </div>
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--f1-muted)' }}>Vitórias</div>
                  <div className="flex items-center gap-1 text-sm font-black">
                    <span style={{ color: data.myWins >= data.theirWins ? 'var(--f1-red)' : 'var(--f1-muted)' }}>{data.myWins}</span>
                    <span style={{ color: 'var(--f1-border-light)' }}>–</span>
                    <span style={{ color: data.theirWins > data.myWins ? '#ffc000' : 'var(--f1-muted)' }}>{data.theirWins}</span>
                  </div>
                  {data.ties > 0 && (
                    <div className="text-xs mt-1" style={{ color: 'var(--f1-muted)' }}>{data.ties} empate{data.ties !== 1 ? 's' : ''}</div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#ffc000' }}>{data.them.username}</div>
                  <div className="text-3xl font-black text-white">{data.them.total}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>pts</div>
                </div>
              </div>
              {data.races.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--f1-muted)' }}>
                  Nenhuma corrida finalizada ainda.
                </div>
              ) : (
                <div>
                  {data.races.map(r => {
                    const iWon   = r.winner === 'me'
                    const theyWon = r.winner === 'them'
                    return (
                      <div
                        key={r.id}
                        className="grid px-5 py-2.5 items-center text-sm border-b"
                        style={{ gridTemplateColumns: '2rem 1fr 2.5rem auto 2.5rem', borderColor: 'var(--f1-border)', gap: '0.5rem' }}
                      >
                        <span className="font-black" style={{ color: 'var(--f1-muted)', fontStyle: 'italic', fontSize: '0.7rem' }}>
                          R{String(r.round).padStart(2, '0')}
                        </span>
                        <span className="font-bold truncate" style={{ color: 'var(--f1-text)', fontSize: '0.8rem' }}>{r.name}</span>
                        <span className="text-right font-black" style={{ color: iWon ? 'var(--f1-red)' : 'var(--f1-muted)' }}>{r.mine}</span>
                        <span style={{ color: 'var(--f1-border-light)', textAlign: 'center' }}>×</span>
                        <span className="font-black" style={{ color: theyWon ? '#ffc000' : 'var(--f1-muted)' }}>{r.theirs}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const MEDAL_COLOR = [
  { bg: 'rgba(255,192,0,0.12)',  border: 'var(--f1-gold)',   text: 'var(--f1-gold)',   label: '01' },
  { bg: 'rgba(192,192,192,0.1)', border: 'var(--f1-silver)', text: 'var(--f1-silver)', label: '02' },
  { bg: 'rgba(205,127,50,0.1)',  border: 'var(--f1-bronze)', text: 'var(--f1-bronze)', label: '03' },
]

export default function LeaderboardClient({ entries, currentUserId }: { entries: Entry[]; currentUserId: string }) {
  const [h2hTarget, setH2hTarget] = useState<string | null>(null)

  return (
    <>
      {h2hTarget && <H2HModal userId={h2hTarget} onClose={() => setH2hTarget(null)} />}

      <div className="card overflow-hidden">
        <div className="striped-accent-thick" />

        {entries.length === 0 ? (
          <p className="p-12 text-center text-sm uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>
            Nenhum palpite pontuado ainda
          </p>
        ) : (
          <div>
            <div
              className="grid px-4 py-2 text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--f1-muted)', borderBottom: '1px solid var(--f1-border)', gridTemplateColumns: '3rem 1fr 5rem' }}
            >
              <span>POS</span>
              <span>Nome</span>
              <span className="text-right">PTS</span>
            </div>

            {entries.map((entry, i) => {
              const isMe  = entry.userId === currentUserId
              const medal = MEDAL_COLOR[i]
              const delta = entry.delta
              const hasDelta = delta !== undefined && delta !== 0

              return (
                <div
                  key={entry.userId}
                  className="grid px-4 py-3.5 items-center transition-colors"
                  style={{
                    gridTemplateColumns: '3rem 1fr 5rem',
                    borderBottom: '1px solid var(--f1-border)',
                    backgroundColor: isMe ? 'rgba(232,0,45,0.06)' : i === 0 ? 'rgba(255,192,0,0.04)' : undefined,
                    borderLeft: isMe ? '3px solid var(--f1-red)' : medal ? `3px solid ${medal.border}` : '3px solid transparent',
                  }}
                >
                  <span className="font-black text-sm" style={{ fontStyle: 'italic', color: medal ? medal.text : 'var(--f1-muted)' }}>
                    {medal ? medal.label : `0${i + 1}`.slice(-2)}
                  </span>

                  <span className="font-bold text-sm truncate flex items-center gap-1.5">
                    <span style={{ color: isMe ? 'white' : 'var(--f1-text)' }}>{entry.username}</span>
                    {isMe && (
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-red)' }}>você</span>
                    )}
                    {hasDelta && (
                      <span
                        className="text-xs font-bold flex-shrink-0"
                        style={{ color: delta! > 0 ? '#22c55e' : '#ef4444' }}
                        title={delta! > 0 ? `Subiu ${delta} posição` : `Caiu ${Math.abs(delta!)} posição`}
                      >
                        {delta! > 0 ? `▲${delta}` : `▼${Math.abs(delta!)}`}
                      </span>
                    )}
                    {!isMe && (
                      <button
                        onClick={() => setH2hTarget(entry.userId)}
                        className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ color: 'var(--f1-muted)', border: '1px solid var(--f1-border)', background: 'none', cursor: 'pointer', fontSize: '0.6rem', lineHeight: 1.4 }}
                      >
                        H2H
                      </button>
                    )}
                  </span>

                  <span
                    className="text-right font-black text-lg pts-badge"
                    style={{ color: medal ? medal.text : isMe ? 'var(--f1-red)' : 'var(--f1-text)' }}
                  >
                    {entry.total}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
