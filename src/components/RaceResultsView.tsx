'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Race, Driver, RaceResult, Prediction } from '@/lib/types/database'
import { calculateScore, type ScoreBreakdown } from '@/lib/scoring'
import { getCircuitInfo, getRaceFlag } from '@/lib/circuitData'

interface BaseProps {
  race: Race
  drivers: Driver[]
  result?: RaceResult
  userPrediction?: Prediction
}

function driverName(drivers: Driver[], id: string | null | undefined) {
  if (!id) return '—'
  return drivers.find(d => d.id === id)?.name ?? '—'
}

function computeScore({ race, result, userPrediction }: Pick<BaseProps, 'race' | 'result' | 'userPrediction'>): ScoreBreakdown | null {
  return result && userPrediction ? calculateScore(userPrediction, result, race.challenge_correct) : null
}

function PointsBadge({ points }: { points: number }) {
  if (points === 0) {
    return <span className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0" style={{ color: 'var(--f1-muted)', backgroundColor: 'rgba(154,154,176,0.12)' }}>0 pts</span>
  }
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0" style={{ color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.12)' }}>
      +{points} {points === 1 ? 'pt' : 'pts'}
    </span>
  )
}

// ── Sua pontuação + compartilhar ─────────────────────────────────────────────
export function ScoreSummaryCard({ race, result, userPrediction }: Omit<BaseProps, 'drivers'>) {
  const score = computeScore({ race, result, userPrediction })
  if (!score) return null
  return (
    <div className="card p-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--f1-muted)' }}>Sua pontuação nesta corrida</div>
        <div className="text-4xl font-black" style={{ color: 'var(--f1-red)' }}>
          {score.total_points}
          <span className="text-lg font-normal ml-1.5" style={{ color: 'var(--f1-muted)' }}>pts</span>
        </div>
      </div>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`Fiz ${score.total_points} pts no ${race.name}! 🏆 F1 Bolão`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary flex-shrink-0"
        style={{ background: '#16a34a', textDecoration: 'none', fontSize: '0.75rem', padding: '0.55rem 1.1rem' }}
      >
        🔗 Compartilhar
      </a>
    </div>
  )
}

// ── Desafio da rodada ────────────────────────────────────────────────────────
export function ChallengeResultCard({ race, result, userPrediction }: Omit<BaseProps, 'drivers'>) {
  const score = computeScore({ race, result, userPrediction })
  if (!race.challenge_question || (!userPrediction?.challenge_answer && !race.challenge_correct)) return null

  const hit = !!race.challenge_correct && userPrediction?.challenge_answer === race.challenge_correct
  return (
    <div className="rounded p-5" style={{ border: '1px solid rgba(255,192,0,0.35)', background: 'rgba(255,192,0,0.04)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span aria-hidden>⚡</span>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--f1-gold)' }}>
          Desafio da Rodada
        </span>
      </div>
      <p className="text-sm font-bold text-white mb-3">{race.challenge_question}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        {race.challenge_correct && (
          <span style={{ color: 'var(--f1-muted)' }}>
            Resposta: <span className="font-black text-white">{race.challenge_correct}</span>
          </span>
        )}
        {userPrediction?.challenge_answer && (
          <span style={{ color: 'var(--f1-muted)' }}>
            Seu palpite:{' '}
            <span className="font-black" style={{ color: race.challenge_correct ? (hit ? '#22c55e' : 'var(--f1-red)') : 'white' }}>
              {userPrediction.challenge_answer}
            </span>
          </span>
        )}
        {score !== null && race.challenge_correct && <PointsBadge points={score.challenge_points} />}
      </div>
    </div>
  )
}

