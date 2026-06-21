export type CircuitInfo = {
  fullName: string
  length: number       // km
  laps: number
  lapRecord: { time: string; driver: string; year: number }
  mostWins: { driver: string; wins: number }
  firstRace: number
  type: 'permanente' | 'urbano' | 'misto'
}

const circuits: Record<string, CircuitInfo> = {
  albert_park: {
    fullName: 'Albert Park Circuit',
    length: 5.278, laps: 58,
    lapRecord: { time: '1:20.235', driver: 'Charles Leclerc', year: 2022 },
    mostWins: { driver: 'Michael Schumacher / Lewis Hamilton', wins: 4 },
    firstRace: 1996, type: 'misto',
  },
  shanghai: {
    fullName: 'Shanghai International Circuit',
    length: 5.451, laps: 56,
    lapRecord: { time: '1:32.238', driver: 'Michael Schumacher', year: 2004 },
    mostWins: { driver: 'Michael Schumacher / Lewis Hamilton / Sebastian Vettel', wins: 2 },
    firstRace: 2004, type: 'permanente',
  },
  suzuka: {
    fullName: 'Suzuka International Racing Course',
    length: 5.807, laps: 53,
    lapRecord: { time: '1:30.983', driver: 'Lewis Hamilton', year: 2019 },
    mostWins: { driver: 'Michael Schumacher', wins: 6 },
    firstRace: 1987, type: 'permanente',
  },
  bahrain: {
    fullName: 'Bahrain International Circuit',
    length: 5.412, laps: 57,
    lapRecord: { time: '1:31.447', driver: 'Pedro de la Rosa', year: 2005 },
    mostWins: { driver: 'Lewis Hamilton / Sebastian Vettel', wins: 5 },
    firstRace: 2004, type: 'permanente',
  },
  jeddah: {
    fullName: 'Jeddah Corniche Circuit',
    length: 6.174, laps: 50,
    lapRecord: { time: '1:30.734', driver: 'Lewis Hamilton', year: 2021 },
    mostWins: { driver: 'Max Verstappen', wins: 2 },
    firstRace: 2021, type: 'urbano',
  },
  miami: {
    fullName: 'Miami International Autodrome',
    length: 5.412, laps: 57,
    lapRecord: { time: '1:29.708', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Max Verstappen', wins: 2 },
    firstRace: 2022, type: 'urbano',
  },
  imola: {
    fullName: 'Autodromo Enzo e Dino Ferrari',
    length: 4.909, laps: 63,
    lapRecord: { time: '1:15.484', driver: 'Max Verstappen', year: 2022 },
    mostWins: { driver: 'Michael Schumacher', wins: 7 },
    firstRace: 1980, type: 'permanente',
  },
  monaco: {
    fullName: 'Circuit de Monaco',
    length: 3.337, laps: 78,
    lapRecord: { time: '1:12.909', driver: 'Lando Norris', year: 2024 },
    mostWins: { driver: 'Ayrton Senna', wins: 6 },
    firstRace: 1950, type: 'urbano',
  },
  barcelona: {
    fullName: 'Circuit de Barcelona-Catalunya',
    length: 4.675, laps: 66,
    lapRecord: { time: '1:16.330', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Michael Schumacher', wins: 6 },
    firstRace: 1991, type: 'permanente',
  },
  montreal: {
    fullName: 'Circuit Gilles Villeneuve',
    length: 4.361, laps: 70,
    lapRecord: { time: '1:13.078', driver: 'Valtteri Bottas', year: 2019 },
    mostWins: { driver: 'Michael Schumacher', wins: 7 },
    firstRace: 1978, type: 'misto',
  },
  silverstone: {
    fullName: 'Silverstone Circuit',
    length: 5.891, laps: 52,
    lapRecord: { time: '1:27.097', driver: 'Max Verstappen', year: 2020 },
    mostWins: { driver: 'Lewis Hamilton', wins: 8 },
    firstRace: 1950, type: 'permanente',
  },
  hungaroring: {
    fullName: 'Hungaroring',
    length: 4.381, laps: 70,
    lapRecord: { time: '1:16.627', driver: 'Lewis Hamilton', year: 2020 },
    mostWins: { driver: 'Lewis Hamilton', wins: 8 },
    firstRace: 1986, type: 'permanente',
  },
  spa: {
    fullName: 'Circuit de Spa-Francorchamps',
    length: 7.004, laps: 44,
    lapRecord: { time: '1:46.286', driver: 'Valtteri Bottas', year: 2018 },
    mostWins: { driver: 'Ayrton Senna / Michael Schumacher / Lewis Hamilton', wins: 6 },
    firstRace: 1950, type: 'misto',
  },
  zandvoort: {
    fullName: 'Circuit Zandvoort',
    length: 4.259, laps: 72,
    lapRecord: { time: '1:11.097', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Max Verstappen', wins: 3 },
    firstRace: 1952, type: 'permanente',
  },
  monza: {
    fullName: 'Autodromo Nazionale Monza',
    length: 5.793, laps: 53,
    lapRecord: { time: '1:21.046', driver: 'Rubens Barrichello', year: 2004 },
    mostWins: { driver: 'Michael Schumacher', wins: 5 },
    firstRace: 1950, type: 'permanente',
  },
  baku: {
    fullName: 'Baku City Circuit',
    length: 6.003, laps: 51,
    lapRecord: { time: '1:43.009', driver: 'Charles Leclerc', year: 2019 },
    mostWins: { driver: 'Sergio Pérez', wins: 2 },
    firstRace: 2016, type: 'urbano',
  },
  singapore: {
    fullName: 'Marina Bay Street Circuit',
    length: 4.940, laps: 62,
    lapRecord: { time: '1:35.867', driver: 'Lewis Hamilton', year: 2023 },
    mostWins: { driver: 'Sebastian Vettel', wins: 5 },
    firstRace: 2008, type: 'urbano',
  },
  cota: {
    fullName: 'Circuit of the Americas',
    length: 5.513, laps: 56,
    lapRecord: { time: '1:36.169', driver: 'Charles Leclerc', year: 2019 },
    mostWins: { driver: 'Lewis Hamilton', wins: 6 },
    firstRace: 2012, type: 'permanente',
  },
  mexico: {
    fullName: 'Autodromo Hermanos Rodriguez',
    length: 4.304, laps: 71,
    lapRecord: { time: '1:17.774', driver: 'Valtteri Bottas', year: 2021 },
    mostWins: { driver: 'Max Verstappen', wins: 5 },
    firstRace: 1963, type: 'permanente',
  },
  interlagos: {
    fullName: 'Autodromo José Carlos Pace',
    length: 4.309, laps: 71,
    lapRecord: { time: '1:10.540', driver: 'Valtteri Bottas', year: 2018 },
    mostWins: { driver: 'Michael Schumacher / Ayrton Senna', wins: 4 },
    firstRace: 1973, type: 'permanente',
  },
  las_vegas: {
    fullName: 'Las Vegas Street Circuit',
    length: 6.201, laps: 50,
    lapRecord: { time: '1:35.490', driver: 'Oscar Piastri', year: 2024 },
    mostWins: { driver: 'Carlos Sainz', wins: 1 },
    firstRace: 2023, type: 'urbano',
  },
  losail: {
    fullName: 'Losail International Circuit',
    length: 5.419, laps: 57,
    lapRecord: { time: '1:24.319', driver: 'Max Verstappen', year: 2023 },
    mostWins: { driver: 'Max Verstappen', wins: 2 },
    firstRace: 2021, type: 'permanente',
  },
  yas_marina: {
    fullName: 'Yas Marina Circuit',
    length: 5.281, laps: 55,
    lapRecord: { time: '1:26.103', driver: 'Max Verstappen', year: 2021 },
    mostWins: { driver: 'Lewis Hamilton', wins: 5 },
    firstRace: 2009, type: 'permanente',
  },
  red_bull_ring: {
    fullName: 'Red Bull Ring',
    length: 4.318, laps: 71,
    lapRecord: { time: '1:05.619', driver: 'Carlos Sainz', year: 2020 },
    mostWins: { driver: 'Max Verstappen', wins: 5 },
    firstRace: 1970, type: 'permanente',
  },
}

const keywords: Record<string, string> = {
  albert: 'albert_park', australia: 'albert_park', melbourne: 'albert_park',
  shanghai: 'shanghai', china: 'shanghai',
  suzuka: 'suzuka', japan: 'suzuka', japão: 'suzuka',
  bahrain: 'bahrain', barein: 'bahrain',
  jeddah: 'jeddah', saudi: 'jeddah', arábia: 'jeddah',
  miami: 'miami',
  imola: 'imola', emilia: 'imola',
  monaco: 'monaco', mônaco: 'monaco',
  barcelona: 'barcelona', spain: 'barcelona', espanha: 'barcelona', catalunha: 'barcelona',
  montreal: 'montreal', canada: 'montreal', canadá: 'montreal', villeneuve: 'montreal',
  silverstone: 'silverstone', britain: 'silverstone', british: 'silverstone', grã: 'silverstone',
  hungaroring: 'hungaroring', hungary: 'hungaroring', hungria: 'hungaroring', budapest: 'hungaroring',
  spa: 'spa', belgium: 'spa', bélgica: 'spa', francorchamps: 'spa',
  zandvoort: 'zandvoort', netherlands: 'zandvoort', holanda: 'zandvoort',
  monza: 'monza', italy: 'monza', itália: 'monza',
  baku: 'baku', azerbaijan: 'baku', azerbaijão: 'baku',
  singapore: 'singapore', singapura: 'singapore', marina: 'singapore',
  austin: 'cota', americas: 'cota', cota: 'cota', texas: 'cota',
  mexico: 'mexico', méxico: 'mexico', hermanos: 'mexico',
  interlagos: 'interlagos', brazil: 'interlagos', brasil: 'interlagos', paulo: 'interlagos',
  vegas: 'las_vegas',
  losail: 'losail', qatar: 'losail', catar: 'losail',
  abu: 'yas_marina', dhabi: 'yas_marina', yas: 'yas_marina',
  austria: 'red_bull_ring', áustria: 'red_bull_ring', 'red bull': 'red_bull_ring', spielberg: 'red_bull_ring',
}

export function getCircuitInfo(raceName: string, circuit?: string): CircuitInfo | null {
  const search = `${raceName} ${circuit ?? ''}`.toLowerCase()
  for (const [kw, key] of Object.entries(keywords)) {
    if (search.includes(kw)) return circuits[key] ?? null
  }
  return null
}
