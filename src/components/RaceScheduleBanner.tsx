'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Race } from '@/lib/types/database'

// Banner verde de palpites abertos + modal com o cronograma do fim de semana
export default function RaceScheduleBanner({ race }: { race: Race }) {
  const [open, setOpen] = useState(false)
  const deadline = race.fp1_start_time ?? race.qualifying_start_time

  const sessions = [
    { label: 'Treino Livre 1', time: race.fp1_start_time },
    { label: 'Classificação', time: race.qualifying_start_time },
    { label: 'Corrida', time: race.race_start_time },
  ].filter((s): s is { label: string; time: string } => !!s.time)

  return (
    <>
      <div
        className="mb-6 rounded flex items-center gap-3 px-4 py-3"
        style={{ border: '1px solid rgba(34,197,94,0.45)', background: 'rgba(34,197,94,0.07)' }}
      >
        <span
          className="flex items-center justify-center w-7 h-7 rounded flex-shrink-0 text-sm"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)' }}
          aria-hidden
        >
          ✅
        </span>
        <p className="text-sm flex-1 min-w-0" style={{ color: '#d8ffe6' }}>
          Palpites abertos até o início do FP1:{' '}
          <strong style={{ color: '#22c55e' }}>{format(new Date(deadline), 'dd/MM HH:mm', { locale: ptBR })}</strong>
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-shrink-0 text-xs font-black uppercase tracking-widest flex items-center gap-2"
          style={{ color: 'var(--f1-muted)' }}
        >
          <span aria-hidden>📅</span>
          <span className="hidden sm:inline">Ver cronograma</span>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="card w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden" style={{ borderRadius: '4px' }}>
            <div className="striped-accent-thick flex-shrink-0" />
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--f1-border)' }}>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--f1-red)' }}>Cronograma</div>
                <div className="font-black text-white">{race.name}</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-xl font-bold leading-none w-11 h-11 -mr-2" style={{ color: 'var(--f1-muted)' }} aria-label="Fechar">✕</button>
            </div>
            <div className="p-5 flex flex-col gap-3 overflow-y-auto">
              {sessions.map(s => (
                <div key={s.label} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--f1-border)' }}>
                  <span className="text-sm font-bold text-white">{s.label}</span>
                  <span className="text-sm" style={{ color: 'var(--f1-muted)' }}>
                    {format(new Date(s.time), "EEE dd/MM '·' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              ))}
              <p className="text-xs mt-1" style={{ color: 'var(--f1-muted)' }}>
                Horários no fuso do seu dispositivo. Os palpites fecham no início do FP1.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
