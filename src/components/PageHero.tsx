import type { ReactNode } from 'react'

// Faixa de cabeçalho padrão das telas internas: full-bleed, listras vermelhas
// no canto superior esquerdo, kicker vermelho, título grande em itálico.
// `right` é um slot opcional (card de destaque, ações) e `children` renderiza
// abaixo do título dentro da faixa (ex.: barra de progresso).
export default function PageHero({
  kicker = 'Temporada 2026',
  title,
  subtitle,
  right,
  children,
}: {
  kicker?: string
  title: string
  subtitle?: ReactNode
  right?: ReactNode
  children?: ReactNode
}) {
  return (
    <div
      className="full-bleed -mt-8 mb-6 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 25% 0%, #1a1016 0%, #101018 45%, #0d0d14 100%)',
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

      <div className="container mx-auto max-w-6xl px-4 pt-10 pb-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-4 justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)', letterSpacing: '0.18em' }}>
              {kicker}
            </p>
            <h1 className="f1-heading italic text-4xl sm:text-5xl mb-2">{title}</h1>
            {subtitle && (
              <p className="text-sm sm:text-base" style={{ color: 'var(--f1-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {right && <div className="flex-shrink-0">{right}</div>}
        </div>
        {children}
      </div>
    </div>
  )
}
