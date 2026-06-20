const BASE_URL = 'https://api.openf1.org/v1'

export interface OpenF1Session {
  session_key: number
  session_name: string
  session_type: string
  meeting_name: string
  country_name: string
  date_start: string
  year: number
}

export interface OpenF1Position {
  driver_number: number
  position: number
  session_key: number
  date: string
}

export interface OpenF1Driver {
  driver_number: number
  broadcast_name: string
  full_name: string
  name_acronym: string
  team_name: string
  session_key: number
}

export async function getSessionsByYear(year: number): Promise<OpenF1Session[]> {
  const res = await fetch(`${BASE_URL}/sessions?year=${year}`)
  if (!res.ok) throw new Error('Failed to fetch OpenF1 sessions')
  return res.json()
}

export async function getFinalPositions(sessionKey: number): Promise<OpenF1Position[]> {
  // Get last recorded position per driver
  const res = await fetch(`${BASE_URL}/position?session_key=${sessionKey}`)
  if (!res.ok) throw new Error('Failed to fetch positions')
  const all: OpenF1Position[] = await res.json()

  // Keep only the last entry per driver (final standing)
  const byDriver = new Map<number, OpenF1Position>()
  for (const pos of all) {
    const existing = byDriver.get(pos.driver_number)
    if (!existing || pos.date > existing.date) {
      byDriver.set(pos.driver_number, pos)
    }
  }
  return Array.from(byDriver.values()).sort((a, b) => a.position - b.position)
}

export async function getSessionDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
  const res = await fetch(`${BASE_URL}/drivers?session_key=${sessionKey}`)
  if (!res.ok) throw new Error('Failed to fetch drivers')
  return res.json()
}

export async function findSessionKey(
  year: number,
  countryName: string,
  sessionType: 'Qualifying' | 'Race'
): Promise<number | null> {
  const sessions = await getSessionsByYear(year)
  const match = sessions.find(
    s =>
      s.country_name.toLowerCase().includes(countryName.toLowerCase()) &&
      s.session_type === sessionType
  )
  return match?.session_key ?? null
}
