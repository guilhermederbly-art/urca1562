export type CircuitInfo = {
  laps: number
  wikiImage: string
}

const circuits: Record<string, CircuitInfo> = {
  albert_park:  { laps: 58, wikiImage: 'Albert_Park_Grand_Prix_Circuit.svg' },
  shanghai:     { laps: 56, wikiImage: 'Shanghai_circuit.svg' },
  suzuka:       { laps: 53, wikiImage: 'Suzuka_circuit_2005.svg' },
  bahrain:      { laps: 57, wikiImage: 'Bahrain_International_Circuit_2010.svg' },
  jeddah:       { laps: 50, wikiImage: 'Jeddah_circuit.svg' },
  miami:        { laps: 57, wikiImage: 'Miami_International_Autodrome.svg' },
  monaco:       { laps: 78, wikiImage: 'Circuit_de_Monaco.svg' },
  montreal:     { laps: 70, wikiImage: 'Circuit_Gilles_Villeneuve.svg' },
  barcelona:    { laps: 66, wikiImage: 'Circuit_de_Barcelona-Catalunya.svg' },
  red_bull_ring:{ laps: 71, wikiImage: 'Red_Bull_Ring.svg' },
  silverstone:  { laps: 52, wikiImage: 'Silverstone_circuit_2020.svg' },
  spa:          { laps: 44, wikiImage: 'Spa-Francorchamps_of_Belgium.svg' },
  hungaroring:  { laps: 70, wikiImage: 'Hungaroring.svg' },
  zandvoort:    { laps: 72, wikiImage: 'Circuit_Zandvoort.svg' },
  monza:        { laps: 53, wikiImage: 'Monza_track_map.svg' },
  madrid:       { laps: 55, wikiImage: 'Madrid_Street_Circuit.svg' },
  baku:         { laps: 51, wikiImage: 'Baku_City_Circuit.svg' },
  singapore:    { laps: 62, wikiImage: 'Marina_Bay_Street_Circuit.svg' },
  cota:         { laps: 56, wikiImage: 'Circuit_of_the_Americas.svg' },
  mexico:       { laps: 71, wikiImage: 'Autodromo_Hermanos_Rodriguez.svg' },
  interlagos:   { laps: 71, wikiImage: 'Interlagos.svg' },
  las_vegas:    { laps: 50, wikiImage: 'Las_Vegas_Street_Circuit.svg' },
  losail:       { laps: 57, wikiImage: 'Losail_International_Circuit.svg' },
  yas_marina:   { laps: 55, wikiImage: 'Yas_Marina_Circuit.svg' },
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
  barcelona: 'barcelona', spain: 'barcelona', espanha: 'barcelona', catalunha: 'barcelona',
  spielberg: 'red_bull_ring', austria: 'red_bull_ring', áustria: 'red_bull_ring', 'red bull': 'red_bull_ring',
  silverstone: 'silverstone', britain: 'silverstone', british: 'silverstone', grã: 'silverstone',
  spa: 'spa', belgium: 'spa', bélgica: 'spa', francorchamps: 'spa',
  hungaroring: 'hungaroring', hungary: 'hungaroring', hungria: 'hungaroring', budapest: 'hungaroring',
  zandvoort: 'zandvoort', netherlands: 'zandvoort', holanda: 'zandvoort',
  monza: 'monza', italy: 'monza', itália: 'monza',
  madrid: 'madrid', spain2: 'madrid',
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

export function getCircuitImageUrl(wikiImage: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(wikiImage)}?width=500`
}
