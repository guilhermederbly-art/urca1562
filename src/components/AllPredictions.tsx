'use client'

import { useState } from 'react'
import type { Driver, Race, RaceResult } from '@/lib/types/database'
import { getTeamColor } from '@/lib/teamColors'
import GroupSelector, { type GroupInfo } from './GroupSelector'

export interface NamedPrediction {
  userId: string
  username: string
  pole_driver_id: string | null
  p1_driver_id: string | null
  p2_driver_id: string | null
  p3_driver_id: string | null
  random_pos_driver_id: string | null
  bortoleto_position: number | null
  challenge_answer: string | null
}

interface Props {
  race: Race
  allPredictions: NamedPrediction[]
  drivers: Driver[]
  result?: RaceResult
  currentUserId: string
  groups?: GroupInfo[]
}

// Chip de piloto na cor da equipe. Verde quando o palpite acertou.
// O acerto so e marcado quando o resultado JA existe — antes disso `certo`
// chega como null, e nao como false: "ainda nao sabemos" e "errou" nao podem
// ter a mesma aparencia.
function DriverChip({ driver, certo }: { driver?: Driver; certo: boolean | null }) {
  if (!driver) return <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>—</span>
  const cor = certo ? '#22c55e' : getTeamColor(driver.team)
  return (
    <span
      title={`${driver.name} · ${driver.team}`}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-black"
      style={{
        color: certo ? '#22c55e' : 'var(--f1-text)',
        background: certo ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
        borderLeft: `2px solid ${cor}`,
      }}
    >
      {driver.abbreviation}
      {certo && <span aria-label="acertou">✓</span>}
    </span>
  )
}

function ValorChip({ texto, certo }: { texto: string | null; certo: boolean | null }) {
  if (texto == null || texto === '') return <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>—</span>
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-black"
      style={{
        color: certo ? '#22c55e' : 'var(--f1-text)',
        background: certo ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
      }}
    >
      {texto}
      {certo && <span aria-label="acertou">✓</span>}
    </span>
  )
}

