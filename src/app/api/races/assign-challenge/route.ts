import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { pickRandomChallenge } from '@/lib/challengeBank'

// POST /api/races/assign-challenge
// Body: { raceId: string }
// Assigns a random challenge to a race that is already open (e.g. opened before this feature existed)
export async function POST(req: NextRequest) {
  const { raceId } = await req.json()
  if (!raceId) return NextResponse.json({ error: 'raceId required' }, { status: 400 })

  const supabase = await createServiceClient()
  const challenge = pickRandomChallenge()

  const { error } = await supabase
    .from('races')
    .update({
      challenge_question: challenge.question,
      challenge_options: challenge.options,
      challenge_correct: null,
    })
    .eq('id', raceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, challenge })
}
