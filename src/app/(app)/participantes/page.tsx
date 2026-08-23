import { createClient } from '@/lib/supabase/server'
import ParticipantesClient from '@/components/ParticipantesClient'
import PageHero from '@/components/PageHero'

export default async function ParticipantesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Todos os perfis cadastrados
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, created_at')
    .order('created_at')

  // Pontos por usuário
  const { data: scores } = await supabase
    .from('scores')
    .select('user_id, total_points')

  // Corrida aberta — para verificar quem já palpitou
  const { data: openRace } = await supabase
    .from('races')
    .select('id, name')
    .eq('status', 'open')
    .order('round_number')
    .limit(1)
    .maybeSingle()

  const { data: predictions } = openRace
    ? await supabase
        .from('predictions')
        .select('user_id')
        .eq('race_id', openRace.id)
    : { data: [] }

  const predictedIds = new Set((predictions ?? []).map((p: { user_id: string }) => p.user_id))

  const totalPoints = (scores ?? []).reduce<Record<string, number>>((acc, s: { user_id: string; total_points: number }) => {
    acc[s.user_id] = (acc[s.user_id] ?? 0) + s.total_points
    return acc
  }, {})

  const list = (profiles ?? []).map(p => ({
    ...p,
    points: totalPoints[p.id] ?? 0,
    predicted: predictedIds.has(p.id),
    isMe: p.id === user!.id,
  })).sort((a, b) => b.points - a.points)

  return (
    <div>
      <PageHero
        title="Participantes"
        subtitle={`${list.length} piloto${list.length !== 1 ? 's' : ''} no grid`}
      />

      <ParticipantesClient list={list} openRaceName={openRace?.name ?? null} />
    </div>
  )
}
