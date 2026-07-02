export type Challenge = {
  question: string
  options: string[]
}

export const CHALLENGE_BANK: Challenge[] = [
  { question: "Haverá Safety Car (SC) nesta corrida?", options: ["Sim", "Não"] },
  { question: "Haverá bandeira vermelha?", options: ["Sim", "Não"] },
  { question: "O pole position vai vencer a corrida?", options: ["Sim", "Não"] },
  { question: "O vencedor vai fazer mais de 1 parada no pit?", options: ["Sim", "Não"] },
  { question: "Algum piloto vai abandonar nas primeiras 5 voltas?", options: ["Sim", "Não"] },
  { question: "Haverá mais de 3 abandonos na corrida?", options: ["Sim", "Não"] },
  { question: "A McLaren vai terminar com 2 pilotos no pódio?", options: ["Sim", "Não"] },
  { question: "Algum piloto vai receber penalidade de tempo durante a corrida?", options: ["Sim", "Não"] },
  { question: "Haverá Safety Car Virtual (VSC) nesta corrida?", options: ["Sim", "Não"] },
  { question: "O Safety Car vai aparecer nas últimas 10 voltas?", options: ["Sim", "Não"] },
  { question: "O pódio vai ter 3 equipes diferentes?", options: ["Sim", "Não"] },
  { question: "Haverá troca de posição entre P1 e P2 na corrida?", options: ["Sim", "Não"] },
  { question: "O Bortoleto vai terminar na zona de pontos (top 10)?", options: ["Sim", "Não"] },
  { question: "O Verstappen vai terminar no pódio?", options: ["Sim", "Não"] },
  { question: "O Hamilton vai terminar à frente do Leclerc?", options: ["Sim", "Não"] },
  { question: "Quantos Safety Cars físicos haverá nesta corrida?", options: ["0", "1", "2 ou mais"] },
  { question: "Quantas paradas no pit vai fazer o vencedor?", options: ["1 parada", "2 paradas", "3+ paradas"] },
  { question: "Algum piloto vai rodar e continuar na corrida?", options: ["Sim", "Não"] },
  { question: "O líder do campeonato vai vencer esta corrida?", options: ["Sim", "Não"] },
  { question: "Haverá pelo menos 1 Drive Through ou Stop & Go?", options: ["Sim", "Não"] },
]

export function pickRandomChallenge(): Challenge {
  return CHALLENGE_BANK[Math.floor(Math.random() * CHALLENGE_BANK.length)]
}
