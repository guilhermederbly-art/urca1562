import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/races/close
// Body: { raceId: string }
// Closes predictions for a race
export async function POST(req: NextRequest) {
  const { raceId } = await req.json()
  if (!raceId) return NextResponse.json({ error: 'raceId required' }, { status: 400 })

  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('races')
    .update({ status: 'closed' })
    .eq('id', raceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
