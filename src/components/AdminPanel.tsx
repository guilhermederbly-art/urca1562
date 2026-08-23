'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Race, Driver } from '@/lib/types/database'

interface UserRow {
  id: string
  username: string
  email: string
  created_at: string
  last_seen_at: string | null
}

interface GroupRow {
  id: string
  name: string
  code: string
  created_at: string
  memberCount: number
}

interface Props {
  races: Race[]
  drivers: Driver[]
  users: UserRow[]
  groups: GroupRow[]
  openRaceName?: string
  predictedUserIds?: string[]
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Em breve',
  open: 'Aberta',
  closed: 'Fechada',
  finished: 'Finalizada',
}

export default function AdminPanel({ races, drivers, users, groups, openRaceName, predictedUserIds = [] }: Props) {
  const predictedSet = new Set(predictedUserIds)
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [challengeExpanded, setChallengeExpanded] = useState<string | null>(null)

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

  async function assignChallenge(raceId: string) {
    setLoading(raceId + '-assign')
    const res = await fetch('/api/races/assign-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raceId }),
    })
    const data = await res.json()
    setMessage(res.ok ? `✅ Desafio atribuído: "${data.challenge?.question}"` : `❌ ${data.error}`)
    setLoading(null)
    router.refresh()
  }

  async function setChallenge(raceId: string, correctAnswer: string) {
    setLoading(raceId + '-challenge')
    const res = await fetch('/api/races/set-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raceId, correctAnswer }),
    })
    const data = await res.json()
    setMessage(res.ok ? `✅ Resposta do desafio registrada: "${correctAnswer}"` : `❌ ${data.error}`)
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
  // Corridas ativas (não finalizadas)
  const visibleRaces = races.filter(r =>
    r.status !== 'finished' && new Date(r.race_start_time) >= now
  )
  // Corridas finalizadas nos últimos 14 dias (para re-importar se necessário)
  const recentFinishedRaces = races.filter(r => {
    if (r.status !== 'finished') return false
    const daysSince = (now.getTime() - new Date(r.race_start_time).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince <= 14
  })
  // Corridas finalizadas com desafio sem resposta definida
  const pendingChallengeRaces = races.filter(r =>
    r.challenge_question && !r.challenge_correct
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

        <div>
          {visibleRaces.map(race => (
            <div key={race.id} className="border-b last:border-0" style={{ borderColor: 'var(--f1-border)' }}>
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="font-bold">{race.round_number}. {race.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
                    {race.circuit} · {format(new Date(race.race_start_time), "dd/MM/yyyy", { locale: ptBR })} ·{' '}
                    <span className="font-semibold">{STATUS_LABEL[race.status]}</span>
                    {race.random_position && ` · P${race.random_position} aleatória`}
                  </div>
                  {race.challenge_question && (
                    <div className="mt-1.5 text-xs" style={{ color: 'rgba(255,192,0,0.8)' }}>
                      ⚡ {race.challenge_question}
                      {race.challenge_correct && <span className="ml-1 font-bold">→ {race.challenge_correct}</span>}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {race.status === 'upcoming' && (
                    <button
                      onClick={() => openPredictions(race.id)}
                      className="text-xs px-3 py-1.5 rounded font-bold border"
                      style={{ borderColor: '#22c55e', color: '#22c55e' }}
                      disabled={!!loading}
                    >
                      {loading === race.id + '-open' ? '...' : '▶ Abrir palpites'}
                    </button>
                  )}
                  {race.status === 'open' && !race.challenge_question && (
                    <button
                      onClick={() => assignChallenge(race.id)}
                      className="text-xs px-3 py-1.5 rounded font-bold border"
                      style={{ borderColor: 'rgba(255,192,0,0.6)', color: 'rgba(255,192,0,0.9)' }}
                      disabled={!!loading}
                    >
                      {loading === race.id + '-assign' ? '...' : '⚡ Atribuir desafio'}
                    </button>
                  )}
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
                  {race.status === 'closed' && race.challenge_question && !race.challenge_correct && (
                    <button
                      onClick={() => setChallengeExpanded(challengeExpanded === race.id ? null : race.id)}
                      className="text-xs px-3 py-1.5 rounded font-bold border"
                      style={{ borderColor: 'rgba(255,192,0,0.6)', color: 'rgba(255,192,0,0.9)' }}
                      disabled={!!loading}
                    >
                      ⚡ Definir resposta
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

              {/* Challenge answer panel */}
              {challengeExpanded === race.id && race.challenge_options && (
                <div className="px-5 pb-4 pt-1">
                  <p className="text-xs mb-2" style={{ color: 'var(--f1-muted)' }}>Qual foi a resposta correta?</p>
                  <div className="flex flex-wrap gap-2">
                    {race.challenge_options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setChallenge(race.id, opt); setChallengeExpanded(null) }}
                        className="text-xs px-3 py-1.5 rounded font-bold border"
                        style={{ borderColor: 'rgba(255,192,0,0.5)', color: 'rgba(255,192,0,0.9)', background: 'rgba(255,192,0,0.08)' }}
                        disabled={loading === race.id + '-challenge'}
                      >
                        {loading === race.id + '-challenge' ? '...' : opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {visibleRaces.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: 'var(--f1-muted)' }}>Nenhuma corrida ativa.</p>
          )}
        </div>
      </div>

      {/* Corridas recentes finalizadas */}
      {recentFinishedRaces.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--f1-border)' }}>
            <h2 className="font-bold">Corridas recentes</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
              Re-importe resultados se a pontuação estiver incorreta ou zerada.
            </p>
          </div>
          <div>
            {recentFinishedRaces.map(race => (
              <div key={race.id} className="border-b last:border-0 px-5 py-4 flex items-start gap-4" style={{ borderColor: 'var(--f1-border)' }}>
                <div className="flex-1">
                  <div className="font-bold">{race.round_number}. {race.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
                    {format(new Date(race.race_start_time), "dd/MM/yyyy", { locale: ptBR })}
                    {race.challenge_question && (
                      <span className="ml-2" style={{ color: 'rgba(255,192,0,0.8)' }}>
                        ⚡ {race.challenge_question}
                        {race.challenge_correct && <span className="font-bold"> → {race.challenge_correct}</span>}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {race.challenge_question && !race.challenge_correct && (
                    <button
                      onClick={() => setChallengeExpanded(challengeExpanded === race.id ? null : race.id)}
                      className="text-xs px-3 py-1.5 rounded font-bold border"
                      style={{ borderColor: 'rgba(255,192,0,0.6)', color: 'rgba(255,192,0,0.9)' }}
                      disabled={!!loading}
                    >
                      ⚡ Definir resposta
                    </button>
                  )}
                  <button
                    onClick={() => fetchResults(race.id)}
                    className="text-xs px-3 py-1.5 rounded font-bold border"
                    style={{ borderColor: '#22c55e', color: '#22c55e' }}
                    disabled={!!loading}
                  >
                    {loading === race.id + '-results' ? 'Importando...' : '↻ Re-importar resultados'}
                  </button>
                </div>
                {challengeExpanded === race.id && race.challenge_options && (
                  <div className="w-full mt-2">
                    <p className="text-xs mb-2" style={{ color: 'var(--f1-muted)' }}>Qual foi a resposta correta?</p>
                    <div className="flex flex-wrap gap-2">
                      {race.challenge_options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setChallenge(race.id, opt); setChallengeExpanded(null) }}
                          className="text-xs px-3 py-1.5 rounded font-bold border"
                          style={{ borderColor: 'rgba(255,192,0,0.5)', color: 'rgba(255,192,0,0.9)', background: 'rgba(255,192,0,0.08)' }}
                          disabled={loading === race.id + '-challenge'}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desafios pendentes */}
      {pendingChallengeRaces.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--f1-border)' }}>
            <h2 className="font-bold">⚡ Desafios pendentes</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
              Defina a resposta correta para recalcular a pontuação.
            </p>
          </div>
          <div>
            {pendingChallengeRaces.map(race => (
              <div key={race.id} className="border-b last:border-0" style={{ borderColor: 'var(--f1-border)' }}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm">{race.round_number}. {race.name}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--f1-gold)' }}>
                        ⚡ {race.challenge_question}
                      </div>
                    </div>
                    <button
                      onClick={() => setChallengeExpanded(challengeExpanded === race.id ? null : race.id)}
                      className="text-xs px-3 py-1.5 rounded font-bold border flex-shrink-0"
                      style={{ borderColor: 'rgba(255,192,0,0.6)', color: 'rgba(255,192,0,0.9)' }}
                      disabled={!!loading}
                    >
                      {challengeExpanded === race.id ? 'Cancelar' : '⚡ Definir resposta'}
                    </button>
                  </div>
                  {challengeExpanded === race.id && race.challenge_options && (
                    <div className="mt-3">
                      <p className="text-xs mb-2" style={{ color: 'var(--f1-muted)' }}>Qual foi a resposta correta?</p>
                      <div className="flex flex-wrap gap-2">
                        {race.challenge_options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setChallenge(race.id, opt); setChallengeExpanded(null) }}
                            className="text-xs px-3 py-1.5 rounded font-bold border"
                            style={{ borderColor: 'rgba(255,192,0,0.5)', color: 'rgba(255,192,0,0.9)', background: 'rgba(255,192,0,0.08)' }}
                            disabled={loading === race.id + '-challenge'}
                          >
                            {loading === race.id + '-challenge' ? '...' : opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ferramentas */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--f1-border)' }}>
          <h2 className="font-bold">Ferramentas</h2>
        </div>
        <div className="px-5 py-4 flex flex-wrap gap-3">
          <button
            onClick={async () => {
              setLoading('sync-sessions')
              const res = await fetch('/api/admin/sync-sessions', { method: 'POST' })
              const data = await res.json()
              setMessage(res.ok
                ? data.updated > 0
                  ? `✅ ${data.updated} corrida(s) sincronizada(s): ${data.races.join(' | ')}`
                  : `✅ ${data.message}`
                : `❌ ${data.error}`)
              setLoading(null)
              router.refresh()
            }}
            className="text-xs px-4 py-2 rounded font-bold border"
            style={{ borderColor: '#22c55e', color: '#22c55e' }}
            disabled={!!loading}
          >
            {loading === 'sync-sessions' ? 'Sincronizando...' : '🔗 Sync session keys OpenF1'}
          </button>
        </div>
      </div>

      {/* Users */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--f1-border)' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">
              Usuários <span className="text-xs font-normal ml-1" style={{ color: 'var(--f1-muted)' }}>({users.length})</span>
            </h2>
            {openRaceName && (
              <div className="text-xs" style={{ color: 'var(--f1-muted)' }}>
                <span className="font-semibold text-white">{predictedUserIds.length}</span>/{users.length} palpitaram · {openRaceName}
              </div>
            )}
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--f1-border)' }}>
          {users.map(u => {
            const hasPredicted = predictedSet.has(u.id)
            return (
            <div key={u.id} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{u.username}</span>
                  {openRaceName && (
                    hasPredicted
                      ? <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>✓ Palpitou</span>
                      : <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}>⏳ Pendente</span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>{u.email}</div>
              </div>
              <div className="text-right text-xs flex-shrink-0" style={{ color: 'var(--f1-muted)' }}>
                <div>desde {format(new Date(u.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                {u.last_seen_at ? (
                  <div className="mt-0.5 font-semibold" style={{ color: 'white' }} title={format(new Date(u.last_seen_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}>
                    {formatDistanceToNow(new Date(u.last_seen_at), { locale: ptBR, addSuffix: true })}
                  </div>
                ) : (
                  <div className="mt-0.5">nunca acessou</div>
                )}
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
          )})}
          {users.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: 'var(--f1-muted)' }}>Nenhum usuário cadastrado.</p>
          )}
        </div>
      </div>

      {/* ── Grupos ─────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--f1-border)' }}>
          <h2 className="font-bold">
            Grupos <span className="text-xs font-normal ml-1" style={{ color: 'var(--f1-muted)' }}>({groups.length})</span>
          </h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--f1-border)' }}>
          {groups.map(g => (
            <div key={g.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white">{g.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
                  {g.memberCount} {g.memberCount === 1 ? 'membro' : 'membros'} · criado em {format(new Date(g.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              </div>
              <span
                className="font-black tracking-widest flex-shrink-0"
                style={{ color: 'var(--f1-gold)', letterSpacing: '0.15em', fontSize: '1rem' }}
              >
                {g.code}
              </span>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: 'var(--f1-muted)' }}>Nenhum grupo criado ainda.</p>
          )}
        </div>
      </div>

    </div>
  )
}
