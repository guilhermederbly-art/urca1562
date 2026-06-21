import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/races/predictions?raceId=xxx
export async function GET(req: NextRequest) {
  const raceId = req.nextUrl.searchParams.get('raceId')
  if (!raceId) return NextResponse.json({ error: 'raceId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: predictionsRaw }, { data: drivers }, { data: race }] = await Promise.all([
    supabase
      .from('predictions')
      .select('pole_driver_id, p1_driver_id, p2_driver_id, p3_driver_id, random_pos_driver_id, bortoleto_position, profiles(username)')
      .eq('race_id', raceId),
    supabase.from('drivers').select('id, abbreviation'),
    supabase.from('races').select('status, random_position').eq('id', raceId).single(),
  ])

  if (!race || (race.status !== 'closed' && race.status !== 'finished')) {
    return NextResponse.json({ error: 'Palpites ainda não encerrados' }, { status: 403 })
  }

  const driverMap = new Map((drivers ?? []).map(d => [d.id, d.abbreviation]))

  type PredRow = {
    pole_driver_id: string | null
    p1_driver_id: string | null
    p2_driver_id: string | null
    p3_driver_id: string | null
    random_pos_driver_id: string | null
    bortoleto_position: number | null
    profiles: { username: string } | null
  }

  const result = ((predictionsRaw ?? []) as PredRow[]).map(p => ({
    username: p.profiles?.username ?? '?',
    pole: driverMap.get(p.pole_driver_id ?? '') ?? '—',
    p1:   driverMap.get(p.p1_driver_id ?? '') ?? '—',
    p2:   driverMap.get(p.p2_driver_id ?? '') ?? '—',
    p3:   driverMap.get(p.p3_driver_id ?? '') ?? '—',
    random_pos: driverMap.get(p.random_pos_driver_id ?? '') ?? '—',
    bortoleto_position: p.bortoleto_position ?? '—',
  }))

  return NextResponse.json({ ok: true, predictions: result, random_position: race.random_position })
}
