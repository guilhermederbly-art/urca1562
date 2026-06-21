'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Race, Driver } from '@/lib/types/database'

interface UserRow {
  id: string
  username: string
  email: string
  created_at: string
}

interface Props {
  races: Race[]
  drivers: Driver[]
  users: UserRow[]
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Em breve',
  open: 'Aberta',
  closed: 'Fechada',
  finished: 'Finalizada',
}

export default function AdminPanel({ races, drivers, users }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function openPredictions(raceId: string) {
    setLoading(raceId + '-open')
    const res = await fetch('/api/races/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raceId }),
    })
    const data = await res.json()
    setMessage(res.ok ? `✅ Palpites abertos! Posição aleatória: P${data.randomPosition}` : `❌ ${data.error}`)
    setLoading(null)
    router.refresh()
  }

  async function closePredictions(raceId: string) {
    setLoading(raceId + '-close')
    const res = await fetch('/api/races/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raceId }),
    })
    const data = await res.json()
    setMessage(res.ok ? '✅ Palpites fechados.' : `❌ ${data.error}`)
    setLoading(null)
    router.refresh()
  }

  async function fetchResults(raceId: string) {
    setLoading(raceId + '-results')
    setMessage('Buscando resultados via OpenF1...')
    const res = await fetch('/api/races/fetch-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raceId }),
    })
    const data = await res.json()
    setMessage(res.ok ? '✅ Resultados importados e pontuação calculada!' : `❌ ${data.error}`)
    setLoading(null)
    router.refresh()
  }

  async function reopenPredictions(raceId: string) {
    setLoading(raceId + '-reopen')
    const res = await fetch('/api/races/reopen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raceId }),
    })
    const data = await res.json()
    setMessage(res.ok ? '✅ Palpites reabertos!' : `❌ ${data.error}`)
    setLoading(null)
    router.refresh()
  }

  async function deleteUser(userId: string) {
    setLoading('del-' + userId)
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    setMessage(res.ok ? '✅ Usuário excluído.' : `❌ ${data.error}`)
    setConfirmDelete(null)
    setLoading(null)
    router.refresh()
  }

  const now = new Date()
  // Oculta corridas já passadas (pela data) ou finalizadas
  const visibleRaces = races.filter(r =>
    r.status !== 'finished' && new Date(r.race_start_time) >= now
  )

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <div className="card p-4 text-sm font-medium"
          style={{ borderColor: message.startsWith('✅') ? '#22c55e' : 'var(--f1-red)', color: message.startsWith('✅') ? '#22c55e' : 'var(--f1-red)' }}>
          {message}
        </div>
      )}

      {/* Races list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--f1-border)' }}>
          <h2 className="font-bold">Corridas</h2>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--f1-border)' }}>
          {visibleRaces.map(race => (
            <div key={race.id} className="px-5 py-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="font-bold">{race.round_number}. {race.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
                  {race.circuit} · {format(new Date(race.race_start_time), "dd/MM/yyyy", { locale: ptBR })} ·{' '}
                  <span className="font-semibold">{STATUS_LABEL[race.status]}</span>
                  {race.random_position && ` · P${race.random_position} aleatória`}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                {race.status === 'open' && (
                  <button
                    onClick={() => closePredictions(race.id)}
                    className="text-xs px-3 py-1.5 rounded font-bold border"
                    style={{ borderColor: '#f97316', color: '#f97316' }}
                    disabled={!!loading}
                  >
                    {loading === race.id + '-close' ? '...' : 'Fechar palpites'}
                  </button>
                )}
                {race.status === 'closed' && (
                  <button
                    onClick={() => reopenPredictions(race.id)}
                    className="text-xs px-3 py-1.5 rounded font-bold border"
                    style={{ borderColor: '#a78bfa', color: '#a78bfa' }}
                    disabled={!!loading}
                  >
                    {loading === race.id + '-reopen' ? '...' : '↩ Reabrir palpites'}
                  </button>
                )}
                {race.status === 'closed' && (
                  <button
                    onClick={() => fetchResults(race.id)}
                    className="text-xs px-3 py-1.5 rounded font-bold border"
                    style={{ borderColor: '#22c55e', color: '#22c55e' }}
                    disabled={!!loading}
                  >
                    {loading === race.id + '-results' ? 'Buscando...' : 'Importar resultados'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {visibleRaces.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: 'var(--f1-muted)' }}>Nenhuma corrida ativa.</p>
          )}
        </div>
      </div>

      {/* Users */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--f1-border)' }}>
          <h2 className="font-bold">Usuários <span className="text-xs font-normal ml-1" style={{ color: 'var(--f1-muted)' }}>({users.length})</span></h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--f1-border)' }}>
          {users.map(u => (
            <div key={u.id} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-bold text-sm">{u.username}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>{u.email}</div>
              </div>
              <div className="text-xs flex-shrink-0" style={{ color: 'var(--f1-muted)' }}>
                {format(new Date(u.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              {confirmDelete === u.id ? (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="text-xs px-3 py-1.5 rounded font-bold"
                    style={{ background: 'var(--f1-red)', color: 'white' }}
                    disabled={loading === 'del-' + u.id}
                  >
                    {loading === 'del-' + u.id ? '...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(u.id)}
                  className="text-xs px-3 py-1.5 rounded font-bold border flex-shrink-0"
                  style={{ borderColor: 'var(--f1-red)', color: 'var(--f1-red)' }}
                  disabled={!!loading}
                >
                  Excluir
                </button>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: 'var(--f1-muted)' }}>Nenhum usuário cadastrado.</p>
          )}
        </div>
      </div>

    </div>
  )
}
