import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = { title: 'Meu Perfil — F1 Bolão' }

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: predictionsRaw },
    { data: racesRaw },
    { data: driversRaw },
    { data: scoresRaw },
    { data: profileRaw },
    { data: allScoresRaw },
  ] = await Promise.all([
    supabase.from('predictions').select('*').eq('user_id', user.id),
    supabase.from('races').select('*').order('round_number', { ascending: true }),
    supabase.from('drivers').select('id, abbreviation'),
    supabase.from('scores').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('username').eq('id', user.id).single(),
    supabase.from('scores').select('user_id, race_id, total_points'),
  ])

  const predictions = predictionsRaw ?? []
  const races = racesRaw ?? []
  const drivers = driversRaw ?? []
  const scores = scoresRaw ?? []
  const username = profileRaw?.username ?? '?'

  const driverMap = new Map(drivers.map(d => [d.id, d.abbreviation]))
  const raceMap = new Map(races.map(r => [r.id, r]))
  const scoreMap = new Map(scores.map(s => [s.race_id, s]))

  const raceIds = predictions.map(p => p.race_id)
  const { data: resultsRaw } = raceIds.length
    ? await supabase.from('race_results').select('*').in('race_id', raceIds)
    : { data: [] }
  const resultMap = new Map((resultsRaw ?? []).map(r => [r.race_id, r]))

  // Corridas finalizadas com palpite do usuário
  const finishedWithPred = predictions.filter(p => {
    const result = resultMap.get(p.race_id)
    const race = raceMap.get(p.race_id)
    return result && race && race.status === 'finished'
  })

  const totalPoints = scores.reduce((sum, s) => sum + s.total_points, 0)
  const racesPlayed = finishedWithPred.length
  const avgPoints = racesPlayed > 0 ? (totalPoints / racesPlayed).toFixed(1) : '—'

  type BestRace = { name: string; points: number }
  let bestRace: BestRace | null = null
  scores.forEach(s => {
    const race = raceMap.get(s.race_id)
    if (race && (!bestRace || s.total_points > (bestRace as BestRace).points)) {
      bestRace = { name: race.name.replace('Grande Prêmio ', 'GP ').replace('Grande Premio ', 'GP '), points: s.total_points }
    }
  })

  // Estatísticas por categoria
  let poleCorrect = 0
  let p1Exact = 0, p1Partial = 0
  let p2Exact = 0, p2Partial = 0
  let p3Exact = 0, p3Partial = 0
  let randomCorrect = 0, bortoletoCorrect = 0
  let challengeCorrect = 0, challengeTotal = 0

  finishedWithPred.forEach(p => {
    const s = scoreMap.get(p.race_id)
    const race = raceMap.get(p.race_id)
    if (!s) return
    if (s.pole_points > 0) poleCorrect++
    if (s.p1_points === 3) p1Exact++; else if (s.p1_points === 1) p1Partial++
    if (s.p2_points === 3) p2Exact++; else if (s.p2_points === 1) p2Partial++
    if (s.p3_points === 3) p3Exact++; else if (s.p3_points === 1) p3Partial++
    if (s.random_pos_points > 0) randomCorrect++
    if (s.bortoleto_points > 0) bortoletoCorrect++
    if (race?.challenge_question) {
      challengeTotal++
      if (s.challenge_points > 0) challengeCorrect++
    }
  })

  const pct = (n: number) => racesPlayed > 0 ? Math.round((n / racesPlayed) * 100) : 0

  // Race wins: races where user had highest total_points
  const allScores = allScoresRaw ?? []
  const topByRace: Record<string, { userId: string; pts: number }> = {}
  for (const s of allScores) {
    const cur = topByRace[s.race_id]
    if (!cur || s.total_points > cur.pts) {
      topByRace[s.race_id] = { userId: s.user_id, pts: s.total_points }
    }
  }
  const raceWins = Object.values(topByRace).filter(t => t.userId === user.id && t.pts > 0).length

  // Streak: consecutive finished races (by round_number) where user participated
  const finishedRacesSorted = races
    .filter(r => r.status === 'finished')
    .sort((a, b) => b.round_number - a.round_number)
  let currentStreak = 0
  for (const r of finishedRacesSorted) {
    if (predictions.find(p => p.race_id === r.id)) {
      currentStreak++
    } else {
      break
    }
  }

  // Histórico ordenado por round desc
  const history = predictions
    .map(p => ({
      race: raceMap.get(p.race_id),
      prediction: p,
      result: resultMap.get(p.race_id) ?? null,
      score: scoreMap.get(p.race_id) ?? null,
    }))
    .filter(item => item.race)
    .sort((a, b) => b.race!.round_number - a.race!.round_number)

  function driverName(id: string | null) {
    if (!id) return '—'
    return driverMap.get(id) ?? '?'
  }

  function chipColor(pts: number, maxPts: number) {
    if (pts === maxPts) return { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#22c55e' }
    if (pts > 0)         return { bg: 'rgba(255,192,0,0.15)',  border: 'rgba(255,192,0,0.4)',  text: '#ffc000' }
    return               { bg: 'rgba(232,0,45,0.1)',    border: 'rgba(232,0,45,0.25)',   text: '#8a8aa0' }
  }

  function noResultChip() {
    return { bg: 'rgba(138,138,160,0.1)', border: 'rgba(138,138,160,0.2)', text: '#8a8aa0' }
  }

  const statCard = (label: string, value: string | number, sub?: string) => (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>{label}</span>
      <span className="text-3xl font-black text-white">{value}</span>
      {sub && <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>{sub}</span>}
    </div>
  )

  const accRow = (label: string, exact: number, partial: number | null, max: number, total?: number) => {
    const denominator = total ?? racesPlayed
    const pctExact = denominator > 0 ? Math.round((exact / denominator) * 100) : 0
    return (
      <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--f1-border)' }}>
        <span className="text-sm font-semibold text-white">{label}</span>
        <div className="flex items-center gap-3">
          {partial !== null && (
            <span className="text-xs" style={{ color: '#ffc000' }}>
              {partial} {partial !== 1 ? 'parciais' : 'parcial'}
            </span>
          )}
          <span className="text-xs font-bold" style={{ color: exact > 0 ? '#22c55e' : 'var(--f1-muted)' }}>
            {exact}/{denominator} acerto{exact !== 1 ? 's' : ''}
          </span>
          <div style={{
            width: '80px', height: '6px', borderRadius: '3px',
            background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '3px',
              width: `${pctExact}%`,
              background: exact > 0 ? '#22c55e' : 'rgba(138,138,160,0.3)',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span className="text-xs font-black w-8 text-right" style={{ color: exact > 0 ? '#22c55e' : 'var(--f1-muted)' }}>
            {pctExact}%
          </span>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 flex flex-col gap-6">

      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)' }}>
          Perfil
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wide">{username}</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
          Temporada 2026 · {predictions.length} palpite{predictions.length !== 1 ? 's' : ''} enviado{predictions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCard('Total de pontos', totalPoints)}
        {statCard('Corridas', racesPlayed, 'com resultado')}
        {statCard('Média / corrida', avgPoints, 'pontos')}
        {statCard('Melhor corrida', bestRace ? `${(bestRace as BestRace).points}pts` : '—', bestRace ? (bestRace as BestRace).name : '')}
      </div>

      {/* Streak + wins row */}
      {racesPlayed > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <span className="text-3xl">{currentStreak >= 3 ? '🔥' : '📅'}</span>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--f1-muted)' }}>Sequência atual</div>
              <div className="text-2xl font-black text-white leading-none">
                {currentStreak}
                <span className="text-sm font-normal ml-1" style={{ color: 'var(--f1-muted)' }}>
                  {currentStreak === 1 ? 'corrida' : 'corridas'}
                </span>
              </div>
              {currentStreak >= 3 && (
                <div className="text-xs mt-0.5" style={{ color: '#f97316' }}>Em chamas! 🔥</div>
              )}
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--f1-muted)' }}>Corridas vencidas</div>
              <div className="text-2xl font-black leading-none" style={{ color: raceWins > 0 ? 'var(--f1-gold)' : 'white' }}>
                {raceWins}
                <span className="text-sm font-normal ml-1" style={{ color: 'var(--f1-muted)' }}>
                  {raceWins === 1 ? 'vitória' : 'vitórias'}
                </span>
              </div>
              {raceWins === 0 && racesPlayed > 0 && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>Ainda sem vitórias</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accuracy section */}
      {racesPlayed > 0 && (
        <div className="card overflow-hidden">
          <div className="striped-accent-thick" />
          <div className="px-5 pt-4 pb-2">
            <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--f1-red)' }}>
              Taxa de acerto
            </h2>
          </div>
          <div className="px-5 pb-4">
            {accRow('Pole Position', poleCorrect, null, 2)}
            {accRow('1º Lugar', p1Exact, p1Partial, 3)}
            {accRow('2º Lugar', p2Exact, p2Partial, 3)}
            {accRow('3º Lugar', p3Exact, p3Partial, 3)}
            {accRow('Posição Aleatória 🎲', randomCorrect, null, 4)}
            {accRow('Bortoleto 🇧🇷', bortoletoCorrect, null, 4)}
            {challengeTotal > 0 && (
              <div className="border-0">
                {accRow('Desafio ⚡', challengeCorrect, null, 1, challengeTotal)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Race history */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--f1-red)' }}>
          Histórico de palpites
        </h2>

        {history.length === 0 && (
          <div className="card p-12 text-center text-sm" style={{ color: 'var(--f1-muted)' }}>
            Nenhum palpite enviado ainda.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {history.map(({ race, prediction, result, score }) => {
            if (!race) return null
            const hasResult = !!result
            const isFinished = race.status === 'finished'

            const categories = [
              {
                label: 'Pole',
                pick: driverName(prediction.pole_driver_id),
                actual: hasResult ? driverName(result!.pole_driver_id) : null,
                pts: score?.pole_points ?? null,
                maxPts: 2,
              },
              {
                label: 'P1',
                pick: driverName(prediction.p1_driver_id),
                actual: hasResult ? driverName(result!.p1_driver_id) : null,
                pts: score?.p1_points ?? null,
                maxPts: 3,
              },
              {
                label: 'P2',
                pick: driverName(prediction.p2_driver_id),
                actual: hasResult ? driverName(result!.p2_driver_id) : null,
                pts: score?.p2_points ?? null,
                maxPts: 3,
              },
              {
                label: 'P3',
                pick: driverName(prediction.p3_driver_id),
                actual: hasResult ? driverName(result!.p3_driver_id) : null,
                pts: score?.p3_points ?? null,
                maxPts: 3,
              },
              {
                label: '🎲',
                pick: driverName(prediction.random_pos_driver_id),
                actual: hasResult ? driverName(result!.random_pos_driver_id) : null,
                pts: score?.random_pos_points ?? null,
                maxPts: 4,
              },
              {
                label: '🇧🇷',
                pick: prediction.bortoleto_position !== null ? `P${prediction.bortoleto_position}` : '—',
                actual: hasResult && result!.bortoleto_position !== null ? `P${result!.bortoleto_position}` : null,
                pts: score?.bortoleto_points ?? null,
                maxPts: 4,
              },
              ...(race.challenge_question ? [{
                label: '⚡',
                pick: prediction.challenge_answer ?? '—',
                actual: hasResult ? (race.challenge_correct ?? null) : null,
                pts: score?.challenge_points ?? null,
                maxPts: 1,
              }] : []),
            ]

            return (
              <div key={race.id} className="card overflow-hidden">
                <div className="flex items-center gap-0">
                  {/* Round badge */}
                  <div
                    className="flex-shrink-0 flex flex-col items-center justify-center w-12 self-stretch"
                    style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRight: '1px solid var(--f1-border)' }}
                  >
                    <span className="round-badge">{race.round_number}</span>
                  </div>

                  <div className="flex-1 min-w-0 px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div>
                        <div className="font-bold text-white text-sm leading-tight">{race.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
                          {format(new Date(race.race_start_time), "dd 'de' MMM yyyy", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hasResult && score && (
                          <span
                            className="text-lg font-black"
                            style={{ color: score.total_points > 0 ? 'white' : 'var(--f1-muted)' }}
                          >
                            {score.total_points}
                            <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--f1-muted)' }}>pts</span>
                          </span>
                        )}
                        {!isFinished && (
                          <span
                            className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{ color: '#ffc000', backgroundColor: 'rgba(255,192,0,0.1)' }}
                          >
                            {race.status === 'open' ? 'Em aberto' : 'Aguardando resultado'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Challenge question */}
                    {race.challenge_question && (
                      <div className="text-xs mb-2" style={{ color: 'var(--f1-muted)' }}>
                        <span style={{ color: 'var(--f1-red)', fontWeight: 700 }}>⚡</span>{' '}
                        {race.challenge_question}
                      </div>
                    )}

                    {/* Category chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map(cat => {
                        const colors = hasResult && cat.pts !== null
                          ? chipColor(cat.pts, cat.maxPts)
                          : noResultChip()

                        return (
                          <div
                            key={cat.label}
                            style={{
                              border: `1px solid ${colors.border}`,
                              backgroundColor: colors.bg,
                              borderRadius: '4px',
                              padding: '3px 7px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              minWidth: '44px',
                            }}
                          >
                            <span className="text-xs" style={{ color: 'var(--f1-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {cat.label}
                            </span>
                            <span className="font-black text-xs" style={{ color: colors.text }}>
                              {cat.pick}
                            </span>
                            {hasResult && cat.actual && cat.actual !== cat.pick && (
                              <span className="text-xs" style={{ color: 'var(--f1-muted)', fontSize: '0.6rem' }}>
                                ↳ {cat.actual}
                              </span>
                            )}
                            {hasResult && cat.pts !== null && (
                              <span style={{ color: colors.text, fontSize: '0.6rem', fontWeight: 700 }}>
                                +{cat.pts}pt{cat.pts !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
