'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Race, Driver, Prediction } from '@/lib/types/database'
import { getTeamColor } from '@/lib/teamColors'

interface Props {
  race: Race
  drivers: Driver[]
  existing?: Prediction
  userId: string
}

const BORTOLETO_POSITIONS = Array.from({ length: 22 }, (_, i) => i + 1)

// Cabeçalho de seção: ícone + rótulo à esquerda, pontuação à direita
function SectionHeader({ icon, label, points }: { icon: string; label: string; points: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <span className="text-sm font-black text-white flex items-center gap-2">
        <span aria-hidden>{icon}</span> {label}
      </span>
      <span className="text-xs flex-shrink-0 flex items-center gap-1.5" style={{ color: 'var(--f1-muted)' }}>
        <span style={{ color: 'var(--f1-red)', fontSize: '0.5rem' }} aria-hidden>●</span>
        {points}
      </span>
    </div>
  )
}

// Grade de chips de piloto: número em cima, sigla embaixo, cor da equipe na base
function DriverGrid({
  drivers,
  value,
  onChange,
  disabledIds,
}: {
  drivers: Driver[]
  value: string
  onChange: (v: string) => void
  disabledIds?: Set<string>
}) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}
    >
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
              paddingTop: '7px', paddingBottom: '10px',
              borderRadius: '6px', textAlign: 'center', position: 'relative', overflow: 'hidden',
              border: `1px solid ${sel ? 'var(--f1-red)' : disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)'}`,
              background: sel ? 'rgba(232,0,45,0.18)' : disabled ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.04)',
              boxShadow: sel ? '0 0 0 1px var(--f1-red)' : 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.35 : 1,
              minHeight: '52px',
            }}
          >
            <div style={{ fontSize: '0.6rem', color: 'var(--f1-muted)', fontWeight: 700, lineHeight: 1 }}>#{d.number}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white', lineHeight: 1.3, marginTop: '3px' }}>
              {d.abbreviation}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: getTeamColor(d.team) }} />
          </button>
        )
      })}
    </div>
  )
}

// Pódio decorativo do card de desafio
function PodiumGraphic() {
  return (
    <svg width="150" height="86" viewBox="0 0 150 86" aria-hidden className="flex-shrink-0 hidden sm:block">
      <text x="75" y="18" textAnchor="middle" fontSize="16">🏆</text>
      {/* blocos 2 · 1 · 3 */}
      <rect x="8"   y="46" width="42" height="34" rx="3" fill="rgba(255,192,0,0.06)" stroke="rgba(255,192,0,0.5)" />
      <rect x="54"  y="28" width="42" height="52" rx="3" fill="rgba(255,192,0,0.1)"  stroke="var(--f1-gold)" />
      <rect x="100" y="54" width="42" height="26" rx="3" fill="rgba(255,192,0,0.06)" stroke="rgba(255,192,0,0.5)" />
      <text x="29"  y="68" textAnchor="middle" fontSize="15" fontWeight="900" fill="var(--f1-gold)">2</text>
      <text x="75"  y="60" textAnchor="middle" fontSize="19" fontWeight="900" fill="var(--f1-gold)">1</text>
      <text x="121" y="74" textAnchor="middle" fontSize="13" fontWeight="900" fill="rgba(255,192,0,0.7)">3</text>
    </svg>
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

      {/* Card principal de palpites */}
      <div
        className="rounded overflow-hidden"
        style={{
          border: '1px solid rgba(232,0,45,0.25)',
          background: 'linear-gradient(160deg, rgba(60,10,20,0.55) 0%, rgba(26,26,39,0.9) 45%, var(--f1-card) 100%)',
        }}
      >
        <div className="p-5 sm:p-6">
          <h2 className="font-black text-lg mb-6 flex items-center gap-2 text-white">
            <span aria-hidden>🏆</span> Seus Palpites
          </h2>

          <div className="flex flex-col gap-7">
            <div>
              <SectionHeader icon="🏁" label="Pole Position" points="2 pts se acertar" />
              <DriverGrid drivers={drivers} value={pole} onChange={setPole} />
            </div>

            <div>
              <SectionHeader icon="🥇" label="1° lugar" points="3 pts se acertar · 1 pt no pódio" />
              <DriverGrid drivers={drivers} value={p1} onChange={setP1} disabledIds={podiumDisabled([p2, p3])} />
            </div>

            <div>
              <SectionHeader icon="🥈" label="2° lugar" points="3 pts se acertar · 1 pt no pódio" />
              <DriverGrid drivers={drivers} value={p2} onChange={setP2} disabledIds={podiumDisabled([p1, p3])} />
            </div>

            <div>
              <SectionHeader icon="🥉" label="3° lugar" points="3 pts se acertar · 1 pt no pódio" />
              <DriverGrid drivers={drivers} value={p3} onChange={setP3} disabledIds={podiumDisabled([p1, p2])} />
            </div>

            {race.random_position && (
              <div>
                <SectionHeader icon="🎲" label={`Posição aleatória — P${race.random_position}`} points="4 pts se acertar" />
                <DriverGrid drivers={drivers} value={randomDriver} onChange={setRandomDriver} />
              </div>
            )}

            <div>
              <SectionHeader icon="🇧🇷" label="Posição do Bortoleto" points="4 pts se acertar" />
              <div
                className="grid"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: '8px' }}
              >
                {BORTOLETO_POSITIONS.map(pos => {
                  const sel = bortoletoPos === pos
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setBortoletoPos(sel ? '' : pos)}
                      aria-pressed={sel}
                      style={{
                        height: '38px', borderRadius: '6px',
                        border: `1px solid ${sel ? 'var(--f1-red)' : 'rgba(255,255,255,0.1)'}`,
                        background: sel ? 'rgba(232,0,45,0.18)' : 'rgba(255,255,255,0.04)',
                        boxShadow: sel ? '0 0 0 1px var(--f1-red)' : 'none',
                        cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem',
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
      </div>

      {/* Desafio da rodada */}
      {race.challenge_question && race.challenge_options && (
        <div
          className="rounded p-5 flex items-center gap-5"
          style={{ border: '1px solid rgba(255,192,0,0.35)', background: 'rgba(255,192,0,0.04)' }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-base" aria-hidden>⚡</span>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--f1-gold)' }}>Desafio da Rodada</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,192,0,0.15)', color: 'var(--f1-gold)', border: '1px solid rgba(255,192,0,0.3)' }}>+1 pt</span>
            </div>
            <p className="font-bold text-white text-sm mb-3">{race.challenge_question}</p>
            <div className="flex flex-wrap gap-2">
              {race.challenge_options.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setChallengeAnswer(opt)}
                  aria-pressed={challengeAnswer === opt}
                  className="px-5 py-2 rounded text-sm font-bold transition-all"
                  style={{
                    minWidth: '4rem',
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
          <PodiumGraphic />
        </div>
      )}

      {error && (
        <p className="text-sm font-medium px-1" style={{ color: 'var(--f1-red)' }}>{error}</p>
      )}

      {/* Sticky submit button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-30" style={{ background: 'linear-gradient(to top, var(--f1-dark) 70%, transparent)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="container mx-auto max-w-6xl">
          <button type="submit" className="btn-primary w-full" disabled={loading} style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
            {loading ? 'Salvando...' : existing ? 'Atualizar palpite' : 'Enviar palpite'}
          </button>
        </div>
      </div>
    </form>
  )
}
