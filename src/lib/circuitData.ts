export type CircuitInfo = {
  laps: number
  wikiTitle: string
  lapRecord: { time: string; driver: string; year: number }
  mostWins: { driver: string; wins: number }
}

const circuits: Record<string, CircuitInfo> = {
  albert_park:  {
    laps: 58, wikiTitle: 'Albert Park Circuit',
    lapRecord: { time: '1:20.235', driver: 'Charles Leclerc', year: 2022 },
    mostWins: { driver: 'Michael Schumacher / Lewis Hamilton', wins: 4 },
  },
  shanghai:     {
    laps: 56, wikiTitle: 'Shanghai International Circuit',
    lapRecord: { time: '1:32.238', driver: 'Michael Schumacher', year: 2004 },
    mostWins: { driver: 'Michael Schumacher / Lewis Hamilton / Sebastian Vettel', wins: 2 },
  },
  suzuka:       {
    laps: 53, wikiTitle: 'Suzuka International Racing Course',
    lapRecord: { time: '1:30.983', driver: 'Lewis Hamilton', year: 2019 },
    mostWins: { driver: 'Michael Schumacher', wins: 6 },
  },
  bahrain:      {
    laps: 57, wikiTitle: 'Bahrain International Circuit',
    lapRecord: { time: '1:31.447', driver: 'Pedro de la Rosa', year: 2005 },
    mostWins: { driver: 'Lewis Hamilton / Sebastian Vettel', wins: 5 },
  },
  jeddah:       {
    laps: 50, wikiTitle: 'Jeddah Street Circuit',
    lapRecord: { time: '1:30.734', driver: 'Lewis Hamilton', year: 2021 },
    mostWins: { driver: 'Max Verstappen', wins: 2 },
  },
  miami:        {
    laps: 57, wikiTitle: 'Miami International Autodrome',
    lapRecord: { time: '1:29.708', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Max Verstappen', wins: 2 },
  },
  monaco:       {
    laps: 78, wikiTitle: 'Circuit de Monaco',
    lapRecord: { time: '1:12.909', driver: 'Lando Norris', year: 2024 },
    mostWins: { driver: 'Ayrton Senna', wins: 6 },
  },
  montreal:     {
    laps: 70, wikiTitle: 'Circuit Gilles Villeneuve',
    lapRecord: { time: '1:13.078', driver: 'Valtteri Bottas', year: 2019 },
    mostWins: { driver: 'Michael Schumacher', wins: 7 },
  },
  barcelona:    {
    laps: 66, wikiTitle: 'Circuit de Barcelona-Catalunya',
    lapRecord: { time: '1:16.330', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Michael Schumacher', wins: 6 },
  },
  red_bull_ring: {
    laps: 71, wikiTitle: 'Red Bull Ring',
    lapRecord: { time: '1:05.619', driver: 'Carlos Sainz', year: 2020 },
    mostWins: { driver: 'Max Verstappen', wins: 5 },
  },
  silverstone:  {
    laps: 52, wikiTitle: 'Silverstone Circuit',
    lapRecord: { time: '1:27.097', driver: 'Max Verstappen', year: 2020 },
    mostWins: { driver: 'Lewis Hamilton', wins: 8 },
  },
  spa:          {
    laps: 44, wikiTitle: 'Circuit de Spa-Francorchamps',
    lapRecord: { time: '1:46.286', driver: 'Valtteri Bottas', year: 2018 },
    mostWins: { driver: 'Ayrton Senna / Michael Schumacher / Lewis Hamilton', wins: 6 },
  },
  hungaroring:  {
    laps: 70, wikiTitle: 'Hungaroring',
    lapRecord: { time: '1:16.627', driver: 'Lewis Hamilton', year: 2020 },
    mostWins: { driver: 'Lewis Hamilton', wins: 8 },
  },
  zandvoort:    {
    laps: 72, wikiTitle: 'Circuit Zandvoort',
    lapRecord: { time: '1:11.097', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Max Verstappen', wins: 3 },
  },
  monza:        {
    laps: 53, wikiTitle: 'Autodromo Nazionale Monza',
    lapRecord: { time: '1:21.046', driver: 'Rubens Barrichello', year: 2004 },
    mostWins: { driver: 'Michael Schumacher', wins: 5 },
  },
  madrid:       {
    laps: 55, wikiTitle: 'Madrid Street Circuit',
    lapRecord: { time: '—', driver: '—', year: 2026 },
    mostWins: { driver: '—', wins: 0 },
  },
  baku:         {
    laps: 51, wikiTitle: 'Baku City Circuit',
    lapRecord: { time: '1:43.009', driver: 'Charles Leclerc', year: 2019 },
    mostWins: { driver: 'Sergio Pérez', wins: 2 },
  },
  singapore:    {
    laps: 62, wikiTitle: 'Marina Bay Street Circuit',
    lapRecord: { time: '1:35.867', driver: 'Lewis Hamilton', year: 2023 },
    mostWins: { driver: 'Sebastian Vettel', wins: 5 },
  },
  cota:         {
    laps: 56, wikiTitle: 'Circuit of the Americas',
    lapRecord: { time: '1:36.169', driver: 'Charles Leclerc', year: 2019 },
    mostWins: { driver: 'Lewis Hamilton', wins: 6 },
  },
  mexico:       {
    laps: 71, wikiTitle: 'Autódromo Hermanos Rodríguez',
    lapRecord: { time: '1:17.774', driver: 'Valtteri Bottas', year: 2021 },
    mostWins: { driver: 'Max Verstappen', wins: 5 },
  },
  interlagos:   {
    laps: 71, wikiTitle: 'Autódromo José Carlos Pace',
    lapRecord: { time: '1:10.540', driver: 'Valtteri Bottas', year: 2018 },
    mostWins: { driver: 'Michael Schumacher / Ayrton Senna', wins: 4 },
  },
  las_vegas:    {
    laps: 50, wikiTitle: 'Las Vegas Street Circuit',
    lapRecord: { time: '1:35.490', driver: 'Oscar Piastri', year: 2024 },
    mostWins: { driver: 'Carlos Sainz', wins: 1 },
  },
  losail:       {
    laps: 57, wikiTitle: 'Losail International Circuit',
    lapRecord: { time: '1:24.319', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Max Verstappen', wins: 2 },
  },
  yas_marina:   {
    laps: 55, wikiTitle: 'Yas Marina Circuit',
    lapRecord: { time: '1:26.103', driver: 'Max Verstappen', year: 2021 },
    mostWins: { driver: 'Lewis Hamilton', wins: 5 },
  },
}

const keywords: Record<string, string> = {
  albert: 'albert_park', australia: 'albert_park', melbourne: 'albert_park',
  shanghai: 'shanghai', china: 'shanghai',
  suzuka: 'suzuka', japan: 'suzuka', japão: 'suzuka',
  bahrain: 'bahrain', barein: 'bahrain', sakhir: 'bahrain',
  jeddah: 'jeddah', saudi: 'jeddah', arábia: 'jeddah',
  miami: 'miami',
  monaco: 'monaco', mônaco: 'monaco',
  montreal: 'montreal', canada: 'montreal', canadá: 'montreal', villeneuve: 'montreal',
  barcelona: 'barcelona', catalunha: 'barcelona',
  spielberg: 'red_bull_ring', austria: 'red_bull_ring', áustria: 'red_bull_ring',
  silverstone: 'silverstone', britain: 'silverstone', grã: 'silverstone',
  spa: 'spa', belgium: 'spa', bélgica: 'spa', francorchamps: 'spa',
  hungaroring: 'hungaroring', hungary: 'hungaroring', hungria: 'hungaroring', budapest: 'hungaroring',
  zandvoort: 'zandvoort', netherlands: 'zandvoort', holanda: 'zandvoort',
  monza: 'monza', italy: 'monza', itália: 'monza',
  madrid: 'madrid',
  baku: 'baku', azerbaijan: 'baku', azerbaijão: 'baku',
  singapore: 'singapore', singapura: 'singapore', marina: 'singapore',
  austin: 'cota', americas: 'cota', cota: 'cota', texas: 'cota',
  mexico: 'mexico', méxico: 'mexico', hermanos: 'mexico',
  interlagos: 'interlagos', brazil: 'interlagos', brasil: 'interlagos', paulo: 'interlagos',
  vegas: 'las_vegas',
  losail: 'losail', qatar: 'losail', catar: 'losail', lusail: 'losail',
  abu: 'yas_marina', dhabi: 'yas_marina', yas: 'yas_marina',
}

export function getCircuitInfo(raceName: string, circuit?: string): CircuitInfo | null {
  const search = `${raceName} ${circuit ?? ''}`.toLowerCase()
  for (const [kw, key] of Object.entries(keywords)) {
    if (search.includes(kw)) return circuits[key] ?? null
  }
  return null
}
