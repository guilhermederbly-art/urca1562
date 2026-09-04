import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { recusaSeNaoAdmin } from '@/lib/auth'

// POST /api/admin/sync-fp1
// Atualiza fp1_start_time para todas as corridas existentes no banco
export async function POST() {
  const recusa = await recusaSeNaoAdmin()
  if (recusa) return recusa

  const supabase = await createServiceClient()

  const res = await fetch('https://api.openf1.org/v1/sessions?year=2026')
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch OpenF1' }, { status: 502 })

  const sessions = await res.json() as {
    session_key: number; session_name: string; session_type: string
    meeting_key: number; date_start: string
  }[]

  // Mapeia meeting_key → FP1 date
  const fp1ByMeeting = new Map<number, string>()
  for (const s of sessions) {
    if (s.session_name === 'Practice 1') {
      fp1ByMeeting.set(s.meeting_key, s.date_start)
    }
  }

  // Mapeia race session_key → meeting_key
  const meetingByRaceKey = new Map<number, number>()
  for (const s of sessions) {
    if (s.session_type === 'Race') {
      meetingByRaceKey.set(s.session_key, s.meeting_key)
    }
  }

  const { data: races } = await supabase
    .from('races')
    .select('id, name, openf1_race_session_key')
    .not('openf1_race_session_key', 'is', null)

  const updates: string[] = []

  for (const race of (races ?? [])) {
    const meetingKey = meetingByRaceKey.get(race.openf1_race_session_key!)
    if (!meetingKey) continue
    const fp1Time = fp1ByMeeting.get(meetingKey)
    if (!fp1Time) continue

    await supabase
      .from('races')
      .update({ fp1_start_time: fp1Time })
      .eq('id', race.id)

    updates.push(`${race.name}: FP1 = ${fp1Time}`)
  }

  return NextResponse.json({ ok: true, updated: updates.length, races: updates })
}
