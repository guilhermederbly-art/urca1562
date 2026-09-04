import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { recusaSeNaoAdmin } from '@/lib/auth'

// POST /api/races/reopen
// Reopens a closed race without changing the random_position already drawn
export async function POST(req: NextRequest) {
  const recusa = await recusaSeNaoAdmin()
  if (recusa) return recusa

  const { raceId } = await req.json()
  if (!raceId) return NextResponse.json({ error: 'raceId required' }, { status: 400 })

  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('races')
    .update({ status: 'open' })
    .eq('id', raceId)
    .in('status', ['closed', 'finished'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
