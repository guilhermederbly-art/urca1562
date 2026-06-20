import { createClient } from '@/lib/supabase/server'
import AdminPanel from '@/components/AdminPanel'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: races } = await supabase
    .from('races')
    .select('*')
    .order('round_number')

  const { data: drivers } = await supabase.from('drivers').select('*').order('number')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Painel Admin</h1>
        <p style={{ color: 'var(--f1-muted)' }} className="text-sm">
          Gerencie corridas, palpites e resultados
        </p>
      </div>
      <AdminPanel races={races ?? []} drivers={drivers ?? []} />
    </div>
  )
}
