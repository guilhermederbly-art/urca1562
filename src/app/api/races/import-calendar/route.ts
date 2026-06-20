import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const BASE_URL = 'https://api.openf1.org/v1'

interface OpenF1Session {
  session_key: number
  session_name: string
  session_type: string
  meeting_key: number
  meeting_name: string
  country_name: string
  circuit_short_name: string
  date_start: string
  year: number
}

// POST /api/races/import-calendar
// Fetches all 2026 F1 sessions from OpenF1 and upserts races into the DB
export async function POST() {
  const supabase = await createServiceClient()

  // Fetch all 2026 sessions
  const res = await fetch(`${BASE_URL}/sessions?year=2026`)
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch OpenF1 sessions' }, { status: 502 })

  const sessions: OpenF1Session[] = await res.json()

  // Group sessions by meeting_key
  const meetings = new Map<number, { fp1?: OpenF1Session; quali?: OpenF1Session; race?: OpenF1Session; sprint?: OpenF1Session }>()

  for (const session of sessions) {
    const group = meetings.get(session.meeting_key) ?? {}
    if (session.session_name === 'Practice 1') group.fp1 = session
    if (session.session_type === 'Qualifying') group.quali = session
    if (session.session_type === 'Race') group.race = session
    if (session.session_type === 'Sprint') group.sprint = session
    meetings.set(session.meeting_key, group)
  }

  // Fetch existing races to avoid duplicates
  const { data: existingRaces } = await supabase.from('races').select('openf1_race_session_key')
  const existingKeys = new Set(existingRaces?.map(r => r.openf1_race_session_key).filter(Boolean) ?? [])

  const toInsert = []
  let roundNumber = 1

  // Sort meetings by race date
  const sorted = Array.from(meetings.entries())
    .filter(([, g]) => g.race)
    .sort((a, b) => new Date(a[1].race!.date_start).getTime() - new Date(b[1].race!.date_start).getTime())

  for (const [, group] of sorted) {
    const race = group.race!
    const quali = group.quali
    const fp1 = group.fp1

    if (existingKeys.has(race.session_key)) {
      roundNumber++
      continue
    }

    const qualiTime = quali
      ? quali.date_start
      : new Date(new Date(race.date_start).getTime() - 3 * 60 * 60 * 1000).toISOString()

    const fp1Time = fp1?.date_start ?? null

    toInsert.push({
      round_number: roundNumber,
      name: `Grande Prêmio ${ofCountry(race.country_name)}`,
      circuit: race.circuit_short_name,
      country: race.country_name,
      fp1_start_time: fp1Time,
      qualifying_start_time: qualiTime,
      race_start_time: race.date_start,
      openf1_quali_session_key: quali?.session_key ?? null,
      openf1_race_session_key: race.session_key,
      status: 'upcoming' as const,
    })

    roundNumber++
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ ok: true, imported: 0, message: 'Nenhuma corrida nova para importar.' })
  }

  const { error } = await supabase.from('races').insert(toInsert)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, imported: toInsert.length })
}

// Translates country name to Portuguese "de/do/da" form
function ofCountry(country: string): string {
  const map: Record<string, string> = {
    'Australia': 'da Austrália',
    'China': 'da China',
    'Japan': 'do Japão',
    'Bahrain': 'do Bahrain',
    'Saudi Arabia': 'da Arábia Saudita',
    'United States': 'dos Estados Unidos',
    'Italy': 'da Itália',
    'Monaco': 'de Mônaco',
    'Spain': 'da Espanha',
    'Canada': 'do Canadá',
    'Austria': 'da Áustria',
    'United Kingdom': 'da Grã-Bretanha',
    'Hungary': 'da Hungria',
    'Belgium': 'da Bélgica',
    'Netherlands': 'dos Países Baixos',
    'Singapore': 'de Singapura',
    'Mexico': 'do México',
    'Brazil': 'do Brasil',
    'Qatar': 'do Qatar',
    'UAE': 'de Abu Dhabi',
    'Azerbaijan': 'do Azerbaijão',
    'Miami': 'de Miami',
    'Las Vegas': 'de Las Vegas',
  }
  return map[country] ?? `de ${country}`
}
