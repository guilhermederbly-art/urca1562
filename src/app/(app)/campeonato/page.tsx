export const revalidate = 300

export const metadata = { title: 'Campeonato F1 2026 — F1 Bolão' }

const JOLPICA = 'https://api.jolpi.ca/ergast/f1/2026'

interface DriverStanding {
  position: string
  points: string
  wins: string
  Driver: { code: string; givenName: string; familyName: string; nationality: string }
  Constructors: { name: string }[]
}

interface ConstructorStanding {
  position: string
  points: string
  wins: string
  Constructor: { name: string; nationality: string }
}

function teamColor(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('red bull'))                    return '#3671C6'
  if (n.includes('ferrari'))                     return '#E8002D'
  if (n.includes('mclaren'))                     return '#FF8000'
  if (n.includes('mercedes'))                    return '#27F4D2'
  if (n.includes('aston'))                       return '#358C75'
  if (n.includes('alpine'))                      return '#FF87BC'
  if (n.includes('williams'))                    return '#005AFF'
  if (n.includes('racing bulls') || n.includes('rb') || n.includes('visa')) return '#6692FF'
  if (n.includes('haas'))                        return '#B6BABD'
  if (n.includes('sauber') || n.includes('kick')) return '#52E252'
  return '#8a8aa0'
}

async function fetchStandings() {
  try {
    const [dRes, cRes] = await Promise.all([
      fetch(`${JOLPICA}/driverStandings.json`, { next: { revalidate: 300 } }),
      fetch(`${JOLPICA}/constructorStandings.json`, { next: { revalidate: 300 } }),
    ])
    const [dData, cData] = await Promise.all([dRes.json(), cRes.json()])

    const dList = dData?.MRData?.StandingsTable?.StandingsLists?.[0]
    const cList = cData?.MRData?.StandingsTable?.StandingsLists?.[0]

    return {
      round: dList?.round ?? '?',
      drivers: (dList?.DriverStandings ?? []) as DriverStanding[],
      constructors: (cList?.ConstructorStandings ?? []) as ConstructorStanding[],
    }
  } catch {
    return { round: '?', drivers: [], constructors: [] }
  }
}

export default async function CampeonatoPage() {
  const { round, drivers, constructors } = await fetchStandings()

  const leader = drivers[0]
  const leaderPts = leader ? Number(leader.points) : 0

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--f1-red)' }}>
            Temporada 2026
          </p>
          <h1 className="f1-heading text-3xl">Campeonato</h1>
        </div>
        <div className="text-right text-xs" style={{ color: 'var(--f1-muted)' }}>
          <span>Após rodada </span>
          <span className="font-bold text-white">{round}</span>
        </div>
      </div>

      {/* Driver standings */}
      <div className="card overflow-hidden mb-5">
        <div className="striped-accent-thick" />
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--f1-border)' }}>
          <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: 'var(--f1-red)' }}>
            🏆 Pilotos
          </h2>
          <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>{drivers.length} pilotos</span>
        </div>

        {drivers.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--f1-muted)' }}>
            Dados indisponíveis no momento.
          </p>
        ) : (
          <div>
            {drivers.map((d, i) => {
              const pts = Number(d.points)
              const gap = i === 0 ? null : leaderPts - pts
              const team = d.Constructors[0]?.name ?? '—'
              const color = teamColor(team)
              const isLeader = i === 0
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

              return (
                <div
                  key={d.Driver.code}
                  className="flex items-center gap-0 border-b"
                  style={{
                    borderColor: 'var(--f1-border)',
                    borderLeft: `4px solid ${color}`,
                    background: isLeader ? 'rgba(255,215,0,0.03)' : 'transparent',
                  }}
                >
                  {/* Position */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center w-12 self-stretch text-center"
                    style={{ background: 'rgba(0,0,0,0.2)', borderRight: '1px solid var(--f1-border)' }}
                  >
                    <span className="font-black text-sm" style={{ color: isLeader ? '#ffd700' : 'var(--f1-muted)' }}>
                      {medal ?? d.position}
                    </span>
                  </div>

                  {/* Driver info */}
                  <div className="flex-1 min-w-0 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-black text-xs px-1.5 py-0.5 rounded"
                        style={{ background: `${color}22`, color, border: `1px solid ${color}44`, letterSpacing: '0.05em' }}
                      >
                        {d.Driver.code}
                      </span>
                      <span className="font-bold text-white text-sm truncate">
                        {d.Driver.givenName} {d.Driver.familyName}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>
                      {team}
                      {d.wins !== '0' && (
                        <span className="ml-2" style={{ color: '#ffd700' }}>
                          🏆 {d.wins} vitória{Number(d.wins) !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Gap to leader */}
                  {gap !== null && (
                    <div className="hidden sm:block flex-shrink-0 px-4 text-right">
                      <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>
                        -{gap} pts
                      </span>
                    </div>
                  )}

                  {/* Points */}
                  <div className="flex-shrink-0 px-4 py-3 text-right">
                    <span
                      className="font-black text-lg"
                      style={{ color: isLeader ? '#ffd700' : 'white' }}
                    >
                      {pts}
                    </span>
                    <span className="text-xs ml-0.5" style={{ color: 'var(--f1-muted)' }}>pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Constructor standings */}
      <div className="card overflow-hidden">
        <div className="striped-accent-thick" />
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--f1-border)' }}>
          <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: 'var(--f1-red)' }}>
            🏗 Construtores
          </h2>
        </div>

        {constructors.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--f1-muted)' }}>
            Dados indisponíveis no momento.
          </p>
        ) : (
          <div>
            {constructors.map((c, i) => {
              const pts = Number(c.points)
              const leaderPtsC = Number(constructors[0].points)
              const gap = i === 0 ? null : leaderPtsC - pts
              const color = teamColor(c.Constructor.name)
              const isLeader = i === 0
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

              return (
                <div
                  key={c.Constructor.name}
                  className="flex items-center gap-0 border-b"
                  style={{
                    borderColor: 'var(--f1-border)',
                    borderLeft: `4px solid ${color}`,
                    background: isLeader ? 'rgba(255,215,0,0.03)' : 'transparent',
                  }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center w-12 self-stretch"
                    style={{ background: 'rgba(0,0,0,0.2)', borderRight: '1px solid var(--f1-border)' }}
                  >
                    <span className="font-black text-sm" style={{ color: isLeader ? '#ffd700' : 'var(--f1-muted)' }}>
                      {medal ?? c.position}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 px-4 py-3">
                    <div className="font-bold text-white text-sm">{c.Constructor.name}</div>
                    {c.wins !== '0' && (
                      <div className="text-xs mt-0.5" style={{ color: '#ffd700' }}>
                        🏆 {c.wins} vitória{Number(c.wins) !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {gap !== null && (
                    <div className="hidden sm:block flex-shrink-0 px-4 text-right">
                      <span className="text-xs" style={{ color: 'var(--f1-muted)' }}>
                        -{gap} pts
                      </span>
                    </div>
                  )}

                  <div className="flex-shrink-0 px-4 py-3 text-right">
                    <span className="font-black text-lg" style={{ color: isLeader ? '#ffd700' : 'white' }}>
                      {pts}
                    </span>
                    <span className="text-xs ml-0.5" style={{ color: 'var(--f1-muted)' }}>pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
