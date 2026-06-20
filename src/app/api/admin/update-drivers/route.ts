import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const DRIVERS_2026 = [
  { number: 1,  name: 'Lando Norris',       abbreviation: 'NOR', team: 'McLaren',       is_bortoleto: false },
  { number: 3,  name: 'Max Verstappen',      abbreviation: 'VER', team: 'Red Bull Racing', is_bortoleto: false },
  { number: 5,  name: 'Gabriel Bortoleto',   abbreviation: 'BOR', team: 'Audi',          is_bortoleto: true  },
  { number: 6,  name: 'Isack Hadjar',        abbreviation: 'HAD', team: 'Red Bull Racing', is_bortoleto: false },
  { number: 10, name: 'Pierre Gasly',        abbreviation: 'GAS', team: 'Alpine',         is_bortoleto: false },
  { number: 11, name: 'Sergio Perez',        abbreviation: 'PER', team: 'Cadillac',       is_bortoleto: false },
  { number: 12, name: 'Kimi Antonelli',      abbreviation: 'ANT', team: 'Mercedes',       is_bortoleto: false },
  { number: 14, name: 'Fernando Alonso',     abbreviation: 'ALO', team: 'Aston Martin',   is_bortoleto: false },
  { number: 16, name: 'Charles Leclerc',     abbreviation: 'LEC', team: 'Ferrari',        is_bortoleto: false },
  { number: 18, name: 'Lance Stroll',        abbreviation: 'STR', team: 'Aston Martin',   is_bortoleto: false },
  { number: 23, name: 'Alexander Albon',     abbreviation: 'ALB', team: 'Williams',       is_bortoleto: false },
  { number: 27, name: 'Nico Hülkenberg',     abbreviation: 'HUL', team: 'Audi',          is_bortoleto: false },
  { number: 30, name: 'Liam Lawson',         abbreviation: 'LAW', team: 'Racing Bulls',   is_bortoleto: false },
  { number: 31, name: 'Esteban Ocon',        abbreviation: 'OCO', team: 'Haas',           is_bortoleto: false },
  { number: 41, name: 'Arvid Lindblad',      abbreviation: 'LIN', team: 'Racing Bulls',   is_bortoleto: false },
  { number: 43, name: 'Franco Colapinto',    abbreviation: 'COL', team: 'Alpine',         is_bortoleto: false },
  { number: 44, name: 'Lewis Hamilton',      abbreviation: 'HAM', team: 'Ferrari',        is_bortoleto: false },
  { number: 55, name: 'Carlos Sainz',        abbreviation: 'SAI', team: 'Williams',       is_bortoleto: false },
  { number: 63, name: 'George Russell',      abbreviation: 'RUS', team: 'Mercedes',       is_bortoleto: false },
  { number: 77, name: 'Valtteri Bottas',     abbreviation: 'BOT', team: 'Cadillac',       is_bortoleto: false },
  { number: 81, name: 'Oscar Piastri',       abbreviation: 'PIA', team: 'McLaren',        is_bortoleto: false },
  { number: 87, name: 'Oliver Bearman',      abbreviation: 'BEA', team: 'Haas',           is_bortoleto: false },
]

export async function POST() {
  const supabase = await createServiceClient()

  // Delete all existing drivers
  await supabase.from('drivers').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Insert updated 2026 grid
  const { error } = await supabase.from('drivers').insert(DRIVERS_2026)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, drivers: DRIVERS_2026.length })
}