// ── Tabela de resultado da corrida ───────────────────────────────────────────
export function ResultsTableCard({ race, drivers, result, userPrediction }: BaseProps) {
  const score = computeScore({ race, result, userPrediction })

  const rows = [
    { label: 'Pole Position', emoji: '🏁', resultId: result?.pole_driver_id, predictionId: userPrediction?.pole_driver_id, points: score?.pole_points },
    { label: '1° Lugar', emoji: '🥇', resultId: result?.p1_driver_id, predictionId: userPrediction?.p1_driver_id, points: score?.p1_points },
    { label: '2° Lugar', emoji: '🥈', resultId: result?.p2_driver_id, predictionId: userPrediction?.p2_driver_id, points: score?.p2_points },
    { label: '3° Lugar', emoji: '🥉', resultId: result?.p3_driver_id, predictionId: userPrediction?.p3_driver_id, points: score?.p3_points },
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
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--f1-border)' }}>
        <span aria-hidden style={{ color: 'var(--f1-red)' }}>🏆</span>
        <span className="text-sm font-black uppercase tracking-widest text-white">Resultado da corrida</span>
      </div>

      {/* Cabeçalho de colunas */}
      <div
        className="px-5 py-3 border-b grid gap-2 text-xs font-bold uppercase tracking-widest"
        style={{ borderColor: 'var(--f1-border)', color: 'var(--f1-muted)', gridTemplateColumns: '1.2fr 1fr 1.2fr' }}
      >
        <span>Posição</span>
        <span>Resultado</span>
        <span>Seu palpite</span>
      </div>

      {rows.map((row, i) => {
        const correct = row.resultId === row.predictionId && row.resultId != null
        const isLast = i === rows.length - 1
        if ('isDNF' in row && row.isDNF) {
          return (
            <div key={i} className="px-5 py-3.5 grid gap-2 items-center text-sm" style={{
              gridTemplateColumns: '1.2fr 1fr 1.2fr',
              borderBottom: isLast ? 'none' : '1px solid var(--f1-border)',
              backgroundColor: 'rgba(138,138,160,0.05)',
            }}>
              <span className="font-medium">{row.emoji} {row.label}</span>
              <span className="font-bold text-xs px-1.5 py-0.5 rounded" style={{ color: '#8a8aa0', background: 'rgba(138,138,160,0.15)', width: 'fit-content' }}>
                DNF — anulada
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ color: 'var(--f1-muted)' }}>{driverName(drivers, row.predictionId as string)}</span>
                <PointsBadge points={0} />
              </div>
            </div>
          )
        }
        return (
          <div key={i} className="px-5 py-3.5 grid gap-2 items-center text-sm" style={{
            gridTemplateColumns: '1.2fr 1fr 1.2fr',
            borderBottom: isLast ? 'none' : '1px solid var(--f1-border)',
            backgroundColor: correct ? 'rgba(34,197,94,0.05)' : undefined,
          }}>
            <span className="font-medium">{row.emoji} {row.label}</span>
            <span className="font-bold text-white">
              {row.isPosition ? (row.resultId ?? '—') : driverName(drivers, row.resultId as string)}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ color: 'var(--f1-muted)' }}>
                {row.isPosition ? (row.predictionId ?? '—') : driverName(drivers, row.predictionId as string)}
              </span>
              {row.points !== undefined && <PointsBadge points={row.points} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Card do circuito ─────────────────────────────────────────────────────────
export function CircuitInfoCard({ race }: { race: Race }) {
  const info = getCircuitInfo(race.name, race.circuit)
  if (!info) return null

  const metaRows = [
    { icon: '📅', text: format(new Date(race.race_start_time), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) },
    { icon: '📍', text: `${race.circuit}, ${race.name.replace(/^Grande Prêmio (da|do|de|dos|das)\s*/i, '')}` },
    { icon: '🛣️', text: `${info.length.toFixed(3)} km` },
    { icon: '⏱️', text: `${info.laps} voltas` },
  ]

  return (
    <div
      className="rounded overflow-hidden flex flex-col sm:flex-row"
      style={{ border: '1px solid rgba(232,0,45,0.4)', background: 'var(--f1-card)' }}
    >
      <div className="sm:w-1/2 flex-shrink-0 flex items-center justify-center" style={{ background: '#000', minHeight: '160px' }}>
        <img
          src={`/circuits/${info._key}.svg`}
          alt={`Traçado de ${race.circuit}`}
          style={{ width: '100%', display: 'block' }}
          onError={e => { (e.target as HTMLImageElement).src = `/circuits/${info._key}.png` }}
        />
      </div>
      <div className="flex-1 p-5 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span aria-hidden>{getRaceFlag(race.name, race.circuit)}</span>
          <span className="font-black text-white text-lg uppercase tracking-wide">{race.circuit}</span>
        </div>
        <div className="text-xs mb-2" style={{ color: 'var(--f1-muted)' }}>Circuito de {race.circuit}</div>
        {metaRows.map(m => (
          <div key={m.text} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--f1-muted)' }}>
            <span className="text-xs" aria-hidden>{m.icon}</span>
            <span>{m.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Barra de dica no rodapé ──────────────────────────────────────────────────
export function DicaBar({ race }: { race: Race }) {
  return (
    <div className="card px-5 py-4 flex items-center gap-4">
      <span
        className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
        style={{ border: '1px solid rgba(232,0,45,0.4)', color: 'var(--f1-red)' }}
        aria-hidden
      >
        🎯
      </span>
      <p className="text-sm" style={{ color: 'var(--f1-muted)' }}>
        <span className="font-black uppercase tracking-widest text-xs mr-2" style={{ color: 'var(--f1-red)' }}>Dica</span>
        A pontuação é calculada com base nas posições previstas para Pole, P1, P2, P3,
        {race.random_position ? ` o piloto sorteado (P${race.random_position}),` : ''} o Bortoleto e o desafio da rodada.
      </p>
    </div>
  )
}

// ── Estados vazios ───────────────────────────────────────────────────────────
export function EmptyResultsNotice({ result, userPrediction }: { result?: RaceResult; userPrediction?: Prediction }) {
  if (result && userPrediction) return null
  return (
    <div className="card p-6 text-center">
      <p style={{ color: 'var(--f1-muted)' }} className="text-sm">
        {!result
          ? 'Os resultados ainda não foram publicados para esta corrida.'
          : 'Você não fez palpite para esta corrida.'}
      </p>
    </div>
  )
}
