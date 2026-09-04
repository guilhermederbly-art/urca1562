import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { recusaSeNaoAdmin, ehChamadaDeSistema } from '@/lib/auth'
import { getFinalPositions, findSessionKey } from '@/lib/openf1'
import { calculateScore } from '@/lib/scoring'
import type { Prediction } from '@/lib/types/database'

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard'

// GET final positions from ESPN (works for both live and completed races)
async function getEspnFinalPositions(raceStartTime: string): Promise<{
  racePositions: { driverName: string; position: number }[]
  poleDriverName: string | null
}> {
  try {
    const res = await fetch(ESPN_URL, { next: { revalidate: 0 } })
    if (!res.ok) return { racePositions: [], poleDriverName: null }
    const data = await res.json() as {
      events: {
        competitions: {
          date: string
          type: { abbreviation: string }
          status: { type: { completed: boolean } }
          competitors: { order: number; athlete: { displayName: string } }[]
        }[]
      }[]
    }
    const raceDate = new Date(raceStartTime)
    let raceComp = null as typeof data.events[0]['competitions'][0] | null
    let qualiComp = null as typeof data.events[0]['competitions'][0] | null
    for (const event of data.events ?? []) {
      for (const comp of event.competitions ?? []) {
        const diff = Math.abs(new Date(comp.date).getTime() - raceDate.getTime())
        if (comp.type.abbreviation === 'Race' && diff < 6 * 60 * 60 * 1000) raceComp = comp
        if ((comp.type.abbreviation === 'Qual' || comp.type.abbreviation === 'Q') && diff < 3 * 24 * 60 * 60 * 1000) qualiComp = comp
      }
      if (raceComp) break
    }
    if (!raceComp?.competitors?.length) return { racePositions: [], poleDriverName: null }
    const racePositions = raceComp.competitors
      .map(c => ({ driverName: c.athlete.displayName, position: c.order }))
      .sort((a, b) => a.position - b.position)
    const poleDriverName = qualiComp?.competitors?.find(c => c.order === 1)?.athlete.displayName ?? null
    return { racePositions, poleDriverName }
  } catch {
    return { racePositions: [], poleDriverName: null }
  }
}

