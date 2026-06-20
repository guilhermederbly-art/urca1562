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

const BORTOLETO_POSITIONS = Array.from({ length: 20 }, (_, i) => i + 1)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!pole || !p1 || !p2 || !p3 || !randomDriver || bortoletoPos === '') {
      setError('Preencha todos os campos antes de enviar.')
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

  const DriverSelect = ({
    label, value, onChange, excludeIds = [], description,
  }: {
    label: string; value: string; onChange: (v: string) => void
    excludeIds?: string[]; description?: string
  }) => (
    <div>
      <label className="block text-sm font-semibold mb-1.5">
        {label}
        {description && (
          <span className="ml-2 text-xs font-normal" style={{ color: 'var(--f1-muted)' }}>{description}</span>
        )}
      </label>
      <select
        className="input-field"
        value={value}
        onChange={e => onChange(e.target.value)}
        required
      >
        <option value="">Selecione um piloto</option>
        {drivers
          .filter(d => !excludeIds.includes(d.id) || d.id === value)
          .map(d => (
            <option key={d.id} value={d.id}>
              #{d.number} {d.name} — {d.team}
            </option>
          ))}
      </select>
    </div>
  )

  if (success) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-3">🏁</div>
        <h2 className="text-xl font-black mb-2">Palpite salvo!</h2>
        <p style={{ color: 'var(--f1-muted)' }} className="mb-4 text-sm">Seu palpite foi registrado com sucesso.</p>
        <button onClick={() => router.push('/')} className="btn-secondary">
          Voltar ao calendário
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="card p-5">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
          <span style={{ color: 'var(--f1-red)' }}>🏆</span> Seus Palpites
        </h2>

        <div className="flex flex-col gap-4">
          <DriverSelect
            label="Pole Position"
            description="2 pts se acertar"
            value={pole}
            onChange={setPole}
          />

          <div className="border-t pt-4" style={{ borderColor: 'var(--f1-border)' }}>
            <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--f1-muted)' }}>
              Pódio — 3 pts se cravar a posição · 1 pt se o piloto estiver no pódio
            </p>
            <div className="flex flex-col gap-3">
              <DriverSelect
                label="🥇 1° lugar"
                value={p1}
                onChange={setP1}
              />
              <DriverSelect
                label="🥈 2° lugar"
                value={p2}
                onChange={setP2}
              />
              <DriverSelect
                label="🥉 3° lugar"
                value={p3}
                onChange={setP3}
              />
            </div>
          </div>

          {race.random_position && (
            <div className="border-t pt-4" style={{ borderColor: 'var(--f1-border)' }}>
              <DriverSelect
                label={`🎲 Posição aleatória — P${race.random_position}`}
                description="3 pts se acertar"
                value={randomDriver}
                onChange={setRandomDriver}
              />
            </div>
          )}

          <div className="border-t pt-4" style={{ borderColor: 'var(--f1-border)' }}>
            <label className="block text-sm font-semibold mb-1.5">
              🇧🇷 Posição do Bortoleto
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--f1-muted)' }}>3 pts se acertar</span>
            </label>
            <select
              className="input-field"
              value={bortoletoPos}
              onChange={e => setBortoletoPos(e.target.value ? Number(e.target.value) : '')}
              required
            >
              <option value="">Selecione a posição</option>
              {BORTOLETO_POSITIONS.map(p => (
                <option key={p} value={p}>P{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium px-1" style={{ color: 'var(--f1-red)' }}>{error}</p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Salvando...' : existing ? 'Atualizar palpite' : 'Enviar palpite'}
      </button>
    </form>
  )
}
