import { createClient } from '@/lib/supabase/server'
import type { Race } from '@/lib/types/database'
import DashboardRaces from '@/components/DashboardRaces'
import Link from 'next/link'
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

  const finished = races.filter(r => r.status === 'finished').length
  const total = races.length
  const pct = total > 0 ? Math.round((finished / total) * 100) : 0

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div
        className="full-bleed -mt-8 mb-6 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 25% 0%, #1a1016 0%, #101018 45%, #0d0d14 100%)',
          borderBottom: '1px solid var(--f1-border)',
        }}
      >
        {/* Listras diagonais no canto superior esquerdo */}
        <div
          aria-hidden
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: '220px',
            height: '110px',
            background: 'repeating-linear-gradient(-60deg, var(--f1-red) 0px, var(--f1-red) 14px, #b00022 14px, #b00022 18px, transparent 18px, transparent 36px)',
            clipPath: 'polygon(0 0, 100% 0, 0 100%)',
            opacity: 0.9,
          }}
        />

        <div className="container mx-auto max-w-6xl px-4 pt-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-4 justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)', letterSpacing: '0.18em' }}>
                Temporada 2026
              </p>
              <h1 className="f1-heading italic text-4xl sm:text-5xl mb-2">Calendário</h1>
              <p className="text-sm sm:text-base" style={{ color: 'var(--f1-muted)' }}>
                Acompanhe todas as corridas e faça seus palpites!
              </p>
            </div>

            {userRank !== null && totalPlayers > 1 && (
              <div
                className="flex-shrink-0 text-center px-8 py-4 rounded"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--f1-border)' }}
              >
                <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--f1-muted)', letterSpacing: '0.15em' }}>
                  Sua posição
                </div>
                <div className="font-black text-4xl leading-none text-white">
                  {userRank}º
                </div>
                <div className="text-sm mt-1 mb-3" style={{ color: 'var(--f1-muted)' }}>{userPoints} pts</div>
                <Link
                  href="/leaderboard"
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: 'var(--f1-red)', letterSpacing: '0.12em' }}
                >
                  Ver ranking →
                </Link>
              </div>
            )}
          </div>

          {/* Progresso da temporada */}
          {total > 0 && (
            <div className="mt-6 sm:max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--f1-muted)', letterSpacing: '0.15em' }}>
                  Progresso da temporada
                </span>
                <span className="text-sm font-black text-white">
                  {finished} / {total} <span className="font-normal" style={{ color: 'var(--f1-muted)' }}>corridas</span>
                </span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, var(--f1-red), #ff4d6d)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )}
        </div>
      </div>

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
