import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { recusaSeNaoAdmin } from '@/lib/auth'

// POST /api/races/close
// Body: { raceId: string }
// Closes predictions for a race
export async function POST(req: NextRequest) {
  const recusa = await recusaSeNaoAdmin()
  if (recusa) return recusa

  const { raceId } = await req.json()
  if (!raceId) return NextResponse.json({ error: 'raceId required' }, { status: 400 })

  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('races')
    .update({ status: 'closed' })
    .eq('id', raceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-assign OpenF1 session key if not set
  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single()
  if (race && !race.openf1_race_session_key && race.country && race.race_start_time) {
    try {
      const res = await fetch('https://api.openf1.org/v1/sessions?year=2026')
      if (res.ok) {
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
        const raceDate = new Date(race.race_start_time)
        let bestKey: number | null = null
        let bestQualiKey: number | null = null
        let bestDiff = Infinity
        for (const [, g] of byMeeting) {
          if (!g.race) continue
          const diff = Math.abs(new Date(g.race.date_start).getTime() - raceDate.getTime())
          const countryMatch =
            g.race.country_name.toLowerCase().includes(race.country.toLowerCase()) ||
            race.country.toLowerCase().includes(g.race.country_name.toLowerCase())
          if (diff < 36 * 60 * 60 * 1000 && countryMatch && diff < bestDiff) {
            bestKey = g.race.session_key
            bestQualiKey = g.quali?.session_key ?? null
            bestDiff = diff
          }
        }
        if (bestKey) {
          await supabase.from('races').update({
            openf1_race_session_key: bestKey,
            openf1_quali_session_key: bestQualiKey,
          }).eq('id', raceId)
        }
      }
    } catch {}
  }

  return NextResponse.json({ ok: true })
}
