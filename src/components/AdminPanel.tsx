'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Race, Driver } from '@/lib/types/database'

interface Props {
  races: Race[]
  drivers: Driver[]
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Em breve',
  open: 'Aberta',
  closed: 'Fechada',
  finished: 'Finalizada',
}

export default function AdminPanel({ races, drivers }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  // New race form
  const [showNewRace, setShowNewRace] = useState(false)
  const [newRace, setNewRace] = useState({
    round_number: '',
    name: '',
    circuit: '',
    country: '',
    qualifying_start_time: '',
    race_start_time: '',
    openf1_quali_session_key: '',
    openf1_race_session_key: '',
  })

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

  async function runAutomation() {
    setLoading('automation')
    setMessage('Executando automação...')
    const res = await fetch('/api/cron/update')
    const data = await res.json()
    if (res.ok) {
      const logText = data.log?.length ? data.log.join(' · ') : 'Nada a fazer no momento.'
      setMessage(`✅ ${logText}`)
    } else {
      setMessage(`❌ ${data.error}`)
    }
    setLoading(null)
    router.refresh()
  }

  async function importCalendar() {
    setLoading('import-calendar')
    setMessage('Buscando calendário 2026 via OpenF1...')
    const res = await fetch('/api/races/import-calendar', { method: 'POST' })
    const data = await res.json()
    setMessage(
      res.ok
        ? data.imported === 0
          ? '✅ Calendário já estava atualizado, nenhuma corrida nova.'
          : `✅ ${data.imported} corrida(s) importada(s) com sucesso!`
        : `❌ ${data.error}`
    )
    setLoading(null)
    router.refresh()
  }

  async function createRace(e: React.FormEvent) {
    e.preventDefault()
    setLoading('new-race')
    const res = await fetch('/api/races/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newRace,
        round_number: Number(newRace.round_number),
        openf1_quali_session_key: newRace.openf1_quali_session_key ? Number(newRace.openf1_quali_session_key) : null,
        openf1_race_session_key: newRace.openf1_race_session_key ? Number(newRace.openf1_race_session_key) : null,
      }),
    })
    const data = await res.json()
    setMessage(res.ok ? '✅ Corrida criada!' : `❌ ${data.error}`)
    setLoading(null)
    setShowNewRace(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <div className="card p-4 text-sm font-medium"
          style={{ borderColor: message.startsWith('✅') ? '#22c55e' : 'var(--f1-red)', color: message.startsWith('✅') ? '#22c55e' : 'var(--f1-red)' }}>
          {message}
        </div>
      )}

      {/* Automation */}
      <div className="card p-4 flex items-center justify-between gap-4">
        <div>
          <div className="font-bold text-sm">Automação</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
            Fecha palpites, importa resultados e abre a próxima rodada automaticamente
          </div>
        </div>
        <button
          onClick={runAutomation}
          className="btn-primary text-xs px-4 py-2 flex-shrink-0"
          disabled={!!loading}
        >
          {loading === 'automation' ? 'Executando...' : '⚡ Executar agora'}
        </button>
      </div>

      {/* Races list */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--f1-border)' }}>
          <h2 className="font-bold">Corridas</h2>
          <div className="flex gap-2">
            <button
              onClick={importCalendar}
              className="text-xs px-4 py-2 rounded font-bold border"
              style={{ borderColor: '#22c55e', color: '#22c55e' }}
              disabled={!!loading}
            >
              {loading === 'import-calendar' ? 'Importando...' : '🗓 Importar calendário 2026'}
            </button>
            <button onClick={() => setShowNewRace(!showNewRace)} className="btn-secondary text-xs px-4 py-2">
              + Manual
            </button>
          </div>
        </div>

        {showNewRace && (
          <form onSubmit={createRace} className="p-5 border-b flex flex-col gap-3" style={{ borderColor: 'var(--f1-border)' }}>
            <h3 className="font-bold text-sm">Nova Corrida</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { field: 'round_number', label: 'Rodada', type: 'number', placeholder: '1' },
                { field: 'country', label: 'País', type: 'text', placeholder: 'Bahrain' },
                { field: 'name', label: 'Nome', type: 'text', placeholder: 'Grande Prêmio do Bahrain' },
                { field: 'circuit', label: 'Circuito', type: 'text', placeholder: 'Sakhir' },
                { field: 'qualifying_start_time', label: 'Início do Q1', type: 'datetime-local', placeholder: '' },
                { field: 'race_start_time', label: 'Largada', type: 'datetime-local', placeholder: '' },
                { field: 'openf1_quali_session_key', label: 'OpenF1 Quali Key', type: 'number', placeholder: 'opcional' },
                { field: 'openf1_race_session_key', label: 'OpenF1 Race Key', type: 'number', placeholder: 'opcional' },
              ].map(({ field, label, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--f1-muted)' }}>{label}</label>
                  <input
                    type={type}
                    className="input-field text-sm"
                    placeholder={placeholder}
                    value={newRace[field as keyof typeof newRace]}
                    onChange={e => setNewRace(p => ({ ...p, [field]: e.target.value }))}
                    required={!['openf1_quali_session_key', 'openf1_race_session_key'].includes(field)}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <button type="submit" className="btn-primary text-xs px-4 py-2" disabled={loading === 'new-race'}>
                {loading === 'new-race' ? 'Criando...' : 'Criar corrida'}
              </button>
              <button type="button" onClick={() => setShowNewRace(false)} className="btn-secondary text-xs px-4 py-2">
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="divide-y" style={{ borderColor: 'var(--f1-border)' }}>
          {races.map(race => (
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
                {race.status === 'upcoming' && (
                  <button
                    onClick={() => openPredictions(race.id)}
                    className="btn-primary text-xs px-3 py-1.5"
                    disabled={!!loading}
                  >
                    {loading === race.id + '-open' ? '...' : 'Abrir palpites'}
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
                {(race.status === 'closed' || race.status === 'finished') && (
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
          {races.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: 'var(--f1-muted)' }}>Nenhuma corrida cadastrada.</p>
          )}
        </div>
      </div>

      {/* OpenF1 help */}
      <div className="card p-5 text-sm" style={{ borderColor: 'var(--f1-border)' }}>
        <h3 className="font-bold mb-2">Como obter as chaves OpenF1</h3>
        <ol className="flex flex-col gap-1 list-decimal list-inside" style={{ color: 'var(--f1-muted)' }}>
          <li>Acesse <code className="text-white">api.openf1.org/v1/sessions?year=2026</code></li>
          <li>Encontre a corrida pelo <code className="text-white">meeting_name</code> e <code className="text-white">country_name</code></li>
          <li>Copie o <code className="text-white">session_key</code> da sessão <strong className="text-white">Qualifying</strong> e da <strong className="text-white">Race</strong></li>
          <li>Insira os valores ao criar a corrida</li>
        </ol>
      </div>
    </div>
  )
}
