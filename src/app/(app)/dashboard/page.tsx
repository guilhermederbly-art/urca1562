import { createClient } from '@/lib/supabase/server'
import type { Race } from '@/lib/types/database'
import DashboardRaces from '@/components/DashboardRaces'
import { ADMIN_EMAIL } from '@/lib/config'

export const metadata = { title: 'Calendário — F1 Bolão' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: racesData } = await supabase.from('races').select('*').order('round_number')
  const races = (racesData as Race[]) ?? []

  const [{ data: userPredictions }, { data: allScores }] = await Promise.all([
    supabase.from('predictions').select('race_id').eq('user_id', user!.id),
    supabase.from('scores').select('user_id, total_points'),
  ])
  const predictedRaceIds = new Set((userPredictions ?? []).map(p => (p as { race_id: string }).race_id))

  // Calculate user's current rank
  const rankMap: Record<string, number> = {}
  for (const s of allScores ?? []) {
    rankMap[s.user_id] = (rankMap[s.user_id] ?? 0) + s.total_points
  }
  const sortedByPoints = Object.entries(rankMap).sort((a, b) => b[1] - a[1])
  const userRankIndex = sortedByPoints.findIndex(([id]) => id === user!.id)
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null
  const userPoints = userRankIndex >= 0 ? sortedByPoints[userRankIndex][1] : 0
  const totalPlayers = sortedByPoints.length

  const isAdmin = user?.email === ADMIN_EMAIL
  const now = new Date()
  const openRace      = races.find(r => r.status === 'open') ?? null
  const liveRace      = races.find(r => r.status === 'closed' && new Date(r.race_start_time) <= now) ?? null
  const isPast        = (r: Race) => r.status === 'finished' || (r.status === 'upcoming' && new Date(r.race_start_time) < now)
  const allFinished   = races.filter(r => isPast(r)).sort((a, b) => b.round_number - a.round_number)
  const recentlyFinishedRace = allFinished[0] ?? null
  const finishedRaces = allFinished.slice(1)
  const activeRaces   = races.filter(r =>
    r.status !== 'open' && !isPast(r) && r.id !== liveRace?.id
  )

  const rankLabel = userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : `${userRank}º`

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)' }}>
            Temporada 2026
          </p>
          <h1 className="f1-heading text-3xl">Calendário</h1>
        </div>
        {userRank !== null && totalPlayers > 1 && (
          <div
            className="flex-shrink-0 text-center px-4 py-2 rounded"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--f1-border)' }}
          >
            <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--f1-muted)' }}>Sua posição</div>
            <div className="font-black text-2xl leading-none" style={{ color: userRank <= 3 ? 'var(--f1-gold)' : 'white' }}>
              {rankLabel}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>{userPoints} pts</div>
          </div>
        )}
      </div>

      {/* Season progress */}
      {races.length > 0 && (() => {
        const finished = races.filter(r => r.status === 'finished').length
        const total = races.length
        const pct = Math.round((finished / total) * 100)
        return (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>
                Progresso da temporada
              </span>
              <span className="text-xs font-black" style={{ color: 'var(--f1-muted)' }}>
                {finished}/{total} corridas
              </span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: 'linear-gradient(90deg, var(--f1-red), #ff4d6d)',
                borderRadius: '2px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )
      })()}

      <DashboardRaces
        openRace={openRace}
        liveRace={liveRace}
        recentlyFinishedRace={recentlyFinishedRace}
        activeRaces={activeRaces}
        finishedRaces={finishedRaces}
        predictedRaceIds={predictedRaceIds}
        isAdmin={isAdmin}
      />
    </div>
  )
}
