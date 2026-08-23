'use client'

import Link from 'next/link'
import type { Race } from '@/lib/types/database'
import { getRaceFlag, getCircuitInfo } from '@/lib/circuitData'

// Faixa de cabeçalho das páginas de corrida: full-bleed, listras vermelhas no
// canto superior esquerdo e o traçado do circuito esmaecido à direita.
export default function RaceHero({ race, dateLabel }: { race: Race; dateLabel: string }) {
  const info = getCircuitInfo(race.name, race.circuit)

  return (
    <div
      className="full-bleed -mt-8 mb-6 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 30% 0%, #1a1016 0%, #101018 45%, #0d0d14 100%)',
        borderBottom: '1px solid var(--f1-border)',
      }}
    >
      {/* Listras diagonais no canto superior esquerdo */}
      <div
        aria-hidden
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: '220px',
          height: '110px',
          background: 'repeating-linear-gradient(-60deg, var(--f1-red) 0px, var(--f1-red) 14px, #b00022 14px, #b00022 18px, transparent 18px, transparent 36px)',
          clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          opacity: 0.9,
        }}
      />

      {/* Traçado do circuito esmaecido à direita */}
      {info && (
        <img
          src={`/circuits/${info._key}.svg`}
          alt=""
          aria-hidden
          className="absolute pointer-events-none hidden sm:block"
          style={{ right: '4%', top: '50%', transform: 'translateY(-50%)', height: '85%', opacity: 0.14 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}

      <div className="container mx-auto max-w-6xl px-4 pt-10 pb-8 relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--f1-muted)' }}>
            <span>Corrida</span>
            <span style={{ color: 'var(--f1-red)' }}>•</span>
            <span>Rodada {race.round_number}</span>
          </div>
          <Link
            href="/dashboard"
            className="flex-shrink-0 text-xs font-black uppercase px-4 py-2 rounded"
            style={{ border: '1px solid var(--f1-border-light)', color: 'white', letterSpacing: '0.12em', background: 'rgba(255,255,255,0.03)' }}
          >
            ← Voltar
          </Link>
        </div>

        <h1 className="flex items-center gap-3 text-3xl sm:text-4xl font-black text-white leading-tight mb-1.5">
          <span aria-hidden>{getRaceFlag(race.name, race.circuit)}</span>
          {race.name}
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--f1-muted)' }}>
          {race.circuit} • {dateLabel}
        </p>

        {race.random_position && (
          <div
            className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold"
            style={{ border: '1px solid rgba(232,0,45,0.45)', background: 'rgba(232,0,45,0.1)', color: 'var(--f1-red)' }}
          >
            🎲 Posição aleatória da rodada: <strong className="font-black">P{race.random_position}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
