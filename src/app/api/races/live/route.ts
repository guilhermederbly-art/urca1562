import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFinalPositions } from '@/lib/openf1'
import { calculateScore } from '@/lib/scoring'

// GET /api/races/live?raceId=xxx&demo=true
export async function GET(req: NextRequest) {
  const raceId = req.nextUrl.searchParams.get('raceId')
  const isDemo = req.nextUrl.searchParams.get('demo') === 'true'
  if (!raceId) return NextResponse.json({ error: 'raceId required' }, { status: 400 })

  const supabase = await createClient()

  const [{ data: race }, { data: driversRaw }, { data: predictionsRaw }, { data: profilesRaw }] = await Promise.all([
    supabase.from('races').select('*').eq('id', raceId).single(),
    supabase.from('drivers').select('*'),
    supabase.from('predictions')
      .select('id, user_id, race_id, pole_driver_id, p1_driver_id, p2_driver_id, p3_driver_id, random_pos_driver_id, bortoleto_position, profiles(username)')
      .eq('race_id', raceId),
    supabase.from('profiles').select('id, username'),
  ])

  if (!race) return NextResponse.json({ error: 'Corrida não encontrada' }, { status: 404 })
  if (!race.openf1_race_session_key) return NextResponse.json({ error: 'Sessão OpenF1 não configurada' }, { status: 400 })

  const drivers = driversRaw ?? []
  const driverByNumber = new Map(drivers.map(d => [d.number, d]))
  const driverById = new Map(drivers.map(d => [d.id, d]))

  // Fetch live race positions (or generate fake ones in demo mode)
  let racePositions: Awaited<ReturnType<typeof getFinalPositions>> = []
  let poleDriverId: string | null = null

  if (isDemo) {
    // Shuffle real drivers into random positions for simulation
    const shuffled = [...drivers].sort(() => Math.random() - 0.5)
    racePositions = shuffled.map((d, i) => ({
      driver_number: d.number,
      position: i + 1,
      session_key: 0,
      date: new Date().toISOString(),
    }))
    // Pick a random pole driver
    poleDriverId = drivers[Math.floor(Math.random() * drivers.length)]?.id ?? null
  } else {
    if (!race.openf1_race_session_key) {
      return NextResponse.json({ error: 'Sessão OpenF1 não configurada' }, { status: 400 })
    }
    try {
      racePositions = await getFinalPositions(race.openf1_race_session_key)
    } catch {
      return NextResponse.json({ error: 'Falha ao buscar dados OpenF1' }, { status: 502 })
    }
    if (race.openf1_quali_session_key) {
      try {
        const qualiPos = await getFinalPositions(race.openf1_quali_session_key)
        const pole = qualiPos.find(p => p.position === 1)
        if (pole) poleDriverId = driverByNumber.get(pole.driver_number)?.id ?? null
      } catch {}
    }
  }

  const find = (pos: number) => racePositions.find(p => p.position === pos)
  const bortoleto = drivers.find(d => d.is_bortoleto)
  const bortoletoResult = bortoleto ? racePositions.find(p => p.driver_number === bortoleto.number) : null

  const liveResult = {
    pole_driver_id: poleDriverId,
    p1_driver_id: find(1) ? (driverByNumber.get(find(1)!.driver_number)?.id ?? null) : null,
    p2_driver_id: find(2) ? (driverByNumber.get(find(2)!.driver_number)?.id ?? null) : null,
    p3_driver_id: find(3) ? (driverByNumber.get(find(3)!.driver_number)?.id ?? null) : null,
    random_pos_driver_id: race.random_position && find(race.random_position)
      ? (driverByNumber.get(find(race.random_position!)!.driver_number)?.id ?? null)
      : null,
    bortoleto_position: bortoletoResult?.position ?? null,
  }

  const abbr = (id: string | null) => id ? (driverById.get(id)?.abbreviation ?? '?') : '—'

  function randomPick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

  type FakePred = {
    pole_driver_id: string | null; p1_driver_id: string | null
    p2_driver_id: string | null; p3_driver_id: string | null
    random_pos_driver_id: string | null; bortoleto_position: number | null
  }

  function makeFakePred(): FakePred {
    const ids = drivers.map(d => d.id)
    const shuffled = [...ids].sort(() => Math.random() - 0.5)
    return {
      pole_driver_id: shuffled[0] ?? null,
      p1_driver_id: shuffled[1] ?? null,
      p2_driver_id: shuffled[2] ?? null,
      p3_driver_id: shuffled[3] ?? null,
      random_pos_driver_id: shuffled[4] ?? null,
      bortoleto_position: randomPick([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]),
    }
  }

  type PredRow = {
    id: string; user_id: string; race_id: string
    pole_driver_id: string | null; p1_driver_id: string | null
    p2_driver_id: string | null; p3_driver_id: string | null
    random_pos_driver_id: string | null; bortoleto_position: number | null
    profiles: { username: string } | null
  }

  const leaderboardSource = isDemo
    ? (profilesRaw ?? []).map(p => ({ ...makeFakePred(), username: p.username }))
    : ((predictionsRaw ?? []) as PredRow[]).map(pred => ({ ...pred, username: pred.profiles?.username ?? '?' }))

  const leaderboard = leaderboardSource
    .map(entry => {
      const score = calculateScore(entry as unknown as Parameters<typeof calculateScore>[0], liveResult as unknown as Parameters<typeof calculateScore>[1])
      return {
        username: entry.username,
        total: score.total_points,
        pole: score.pole_points,
        p1: score.p1_points,
        p2: score.p2_points,
        p3: score.p3_points,
        random: score.random_pos_points,
        bortoleto: score.bortoleto_points,
        picks: {
          pole: abbr(entry.pole_driver_id),
          p1: abbr(entry.p1_driver_id),
          p2: abbr(entry.p2_driver_id),
          p3: abbr(entry.p3_driver_id),
          random: abbr(entry.random_pos_driver_id),
          bortoleto: entry.bortoleto_position !== null ? `P${entry.bortoleto_position}` : '—',
        },
      }
    })
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({
    ok: true,
    isDemo,
    raceName: race.name,
    randomPosition: race.random_position,
    hasData: racePositions.length > 0,
    currentPositions: racePositions.slice(0, 20).map(p => ({
      position: p.position,
      abbreviation: driverByNumber.get(p.driver_number)?.abbreviation ?? `#${p.driver_number}`,
    })),
    liveResult: {
      pole: abbr(liveResult.pole_driver_id),
      p1: abbr(liveResult.p1_driver_id),
      p2: abbr(liveResult.p2_driver_id),
      p3: abbr(liveResult.p3_driver_id),
      random: abbr(liveResult.random_pos_driver_id),
      bortoleto: liveResult.bortoleto_position !== null ? `P${liveResult.bortoleto_position}` : '—',
    },
    leaderboard,
    lastUpdated: new Date().toISOString(),
  })
}
