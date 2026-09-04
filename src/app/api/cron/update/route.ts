import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getFinalPositions } from '@/lib/openf1'
import { getEspnPositions, achaDriverPorNome } from '@/lib/espn'
import { calculateScore } from '@/lib/scoring'
import { pickRandomChallenge } from '@/lib/challengeBank'
import type { Prediction, Race } from '@/lib/types/database'

// GET /api/cron/update
// Called by Vercel Cron (or cron-job.org) every 5-10 minutes.
// 1. Closes predictions for races where Q1 has started
// 2. Imports results for races that should be finished
// 3. Opens the next race as soon as a race is marked finished
export async function GET(req: NextRequest) {
  // Protegida por CRON_SECRET, e FALHA FECHADO de proposito.
  //
  // Isto ja nasceu como `if (secret) { ... }`, e o efeito foi que a rota ficou
  // ABERTA em producao por meses: a variavel nunca foi cadastrada na Vercel, e
  // sem ela a validacao inteira era pulada — sem erro, sem log, sem sintoma.
  // Recusar quando o segredo nao esta configurado torna esse esquecimento
  // visivel (a rotina para e alguem percebe) em vez de silencioso.
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET nao configurado' }, { status: 503 })
  }
  const auth = req.headers.get('authorization') ?? req.nextUrl.searchParams.get('secret')
  if (auth !== `Bearer ${secret}` && auth !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const now = new Date()
  const log: string[] = []

  // ── 0. Auto-assign OpenF1 session keys for races missing them ─────────────
  await autoAssignSessionKeys(supabase, log)

  // ── 1. Close predictions for races where FP1 has started ──────────────────
  const { data: openRaces } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'open')

  for (const race of (openRaces as Race[] ?? [])) {
    // Use FP1 time if available, otherwise fall back to qualifying time
    const deadline = race.fp1_start_time ?? race.qualifying_start_time
    if (new Date(deadline) <= now) {
      await supabase.from('races').update({ status: 'closed' }).eq('id', race.id)
      log.push(`Closed predictions for: ${race.name} (deadline: ${deadline})`)
    }
  }

  // ── 2. Try to import results for closed races whose race time has passed ──
  const { data: closedRaces } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'closed')

  for (const race of (closedRaces as Race[] ?? [])) {
    // Only attempt after race_start_time + 2 hours (gives time for race to finish)
    const raceEndEstimate = new Date(new Date(race.race_start_time).getTime() + 2 * 60 * 60 * 1000)
    if (now < raceEndEstimate) continue

    const finished = await tryImportResults(race, supabase, log)

    if (finished) {
      // ── 3. Open the next race automatically ────────────────────────────
      const { data: nextRace } = await supabase
        .from('races')
        .select('*')
        .eq('round_number', race.round_number + 1)
        .eq('status', 'upcoming')
        .maybeSingle()

      if (nextRace) {
        const randomPosition = Math.floor(Math.random() * 17) + 4 // P4–P20
        const challenge = pickRandomChallenge()
        await supabase
          .from('races')
          .update({
            status: 'open',
            random_position: randomPosition,
            challenge_question: challenge.question,
            challenge_options: challenge.options,
            challenge_correct: null,
          })
          .eq('id', (nextRace as Race).id)
        log.push(`Opened predictions for: ${(nextRace as Race).name} (P${randomPosition} aleatória · desafio: "${challenge.question}")`)
      }
    }
  }

  return NextResponse.json({ ok: true, timestamp: now.toISOString(), log })
}

async function autoAssignSessionKeys(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  log: string[]
) {
  const { data: racesWithoutKeys } = await supabase
    .from('races')
    .select('*')
    .in('status', ['closed', 'open'])
    .is('openf1_race_session_key', null)

  if (!(racesWithoutKeys ?? []).length) return

  try {
    const res = await fetch('https://api.openf1.org/v1/sessions?year=2026')
    if (!res.ok) return
    const sessions = await res.json() as {
      session_key: number; session_type: string
      meeting_key: number; country_name: string; date_start: string
    }[]

    const byMeeting = new Map<number, { race?: (typeof sessions)[0]; quali?: (typeof sessions)[0] }>()
    for (const s of sessions) {
      const g = byMeeting.get(s.meeting_key) ?? {}
      if (s.session_type === 'Race') g.race = s
      if (s.session_type === 'Qualifying') g.quali = s
      byMeeting.set(s.meeting_key, g)
    }

    for (const race of (racesWithoutKeys as Race[] ?? [])) {
      const raceDate = new Date(race.race_start_time)
      let bestKey: number | null = null
      let bestQualiKey: number | null = null
      let bestDiff = Infinity

      for (const [, g] of byMeeting) {
        if (!g.race) continue
        const diff = Math.abs(new Date(g.race.date_start).getTime() - raceDate.getTime())
        const countryMatch = race.country &&
          (g.race.country_name.toLowerCase().includes(race.country.toLowerCase()) ||
           race.country.toLowerCase().includes(g.race.country_name.toLowerCase()))
        if (diff < 36 * 60 * 60 * 1000 && countryMatch && diff < bestDiff) {
          bestKey = g.race.session_key
          bestQualiKey = g.quali?.session_key ?? null
          bestDiff = diff
        }
      }

      if (bestKey) {
        await supabase.from('races').update({
          openf1_race_session_key: bestKey,
          openf1_quali_session_key: bestQualiKey,
        }).eq('id', race.id)
        log.push(`Auto-assigned session keys for: ${race.name} (race: ${bestKey}, quali: ${bestQualiKey ?? 'none'})`)
      }
    }
  } catch (err) {
    log.push(`Error auto-assigning session keys: ${err}`)
  }
}

