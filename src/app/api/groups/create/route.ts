import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '123456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)]
  code += digits[Math.floor(Math.random() * digits.length)]
  return code
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })

  const { name } = await req.json()
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ ok: false, error: 'Nome do grupo deve ter pelo menos 2 caracteres.' }, { status: 400 })
  }

  // Generate unique code
  let code = ''
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateCode()
    const { data } = await supabase.from('groups').select('id').eq('code', candidate).maybeSingle()
    if (!data) { code = candidate; break }
  }
  if (!code) return NextResponse.json({ ok: false, error: 'Erro ao gerar código. Tente novamente.' }, { status: 500 })

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .insert({ name: name.trim(), code, created_by: user.id })
    .select()
    .single()

  if (groupErr) return NextResponse.json({ ok: false, error: groupErr.message }, { status: 500 })

  const { error: memberErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  // Sem o criador como membro o grupo nasce orfao e invisivel — desfaz a criacao
  if (memberErr) {
    await supabase.from('groups').delete().eq('id', group.id)
    return NextResponse.json({ ok: false, error: memberErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, group })
}
