import { createClient } from '@/lib/supabase/server'
import type { Race } from '@/lib/types/database'
import DashboardRaces from '@/components/DashboardRaces'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: racesData } = await supabase.from('races').select('*').order('round_number')
  const races = (racesData as Race[]) ?? []

  const { data: userPredictions } = await supabase
    .from('predictions').select('race_id').eq('user_id', user!.id)
  const predictedRaceIds = new Set((userPredictions ?? []).map(p => (p as { race_id: string }).race_id))

  const isAdmin = user?.email === 'guilherme.derbly@gmail.com'
  const now = new Date()
  const openRace      = races.find(r => r.status === 'open') ?? null
  const finishedRaces = races.filter(r =>
    r.status !== 'open' && new Date(r.race_start_time) < now
  )
  const finishedIds   = new Set(finishedRaces.map(r => r.id))
  const activeRaces   = races.filter(r =>
    r.status !== 'open' && !finishedIds.has(r.id)
  )

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)' }}>
            Temporada 2026
          </p>
          <h1 className="f1-heading text-3xl">Calendário</h1>
        </div>
        {openRace && (
          <div className="text-right hidden sm:block">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--f1-muted)' }}>Próximo GP</p>
            <p className="font-bold text-sm text-white">{openRace.name}</p>
          </div>
        )}
      </div>

      <DashboardRaces
        openRace={openRace}
        activeRaces={activeRaces}
        finishedRaces={finishedRaces}
        predictedRaceIds={predictedRaceIds}
        isAdmin={isAdmin}
      />
    </div>
  )
}
