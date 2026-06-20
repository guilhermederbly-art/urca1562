import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createServiceClient()

  const { error } = await supabase.from('races').insert({
    round_number: body.round_number,
    name: body.name,
    circuit: body.circuit,
    country: body.country,
    qualifying_start_time: body.qualifying_start_time,
    race_start_time: body.race_start_time,
    openf1_quali_session_key: body.openf1_quali_session_key ?? null,
    openf1_race_session_key: body.openf1_race_session_key ?? null,
    status: 'upcoming',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
