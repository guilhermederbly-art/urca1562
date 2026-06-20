import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Race } from '@/lib/types/database'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'Em breve',         color: '#8a8aa0', bg: 'rgba(138,138,160,0.1)' },
  open:     { label: 'Palpites abertos', color: '#00d2be', bg: 'rgba(0,210,190,0.1)'   },
  closed:   { label: 'Fechado',          color: '#ffc000', bg: 'rgba(255,192,0,0.1)'   },
  finished: { label: 'Finalizada',       color: '#8a8aa0', bg: 'rgba(138,138,160,0.1)' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: racesData } = await supabase.from('races').select('*').order('round_number')
  const races = racesData as Race[] | null

  const { data: userPredictions } = await supabase
    .from('predictions').select('race_id').eq('user_id', user!.id)
  const predictedRaceIds = new Set((userPredictions ?? []).map(p => (p as { race_id: string }).race_id))

  const nextOpen = races?.find(r => r.status === 'open')

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)' }}>
            Temporada 2026
          </p>
          <h1 className="f1-heading text-3xl">Calendário</h1>
        </div>
        {nextOpen && (
          <div className="text-right hidden sm:block">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--f1-muted)' }}>
              Próximo GP
            </p>
            <p className="font-bold text-sm text-white">{nextOpen.name}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {races && races.length > 0 ? races.map(race => {
          const isPredicted = predictedRaceIds.has(race.id)
          const isOpen = race.status === 'open'
          const isFinished = race.status === 'finished'
          const status = STATUS_CONFIG[race.status]

          return (
            <div
              key={race.id}
              className="card flex items-center gap-0 transition-colors"
              style={{
                borderLeft: isOpen ? '3px solid var(--f1-red)' : '3px solid transparent',
              }}
            >
              {/* Round number */}
              <div
                className="flex-shrink-0 flex items-center justify-center w-14 self-stretch"
                style={{
                  backgroundColor: isOpen ? 'rgba(232,0,45,0.08)' : 'rgba(0,0,0,0.2)',
                  borderRight: '1px solid var(--f1-border)',
                }}
              >
                <span className="round-badge">{race.round_number}</span>
              </div>

              {/* Race info */}
              <div className="flex-1 min-w-0 px-4 py-3">
                <div className="font-bold text-white truncate" style={{ fontSize: '0.9375rem' }}>
                  {race.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>{race.circuit}</span>
                  <span style={{ color: 'var(--f1-border-light)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>
                    {format(new Date(race.race_start_time), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                  {race.random_position && isOpen && (
                    <>
                      <span style={{ color: 'var(--f1-border-light)' }}>·</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--f1-gold)' }}>
                        🎲 P{race.random_position}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex-shrink-0 px-3 hidden sm:flex">
                <span
                  className="status-pill"
                  style={{ color: status.color, backgroundColor: status.bg }}
                >
                  {status.label}
                </span>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0 pr-3 py-3">
                {isOpen && !isPredicted && (
                  <Link href={`/races/${race.id}`} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>
                    Palpitar
                  </Link>
                )}
                {isOpen && isPredicted && (
                  <Link href={`/races/${race.id}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>
                    Editar
                  </Link>
                )}
                {!isOpen && isFinished && (
                  <Link href={`/races/${race.id}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}>
                    Resultado
                  </Link>
                )}
                {!isOpen && !isFinished && isPredicted && (
                  <span className="text-xs font-bold uppercase tracking-wider px-3" style={{ color: '#00d2be' }}>
                    ✓ Enviado
                  </span>
                )}
                {!isOpen && !isFinished && !isPredicted && race.status !== 'upcoming' && (
                  <span className="text-xs font-bold uppercase tracking-wider px-3" style={{ color: 'var(--f1-muted)' }}>
                    —
                  </span>
                )}
              </div>
            </div>
          )
        }) : (
          <div className="card p-16 text-center">
            <p className="text-sm uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>
              Nenhuma corrida cadastrada ainda
            </p>
            <Link href="/admin" className="btn-primary inline-flex mt-4" style={{ fontSize: '0.75rem' }}>
              Importar calendário
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
