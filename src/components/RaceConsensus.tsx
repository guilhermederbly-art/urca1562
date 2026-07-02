import type { Driver, Race, Prediction } from '@/lib/types/database'

interface ConsensusData {
  pole:       Record<string, number>
  p1:         Record<string, number>
  p2:         Record<string, number>
  p3:         Record<string, number>
  random_pos: Record<string, number>
  bortoleto:  Record<string, number>
  challenge:  Record<string, number>
  total:      number
}

interface Props {
  race:          Race
  consensus:     ConsensusData
  drivers:       Driver[]
  userPrediction?: Prediction
}

function driverAbbr(drivers: Driver[], id: string | null | undefined) {
  if (!id) return '—'
  return drivers.find(d => d.id === id)?.abbreviation ?? id.slice(0, 3).toUpperCase()
}

function Bar({
  count, total, highlight, correct,
}: {
  count: number; total: number; highlight: boolean; correct: boolean
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const barColor = correct ? '#22c55e' : highlight ? 'var(--f1-red)' : 'rgba(255,255,255,0.15)'
  return (
    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '2px', transition: 'width 0.4s ease' }} />
    </div>
  )
}

function CategoryConsensus({
  label,
  freq,
  total,
  userValue,
  correctValue,
  labelFn,
}: {
  label: string
  freq: Record<string, number>
  total: number
  userValue?: string | null
  correctValue?: string | null
  labelFn: (k: string) => string
}) {
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5)
  if (sorted.length === 0) return null
  return (
    <div className="pb-4 mb-4 border-b" style={{ borderColor: 'var(--f1-border)' }}>
      <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--f1-muted)' }}>{label}</div>
      <div className="flex flex-col gap-1.5">
        {sorted.map(([key, count]) => {
          const pct  = total > 0 ? Math.round((count / total) * 100) : 0
          const isMe = userValue === key
          const isCorrect = correctValue != null && correctValue === key
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="text-xs font-black w-10 flex-shrink-0"
                style={{ color: isCorrect ? '#22c55e' : isMe ? 'var(--f1-red)' : 'var(--f1-text)' }}
              >
                {labelFn(key)}
              </span>
              <Bar count={count} total={total} highlight={isMe} correct={isCorrect} />
              <span className="text-xs font-bold w-8 text-right flex-shrink-0" style={{ color: 'var(--f1-muted)' }}>
                {pct}%
              </span>
              <span className="text-xs w-8 flex-shrink-0" style={{ color: 'var(--f1-muted)', fontSize: '0.62rem' }}>
                {count}x
              </span>
              {isMe && !isCorrect && (
                <span className="text-xs font-black flex-shrink-0" style={{ color: 'var(--f1-red)', fontSize: '0.6rem' }}>você</span>
              )}
              {isCorrect && (
                <span className="text-xs font-black flex-shrink-0" style={{ color: '#22c55e', fontSize: '0.6rem' }}>✓</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RaceConsensus({ race, consensus, drivers, userPrediction }: Props) {
  if (consensus.total === 0) return null

  const driverLabel = (id: string) => driverAbbr(drivers, id)
  const posLabel    = (pos: string) => `P${pos}`

  return (
    <div className="card overflow-hidden">
      <div className="striped-accent-thick" />
      <div className="px-5 pt-4 pb-1 flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--f1-red)' }}>
          Consenso do grupo
        </h2>
        <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>{consensus.total} palpite{consensus.total !== 1 ? 's' : ''}</span>
      </div>
      <div className="px-5 py-4">
        <CategoryConsensus
          label="Pole Position"
          freq={consensus.pole}
          total={consensus.total}
          userValue={userPrediction?.pole_driver_id}
          correctValue={null}
          labelFn={driverLabel}
        />
        <CategoryConsensus
          label="1° Lugar"
          freq={consensus.p1}
          total={consensus.total}
          userValue={userPrediction?.p1_driver_id}
          correctValue={null}
          labelFn={driverLabel}
        />
        <CategoryConsensus
          label="2° Lugar"
          freq={consensus.p2}
          total={consensus.total}
          userValue={userPrediction?.p2_driver_id}
          correctValue={null}
          labelFn={driverLabel}
        />
        <CategoryConsensus
          label="3° Lugar"
          freq={consensus.p3}
          total={consensus.total}
          userValue={userPrediction?.p3_driver_id}
          correctValue={null}
          labelFn={driverLabel}
        />
        {race.random_position && Object.keys(consensus.random_pos).length > 0 && (
          <CategoryConsensus
            label={`Posição Aleatória — P${race.random_position} 🎲`}
            freq={consensus.random_pos}
            total={consensus.total}
            userValue={userPrediction?.random_pos_driver_id}
            correctValue={null}
            labelFn={driverLabel}
          />
        )}
        {Object.keys(consensus.bortoleto).length > 0 && (
          <CategoryConsensus
            label="Bortoleto 🇧🇷"
            freq={consensus.bortoleto}
            total={consensus.total}
            userValue={userPrediction?.bortoleto_position != null ? String(userPrediction.bortoleto_position) : null}
            correctValue={null}
            labelFn={posLabel}
          />
        )}
        {race.challenge_question && Object.keys(consensus.challenge).length > 0 && (
          <div className="border-0">
            <CategoryConsensus
              label={`Desafio ⚡ — ${race.challenge_question}`}
              freq={consensus.challenge}
              total={consensus.total}
              userValue={userPrediction?.challenge_answer}
              correctValue={race.challenge_correct}
              labelFn={(k) => k}
            />
          </div>
        )}
      </div>
    </div>
  )
}
