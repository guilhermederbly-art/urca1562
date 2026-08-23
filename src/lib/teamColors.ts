// Cor oficial aproximada de cada equipe, usada na borda inferior dos chips
// de piloto e em qualquer marcação por equipe.
export function getTeamColor(team: string): string {
  const t = team.toLowerCase()
  if (t.includes('red bull')) return '#3671C6'
  if (t.includes('ferrari')) return '#E8002D'
  if (t.includes('mclaren')) return '#FF8000'
  if (t.includes('mercedes')) return '#27F4D2'
  if (t.includes('aston')) return '#358C75'
  if (t.includes('alpine')) return '#FF87BC'
  if (t.includes('williams')) return '#005AFF'
  if (t.includes('racing bulls') || t.includes('visa') || t.includes('rb ')) return '#6692FF'
  if (t.includes('haas')) return '#B6BABD'
  if (t.includes('sauber') || t.includes('kick')) return '#52E252'
  return '#8a8aa0'
}
