import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'guilherme.derbly@gmail.com'

export async function POST(req: NextRequest) {
  // Only admin can call this
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  // Prevent admin from deleting themselves
  if (userId === user.id) {
    return NextResponse.json({ error: 'Não é possível excluir sua própria conta aqui.' }, { status: 400 })
  }

  const serviceSupabase = await createServiceClient()
  const { error } = await serviceSupabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
