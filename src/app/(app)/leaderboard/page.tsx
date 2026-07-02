import { createClient } from '@/lib/supabase/server'
import LeaderboardClient from '@/components/LeaderboardClient'

export const metadata = { title: 'Ranking — F1 Bolão' }

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profiles }, { data: scores }, { data: races }] = await Promise.all([
    supabase.from('profiles').select('id, username'),
    supabase.from('scores').select('user_id, race_id, total_points'),
    supabase.from('races').select('id, round_number').eq('status', 'finished').order('round_number', { ascending: false }),
  ])

  const scoreMap = (scores ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.user_id] = (acc[s.user_id] ?? 0) + s.total_points
    return acc
  }, {})

  const aggregated = (profiles ?? [])
    .map(p => ({ userId: p.id, username: p.username, total: scoreMap[p.id] ?? 0 }))
    .sort((a, b) => b.total - a.total)

  const lastRace = (races ?? [])[0]
  const positionChange: Record<string, number> = {}

  if (lastRace && (races ?? []).length > 1) {
    const lastRaceScores = (scores ?? []).filter(s => s.race_id === lastRace.id)
    const lastRaceMap = lastRaceScores.reduce<Record<string, number>>((acc, s) => {
      acc[s.user_id] = s.total_points
      return acc
    }, {})
    const prevAggregated = (profiles ?? [])
      .map(p => ({ userId: p.id, total: (scoreMap[p.id] ?? 0) - (lastRaceMap[p.id] ?? 0) }))
      .sort((a, b) => b.total - a.total)
    const prevPositionMap: Record<string, number> = {}
    prevAggregated.forEach((e, i) => { prevPositionMap[e.userId] = i })
    aggregated.forEach((e, i) => {
      const prev = prevPositionMap[e.userId] ?? i
      positionChange[e.userId] = prev - i
    })
  }

  const entries = aggregated.map(e => ({
    ...e,
    delta: positionChange[e.userId],
  }))

  const totalPts = entries.reduce((s, e) => s + e.total, 0)
  const avgPts = entries.length > 0 ? Math.round(totalPts / entries.length) : 0
  const leader = entries[0] ?? null
  const finishedCount = (races ?? []).length

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)' }}>
          Temporada 2026
        </p>
        <h1 className="f1-heading text-3xl">Ranking</h1>
      </div>

      {/* Group stats */}
      {finishedCount > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-3 text-center">
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-muted)', fontSize: '0.6rem' }}>Corridas</div>
            <div className="text-2xl font-black text-white">{finishedCount}</div>
            <div className="text-xs" style={{ color: 'var(--f1-muted)' }}>finalizadas</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-muted)', fontSize: '0.6rem' }}>Média do grupo</div>
            <div className="text-2xl font-black text-white">{avgPts}</div>
            <div className="text-xs" style={{ color: 'var(--f1-muted)' }}>pts / participante</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-gold)', fontSize: '0.6rem' }}>Líder</div>
            <div className="text-sm font-black truncate" style={{ color: 'var(--f1-gold)' }}>{leader?.username ?? '—'}</div>
            <div className="text-xs" style={{ color: 'var(--f1-muted)' }}>{leader?.total ?? 0} pts</div>
          </div>
        </div>
      )}

      <LeaderboardClient entries={entries} currentUserId={user!.id} />
    </div>
  )
}
