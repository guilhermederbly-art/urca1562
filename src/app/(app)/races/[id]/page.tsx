import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import PredictionForm from '@/components/PredictionForm'
import RaceResultsView from '@/components/RaceResultsView'
import RaceConsensus from '@/components/RaceConsensus'
import RaceScoreboard from '@/components/RaceScoreboard'

export default async function RacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: race }, { data: drivers }, { data: prediction }, { data: result }] = await Promise.all([
    supabase.from('races').select('*').eq('id', id).single(),
    supabase.from('drivers').select('*').order('number'),
    supabase.from('predictions').select('*').eq('race_id', id).eq('user_id', user!.id).maybeSingle(),
    supabase.from('race_results').select('*').eq('race_id', id).maybeSingle(),
  ])

  if (!race) notFound()

  const isOpen = race.status === 'open'
  const isFinished = race.status === 'finished'

  // Pontuação por participante — apenas quando finalizada
  let scores: { username: string; total_points: number; pole_points: number; p1_points: number; p2_points: number; p3_points: number; random_pos_points: number; bortoleto_points: number; challenge_points: number; user_id: string }[] = []
  if (isFinished) {
    const { data: scoresRaw } = await supabase
      .from('scores')
      .select('*, profiles(username)')
      .eq('race_id', id)
      .order('total_points', { ascending: false })
    scores = (scoresRaw ?? []).map((s: Record<string, unknown>) => ({
      username: (s.profiles as { username: string } | null)?.username ?? '?',
      total_points: s.total_points as number,
      pole_points: s.pole_points as number,
      p1_points: s.p1_points as number,
      p2_points: s.p2_points as number,
      p3_points: s.p3_points as number,
      random_pos_points: s.random_pos_points as number,
      bortoleto_points: s.bortoleto_points as number,
      challenge_points: s.challenge_points as number,
      user_id: s.user_id as string,
    }))
  }

  // Consenso — disponível após o fechamento
  type FreqMap = Record<string, number>
  const consensus = { pole: {} as FreqMap, p1: {} as FreqMap, p2: {} as FreqMap, p3: {} as FreqMap, random_pos: {} as FreqMap, bortoleto: {} as FreqMap, challenge: {} as FreqMap, total: 0 }
  if (!isOpen) {
    const { data: allPreds } = await supabase.from('predictions').select('*').eq('race_id', id)
    const preds = allPreds ?? []
    consensus.total = preds.length
    for (const p of preds) {
      if (p.pole_driver_id)        consensus.pole[p.pole_driver_id]                     = (consensus.pole[p.pole_driver_id] ?? 0) + 1
      if (p.p1_driver_id)          consensus.p1[p.p1_driver_id]                         = (consensus.p1[p.p1_driver_id] ?? 0) + 1
      if (p.p2_driver_id)          consensus.p2[p.p2_driver_id]                         = (consensus.p2[p.p2_driver_id] ?? 0) + 1
      if (p.p3_driver_id)          consensus.p3[p.p3_driver_id]                         = (consensus.p3[p.p3_driver_id] ?? 0) + 1
      if (p.random_pos_driver_id)  consensus.random_pos[p.random_pos_driver_id]         = (consensus.random_pos[p.random_pos_driver_id] ?? 0) + 1
      if (p.bortoleto_position != null) consensus.bortoleto[String(p.bortoleto_position)] = (consensus.bortoleto[String(p.bortoleto_position)] ?? 0) + 1
      if (p.challenge_answer)      consensus.challenge[p.challenge_answer]               = (consensus.challenge[p.challenge_answer] ?? 0) + 1
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-2 text-sm mb-2">
          <div className="flex items-center gap-2" style={{ color: 'var(--f1-muted)' }}>
            <span>Corrida</span>
            <span>·</span>
            <span>Rodada {race.round_number}</span>
          </div>
          <Link href="/dashboard" className="btn-secondary text-xs px-3 py-1.5">← Voltar</Link>
        </div>
        <h1 className="text-2xl font-black text-white mb-1">{race.name}</h1>
        <p style={{ color: 'var(--f1-muted)' }} className="text-sm">
          {race.circuit} ·{' '}
          {format(new Date(race.race_start_time), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
        {race.random_position && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: 'rgba(232,0,45,0.15)', color: 'var(--f1-red)' }}>
            🎲 Posição aleatória da rodada: <strong>P{race.random_position}</strong>
          </div>
        )}
      </div>

      {/* Deadline warning */}
      {isOpen && (
        <div className="mb-6 p-3 rounded border text-sm"
          style={{ borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>
          ✅ Palpites abertos até o início do FP1:{' '}
          <strong>{format(new Date(race.fp1_start_time ?? race.qualifying_start_time), "dd/MM HH:mm", { locale: ptBR })}</strong>
        </div>
      )}

      {!isOpen && !isFinished && (
        <div className="mb-6 p-3 rounded border text-sm"
          style={{ borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.08)', color: '#f97316' }}>
          🔒 Palpites encerrados para esta corrida.
        </div>
      )}

      {/* Prediction form or results */}
      {isOpen ? (
        <PredictionForm
          race={race}
          drivers={drivers ?? []}
          existing={prediction ?? undefined}
          userId={user!.id}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <RaceResultsView
            race={race}
            drivers={drivers ?? []}
            result={result ?? undefined}
            userPrediction={prediction ?? undefined}
          />
          {isFinished && scores.length > 0 && (
            <RaceScoreboard
              scores={scores}
              currentUserId={user!.id}
              hasChallengePoints={scores.some(s => s.challenge_points > 0)}
            />
          )}
          {consensus.total > 0 && (
            <RaceConsensus
              race={race}
              consensus={consensus}
              drivers={drivers ?? []}
              userPrediction={prediction ?? undefined}
            />
          )}
        </div>
      )}
    </div>
  )
}
