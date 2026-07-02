export type CircuitInfo = {
  laps: number
  wikiTitle: string
  length: number        // km
  corners: number
  type: 'Permanente' | 'Urbano' | 'Misto'
  lapRecord: { time: string; driver: string; year: number }
  mostWins: { driver: string; wins: number }
}

const circuits: Record<string, CircuitInfo> = {
  albert_park:  {
    laps: 58, wikiTitle: 'Albert Park Circuit',
    length: 5.278, corners: 16, type: 'Urbano',
    lapRecord: { time: '1:20.235', driver: 'Charles Leclerc', year: 2022 },
    mostWins: { driver: 'Michael Schumacher / Lewis Hamilton', wins: 4 },
  },
  shanghai:     {
    laps: 56, wikiTitle: 'Shanghai International Circuit',
    length: 5.451, corners: 16, type: 'Permanente',
    lapRecord: { time: '1:32.238', driver: 'Michael Schumacher', year: 2004 },
    mostWins: { driver: 'Michael Schumacher / Lewis Hamilton / Sebastian Vettel', wins: 2 },
  },
  suzuka:       {
    laps: 53, wikiTitle: 'Suzuka International Racing Course',
    length: 5.807, corners: 18, type: 'Permanente',
    lapRecord: { time: '1:30.983', driver: 'Lewis Hamilton', year: 2019 },
    mostWins: { driver: 'Michael Schumacher', wins: 6 },
  },
  bahrain:      {
    laps: 57, wikiTitle: 'Bahrain International Circuit',
    length: 5.412, corners: 15, type: 'Permanente',
    lapRecord: { time: '1:31.447', driver: 'Pedro de la Rosa', year: 2005 },
    mostWins: { driver: 'Lewis Hamilton / Sebastian Vettel', wins: 5 },
  },
  jeddah:       {
    laps: 50, wikiTitle: 'Jeddah Street Circuit',
    length: 6.174, corners: 27, type: 'Urbano',
    lapRecord: { time: '1:30.734', driver: 'Lewis Hamilton', year: 2021 },
    mostWins: { driver: 'Max Verstappen', wins: 2 },
  },
  miami:        {
    laps: 57, wikiTitle: 'Miami International Autodrome',
    length: 5.412, corners: 19, type: 'Urbano',
    lapRecord: { time: '1:29.708', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Max Verstappen', wins: 2 },
  },
  monaco:       {
    laps: 78, wikiTitle: 'Circuit de Monaco',
    length: 3.337, corners: 19, type: 'Urbano',
    lapRecord: { time: '1:12.909', driver: 'Lando Norris', year: 2024 },
    mostWins: { driver: 'Ayrton Senna', wins: 6 },
  },
  montreal:     {
    laps: 70, wikiTitle: 'Circuit Gilles Villeneuve',
    length: 4.361, corners: 14, type: 'Misto',
    lapRecord: { time: '1:13.078', driver: 'Valtteri Bottas', year: 2019 },
    mostWins: { driver: 'Michael Schumacher', wins: 7 },
  },
  barcelona:    {
    laps: 66, wikiTitle: 'Circuit de Barcelona-Catalunya',
    length: 4.657, corners: 14, type: 'Permanente',
    lapRecord: { time: '1:16.330', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Michael Schumacher', wins: 6 },
  },
  red_bull_ring: {
    laps: 71, wikiTitle: 'Red Bull Ring',
    length: 4.318, corners: 10, type: 'Permanente',
    lapRecord: { time: '1:05.619', driver: 'Carlos Sainz', year: 2020 },
    mostWins: { driver: 'Max Verstappen', wins: 5 },
  },
  silverstone:  {
    laps: 52, wikiTitle: 'Silverstone Circuit',
    length: 5.891, corners: 18, type: 'Permanente',
    lapRecord: { time: '1:27.097', driver: 'Max Verstappen', year: 2020 },
    mostWins: { driver: 'Lewis Hamilton', wins: 8 },
  },
  spa:          {
    laps: 44, wikiTitle: 'Circuit de Spa-Francorchamps',
    length: 7.004, corners: 19, type: 'Permanente',
    lapRecord: { time: '1:46.286', driver: 'Valtteri Bottas', year: 2018 },
    mostWins: { driver: 'Ayrton Senna / Michael Schumacher / Lewis Hamilton', wins: 6 },
  },
  hungaroring:  {
    laps: 70, wikiTitle: 'Hungaroring',
    length: 4.381, corners: 14, type: 'Permanente',
    lapRecord: { time: '1:16.627', driver: 'Lewis Hamilton', year: 2020 },
    mostWins: { driver: 'Lewis Hamilton', wins: 8 },
  },
  zandvoort:    {
    laps: 72, wikiTitle: 'Circuit Zandvoort',
    length: 4.259, corners: 14, type: 'Permanente',
    lapRecord: { time: '1:11.097', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Max Verstappen', wins: 3 },
  },
  monza:        {
    laps: 53, wikiTitle: 'Autodromo Nazionale Monza',
    length: 5.793, corners: 11, type: 'Permanente',
    lapRecord: { time: '1:21.046', driver: 'Rubens Barrichello', year: 2004 },
    mostWins: { driver: 'Michael Schumacher', wins: 5 },
  },
  madrid:       {
    laps: 55, wikiTitle: 'Madrid Street Circuit',
    length: 5.47, corners: 21, type: 'Urbano',
    lapRecord: { time: '—', driver: '—', year: 2026 },
    mostWins: { driver: '—', wins: 0 },
  },
  baku:         {
    laps: 51, wikiTitle: 'Baku City Circuit',
    length: 6.003, corners: 20, type: 'Urbano',
    lapRecord: { time: '1:43.009', driver: 'Charles Leclerc', year: 2019 },
    mostWins: { driver: 'Sergio Pérez', wins: 2 },
  },
  singapore:    {
    laps: 62, wikiTitle: 'Marina Bay Street Circuit',
    length: 4.940, corners: 19, type: 'Urbano',
    lapRecord: { time: '1:35.867', driver: 'Lewis Hamilton', year: 2023 },
    mostWins: { driver: 'Sebastian Vettel', wins: 5 },
  },
  cota:         {
    laps: 56, wikiTitle: 'Circuit of the Americas',
    length: 5.513, corners: 20, type: 'Permanente',
    lapRecord: { time: '1:36.169', driver: 'Charles Leclerc', year: 2019 },
    mostWins: { driver: 'Lewis Hamilton', wins: 6 },
  },
  mexico:       {
    laps: 71, wikiTitle: 'Autódromo Hermanos Rodríguez',
    length: 4.304, corners: 17, type: 'Permanente',
    lapRecord: { time: '1:17.774', driver: 'Valtteri Bottas', year: 2021 },
    mostWins: { driver: 'Max Verstappen', wins: 5 },
  },
  interlagos:   {
    laps: 71, wikiTitle: 'Autódromo José Carlos Pace',
    length: 4.309, corners: 15, type: 'Permanente',
    lapRecord: { time: '1:10.540', driver: 'Valtteri Bottas', year: 2018 },
    mostWins: { driver: 'Michael Schumacher / Ayrton Senna', wins: 4 },
  },
  las_vegas:    {
    laps: 50, wikiTitle: 'Las Vegas Street Circuit',
    length: 6.201, corners: 17, type: 'Urbano',
    lapRecord: { time: '1:35.490', driver: 'Oscar Piastri', year: 2024 },
    mostWins: { driver: 'Carlos Sainz', wins: 1 },
  },
  losail:       {
    laps: 57, wikiTitle: 'Losail International Circuit',
    length: 5.380, corners: 16, type: 'Permanente',
    lapRecord: { time: '1:24.319', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Max Verstappen', wins: 2 },
  },
  yas_marina:   {
    laps: 55, wikiTitle: 'Yas Marina Circuit',
    length: 5.281, corners: 16, type: 'Permanente',
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

const circuitFlags: Record<string, string> = {
  albert_park: '🇦🇺', shanghai: '🇨🇳', suzuka: '🇯🇵',
  bahrain: '🇧🇭', jeddah: '🇸🇦', miami: '🇺🇸',
  monaco: '🇲🇨', montreal: '🇨🇦', barcelona: '🇪🇸',
  red_bull_ring: '🇦🇹', silverstone: '🇬🇧', spa: '🇧🇪',
  hungaroring: '🇭🇺', zandvoort: '🇳🇱', monza: '🇮🇹',
  madrid: '🇪🇸', baku: '🇦🇿', singapore: '🇸🇬',
  cota: '🇺🇸', mexico: '🇲🇽', interlagos: '🇧🇷',
  las_vegas: '🇺🇸', losail: '🇶🇦', yas_marina: '🇦🇪',
}

export function getRaceFlag(raceName: string, circuit?: string): string {
  const search = `${raceName} ${circuit ?? ''}`.toLowerCase()
  for (const [kw, key] of Object.entries(keywords)) {
    if (search.includes(kw)) return circuitFlags[key] ?? '🏁'
  }
  return '🏁'
}

export function getCircuitInfo(raceName: string, circuit?: string): (CircuitInfo & { _key: string }) | null {
  const search = `${raceName} ${circuit ?? ''}`.toLowerCase()
  for (const [kw, key] of Object.entries(keywords)) {
    if (search.includes(kw)) {
      const info = circuits[key]
      return info ? { ...info, _key: key } : null
    }
  }
  return null
}
