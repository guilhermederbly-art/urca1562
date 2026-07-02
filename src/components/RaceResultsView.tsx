'use client'

import type { Race, Driver, RaceResult, Prediction } from '@/lib/types/database'
import { calculateScore, type ScoreBreakdown } from '@/lib/scoring'

interface Props {
  race: Race
  drivers: Driver[]
  result?: RaceResult
  userPrediction?: Prediction
}

function driverName(drivers: Driver[], id: string | null | undefined) {
  if (!id) return '—'
  return drivers.find(d => d.id === id)?.name ?? '—'
}

function PointsBadge({ points }: { points: number }) {
  if (points === 0) return <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: 'var(--f1-muted)', backgroundColor: 'rgba(154,154,176,0.1)' }}>0 pts</span>
  const label = `+${points} ${points === 1 ? 'pt' : 'pts'}`
  if (points >= 4) return <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: '#ffd700', backgroundColor: 'rgba(255,215,0,0.12)' }}>{label}</span>
  if (points === 3) return <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)' }}>{label}</span>
  if (points === 2) return <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: 'var(--f1-gold)', backgroundColor: 'rgba(255,215,0,0.1)' }}>{label}</span>
  return <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: '#f97316', backgroundColor: 'rgba(249,115,22,0.1)' }}>{label}</span>
}

function GoldBadge({ points }: { points: number }) {
  if (points === 0) return <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: 'var(--f1-muted)', backgroundColor: 'rgba(154,154,176,0.1)' }}>0 pts</span>
  return <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: 'var(--f1-gold)', backgroundColor: 'rgba(255,192,0,0.1)' }}>+1 pt</span>
}

