import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Race } from '@/lib/types/database'

const ADMIN_EMAIL = 'guilherme.derbly@gmail.com'

// POST /api/admin/sync-sessions
// Busca session keys do OpenF1 para corridas que não têm
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceSupabase = await createServiceClient()
  const { data: races } = await serviceSupabase
    .from('races')
    .select('*')
    .in('status', ['open', 'closed'])
    .is('openf1_race_session_key', null)

  if (!(races ?? []).length) {
    return NextResponse.json({ ok: true, updated: 0, message: 'Todas as corridas já têm session key.' })
  }

  const res = await fetch('https://api.openf1.org/v1/sessions?year=2026')
  if (!res.ok) return NextResponse.json({ error: 'Falha ao buscar sessões do OpenF1' }, { status: 502 })

  const sessions = await res.json() as {
    session_key: number; session_type: string
    meeting_key: number; country_name: string; date_start: string
  }[]

  const byMeeting = new Map<number, { race?: (typeof sessions)[0]; quali?: (typeof sessions)[0] }>()
  for (const s of sessions) {
    const g = byMeeting.get(s.meeting_key) ?? {}
    if (s.session_type === 'Race') g.race = s
    if (s.session_type === 'Qualifying') g.quali = s
    byMeeting.set(s.meeting_key, g)
  }

  const updated: string[] = []

  for (const race of (races as Race[])) {
    const raceDate = new Date(race.race_start_time)
    let bestKey: number | null = null
    let bestQualiKey: number | null = null
    let bestDiff = Infinity

    for (const [, g] of byMeeting) {
      if (!g.race) continue
      const diff = Math.abs(new Date(g.race.date_start).getTime() - raceDate.getTime())
      const countryMatch = race.country &&
        (g.race.country_name.toLowerCase().includes(race.country.toLowerCase()) ||
         race.country.toLowerCase().includes(g.race.country_name.toLowerCase()))
      if (diff < 36 * 60 * 60 * 1000 && countryMatch && diff < bestDiff) {
        bestKey = g.race.session_key
        bestQualiKey = g.quali?.session_key ?? null
        bestDiff = diff
      }
    }

    if (bestKey) {
      await serviceSupabase.from('races').update({
        openf1_race_session_key: bestKey,
        openf1_quali_session_key: bestQualiKey,
      }).eq('id', race.id)
      updated.push(`${race.name}: race=${bestKey}, quali=${bestQualiKey ?? 'N/A'}`)
    }
  }

  return NextResponse.json({ ok: true, updated: updated.length, races: updated })
}
