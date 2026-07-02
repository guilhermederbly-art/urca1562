import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getFinalPositions, getSessionDrivers } from '@/lib/openf1'
import { calculateScore } from '@/lib/scoring'
import type { Prediction } from '@/lib/types/database'

// POST /api/races/fetch-results
// Body: { raceId: string }
// Fetches qualifying + race results from OpenF1, computes scores for all predictions
export async function POST(req: NextRequest) {
  const { raceId } = await req.json()
  if (!raceId) return NextResponse.json({ error: 'raceId required' }, { status: 400 })

  const supabase = await createServiceClient()

  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single()
  if (!race) return NextResponse.json({ error: 'Race not found' }, { status: 404 })

  const { data: drivers } = await supabase.from('drivers').select('*')
  if (!drivers) return NextResponse.json({ error: 'No drivers' }, { status: 500 })

  // Map OpenF1 driver_number → our driver id
  const byNumber = new Map(drivers.map(d => [d.number, d]))

  let poleDriverId: string | null = null
  let p1Id: string | null = null
  let p2Id: string | null = null
  let p3Id: string | null = null
  let randomPosDriverId: string | null = null
  let bortoletoPosition: number | null = null

  // Fetch qualifying results (pole)
  if (race.openf1_quali_session_key) {
    try {
      const qualiPositions = await getFinalPositions(race.openf1_quali_session_key)
      const pole = qualiPositions.find(p => p.position === 1)
      if (pole) poleDriverId = byNumber.get(pole.driver_number)?.id ?? null
    } catch (e) {
      console.error('Failed to fetch qualifying results', e)
    }
  }

  // Fetch race results
  if (race.openf1_race_session_key) {
    try {
      const racePositions = await getFinalPositions(race.openf1_race_session_key)

      const p1Driver = racePositions.find(p => p.position === 1)
      const p2Driver = racePositions.find(p => p.position === 2)
      const p3Driver = racePositions.find(p => p.position === 3)

      if (p1Driver) p1Id = byNumber.get(p1Driver.driver_number)?.id ?? null
      if (p2Driver) p2Id = byNumber.get(p2Driver.driver_number)?.id ?? null
      if (p3Driver) p3Id = byNumber.get(p3Driver.driver_number)?.id ?? null

      // Random position driver
      if (race.random_position) {
        const randomDriver = racePositions.find(p => p.position === race.random_position)
        if (randomDriver) randomPosDriverId = byNumber.get(randomDriver.driver_number)?.id ?? null
      }

      // Bortoleto position
      const bortoleto = drivers.find(d => d.is_bortoleto)
      if (bortoleto) {
        const bortoletoResult = racePositions.find(p => p.driver_number === bortoleto.number)
        bortoletoPosition = bortoletoResult?.position ?? null
      }
    } catch (e) {
      console.error('Failed to fetch race results', e)
    }
  }

  // Upsert race result
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

  // Fetch the saved result to use for scoring
  const { data: savedResult } = await supabase.from('race_results').select('*').eq('race_id', raceId).single()
  if (!savedResult) return NextResponse.json({ error: 'Result not found after save' }, { status: 500 })

  // Compute scores for all predictions
  const { data: predictions } = await supabase.from('predictions').select('*').eq('race_id', raceId)

  if (predictions && predictions.length > 0) {
    const scoreUpserts = (predictions as Prediction[]).map(pred => {
      const s = calculateScore(pred, savedResult, race.challenge_correct)
      return {
        user_id: pred.user_id,
        race_id: raceId,
        ...s,
      }
    })
    await supabase.from('scores').upsert(scoreUpserts, { onConflict: 'user_id,race_id' })
  }

  // Mark race as finished
  await supabase.from('races').update({ status: 'finished' }).eq('id', raceId)

  return NextResponse.json({ ok: true, poleDriverId, p1Id, p2Id, p3Id, randomPosDriverId, bortoletoPosition })
}
