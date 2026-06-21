import { createClient } from '@/lib/supabase/server'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profiles }, { data: scores }] = await Promise.all([
    supabase.from('profiles').select('id, username'),
    supabase.from('scores').select('user_id, total_points'),
  ])

  const scoreMap = (scores ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.user_id] = (acc[s.user_id] ?? 0) + s.total_points
    return acc
  }, {})

  const aggregated = (profiles ?? [])
    .map(p => ({ userId: p.id, username: p.username, total: scoreMap[p.id] ?? 0 }))
    .sort((a, b) => b.total - a.total)

  const MEDAL_COLOR = [
    { bg: 'rgba(255,192,0,0.12)',  border: 'var(--f1-gold)',   text: 'var(--f1-gold)',   label: '01' },
    { bg: 'rgba(192,192,192,0.1)', border: 'var(--f1-silver)', text: 'var(--f1-silver)', label: '02' },
    { bg: 'rgba(205,127,50,0.1)',  border: 'var(--f1-bronze)', text: 'var(--f1-bronze)', label: '03' },
  ]

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)' }}>
          Temporada 2026
        </p>
        <h1 className="f1-heading text-3xl">Ranking</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="striped-accent-thick" />

        {aggregated.length === 0 ? (
          <p className="p-12 text-center text-sm uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>
            Nenhum palpite pontuado ainda
          </p>
        ) : (
          <div>
            {/* Header row */}
            <div
              className="grid px-4 py-2 text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--f1-muted)', borderBottom: '1px solid var(--f1-border)', gridTemplateColumns: '3rem 1fr 5rem' }}
            >
              <span>POS</span>
              <span>Piloto</span>
              <span className="text-right">PTS</span>
            </div>

            {aggregated.map((entry, i) => {
              const isMe = entry.userId === user!.id
              const medal = MEDAL_COLOR[i]

              return (
                <div
                  key={entry.userId}
                  className="grid px-4 py-3.5 items-center transition-colors"
                  style={{
                    gridTemplateColumns: '3rem 1fr 5rem',
                    borderBottom: '1px solid var(--f1-border)',
                    backgroundColor: isMe ? 'rgba(232,0,45,0.06)' : i === 0 ? 'rgba(255,192,0,0.04)' : undefined,
                    borderLeft: isMe ? '3px solid var(--f1-red)' : medal ? `3px solid ${medal.border}` : '3px solid transparent',
                  }}
                >
                  {/* Position */}
                  <span
                    className="font-black text-sm"
                    style={{ fontStyle: 'italic', color: medal ? medal.text : 'var(--f1-muted)' }}
                  >
                    {medal ? medal.label : `0${i + 1}`.slice(-2)}
                  </span>

                  {/* Name */}
                  <span className="font-bold text-sm truncate" style={{ color: isMe ? 'white' : 'var(--f1-text)' }}>
                    {entry.username}
                    {isMe && (
                      <span
                        className="ml-2 text-xs font-bold uppercase tracking-widest"
                        style={{ color: 'var(--f1-red)' }}
                      >
                        você
                      </span>
                    )}
                  </span>

                  {/* Points */}
                  <span
                    className="text-right font-black text-lg pts-badge"
                    style={{ color: medal ? medal.text : isMe ? 'var(--f1-red)' : 'var(--f1-text)' }}
                  >
                    {entry.total}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
