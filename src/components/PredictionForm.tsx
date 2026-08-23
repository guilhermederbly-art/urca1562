'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Race, Driver, Prediction } from '@/lib/types/database'

interface Props {
  race: Race
  drivers: Driver[]
  existing?: Prediction
  userId: string
}

const BORTOLETO_POSITIONS = Array.from({ length: 22 }, (_, i) => i + 1)

function getTeamColor(team: string): string {
  const t = team.toLowerCase()
  if (t.includes('red bull')) return '#3671C6'
  if (t.includes('ferrari')) return '#E8002D'
  if (t.includes('mclaren')) return '#FF8000'
  if (t.includes('mercedes')) return '#27F4D2'
  if (t.includes('aston')) return '#358C75'
  if (t.includes('alpine')) return '#FF87BC'
  if (t.includes('williams')) return '#005AFF'
  if (t.includes('racing bulls') || t.includes('visa') || t.includes('rb ')) return '#6692FF'
  if (t.includes('haas')) return '#B6BABD'
  if (t.includes('sauber') || t.includes('kick')) return '#52E252'
  return '#8a8aa0'
}

// Extracted outside to avoid recreation on every render
function DriverChips({
  drivers,
  label,
  value,
  onChange,
  description,
  disabledIds,
}: {
  drivers: Driver[]
  label: string
  value: string
  onChange: (v: string) => void
  description?: string
  disabledIds?: Set<string>
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-semibold">{label}</span>
        {description && <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>{description}</span>}
      </div>
      <div className="no-scrollbar flex flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible" style={{ gap: '5px', paddingBottom: '4px' }}>
        {drivers.map(d => {
          const sel = value === d.id
          const disabled = disabledIds?.has(d.id) && !sel
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => !disabled && onChange(sel ? '' : d.id)}
              aria-label={d.name}
              aria-pressed={sel}
              style={{
                flexShrink: 0, width: '52px', paddingTop: '5px', paddingBottom: '9px',
                borderRadius: '4px', textAlign: 'center', position: 'relative', overflow: 'hidden',
                border: `2px solid ${sel ? 'var(--f1-red)' : disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)'}`,
                background: sel ? 'rgba(232,0,45,0.15)' : disabled ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.35 : 1,
              }}
            >
              <div style={{ fontSize: '0.58rem', color: 'var(--f1-muted)', fontWeight: 700, lineHeight: 1 }}>#{d.number}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: sel ? 'white' : 'var(--f1-text)', lineHeight: 1.25, marginTop: '2px' }}>
                {d.abbreviation}
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: getTeamColor(d.team) }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function PredictionForm({ race, drivers, existing, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [pole, setPole] = useState(existing?.pole_driver_id ?? '')
  const [p1, setP1] = useState(existing?.p1_driver_id ?? '')
  const [p2, setP2] = useState(existing?.p2_driver_id ?? '')
  const [p3, setP3] = useState(existing?.p3_driver_id ?? '')
  const [randomDriver, setRandomDriver] = useState(existing?.random_pos_driver_id ?? '')
  const [bortoletoPos, setBortoletoPos] = useState<number | ''>(existing?.bortoleto_position ?? '')
  const [challengeAnswer, setChallengeAnswer] = useState(existing?.challenge_answer ?? '')

  // Disabled IDs for each podium slot (can't pick same driver twice)
  const podiumDisabled = (exclude: string[]) => new Set(exclude.filter(Boolean))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const hasChallenge = !!race.challenge_question
    if (!pole || !p1 || !p2 || !p3 || !randomDriver || bortoletoPos === '' || (hasChallenge && !challengeAnswer)) {
      setError('Preencha todos os campos antes de enviar.')
      return
    }
    if (new Set([p1, p2, p3]).size < 3) {
      setError('Pódio inválido: escolha pilotos diferentes para P1, P2 e P3.')
      return
    }
    setLoading(true)
    const supabase = createClient()

    const fields = {
      pole_driver_id: pole,
      p1_driver_id: p1,
      p2_driver_id: p2,
      p3_driver_id: p3,
      random_pos_driver_id: randomDriver,
      bortoleto_position: Number(bortoletoPos),
      challenge_answer: challengeAnswer || null,
    }

    const { error: err } = existing
      ? await supabase.from('predictions').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', existing.id)
      : await supabase.from('predictions').insert({ user_id: userId, race_id: race.id, ...fields })

    if (err) {
      setError('Erro ao salvar palpite. Tente novamente.')
      setLoading(false)
    } else {
      try {
        const audio = new Audio('/sounds/save.mp3')
        audio.volume = 0.8
        await audio.play()
      } catch {}
      setSuccess(true)
      setLoading(false)
      router.refresh()
    }
  }

  if (success) {
    const shareText = `Fiz meu palpite para o ${race.name}! 🏁 Quem acerta mais pontos no F1 Bolão? 🏆`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

    return (
      <div className="card p-8 text-center animate-fade-in-up">
        <div className="text-4xl mb-3">🏁</div>
        <h2 className="text-xl font-black mb-2">Palpite salvo!</h2>
        <p style={{ color: 'var(--f1-muted)' }} className="mb-4 text-sm">Seu palpite foi registrado com sucesso.</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button onClick={() => router.push('/dashboard')} className="btn-secondary">
            Voltar ao calendário
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ background: '#25d366', textDecoration: 'none' }}
          >
            📲 Compartilhar
          </a>
        </div>
      </div>
    )
  }

  // A barra de envio e fixed em qualquer largura, entao o espaco reservado
  // embaixo do form vale pra todas — mais o home indicator do iPhone
  const formPaddingBottom = 'calc(6.5rem + env(safe-area-inset-bottom))'

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      style={{ paddingBottom: formPaddingBottom }}
    >
      {existing && (
        <div className="text-xs font-bold uppercase tracking-widest px-3 py-2 rounded flex items-center gap-2"
          style={{ background: 'rgba(255,192,0,0.08)', border: '1px solid rgba(255,192,0,0.2)', color: 'var(--f1-gold)' }}>
          ✏️ Editando palpite já enviado
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
          <span style={{ color: 'var(--f1-red)' }}>🏆</span> Seus Palpites
        </h2>

        <div className="flex flex-col gap-4">
          <DriverChips drivers={drivers} label="Pole Position" description="2 pts se acertar" value={pole} onChange={setPole} />

          <div className="border-t pt-4" style={{ borderColor: 'var(--f1-border)' }}>
            <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--f1-muted)' }}>
              Pódio — 3 pts se cravar a posição · 1 pt se o piloto estiver no pódio
            </p>
            <div className="flex flex-col gap-4">
              <DriverChips drivers={drivers} label="🥇 1° lugar" value={p1} onChange={setP1} disabledIds={podiumDisabled([p2, p3])} />
              <DriverChips drivers={drivers} label="🥈 2° lugar" value={p2} onChange={setP2} disabledIds={podiumDisabled([p1, p3])} />
              <DriverChips drivers={drivers} label="🥉 3° lugar" value={p3} onChange={setP3} disabledIds={podiumDisabled([p1, p2])} />
            </div>
          </div>

          {race.random_position && (
            <div className="border-t pt-4" style={{ borderColor: 'var(--f1-border)' }}>
              <DriverChips drivers={drivers} label={`🎲 Posição aleatória — P${race.random_position}`} description="4 pts se acertar" value={randomDriver} onChange={setRandomDriver} />
            </div>
          )}

          <div className="border-t pt-4" style={{ borderColor: 'var(--f1-border)' }}>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm font-semibold">🇧🇷 Posição do Bortoleto</span>
              <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>4 pts se acertar</span>
            </div>
            <div className="no-scrollbar flex flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible" style={{ gap: '5px', paddingBottom: '4px' }}>
              {BORTOLETO_POSITIONS.map(pos => {
                const sel = bortoletoPos === pos
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setBortoletoPos(sel ? '' : pos)}
                    style={{
                      flexShrink: 0, width: '40px', height: '40px', borderRadius: '4px',
                      border: `2px solid ${sel ? 'var(--f1-red)' : 'rgba(255,255,255,0.08)'}`,
                      background: sel ? 'rgba(232,0,45,0.15)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer', fontWeight: 900, fontSize: '0.75rem',
                      color: sel ? 'white' : 'var(--f1-muted)',
                    }}
                  >
                    P{pos}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {race.challenge_question && race.challenge_options && (
        <div className="card p-5" style={{ border: '1px solid rgba(255,192,0,0.3)', background: 'rgba(255,192,0,0.04)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">⚡</span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-gold)' }}>Desafio da Rodada</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,192,0,0.15)', color: 'var(--f1-gold)', border: '1px solid rgba(255,192,0,0.3)' }}>+1 pt</span>
          </div>
          <p className="font-bold text-white text-sm mb-3">{race.challenge_question}</p>
          <div className="flex flex-wrap gap-2">
            {race.challenge_options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setChallengeAnswer(opt)}
                className="px-4 py-2 rounded text-sm font-bold transition-all"
                style={{
                  background: challengeAnswer === opt ? 'var(--f1-gold)' : 'rgba(255,192,0,0.08)',
                  color: challengeAnswer === opt ? '#000' : 'var(--f1-gold)',
                  border: `1px solid ${challengeAnswer === opt ? 'var(--f1-gold)' : 'rgba(255,192,0,0.3)'}`,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm font-medium px-1" style={{ color: 'var(--f1-red)' }}>{error}</p>
      )}

      {/* Sticky submit button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-30" style={{ background: 'linear-gradient(to top, var(--f1-dark) 70%, transparent)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <button type="submit" className="btn-primary w-full" disabled={loading} style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
          {loading ? 'Salvando...' : existing ? 'Atualizar palpite' : 'Enviar palpite'}
        </button>
      </div>
    </form>
  )
}
