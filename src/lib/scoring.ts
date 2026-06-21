import type { Prediction, RaceResult } from './types/database'

export interface ScoreBreakdown {
  pole_points: number
  p1_points: number
  p2_points: number
  p3_points: number
  random_pos_points: number
  bortoleto_points: number
  total_points: number
}

export function calculateScore(
  prediction: Prediction,
  result: RaceResult
): ScoreBreakdown {
  const podium = new Set([result.p1_driver_id, result.p2_driver_id, result.p3_driver_id].filter(Boolean))

  // Pole: 2 pts for exact
  const pole_points = prediction.pole_driver_id && prediction.pole_driver_id === result.pole_driver_id ? 2 : 0

  // P1: 3 pts exact, 1 pt if driver is anywhere on podium
  const p1_points = (() => {
    if (!prediction.p1_driver_id) return 0
    if (prediction.p1_driver_id === result.p1_driver_id) return 3
    if (podium.has(prediction.p1_driver_id)) return 1
    return 0
  })()

  // P2: 3 pts exact, 1 pt if driver is anywhere on podium
  const p2_points = (() => {
    if (!prediction.p2_driver_id) return 0
    if (prediction.p2_driver_id === result.p2_driver_id) return 3
    if (podium.has(prediction.p2_driver_id)) return 1
    return 0
  })()

  // P3: 3 pts exact, 1 pt if driver is anywhere on podium
  const p3_points = (() => {
    if (!prediction.p3_driver_id) return 0
    if (prediction.p3_driver_id === result.p3_driver_id) return 3
    if (podium.has(prediction.p3_driver_id)) return 1
    return 0
  })()

  // Random position: 4 pts exact match only
  const random_pos_points =
    prediction.random_pos_driver_id &&
    prediction.random_pos_driver_id === result.random_pos_driver_id
      ? 4
      : 0

  // Bortoleto position: 4 pts exact match only
  const bortoleto_points =
    prediction.bortoleto_position !== null &&
    prediction.bortoleto_position === result.bortoleto_position
      ? 4
      : 0

  const total_points =
    pole_points + p1_points + p2_points + p3_points + random_pos_points + bortoleto_points

  return { pole_points, p1_points, p2_points, p3_points, random_pos_points, bortoleto_points, total_points }
}