async function tryImportResults(
  race: Race,
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  log: string[]
): Promise<boolean> {
  try {
    const { data: drivers } = await supabase.from('drivers').select('*')
    if (!drivers) return false

    const byNumber = new Map(drivers.map(d => [d.number, d]))

    // Posicoes por NUMERO (OpenF1) ou por NOME (ESPN) — daqui para baixo o
    // resto do fluxo so precisa de position + o id do piloto.
    let racePositions: { position: number; driverId: string | null }[] = []
    let fonte = 'OpenF1'

    if (race.openf1_race_session_key) {
      try {
        const openf1 = await getFinalPositions(race.openf1_race_session_key)
        racePositions = openf1.map(p => ({ position: p.position, driverId: byNumber.get(p.driver_number)?.id ?? null }))
      } catch (err) {
        log.push(`OpenF1 indisponivel para ${race.name}: ${err}`)
      }
    }

    // A OpenF1 responde 401 enquanto ha sessao ao vivo para quem nao tem chave
    // paga — justamente a janela do fim da corrida. Sem esta alternativa, a
    // rodada terminava sem resultado e so dizia "not ready yet".
    if (racePositions.length < 10) {
      const espn = await getEspnPositions(race.race_start_time)
      // Só grava como FINAL o que a ESPN considera encerrado: no meio da
      // corrida as posicoes existem e nao sao resultado nenhum.
      if (espn.isCompleted && espn.racePositions.length >= 10) {
        racePositions = espn.racePositions.map(p => ({
          position: p.position,
          driverId: achaDriverPorNome(drivers, p.driverName)?.id ?? null,
        }))
        fonte = 'ESPN'
      }
    }

    // Need at least 10 classified finishers to consider the race done
    if (racePositions.length < 10) {
      log.push(`Results not ready yet for: ${race.name} (${racePositions.length} positions)`)
      return false
    }

    const p1 = racePositions.find(p => p.position === 1)
    const p2 = racePositions.find(p => p.position === 2)
    const p3 = racePositions.find(p => p.position === 3)

    if (!p1 || !p2 || !p3) {
      log.push(`P1/P2/P3 not available yet for: ${race.name}`)
      return false
    }

    const p1Id = p1.driverId
    const p2Id = p2.driverId
    const p3Id = p3.driverId

    // Pole: OpenF1 pela sessao de classificacao e, na falta dela, o nome que a
    // ESPN da para o 1o da Qual. Pole ausente nao impede gravar o resultado —
    // ela vale 2 pontos, o resto da corrida vale muito mais.
    let poleDriverId: string | null = null
    if (race.openf1_quali_session_key) {
      try {
        const qualiPositions = await getFinalPositions(race.openf1_quali_session_key)
        const pole = qualiPositions.find(p => p.position === 1)
        if (pole) poleDriverId = byNumber.get(pole.driver_number)?.id ?? null
      } catch {}
    }
    if (!poleDriverId) {
      const espn = await getEspnPositions(race.race_start_time)
      if (espn.poleDriverName) poleDriverId = achaDriverPorNome(drivers, espn.poleDriverName)?.id ?? null
    }

    // Random position driver
    let randomPosDriverId: string | null = null
    if (race.random_position) {
      randomPosDriverId = racePositions.find(p => p.position === race.random_position)?.driverId ?? null
    }

    // Bortoleto position
    const bortoleto = drivers.find(d => d.is_bortoleto)
    let bortoletoPosition: number | null = null
    if (bortoleto) {
      bortoletoPosition = racePositions.find(p => p.driverId === bortoleto.id)?.position ?? null
    }

    // Upsert result
    await supabase.from('race_results').upsert({
      race_id: race.id,
      pole_driver_id: poleDriverId,
      p1_driver_id: p1Id,
      p2_driver_id: p2Id,
      p3_driver_id: p3Id,
      random_pos_driver_id: randomPosDriverId,
      bortoleto_position: bortoletoPosition,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'race_id' })

    // Compute scores for all predictions
    const { data: savedResult } = await supabase
      .from('race_results').select('*').eq('race_id', race.id).single()

    if (savedResult) {
      const { data: predictions } = await supabase
        .from('predictions').select('*').eq('race_id', race.id)

      if (predictions?.length) {
        const scoreUpserts = (predictions as Prediction[]).map(pred => ({
          user_id: pred.user_id,
          race_id: race.id,
          ...calculateScore(pred, savedResult, race.challenge_correct),
        }))
        await supabase.from('scores').upsert(scoreUpserts, { onConflict: 'user_id,race_id' })
      }
    }

    // Mark race as finished
    await supabase.from('races').update({ status: 'finished' }).eq('id', race.id)
    log.push(`Results imported and scores calculated for: ${race.name} (fonte: ${fonte})`)
    return true
  } catch (err) {
    log.push(`Error importing results for ${race.name}: ${err}`)
    return false
  }
}
