import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import AdminPanel from '@/components/AdminPanel'
import PageHero from '@/components/PageHero'
import { ADMIN_EMAIL } from '@/lib/config'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const serviceSupabase = await createServiceClient()

  const [{ data: races }, { data: drivers }, { data: profiles }, { data: groupsRaw }, { data: groupMembersRaw }] = await Promise.all([
    supabase.from('races').select('*').order('round_number'),
    supabase.from('drivers').select('*').order('number'),
    serviceSupabase.from('profiles').select('id, username, created_at, last_seen_at').order('created_at'),
    serviceSupabase.from('groups').select('id, name, code, created_at').order('created_at'),
    serviceSupabase.from('group_members').select('group_id'),
  ])

  // Get auth users list to cross-reference emails
  const { data: authUsers } = await serviceSupabase.auth.admin.listUsers()
  const authById = new Map(authUsers?.users.map(u => [u.id, u]) ?? [])

  const users = (profiles ?? []).map(p => ({
    ...p,
    email: authById.get(p.id)?.email ?? '',
    last_seen_at: p.last_seen_at ?? null,
  }))

  const memberCountById: Record<string, number> = {}
  for (const m of (groupMembersRaw ?? [])) {
    memberCountById[m.group_id] = (memberCountById[m.group_id] ?? 0) + 1
  }
  const groups = (groupsRaw ?? []).map(g => ({
    ...g,
    memberCount: memberCountById[g.id] ?? 0,
  }))

  // Fetch predictions for the currently open race (if any)
  const openRace = (races ?? []).find(r => r.status === 'open')
  let predictedUserIds: string[] = []
  if (openRace) {
    const { data: preds } = await serviceSupabase
      .from('predictions')
      .select('user_id')
      .eq('race_id', openRace.id)
    predictedUserIds = (preds ?? []).map(p => p.user_id)
  }

  return (
    <div>
      <PageHero
        kicker="Administração"
        title="Painel Admin"
        subtitle="Gerencie corridas, palpites, resultados e usuários"
      />
      <AdminPanel
        races={races ?? []}
        drivers={drivers ?? []}
        users={users}
        groups={groups}
        openRaceName={openRace?.name}
        predictedUserIds={predictedUserIds}
      />
    </div>
  )
}
