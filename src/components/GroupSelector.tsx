'use client'

export interface GroupInfo {
  id: string
  name: string
  memberIds: string[]
}

interface Props {
  groups: GroupInfo[]
  value: string // 'geral' | groupId
  onChange: (val: string) => void
  className?: string
}

export default function GroupSelector({ groups, value, onChange, className }: Props) {
  if (groups.length === 0) return null

  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 ${className ?? ''}`} style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => onChange('geral')}
        className="flex-shrink-0 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-all"
        style={{
          background: value === 'geral' ? 'var(--f1-red)' : 'rgba(255,255,255,0.05)',
          color: value === 'geral' ? 'white' : 'var(--f1-muted)',
          border: `1px solid ${value === 'geral' ? 'var(--f1-red)' : 'var(--f1-border)'}`,
        }}
      >
        🌍 Geral
      </button>
      {groups.map(g => (
        <button
          key={g.id}
          onClick={() => onChange(g.id)}
          className="flex-shrink-0 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-all"
          style={{
            background: value === g.id ? 'var(--f1-red)' : 'rgba(255,255,255,0.05)',
            color: value === g.id ? 'white' : 'var(--f1-muted)',
            border: `1px solid ${value === g.id ? 'var(--f1-red)' : 'var(--f1-border)'}`,
            maxWidth: '9rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={g.name}
        >
          {g.name}
        </button>
      ))}
    </div>
  )
}
