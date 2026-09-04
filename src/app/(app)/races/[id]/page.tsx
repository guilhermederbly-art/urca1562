import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import PredictionForm from '@/components/PredictionForm'
import RaceHero from '@/components/RaceHero'
import RaceScheduleBanner from '@/components/RaceScheduleBanner'
import {
  ScoreSummaryCard,
  ChallengeResultCard,
  ResultsTableCard,
  CircuitInfoCard,
  DicaBar,
  EmptyResultsNotice,
} from '@/components/RaceResultsView'
import RaceConsensus from '@/components/RaceConsensus'
import AllPredictions, { type NamedPrediction } from '@/components/AllPredictions'
import RaceScoreboard from '@/components/RaceScoreboard'
import type { GroupInfo } from '@/components/GroupSelector'

export default async function RacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: race }, { data: drivers }, { data: prediction }, { data: result }, { data: myMemberships }] = await Promise.all([
    supabase.from('races').select('*').eq('id', id).single(),
    supabase.from('drivers').select('*').order('number'),
    supabase.from('predictions').select('*').eq('race_id', id).eq('user_id', user!.id).maybeSingle(),
    supabase.from('race_results').select('*').eq('race_id', id).maybeSingle(),
    supabase.from('group_members').select('group_id').eq('user_id', user!.id),
  ])

  if (!race) notFound()

  const isOpen = race.status === 'open'
  const isFinished = race.status === 'finished'

  // Fetch groups for the current user
  const groupIds = (myMemberships ?? []).map(m => m.group_id)
  let groups: GroupInfo[] = []
  if (groupIds.length > 0) {
    const [{ data: groupsData }, { data: allMembersData }] = await Promise.all([
      supabase.from('groups').select('id, name, code').in('id', groupIds),
      supabase.from('group_members').select('group_id, user_id').in('group_id', groupIds),
    ])
    const membersByGroup: Record<string, string[]> = {}
    for (const m of (allMembersData ?? [])) {
      if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = []
      membersByGroup[m.group_id].push(m.user_id)
    }
    groups = (groupsData ?? []).map(g => ({
      id: g.id,
      name: g.name,
      memberIds: membersByGroup[g.id] ?? [],
    }))
  }

  // Score rows — only when finished
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

  // Palpites de todos, disponiveis so depois do fechamento.
  //
  // O join com profiles e o que permite a lista ser NOMINAL: sem ele da para
  // dizer "60% escolheu VER" (o consenso), mas nao quem escolheu o que.
  let allPredictions: NamedPrediction[] = []
  if (!isOpen) {
    const { data: allPreds } = await supabase
      .from('predictions')
      .select('*, profiles(username)')
      .eq('race_id', id)
    allPredictions = (allPreds ?? []).map((p: Record<string, unknown>) => ({
      userId: p.user_id as string,
      username: (p.profiles as { username: string } | null)?.username ?? 'sem nome',
      pole_driver_id: p.pole_driver_id as string | null,
      p1_driver_id: p.p1_driver_id as string | null,
      p2_driver_id: p.p2_driver_id as string | null,
      p3_driver_id: p.p3_driver_id as string | null,
      random_pos_driver_id: p.random_pos_driver_id as string | null,
      bortoleto_position: p.bortoleto_position as number | null,
      challenge_answer: p.challenge_answer as string | null,
    }))
  }

  const dateLabel = format(new Date(race.race_start_time), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div>
      <RaceHero race={race} dateLabel={dateLabel} />

      {/* Status banners */}
      {isOpen && <RaceScheduleBanner race={race} />}

      {!isOpen && !isFinished && (
        <div className="mb-6 p-3 rounded border text-sm"
          style={{ borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.08)', color: '#f97316' }}>
          🔒 Palpites encerrados para esta corrida.
        </div>
      )}

      {/* Content */}
      {isOpen ? (
        <PredictionForm
          race={race}
          drivers={drivers ?? []}
          existing={prediction ?? undefined}
          userId={user!.id}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
            {/* Coluna esquerda: resultado + circuito */}
            <div className="flex flex-col gap-6 order-2 lg:order-none">
              <ResultsTableCard
                race={race}
                drivers={drivers ?? []}
                result={result ?? undefined}
                userPrediction={prediction ?? undefined}
              />
              <EmptyResultsNotice result={result ?? undefined} userPrediction={prediction ?? undefined} />
              <CircuitInfoCard race={race} />
            </div>

            {/* Coluna direita: pontuação + desafio + ranking da rodada */}
            <div className="flex flex-col gap-6 order-1 lg:order-none">
              <ScoreSummaryCard race={race} result={result ?? undefined} userPrediction={prediction ?? undefined} />
              <ChallengeResultCard race={race} result={result ?? undefined} userPrediction={prediction ?? undefined} />
              {isFinished && scores.length > 0 && (
                <RaceScoreboard
                  scores={scores}
                  currentUserId={user!.id}
                  hasChallengePoints={scores.some(s => s.challenge_points > 0)}
                  groups={groups}
                />
              )}
              {allPredictions.length > 0 && (
                <AllPredictions
                  race={race}
                  allPredictions={allPredictions}
                  drivers={drivers ?? []}
                  result={result ?? undefined}
                  currentUserId={user!.id}
                  groups={groups}
                />
              )}
              {allPredictions.length > 0 && !isFinished && (
                <RaceConsensus
                  race={race}
                  allPredictions={allPredictions}
                  drivers={drivers ?? []}
                  userPrediction={prediction ?? undefined}
                  groups={groups}
                />
              )}
            </div>
          </div>

          <DicaBar race={race} />
        </div>
      )}
    </div>
  )
}
