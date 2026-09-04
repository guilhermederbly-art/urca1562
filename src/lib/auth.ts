import { timingSafeEqual } from 'node:crypto'
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

// Segunda porta, para chamada de SISTEMA (nao ha pessoa logada do outro lado).
// A pagina ao vivo dispara a importacao do resultado no instante em que a
// corrida termina, e ela roda no servidor, sem sessao: com a guarda de admin
// sozinha essa chamada tomava 401 e o .catch() dela engolia — o resultado so
// aparecia horas depois, quando o cron passasse.
//
// FALHA FECHADO: sem CRON_SECRET configurado a porta nao abre "por enquanto".
// E compara em tempo constante — um === sai no primeiro byte diferente e
// vaza o segredo por tempo.
export function ehChamadaDeSistema(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const enviado = req.headers.get('x-cron-secret')
  if (!enviado) return false
  const a = Buffer.from(enviado)
  const b = Buffer.from(secret)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
