import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// One-time setup: delete past races, open next upcoming
export async function POST() {
  const supabase = await createServiceClient()

  // Delete races that already happened (before today)
  const cutoff = new Date().toISOString()
  const { error: delError, count } = await supabase
    .from('races')
    .delete({ count: 'exact' })
    .lt('race_start_time', cutoff)

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  // Open the first upcoming race and draw random position
  const { data: next } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'upcoming')
    .order('round_number')
    .limit(1)
    .single()

  if (!next) return NextResponse.json({ ok: true, deleted: count, opened: null })

  const randomPosition = Math.floor(Math.random() * 17) + 4
  await supabase
    .from('races')
    .update({ status: 'open', random_position: randomPosition })
    .eq('id', next.id)

  return NextResponse.json({ ok: true, deleted: count, opened: next.name, randomPosition })
}
