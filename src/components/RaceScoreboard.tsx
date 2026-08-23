'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import GroupSelector, { type GroupInfo } from './GroupSelector'

const Confetti = dynamic(() => import('./Confetti'), { ssr: false })

interface ScoreRow {
  username: string
  total_points: number
  pole_points: number
  p1_points: number
  p2_points: number
  p3_points: number
  random_pos_points: number
  bortoleto_points: number
  challenge_points: number
  user_id: string
}

interface Props {
  scores: ScoreRow[]
  currentUserId: string
  hasChallengePoints: boolean
  groups?: GroupInfo[]
}

export default function RaceScoreboard({ scores, currentUserId, hasChallengePoints, groups = [] }: Props) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [activeGroup, setActiveGroup] = useState('geral')

  const visibleScores = activeGroup === 'geral'
    ? scores
    : scores.filter(s => groups.find(g => g.id === activeGroup)?.memberIds.includes(s.user_id))

  const userIndex = visibleScores.findIndex(s => s.user_id === currentUserId)
  const userIsFirst = userIndex === 0

  useEffect(() => {
    const globalFirst = scores[0]?.user_id === currentUserId && scores.length > 1
    if (globalFirst) setShowConfetti(true)
  }, [])

  return (
    <>
      {showConfetti && <Confetti />}
    <div className="card overflow-hidden">
      <div className="striped-accent-thick" />
      {userIsFirst && visibleScores.length > 1 && (
        <div className="px-5 py-3 flex items-center gap-2 border-b animate-fade-in-up"
          style={{ borderColor: 'var(--f1-border)', background: 'rgba(255,192,0,0.07)' }}>
          <span className="text-xl">🏆</span>
          <span className="font-black text-sm" style={{ color: 'var(--f1-gold)' }}>
            Você venceu esta corrida! Parabéns!
          </span>
        </div>
      )}
      <div className="px-5 pt-4 pb-3 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--f1-border)' }}>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--f1-gold)' }}>
            Pontuação da rodada
          </div>
          <div className="font-black text-white">Ranking desta corrida</div>
        </div>
        <GroupSelector groups={groups} value={activeGroup} onChange={setActiveGroup} />
      </div>

      <div className="overflow-x-auto">
        <table className="text-sm" style={{ minWidth: 460, width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--f1-border)', background: 'rgba(0,0,0,0.3)' }}>
              <th className="text-center py-2.5 text-xs font-bold uppercase tracking-widest w-10 pl-4" style={{ color: 'var(--f1-muted)' }}>#</th>
              <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)', minWidth: 100 }}>Participante</th>
              <th className="text-center py-2.5 px-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-gold)', minWidth: 48 }}>Total</th>
              <th className="text-center py-2.5 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>Pole</th>
              <th className="text-center py-2.5 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>P1</th>
              <th className="text-center py-2.5 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>P2</th>
              <th className="text-center py-2.5 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>P3</th>
              <th className="text-center py-2.5 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>🎲</th>
              <th className="text-center py-2.5 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>🇧🇷</th>
              {hasChallengePoints && (
                <th className="text-center py-2.5 px-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-gold)' }}>⚡</th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleScores.map((row, i) => {
              const isMe = row.user_id === currentUserId
              const isFirst = i === 0
              const medal = isFirst ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
              return (
                <tr
                  key={row.user_id}
                  style={{
                    borderBottom: '1px solid var(--f1-border)',
                    background: isMe
                      ? 'rgba(0,210,190,0.06)'
                      : isFirst
                        ? 'rgba(255,192,0,0.04)'
                        : 'transparent',
                  }}
                >
                  <td className="text-center pl-4 py-3">
                    <span className="font-black text-white" style={{ fontSize: '0.85rem' }}>
                      {medal ?? (i + 1)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="font-bold"
                      style={{
                        color: isMe ? '#00d2be' : isFirst ? 'var(--f1-gold)' : 'white',
                        fontSize: '0.875rem',
                      }}
                    >
                      {row.username}
                      {isMe && <span className="ml-1.5 text-xs font-normal" style={{ color: '#00d2be', opacity: 0.7 }}>você</span>}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span
                      className="font-black"
                      style={{
                        fontSize: '1.1rem',
                        color: isFirst ? 'var(--f1-gold)' : isMe ? '#00d2be' : 'white',
                      }}
                    >
                      {row.total_points}
                    </span>
                  </td>
                  {[
                    { val: row.pole_points, max: 2 },
                    { val: row.p1_points, max: 3 },
                    { val: row.p2_points, max: 3 },
                    { val: row.p3_points, max: 3 },
                    { val: row.random_pos_points, max: 4 },
                    { val: row.bortoleto_points, max: 4 },
                  ].map(({ val, max }, ci) => (
                    <td key={ci} className="text-center px-2 py-3">
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color: val === max ? '#22c55e' : val > 0 ? '#ffc000' : 'var(--f1-muted)',
                          background: val === max
                            ? 'rgba(34,197,94,0.12)'
                            : val > 0
                              ? 'rgba(255,192,0,0.12)'
                              : 'rgba(138,138,160,0.06)',
                        }}
                      >
                        {val > 0 ? `+${val}` : '0'}
                      </span>
                    </td>
                  ))}
                  {hasChallengePoints && (
                    <td className="text-center px-2 py-3">
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color: row.challenge_points > 0 ? '#22c55e' : 'var(--f1-muted)',
                          background: row.challenge_points > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(138,138,160,0.06)',
                        }}
                      >
                        {row.challenge_points > 0 ? `+${row.challenge_points}` : '0'}
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
    </>
  )
}
