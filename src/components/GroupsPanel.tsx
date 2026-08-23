'use client'

import { useState } from 'react'

interface Group {
  id: string
  name: string
  code: string
  memberCount: number
}

interface Props {
  groups: Group[]
  onClose: () => void
  onGroupJoined: (group: Omit<Group, 'memberCount'>, memberIds: string[]) => void
  onGroupCreated: (group: Omit<Group, 'memberCount'>) => void
}

export default function GroupsPanel({ groups, onClose, onGroupJoined, onGroupCreated }: Props) {
  const [tab, setTab] = useState<'mine' | 'join' | 'create'>('mine')
  const [joinCode, setJoinCode] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleJoin() {
    if (!joinCode.trim()) return
    setError(''); setSuccess(''); setLoading(true)
    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinCode }),
    })
    const data = await res.json()
    setLoading(false)
    if (!data.ok) { setError(data.error); return }
    setSuccess(`Você entrou no grupo "${data.group.name}"!`)
    setJoinCode('')
    onGroupJoined({ id: data.group.id, name: data.group.name, code: data.group.code }, data.memberIds ?? [])
  }

  async function handleCreate() {
    if (!newGroupName.trim()) return
    setError(''); setSuccess(''); setLoading(true)
    const res = await fetch('/api/groups/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName }),
    })
    const data = await res.json()
    setLoading(false)
    if (!data.ok) { setError(data.error); return }
    setSuccess(`Grupo "${data.group.name}" criado! Código: ${data.group.code}`)
    setNewGroupName('')
    onGroupCreated({ id: data.group.id, name: data.group.name, code: data.group.code })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-md flex flex-col overflow-hidden" style={{ borderRadius: '4px', maxHeight: '85vh' }}>
        <div className="striped-accent-thick" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--f1-border)' }}>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--f1-red)' }}>Grupos</div>
            <div className="font-black text-white">Gerencie seus grupos</div>
          </div>
          <button onClick={onClose} className="text-xl font-bold" style={{ color: 'var(--f1-muted)' }}>✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--f1-border)' }}>
          {([
            { key: 'mine', label: 'Meus grupos' },
            { key: 'join', label: 'Entrar' },
            { key: 'create', label: 'Criar' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(''); setSuccess('') }}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
              style={{
                color: tab === t.key ? 'white' : 'var(--f1-muted)',
                borderBottom: tab === t.key ? '2px solid var(--f1-red)' : '2px solid transparent',
                background: 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">

          {/* My groups */}
          {tab === 'mine' && (
            <div className="flex flex-col gap-3">
              {groups.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'var(--f1-muted)' }}>
                  Você não faz parte de nenhum grupo ainda.
                </p>
              ) : groups.map(g => (
                <div key={g.id} className="card p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white">{g.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
                      {g.memberCount} {g.memberCount === 1 ? 'membro' : 'membros'}
                    </div>
                  </div>
                  <button
                    onClick={() => copyCode(g.code)}
                    className="flex flex-col items-center gap-0.5 px-3 py-2 rounded transition-all"
                    style={{
                      background: copied === g.code ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${copied === g.code ? 'rgba(34,197,94,0.4)' : 'var(--f1-border)'}`,
                    }}
                  >
                    <span
                      className="font-black tracking-widest"
                      style={{ fontSize: '1rem', color: copied === g.code ? '#22c55e' : 'var(--f1-gold)', letterSpacing: '0.15em' }}
                    >
                      {g.code}
                    </span>
                    <span className="text-xs" style={{ color: copied === g.code ? '#22c55e' : 'var(--f1-muted)' }}>
                      {copied === g.code ? '✓ copiado' : 'copiar código'}
                    </span>
                  </button>
                </div>
              ))}
              <p className="text-xs text-center pt-2" style={{ color: 'var(--f1-muted)' }}>
                Compartilhe o código com seus amigos para eles entrarem no grupo.
              </p>
            </div>
          )}

          {/* Join group */}
          {tab === 'join' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: 'var(--f1-muted)' }}>
                Insira o código de 5 caracteres que seu amigo compartilhou com você.
              </p>
              <input
                className="input-field text-center font-black tracking-widest"
                style={{ fontSize: '1.25rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}
                placeholder="EX: RACE5"
                maxLength={5}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
              {error && <p className="text-sm" style={{ color: 'var(--f1-red)' }}>{error}</p>}
              {success && <p className="text-sm" style={{ color: '#22c55e' }}>{success}</p>}
              <button
                onClick={handleJoin}
                className="btn-primary w-full"
                disabled={loading || joinCode.length < 5}
              >
                {loading ? 'Entrando...' : 'Entrar no grupo'}
              </button>
            </div>
          )}

          {/* Create group */}
          {tab === 'create' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: 'var(--f1-muted)' }}>
                Crie um grupo e compartilhe o código com seus amigos.
              </p>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--f1-muted)' }}>
                  Nome do grupo
                </label>
                <input
                  className="input-field"
                  placeholder="Ex: Turma do Escritório"
                  maxLength={30}
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              {error && <p className="text-sm" style={{ color: 'var(--f1-red)' }}>{error}</p>}
              {success && (
                <div className="p-3 rounded" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <p className="text-sm font-bold" style={{ color: '#22c55e' }}>{success}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--f1-muted)' }}>Vá em &quot;Meus grupos&quot; para copiar o código.</p>
                </div>
              )}
              <button
                onClick={handleCreate}
                className="btn-primary w-full"
                disabled={loading || newGroupName.trim().length < 2}
              >
                {loading ? 'Criando...' : 'Criar grupo'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
