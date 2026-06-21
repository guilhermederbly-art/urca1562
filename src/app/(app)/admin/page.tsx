import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import AdminPanel from '@/components/AdminPanel'

const ADMIN_EMAIL = 'guilherme.derbly@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const serviceSupabase = await createServiceClient()

  const [{ data: races }, { data: drivers }, { data: profiles }] = await Promise.all([
    supabase.from('races').select('*').order('round_number'),
    supabase.from('drivers').select('*').order('number'),
    serviceSupabase.from('profiles').select('id, username, created_at').order('created_at'),
  ])

  // Get auth users list to cross-reference emails
  const { data: authUsers } = await serviceSupabase.auth.admin.listUsers()
  const emailById = new Map(authUsers?.users.map(u => [u.id, u.email ?? '']) ?? [])

  const users = (profiles ?? []).map(p => ({
    ...p,
    email: emailById.get(p.id) ?? '',
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Painel Admin</h1>
        <p style={{ color: 'var(--f1-muted)' }} className="text-sm">
          Gerencie corridas, palpites, resultados e usuários
        </p>
      </div>
      <AdminPanel races={races ?? []} drivers={drivers ?? []} users={users} />
    </div>
  )
}
