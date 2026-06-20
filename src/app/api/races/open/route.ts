import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/races/open
// Body: { raceId: string }
// Opens predictions for a race and draws the random position (4–20)
export async function POST(req: NextRequest) {
  const { raceId } = await req.json()
  if (!raceId) return NextResponse.json({ error: 'raceId required' }, { status: 400 })

  const supabase = await createServiceClient()

  const randomPosition = Math.floor(Math.random() * 17) + 4 // 4 to 20

  const { error } = await supabase
    .from('races')
    .update({ status: 'open', random_position: randomPosition })
    .eq('id', raceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, randomPosition })
}
