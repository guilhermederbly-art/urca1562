import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFinalPositions } from '@/lib/openf1'
import { calculateScore } from '@/lib/scoring'

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard'

interface EspnCompetitor {
  order: number
  winner: boolean
  athlete: { displayName: string; fullName: string }
}
interface EspnCompetition {
  date: string
  type: { abbreviation: string }
  status: { type: { state: string; completed: boolean } }
  competitors: EspnCompetitor[]
}
interface EspnEvent {
  name: string
  endDate: string
  competitions: EspnCompetition[]
}

async function getEspnPositions(raceStartTime: string): Promise<{
  racePositions: { driverName: string; position: number }[]
  poleDriverName: string | null
  hasData: boolean
  isCompleted: boolean
}> {
  const res = await fetch(ESPN_URL, { next: { revalidate: 0 } })
  if (!res.ok) return { racePositions: [], poleDriverName: null, hasData: false, isCompleted: false }

  const data = await res.json() as { events: EspnEvent[] }
  const raceDate = new Date(raceStartTime)

  let raceComp: EspnCompetition | null = null
  let qualiComp: EspnCompetition | null = null

  for (const event of (data.events ?? [])) {
    for (const comp of (event.competitions ?? [])) {
      const diff = Math.abs(new Date(comp.date).getTime() - raceDate.getTime())
      if (comp.type.abbreviation === 'Race' && diff < 6 * 60 * 60 * 1000) {
        raceComp = comp
      }
      if ((comp.type.abbreviation === 'Qual' || comp.type.abbreviation === 'Q') && diff < 3 * 24 * 60 * 60 * 1000) {
        qualiComp = comp
      }
    }
    if (raceComp) break
  }

  if (!raceComp || !raceComp.competitors?.length) {
    return { racePositions: [], poleDriverName: null, hasData: false, isCompleted: false }
  }

  const racePositions = raceComp.competitors
    .map(c => ({ driverName: c.athlete.displayName, position: c.order }))
    .sort((a, b) => a.position - b.position)

  const poleDriverName = qualiComp?.competitors?.find(c => c.order === 1)?.athlete.displayName ?? null

  const isCompleted = !!raceComp.status?.type?.completed
  const inProgress = raceComp.status?.type?.state === 'in' || !isCompleted
  const hasData = racePositions.length > 0 && inProgress

  return { racePositions, poleDriverName, hasData, isCompleted }
}

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
      .select('id, user_id, race_id, pole_driver_id, p1_driver_id, p2_driver_id, p3_driver_id, random_pos_driver_id, bortoleto_position, challenge_answer, profiles(username)')
      .eq('race_id', raceId),
    supabase.from('profiles').select('id, username'),
  ])

  if (!race) return NextResponse.json({ error: 'Corrida não encontrada' }, { status: 404 })

  const drivers = driversRaw ?? []
  const driverById = new Map(drivers.map(d => [d.id, d]))
  const driverByNumber = new Map(drivers.map(d => [d.number, d]))

  // Match ESPN display name → driver in our DB (by last name or full name)
  function findDriverByName(displayName: string) {
    const lower = displayName.toLowerCase()
    // Try exact match first
    let found = drivers.find(d => d.name.toLowerCase() === lower)
    if (!found) {
      // Try last name match
      const lastName = lower.split(' ').pop() ?? ''
      found = drivers.find(d => d.name.toLowerCase().endsWith(lastName))
    }
    return found ?? null
  }

  type LivePosition = { driverName: string; position: number }
  let livePositions: LivePosition[] = []
  let poleDriverId: string | null = null
  let hasData = false
  let raceFinished = race.status === 'finished'

  if (isDemo) {
    const shuffled = [...drivers].sort(() => Math.random() - 0.5)
    livePositions = shuffled.map((d, i) => ({ driverName: d.name, position: i + 1 }))
    poleDriverId = drivers[Math.floor(Math.random() * drivers.length)]?.id ?? null
    hasData = true
  } else {
    // Try ESPN first (works during live sessions without auth)
    try {
      const espn = await getEspnPositions(race.race_start_time)
      if (espn.hasData) {
        livePositions = espn.racePositions
        if (espn.poleDriverName) poleDriverId = findDriverByName(espn.poleDriverName)?.id ?? null
        hasData = true
      }
      if (espn.isCompleted) {
        raceFinished = true
        // Auto-finalize: if race ended and status is still 'closed', trigger fetch-results
        if (race.status === 'closed' && race.openf1_race_session_key) {
          const origin = req.nextUrl.origin
          fetch(`${origin}/api/races/fetch-results`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Chamada de sistema: aqui nao ha sessao de usuario para enviar.
              'x-cron-secret': process.env.CRON_SECRET ?? '',
            },
            body: JSON.stringify({ raceId: race.id }),
          }).catch(() => {})
        }
      }
    } catch {}

    // Fallback to OpenF1 (works outside live sessions)
    if (!hasData && race.openf1_race_session_key) {
      try {
        const openf1Positions = await getFinalPositions(race.openf1_race_session_key)
        if (openf1Positions.length > 0) {
          livePositions = openf1Positions.map(p => ({
            driverName: driverByNumber.get(p.driver_number)?.name ?? `#${p.driver_number}`,
            position: p.position,
          }))
          hasData = true
        }
      } catch {}
      if (!hasData && race.openf1_quali_session_key) {
        try {
          const qualiPos = await getFinalPositions(race.openf1_quali_session_key)
          const pole = qualiPos.find(p => p.position === 1)
          if (pole) poleDriverId = driverByNumber.get(pole.driver_number)?.id ?? null
        } catch {}
      }
    }
  }

  const findAtPos = (pos: number) => livePositions.find(p => p.position === pos)
  const bortoleto = drivers.find(d => d.is_bortoleto)
  const bortoletoResult = bortoleto ? livePositions.find(p => p.driverName === bortoleto.name) : null

  const liveResult = {
    pole_driver_id: poleDriverId,
    p1_driver_id: findDriverByName(findAtPos(1)?.driverName ?? '')?.id ?? null,
    p2_driver_id: findDriverByName(findAtPos(2)?.driverName ?? '')?.id ?? null,
    p3_driver_id: findDriverByName(findAtPos(3)?.driverName ?? '')?.id ?? null,
    random_pos_driver_id: race.random_position && findAtPos(race.random_position)
      ? (findDriverByName(findAtPos(race.random_position!)!.driverName)?.id ?? null)
      : null,
    bortoleto_position: bortoletoResult?.position ?? null,
  }

  const abbr = (id: string | null) => id ? (driverById.get(id)?.abbreviation ?? '?') : '—'

  function makeFakePred() {
    const ids = drivers.map(d => d.id)
    const shuffled = [...ids].sort(() => Math.random() - 0.5)
    const picks = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
    return {
      pole_driver_id: shuffled[0] ?? null,
      p1_driver_id: shuffled[1] ?? null,
      p2_driver_id: shuffled[2] ?? null,
      p3_driver_id: shuffled[3] ?? null,
      random_pos_driver_id: shuffled[4] ?? null,
      bortoleto_position: picks[Math.floor(Math.random() * picks.length)],
    }
  }

  type PredRow = {
    id: string; user_id: string; race_id: string
    pole_driver_id: string | null; p1_driver_id: string | null
    p2_driver_id: string | null; p3_driver_id: string | null
    random_pos_driver_id: string | null; bortoleto_position: number | null
    challenge_answer: string | null
    profiles: { username: string } | null
  }

  const leaderboardSource = isDemo
    ? (profilesRaw ?? []).map(p => ({ ...makeFakePred(), challenge_answer: null, username: p.username, user_id: p.id }))
    : ((predictionsRaw ?? []) as PredRow[]).map(pred => ({ ...pred, username: pred.profiles?.username ?? '?' }))

  const challengeCorrect = race.challenge_correct ?? null

  const leaderboard = leaderboardSource
    .map(entry => {
      const score = calculateScore(
        entry as unknown as Parameters<typeof calculateScore>[0],
        liveResult as unknown as Parameters<typeof calculateScore>[1],
        challengeCorrect,
      )
      return {
        userId: entry.user_id,
        username: entry.username,
        total: score.total_points,
        pole: score.pole_points,
        p1: score.p1_points,
        p2: score.p2_points,
        p3: score.p3_points,
        random: score.random_pos_points,
        bortoleto: score.bortoleto_points,
        challenge: score.challenge_points,
        picks: {
          pole: abbr(entry.pole_driver_id),
          p1: abbr(entry.p1_driver_id),
          p2: abbr(entry.p2_driver_id),
          p3: abbr(entry.p3_driver_id),
          random: abbr(entry.random_pos_driver_id),
          bortoleto: entry.bortoleto_position !== null ? `P${entry.bortoleto_position}` : '—',
          challenge: entry.challenge_answer ?? '—',
        },
      }
    })
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({
    ok: true,
    isDemo,
    raceName: race.name,
    raceFinished,
    randomPosition: race.random_position,
    challengeQuestion: race.challenge_question ?? null,
    challengeCorrect: race.challenge_correct ?? null,
    hasData,
    currentPositions: livePositions.slice(0, 22).map(p => ({
      position: p.position,
      abbreviation: findDriverByName(p.driverName)?.abbreviation ?? p.driverName.split(' ').pop() ?? '?',
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