export default function AllPredictions({
  race, allPredictions, drivers, result, currentUserId, groups = [],
}: Props) {
  const [activeGroup, setActiveGroup] = useState('geral')

  const visiveis = activeGroup === 'geral'
    ? allPredictions
    : allPredictions.filter(p => groups.find(g => g.id === activeGroup)?.memberIds.includes(p.userId))

  // Voce primeiro, o resto em ordem alfabetica — quem abre a tela procura o
  // proprio palpite antes de comparar com os outros.
  const linhas = [...visiveis].sort((a, b) => {
    if (a.userId === currentUserId) return -1
    if (b.userId === currentUserId) return 1
    return a.username.localeCompare(b.username, 'pt-BR')
  })

  const piloto = (id: string | null) => drivers.find(d => d.id === id)
  const temDesafio = !!race.challenge_question
  const temResultado = !!result

  const colunas: { rotulo: string; sub?: string }[] = [
    { rotulo: 'Pole' },
    { rotulo: 'P1' },
    { rotulo: 'P2' },
    { rotulo: 'P3' },
    { rotulo: race.random_position ? `P${race.random_position}` : 'Aleatória', sub: 'aleatória' },
    { rotulo: 'Bortoleto' },
    ...(temDesafio ? [{ rotulo: 'Desafio' }] : []),
  ]

  if (allPredictions.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="striped-accent-thick" />

      <div className="px-5 pt-4 pb-3 border-b flex items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: 'var(--f1-border)' }}>
        <div>
          <div className="text-sm font-black uppercase tracking-widest text-white mb-0.5 flex items-center gap-2">
            <span aria-hidden style={{ color: 'var(--f1-red)' }}>👀</span> Palpites de todos
          </div>
          <div className="text-xs" style={{ color: 'var(--f1-muted)' }}>
            {linhas.length} {linhas.length === 1 ? 'palpite' : 'palpites'}
            {temResultado ? ' · em verde, quem acertou' : ' · resultado ainda não importado'}
          </div>
        </div>
        {groups.length > 0 && (
          <GroupSelector groups={groups} value={activeGroup} onChange={setActiveGroup} />
        )}
      </div>

      {linhas.length === 0 ? (
        <div className="px-5 py-6 text-center text-xs" style={{ color: 'var(--f1-muted)' }}>
          Ninguém desse grupo palpitou nesta corrida.
        </div>
      ) : (
        // Tabela larga rola sozinha em vez de esmagar as colunas no celular.
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full" style={{ minWidth: temDesafio ? '640px' : '540px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-left px-5 py-2 text-xs font-black uppercase tracking-widest"
                  style={{ color: 'var(--f1-muted)', borderBottom: '1px solid var(--f1-border)' }}>
                  Participante
                </th>
                {colunas.map(c => (
                  <th key={c.rotulo} className="text-left px-2 py-2 text-xs font-black uppercase tracking-widest whitespace-nowrap"
                    style={{ color: 'var(--f1-muted)', borderBottom: '1px solid var(--f1-border)' }}>
                    {c.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map(p => {
                const euMesmo = p.userId === currentUserId
                return (
                  <tr key={p.userId} style={{ background: euMesmo ? 'rgba(225,6,0,0.06)' : undefined }}>
                    <td className="px-5 py-2 whitespace-nowrap" style={{ borderBottom: '1px solid var(--f1-border)' }}>
                      <span className="text-xs font-bold" style={{ color: euMesmo ? 'var(--f1-red)' : 'var(--f1-text)' }}>
                        {p.username}
                      </span>
                      {euMesmo && (
                        <span className="ml-1.5 text-xs font-black" style={{ color: 'var(--f1-red)', fontSize: '0.6rem' }}>
                          você
                        </span>
                      )}
                    </td>

                    <td className="px-2 py-2" style={{ borderBottom: '1px solid var(--f1-border)' }}>
                      <DriverChip driver={piloto(p.pole_driver_id)}
                        certo={temResultado ? p.pole_driver_id != null && p.pole_driver_id === result!.pole_driver_id : null} />
                    </td>
                    <td className="px-2 py-2" style={{ borderBottom: '1px solid var(--f1-border)' }}>
                      <DriverChip driver={piloto(p.p1_driver_id)}
                        certo={temResultado ? p.p1_driver_id != null && p.p1_driver_id === result!.p1_driver_id : null} />
                    </td>
                    <td className="px-2 py-2" style={{ borderBottom: '1px solid var(--f1-border)' }}>
                      <DriverChip driver={piloto(p.p2_driver_id)}
                        certo={temResultado ? p.p2_driver_id != null && p.p2_driver_id === result!.p2_driver_id : null} />
                    </td>
                    <td className="px-2 py-2" style={{ borderBottom: '1px solid var(--f1-border)' }}>
                      <DriverChip driver={piloto(p.p3_driver_id)}
                        certo={temResultado ? p.p3_driver_id != null && p.p3_driver_id === result!.p3_driver_id : null} />
                    </td>
                    <td className="px-2 py-2" style={{ borderBottom: '1px solid var(--f1-border)' }}>
                      <DriverChip driver={piloto(p.random_pos_driver_id)}
                        certo={temResultado ? p.random_pos_driver_id != null && p.random_pos_driver_id === result!.random_pos_driver_id : null} />
                    </td>
                    <td className="px-2 py-2" style={{ borderBottom: '1px solid var(--f1-border)' }}>
                      <ValorChip texto={p.bortoleto_position != null ? `P${p.bortoleto_position}` : null}
                        certo={temResultado ? p.bortoleto_position != null && p.bortoleto_position === result!.bortoleto_position : null} />
                    </td>
                    {temDesafio && (
                      <td className="px-2 py-2" style={{ borderBottom: '1px solid var(--f1-border)' }}>
                        <ValorChip texto={p.challenge_answer}
                          certo={race.challenge_correct != null && p.challenge_answer != null && p.challenge_answer === race.challenge_correct} />
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
