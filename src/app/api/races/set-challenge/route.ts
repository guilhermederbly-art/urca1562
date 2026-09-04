import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { recusaSeNaoAdmin } from '@/lib/auth'
import { calculateScore } from '@/lib/scoring'
import type { Prediction } from '@/lib/types/database'

// POST /api/races/set-challenge
// Body: { raceId: string, correctAnswer: string }
// Sets the correct answer for the round challenge and recalculates all scores
export async function POST(req: NextRequest) {
  const recusa = await recusaSeNaoAdmin()
  if (recusa) return recusa

  const { raceId, correctAnswer } = await req.json()
  if (!raceId || !correctAnswer) return NextResponse.json({ error: 'raceId and correctAnswer required' }, { status: 400 })

  const supabase = await createServiceClient()

  // Save correct answer
  const { error: updateError } = await supabase
    .from('races')
    .update({ challenge_correct: correctAnswer })
    .eq('id', raceId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Recalculate scores for all predictions of this race
  const [{ data: predictions }, { data: result }] = await Promise.all([
    supabase.from('predictions').select('*').eq('race_id', raceId),
    supabase.from('race_results').select('*').eq('race_id', raceId).single(),
  ])

  if (predictions && predictions.length > 0 && result) {
    const scoreUpserts = (predictions as Prediction[]).map(pred => {
      const s = calculateScore(pred, result, correctAnswer)
      return { user_id: pred.user_id, race_id: raceId, ...s }
    })
    await supabase.from('scores').upsert(scoreUpserts, { onConflict: 'user_id,race_id' })
  }

  return NextResponse.json({ ok: true })
}
