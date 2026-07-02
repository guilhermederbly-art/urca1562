import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const otherId = searchParams.get('userId')
  if (!otherId) return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const [
    { data: myScores },
    { data: theirScores },
    { data: races },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('scores').select('race_id, total_points').eq('user_id', user.id),
    supabase.from('scores').select('race_id, total_points').eq('user_id', otherId),
    supabase.from('races').select('id, round_number, name').eq('status', 'finished').order('round_number'),
    supabase.from('profiles').select('id, username').in('id', [user.id, otherId]),
  ])

  const myMap    = new Map((myScores    ?? []).map(s => [s.race_id, s.total_points]))
  const theirMap = new Map((theirScores ?? []).map(s => [s.race_id, s.total_points]))
  const profMap  = new Map((profiles    ?? []).map(p => [p.id, p.username]))

  const raceRows = (races ?? []).map(r => {
    const mine   = myMap.get(r.id)    ?? 0
    const theirs = theirMap.get(r.id) ?? 0
    return {
      id:     r.id,
      name:   r.name.replace(/Grande Pr[eê]mio /i, 'GP '),
      round:  r.round_number,
      mine,
      theirs,
      winner: mine > theirs ? 'me' : theirs > mine ? 'them' : 'tie',
    }
  })

  const myWins    = raceRows.filter(r => r.winner === 'me').length
  const theirWins = raceRows.filter(r => r.winner === 'them').length
  const ties      = raceRows.filter(r => r.winner === 'tie').length
  const myTotal   = raceRows.reduce((s, r) => s + r.mine,   0)
  const theirTotal = raceRows.reduce((s, r) => s + r.theirs, 0)

  return NextResponse.json({
    ok: true,
    me:    { id: user.id, username: profMap.get(user.id)  ?? '?', total: myTotal },
    them:  { id: otherId, username: profMap.get(otherId)   ?? '?', total: theirTotal },
    myWins, theirWins, ties,
    races: raceRows,
  })
}
