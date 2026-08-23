import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ ok: false, error: 'Código inválido.' }, { status: 400 })

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('code', (code as string).toUpperCase().trim())
    .maybeSingle()

  if (!group) return NextResponse.json({ ok: false, error: 'Grupo não encontrado. Verifique o código.' }, { status: 404 })

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: false, error: 'Você já faz parte deste grupo.' }, { status: 409 })

  const { error: memberErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  if (memberErr) {
    return NextResponse.json({ ok: false, error: memberErr.message }, { status: 500 })
  }

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', group.id)

  return NextResponse.json({ ok: true, group, memberIds: (members ?? []).map(m => m.user_id) })
}
