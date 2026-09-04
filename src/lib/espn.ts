// Fonte alternativa de resultado, e nao um luxo: a OpenF1 responde 401
// ("Live F1 session in progress... restricted to authenticated users") para
// quem nao tem chave paga ENQUANTO ha sessao ao vivo — exatamente a janela em
// que o resultado e esperado. A ESPN e aberta.
//
// Isto vivia copiado em /api/races/fetch-results e em /api/races/live, e o
// cron nao tinha copia nenhuma (era o ponto cego). Uma implementacao so.

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard'

interface EspnCompetitor { order: number; athlete: { displayName: string } }
interface EspnCompetition {
  date: string
  type: { abbreviation: string }
  status?: { type?: { completed?: boolean; state?: string } }
  competitors?: EspnCompetitor[]
}
interface EspnEvent { competitions?: EspnCompetition[] }

export interface EspnPosicoes {
  racePositions: { driverName: string; position: number }[]
  poleDriverName: string | null
  /** Posicoes publicadas e a corrida AINDA em andamento — o caso da tela ao vivo. */
  hasData: boolean
  /** A ESPN considera a corrida encerrada. E o que autoriza gravar como resultado FINAL. */
  isCompleted: boolean
}

const VAZIO: EspnPosicoes = { racePositions: [], poleDriverName: null, hasData: false, isCompleted: false }

function achaComps(events: EspnEvent[], raceStartTime: string) {
  const alvo = new Date(raceStartTime).getTime()
  let race: EspnCompetition | null = null
  let quali: EspnCompetition | null = null
  for (const ev of events ?? []) {
    for (const c of ev.competitions ?? []) {
      const diff = Math.abs(new Date(c.date).getTime() - alvo)
      if (c.type.abbreviation === 'Race' && diff < 6 * 60 * 60 * 1000) race = c
      if ((c.type.abbreviation === 'Qual' || c.type.abbreviation === 'Q') && diff < 3 * 24 * 60 * 60 * 1000) quali = c
    }
    if (race) break
  }
  return { race, quali }
}

// NUNCA lanca: os tres chamadores tratam ausencia de dado como "ainda nao da",
// e uma excecao aqui derrubaria a rodada do cron por causa de uma fonte
// secundaria.
export async function getEspnPositions(raceStartTime: string): Promise<EspnPosicoes> {
  // O feed SEM parametro e o do fim de semana corrente, e e o unico comprovado
  // durante a corrida — a tela ao vivo depende dele. O recorte por ano so entra
  // se aquele nao tiver a corrida, que e o caso de etapa antiga.
  const ano = new Date(raceStartTime).getUTCFullYear()
  for (const url of [ESPN_URL, `${ESPN_URL}?dates=${ano}`]) {
    try {
      const res = await fetch(url, { next: { revalidate: 0 } })
      if (!res.ok) continue
      const data = await res.json() as { events?: EspnEvent[] }
      const { race, quali } = achaComps(data.events ?? [], raceStartTime)
      if (!race?.competitors?.length) continue

      const racePositions = race.competitors
        .map(c => ({ driverName: c.athlete.displayName, position: c.order }))
        .sort((a, b) => a.position - b.position)
      const poleDriverName = quali?.competitors?.find(c => c.order === 1)?.athlete.displayName ?? null
      const isCompleted = !!race.status?.type?.completed
      const emAndamento = race.status?.type?.state === 'in' || !isCompleted

      return { racePositions, poleDriverName, isCompleted, hasData: racePositions.length > 0 && emAndamento }
    } catch { /* tenta a proxima URL */ }
  }
  return VAZIO
}

// A ESPN entrega NOME ("George Russell"); a base tem nome e numero. Casa pelo
// nome inteiro e, na falta, pelo sobrenome. Estava copiado em tres lugares.
//
// IGNORA ACENTO, e isto nao e preciosismo: a ESPN manda "Sergio Perez" com
// acento e a base o tem sem, entao ele nao casava por nenhum dos dois
// caminhos — e se a posicao aleatoria sorteada cair na dele, o campo fica
// nulo e ninguem pontua os 3 pontos, sem erro nenhum. "Nico Hulkenberg"
// tinha a mesma armadilha na direcao oposta.
function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function achaDriverPorNome<T extends { name: string }>(drivers: T[], displayName: string): T | null {
  const alvo = norm(displayName)
  const exato = drivers.find(d => norm(d.name) === alvo)
  if (exato) return exato
  const sobrenome = alvo.split(' ').pop() ?? ''
  if (!sobrenome) return null
  return drivers.find(d => norm(d.name).endsWith(sobrenome)) ?? null
}