export default function RaceResultsView({ race, drivers, result, userPrediction }: Props) {
  const score: ScoreBreakdown | null = result && userPrediction
    ? calculateScore(userPrediction, result, race.challenge_correct)
    : null

  const rows = [
    {
      label: 'Pole Position',
      emoji: '🏁',
      resultId: result?.pole_driver_id,
      predictionId: userPrediction?.pole_driver_id,
      points: score?.pole_points,
    },
    {
      label: '1° Lugar',
      emoji: '🥇',
      resultId: result?.p1_driver_id,
      predictionId: userPrediction?.p1_driver_id,
      points: score?.p1_points,
    },
    {
      label: '2° Lugar',
      emoji: '🥈',
      resultId: result?.p2_driver_id,
      predictionId: userPrediction?.p2_driver_id,
      points: score?.p2_points,
    },
    {
      label: '3° Lugar',
      emoji: '🥉',
      resultId: result?.p3_driver_id,
      predictionId: userPrediction?.p3_driver_id,
      points: score?.p3_points,
    },
    ...(race.random_position ? [{
      label: `Posição Aleatória (P${race.random_position})`,
      emoji: '🎲',
      resultId: result?.random_pos_driver_id,
      predictionId: userPrediction?.random_pos_driver_id,
      points: score?.random_pos_points,
      isDNF: !!(result && result.random_pos_driver_id === null),
    }] : []),
    {
      label: 'Posição do Bortoleto',
      emoji: '🇧🇷',
      resultId: result?.bortoleto_position ? `P${result.bortoleto_position}` : undefined,
      predictionId: userPrediction?.bortoleto_position ? `P${userPrediction.bortoleto_position}` : undefined,
      points: score?.bortoleto_points,
      isPosition: true,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Total score */}
      {score && (
        <div className="card p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--f1-muted)' }}>Sua pontuação nesta corrida</div>
            <div className="text-4xl font-black" style={{ color: 'var(--f1-red)' }}>
              {score.total_points}
              <span className="text-lg font-normal ml-1" style={{ color: 'var(--f1-muted)' }}>pts</span>
            </div>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Fiz ${score.total_points} pts no ${race.name}! 🏆 F1 Bolão`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-shrink-0"
            style={{ background: '#25d366', textDecoration: 'none', fontSize: '0.75rem', padding: '0.4rem 0.875rem' }}
          >
            📲 Compartilhar
          </a>
        </div>
      )}

      {/* Results table */}
      <div className="card overflow-hidden">
        <div className="striped-accent" />
        <div className="px-5 py-4 border-b font-bold text-sm grid grid-cols-3 gap-2"
          style={{ borderColor: 'var(--f1-border)', color: 'var(--f1-muted)' }}>
          <span></span>
          <span>Resultado</span>
          <span>Seu palpite</span>
        </div>

        {rows.map((row, i) => {
          const correct = row.resultId === row.predictionId && row.resultId != null
          if (row.isDNF) {
            return (
              <div
                key={i}
                className="px-5 py-3 grid grid-cols-3 gap-2 items-center border-b text-sm"
                style={{ borderColor: 'var(--f1-border)', backgroundColor: 'rgba(138,138,160,0.05)' }}
              >
                <span className="font-medium">
                  {row.emoji} {row.label}
                </span>
                <span className="font-bold text-xs px-1.5 py-0.5 rounded" style={{ color: '#8a8aa0', background: 'rgba(138,138,160,0.15)', width: 'fit-content' }}>
                  DNF — anulada
                </span>
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--f1-muted)' }}>
                    {driverName(drivers, row.predictionId as string)}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: 'var(--f1-muted)', backgroundColor: 'rgba(154,154,176,0.1)' }}>0 pts</span>
                </div>
              </div>
            )
          }
          return (
            <div
              key={i}
              className="px-5 py-3 grid grid-cols-3 gap-2 items-center border-b text-sm"
              style={{
                borderColor: 'var(--f1-border)',
                backgroundColor: correct ? 'rgba(34,197,94,0.05)' : undefined,
              }}
            >
              <span className="font-medium">
                {row.emoji} {row.label}
              </span>
              <span className="font-semibold">
                {row.isPosition
                  ? (row.resultId ?? '—')
                  : driverName(drivers, row.resultId as string)}
              </span>
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--f1-muted)' }}>
                  {row.isPosition
                    ? (row.predictionId ?? '—')
                    : driverName(drivers, row.predictionId as string)}
                </span>
                {row.points !== undefined && <PointsBadge points={row.points} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Challenge row */}
      {race.challenge_question && (userPrediction?.challenge_answer || race.challenge_correct) && (
        <div className="card overflow-hidden" style={{ border: '1px solid rgba(255,192,0,0.2)', background: 'rgba(255,192,0,0.03)' }}>
          <div className="px-5 py-3 flex items-start gap-3">
            <span className="text-base flex-shrink-0">⚡</span>
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-gold)' }}>
                Desafio da Rodada
              </div>
              <div className="text-sm font-semibold text-white mb-2">{race.challenge_question}</div>
              <div className="flex flex-wrap gap-3 text-xs">
                {race.challenge_correct && (
                  <span style={{ color: 'var(--f1-muted)' }}>
                    Resposta: <span className="font-bold text-white">{race.challenge_correct}</span>
                  </span>
                )}
                {userPrediction?.challenge_answer && (
                  <span style={{ color: 'var(--f1-muted)' }}>
                    Seu palpite: <span className="font-bold" style={{
                      color: race.challenge_correct
                        ? (userPrediction.challenge_answer === race.challenge_correct ? '#22c55e' : 'var(--f1-red)')
                        : 'white'
                    }}>{userPrediction.challenge_answer}</span>
                  </span>
                )}
                {score !== null && race.challenge_correct && (
                  <GoldBadge points={score.challenge_points} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="card p-6 text-center">
          <p style={{ color: 'var(--f1-muted)' }} className="text-sm">
            Os resultados ainda não foram publicados para esta corrida.
          </p>
        </div>
      )}

      {!userPrediction && result && (
        <div className="card p-6 text-center">
          <p style={{ color: 'var(--f1-muted)' }} className="text-sm">
            Você não fez palpite para esta corrida.
          </p>
        </div>
      )}
    </div>
  )
}
