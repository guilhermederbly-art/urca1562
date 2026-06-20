import { createClient } from '@/lib/supabase/server'

export default async function ParticipantesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Todos os perfis cadastrados
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, created_at')
    .order('created_at')

  // Pontos por usuário
  const { data: scores } = await supabase
    .from('scores')
    .select('user_id, total_points')

  // Corrida aberta — para verificar quem já palpitou
  const { data: openRace } = await supabase
    .from('races')
    .select('id, name')
    .eq('status', 'open')
    .order('round_number')
    .limit(1)
    .maybeSingle()

  const { data: predictions } = openRace
    ? await supabase
        .from('predictions')
        .select('user_id')
        .eq('race_id', openRace.id)
    : { data: [] }

  const predictedIds = new Set((predictions ?? []).map((p: { user_id: string }) => p.user_id))

  const totalPoints = (scores ?? []).reduce<Record<string, number>>((acc, s: { user_id: string; total_points: number }) => {
    acc[s.user_id] = (acc[s.user_id] ?? 0) + s.total_points
    return acc
  }, {})

  const list = (profiles ?? []).map(p => ({
    ...p,
    points: totalPoints[p.id] ?? 0,
    predicted: predictedIds.has(p.id),
    isMe: p.id === user!.id,
  })).sort((a, b) => b.points - a.points)

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)' }}>
          Temporada 2026
        </p>
        <h1 className="f1-heading text-3xl">Participantes</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--f1-muted)' }}>
          {list.length} piloto{list.length !== 1 ? 's' : ''} no grid
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="striped-accent-thick" />

        {/* Header */}
        <div
          className="grid px-4 py-2 text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--f1-muted)', borderBottom: '1px solid var(--f1-border)', gridTemplateColumns: '3rem 1fr auto auto' }}
        >
          <span>#</span>
          <span>Piloto</span>
          {openRace && <span className="text-center pr-4">GP atual</span>}
          <span className="text-right">PTS</span>
        </div>

        {list.map((p, i) => (
          <div
            key={p.id}
            className="grid px-4 py-3.5 items-center"
            style={{
              gridTemplateColumns: '3rem 1fr auto auto',
              borderBottom: '1px solid var(--f1-border)',
              backgroundColor: p.isMe ? 'rgba(232,0,45,0.06)' : undefined,
              borderLeft: p.isMe ? '3px solid var(--f1-red)' : '3px solid transparent',
            }}
          >
            {/* Posição */}
            <span className="font-black text-sm" style={{ fontStyle: 'italic', color: 'var(--f1-muted)' }}>
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Nome */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: p.isMe ? 'white' : 'var(--f1-text)' }}>
                {p.username}
              </span>
              {p.isMe && (
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-red)' }}>
                  você
                </span>
              )}
            </div>

            {/* Status GP atual */}
            {openRace && (
              <div className="pr-4 flex justify-center">
                {p.predicted ? (
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(0,210,190,0.12)', color: '#00d2be' }}
                  >
                    ✓ Enviou
                  </span>
                ) : (
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(138,138,160,0.1)', color: 'var(--f1-muted)' }}
                  >
                    Pendente
                  </span>
                )}
              </div>
            )}

            {/* Pontos */}
            <span className="text-right font-black text-lg" style={{ color: p.isMe ? 'var(--f1-red)' : 'var(--f1-text)' }}>
              {p.points}
            </span>
          </div>
        ))}

        {list.length === 0 && (
          <p className="p-12 text-center text-sm uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>
            Nenhum participante ainda
          </p>
        )}
      </div>
    </div>
  )
}
