import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, groups: [] })

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = (memberships ?? []).map(m => m.group_id)
  if (groupIds.length === 0) return NextResponse.json({ ok: true, groups: [] })

  const [{ data: groupsData }, { data: allMembers }] = await Promise.all([
    supabase.from('groups').select('id, name, code').in('id', groupIds),
    supabase.from('group_members').select('group_id, user_id').in('group_id', groupIds),
  ])

  const membersByGroup: Record<string, string[]> = {}
  for (const m of (allMembers ?? [])) {
    if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = []
    membersByGroup[m.group_id].push(m.user_id)
  }

  const groups = (groupsData ?? []).map(g => ({
    id: g.id,
    name: g.name,
    code: g.code,
    memberIds: membersByGroup[g.id] ?? [],
  }))

  return NextResponse.json({ ok: true, groups })
}