// POST /api/races/fetch-results
// Body: { raceId: string }
export async function POST(req: NextRequest) {
  // Duas portas: o botao do /admin (sessao de admin) e a pagina ao vivo, que
  // chama isto sem sessao no instante em que a corrida termina.
  if (!ehChamadaDeSistema(req)) {
    const recusa = await recusaSeNaoAdmin()
    if (recusa) return recusa
  }

  const { raceId } = await req.json()
  if (!raceId) return NextResponse.json({ error: 'raceId required' }, { status: 400 })

  const supabase = await createServiceClient()

  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single()
  if (!race) return NextResponse.json({ error: 'Race not found' }, { status: 404 })

  // Skip only if already finished WITH valid results
  if (race.status === 'finished') {
    const { data: existingResult } = await supabase
      .from('race_results').select('p1_driver_id').eq('race_id', raceId).maybeSingle()
    if (existingResult?.p1_driver_id) {
      return NextResponse.json({ ok: true, alreadyFinished: true })
    }
  }

  const { data: drivers } = await supabase.from('drivers').select('*')
  if (!drivers) return NextResponse.json({ error: 'No drivers' }, { status: 500 })

  const byNumber = new Map(drivers.map(d => [d.number, d]))

  // Match ESPN display name → driver in our DB
  function findDriverByName(displayName: string) {
    const lower = displayName.toLowerCase()
    let found = (drivers ?? []).find(d => d.name.toLowerCase() === lower)
    if (!found) {
      const lastName = lower.split(' ').pop() ?? ''
      found = (drivers ?? []).find(d => d.name.toLowerCase().endsWith(lastName))
    }
    return found ?? null
  }

  let poleDriverId: string | null = null
  let p1Id: string | null = null
  let p2Id: string | null = null
  let p3Id: string | null = null
  let randomPosDriverId: string | null = null
  let bortoletoPosition: number | null = null

  // ── Step 1: Auto-assign session keys if missing ────────────────────────────
  let raceSessionKey = race.openf1_race_session_key
  let qualiSessionKey = race.openf1_quali_session_key
  if (!raceSessionKey && race.country) {
    try {
      raceSessionKey = await findSessionKey(2026, race.country, 'Race')
      qualiSessionKey = await findSessionKey(2026, race.country, 'Qualifying')
      if (raceSessionKey) {
        await supabase.from('races').update({
          openf1_race_session_key: raceSessionKey,
          openf1_quali_session_key: qualiSessionKey,
        }).eq('id', raceId)
      }
    } catch {}
  }

  // ── Step 2: Try OpenF1 ─────────────────────────────────────────────────────
  if (raceSessionKey) {
    try {
      const racePositions = await getFinalPositions(raceSessionKey)
      const p1Driver = racePositions.find(p => p.position === 1)
      const p2Driver = racePositions.find(p => p.position === 2)
      const p3Driver = racePositions.find(p => p.position === 3)
      if (p1Driver) p1Id = byNumber.get(p1Driver.driver_number)?.id ?? null
      if (p2Driver) p2Id = byNumber.get(p2Driver.driver_number)?.id ?? null
      if (p3Driver) p3Id = byNumber.get(p3Driver.driver_number)?.id ?? null
      if (race.random_position) {
        const rd = racePositions.find(p => p.position === race.random_position)
        if (rd) randomPosDriverId = byNumber.get(rd.driver_number)?.id ?? null
      }
      const bortoleto = drivers.find(d => d.is_bortoleto)
      if (bortoleto) {
        const br = racePositions.find(p => p.driver_number === bortoleto.number)
        bortoletoPosition = br?.position ?? null
      }
    } catch (e) {
      console.error('OpenF1 race fetch failed', e)
    }
  }

  if (qualiSessionKey) {
    try {
      const qualiPositions = await getFinalPositions(qualiSessionKey)
      const pole = qualiPositions.find(p => p.position === 1)
      if (pole) poleDriverId = byNumber.get(pole.driver_number)?.id ?? null
    } catch {}
  }

  // ── Step 3: ESPN fallback if OpenF1 had no P1 ─────────────────────────────
  if (!p1Id) {
    const espn = await getEspnFinalPositions(race.race_start_time)
    if (espn.racePositions.length >= 3) {
      const ep1 = espn.racePositions.find(p => p.position === 1)
      const ep2 = espn.racePositions.find(p => p.position === 2)
      const ep3 = espn.racePositions.find(p => p.position === 3)
      if (ep1) p1Id = findDriverByName(ep1.driverName)?.id ?? null
      if (ep2) p2Id = findDriverByName(ep2.driverName)?.id ?? null
      if (ep3) p3Id = findDriverByName(ep3.driverName)?.id ?? null
      if (race.random_position) {
        const rd = espn.racePositions.find(p => p.position === race.random_position)
        if (rd) randomPosDriverId = findDriverByName(rd.driverName)?.id ?? null
      }
      if (!poleDriverId && espn.poleDriverName) {
        poleDriverId = findDriverByName(espn.poleDriverName)?.id ?? null
      }
      const bortoleto = drivers.find(d => d.is_bortoleto)
      if (bortoleto && !bortoletoPosition) {
        const br = espn.racePositions.find(p => findDriverByName(p.driverName)?.id === bortoleto.id)
        bortoletoPosition = br?.position ?? null
      }
    }
  }

  // ── Step 4: Abort if still no data ────────────────────────────────────────
  if (!p1Id) {
    return NextResponse.json({
      error: 'Dados não disponíveis no OpenF1 nem na ESPN. Verifique se a corrida terminou e tente novamente em alguns minutos.',
    }, { status: 422 })
  }

  // ── Step 5: Save results and compute scores ────────────────────────────────
  const { error: resultError } = await supabase.from('race_results').upsert({
    race_id: raceId,
    pole_driver_id: poleDriverId,
    p1_driver_id: p1Id,
    p2_driver_id: p2Id,
    p3_driver_id: p3Id,
    random_pos_driver_id: randomPosDriverId,
    bortoleto_position: bortoletoPosition,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'race_id' })

  if (resultError) return NextResponse.json({ error: resultError.message }, { status: 500 })

  const { data: savedResult } = await supabase.from('race_results').select('*').eq('race_id', raceId).single()
  if (!savedResult) return NextResponse.json({ error: 'Result not found after save' }, { status: 500 })

  const { data: predictions } = await supabase.from('predictions').select('*').eq('race_id', raceId)
  if (predictions?.length) {
    const scoreUpserts = (predictions as Prediction[]).map(pred => ({
      user_id: pred.user_id,
      race_id: raceId,
      ...calculateScore(pred, savedResult, race.challenge_correct),
    }))
    await supabase.from('scores').upsert(scoreUpserts, { onConflict: 'user_id,race_id' })
  }

  await supabase.from('races').update({ status: 'finished' }).eq('id', raceId)

  return NextResponse.json({ ok: true, poleDriverId, p1Id, p2Id, p3Id, randomPosDriverId, bortoletoPosition })
}
