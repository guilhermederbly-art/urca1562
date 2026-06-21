import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import PredictionForm from '@/components/PredictionForm'
import RaceResultsView from '@/components/RaceResultsView'

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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--f1-muted)' }}>
          <span>Corrida</span>
          <span>·</span>
          <span>Rodada {race.round_number}</span>
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
        <RaceResultsView
          race={race}
          drivers={drivers ?? []}
          result={result ?? undefined}
          userPrediction={prediction ?? undefined}
        />
      )}
    </div>
  )
}
