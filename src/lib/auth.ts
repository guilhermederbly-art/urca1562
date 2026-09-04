import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/config'

// Guarda única das rotas de administração.
//
// Toda rota que usa createServiceClient() passa por cima do RLS — a service
// role key não tem dono. Sem esta checagem, a rota fica aberta para qualquer
// pessoa que saiba a URL, e o Supabase não recusa nada porque a credencial é
// legítima. Devolve null quando pode seguir, ou a resposta de recusa.
export async function recusaSeNaoAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
