/**
 * Ageing: how attributes grow, peak and decline, and how wear accumulates.
 *
 * The shape the whole game hangs on: teenagers improve fast, players peak
 * roughly 26-30, and after that the decline rate depends on what kind of player
 * you chose to be. Physical falls off a cliff; mental and scoring barely move.
 */

import type { Attributes, AttributeKey, Player } from './types'
import { ATTRIBUTE_KEYS } from './types'
import { Rng, clamp } from './rng'
import { getStyle } from '@/data/styles'

/**
 * Development earned on the floor.
 *
 * Progression used to come only from the preseason, which made a great season
 * and a terrible one develop you identically: the year you played had no
 * bearing on who you became. This adds growth proportional to how the season
 * went, so form compounds and a breakout year changes your trajectory. Young
 * players learn fastest from it; a 34-year-old learns almost nothing.
 */
export function developFromSeason(
  player: Player,
  seasonRating: number,
  minutesPerGame: number,
  rng: Rng,
): void {
  // Sitting on the bench teaches you very little.
  if (minutesPerGame < 8) return

  const performance = clamp((seasonRating - 46) / 9, 0, 5)
  const youth = player.age <= 22 ? 1.35 : player.age <= 27 ? 1 : player.age <= 31 ? 0.55 : 0.2
  const points = Math.round(performance * youth)
  if (points <= 0) return

  const weights = POSITION_WEIGHTS[player.position]
  for (let i = 0; i < points; i++) {
    player.growthPoints += 1
    // Weighted toward what the position uses, but not exclusively: you improve
    // at what the season put in front of you.
    const key = rng.weighted(ATTRIBUTE_KEYS, (k) => 1 + (weights[k] ?? 0.02) * 6)
    if (!spendGrowthPoint(player, key)) player.growthPoints -= 1
  }
  player.growthPoints = 0
}

/**
 * How fast each attribute falls once past its peak, in points per year.
 * Physical is the gamble and mental is the hedge. That contrast is what makes
 * an ageing career interesting, so the merge preserves it at the extremes.
 */
const DECLINE_RATE: Record<AttributeKey, number> = {
  physical: 0.75, // between athleticism's 1.0 and strength's 0.45, weighted to the explosion you lose first
  defense: 0.5,
  playmaking: 0.3, // handling's old rate; the hands go slowly
  scoring: 0.15, // a jump shot survives almost everything
  mental: -0.3, // negative: experience keeps accruing into the late 30s
}

/** Age at which each attribute stops growing on its own and starts to fade. */
const PEAK_AGE: Record<AttributeKey, number> = {
  physical: 25,
  playmaking: 27,
  defense: 28,
  scoring: 30,
  mental: 40,
}

/**
 * Apply one year of natural ageing. Called at the start of each preseason,
 * before perks are offered.
 */
export function ageOneYear(player: Player, rng: Rng): void {
  const style = getStyle(player.styleId)
  // Wear makes decline bite earlier and harder. A 32-year-old with 70 wear ages
  // like a 36-year-old with none.
  const wearPenalty = player.hidden.wear / 100

  for (const key of ATTRIBUTE_KEYS) {
    const peak = PEAK_AGE[key]
    let delta: number

    if (player.age < peak) {
      // Natural improvement, steepest as a teenager and tapering toward the peak.
      const distance = peak - player.age
      delta = rng.float(0.2, 1.1) * Math.min(1, distance / 6)
      // Highlight athletes bloom physically faster than they learn.
      if (key === 'physical' && style.id === 'highlight') delta *= 1.25
      if (key === 'mental' && style.id === 'highlight') delta *= 0.7
    } else {
      const yearsPast = player.age - peak
      const rate = DECLINE_RATE[key]
      if (rate <= 0) {
        // Mental keeps creeping up; experience is cumulative.
        delta = rng.float(0, -rate * 1.4)
      } else {
        const severity = rate * (0.35 + yearsPast * 0.16) * (1 + wearPenalty * 1.3)
        delta = -rng.float(severity * 0.5, severity * 1.5)
      }
    }

    player.attributes[key] = clamp(player.attributes[key] + delta, 5, 99)
  }

  player.age += 1
}

/**
 * Spend a growth point on an attribute. Returns false if the spend is illegal.
 *
 * Returns are steeply diminishing on purpose: it keeps a realistic ceiling
 * (a great player tops out in the high 80s, not at 99 across the board) and it
 * makes specialising in two attributes a different build from spreading
 * points evenly.
 */
export function spendGrowthPoint(player: Player, key: AttributeKey): boolean {
  if (player.growthPoints <= 0) return false
  const current = player.attributes[key]
  if (current >= 96) return false

  // Every rung is the seven-attribute ladder (0.15 / 0.4 / 0.85 / 1.5 / 2.3)
  // scaled by 0.675. The gain-per-point ladder was tuned when a growth point
  // was one of seven attributes: since `overallRating` is a weighted
  // *average*, the same number of points spread over five attributes instead
  // of seven moves it about 7/5 as fast, and careers inflated across the
  // board. Scaling here rather than cutting the per-point gain keeps the
  // diminishing-returns shape, and the choice between specialising and
  // spreading, exactly as it was. 0.675 rather than the arithmetic
  // 5/7 = 0.714 most likely because development feeds back on itself: a
  // better season earns more points in `developFromSeason`, so the inflation
  // compounds beyond what the averaging alone predicts. The factor was
  // measured against `__fixtures__/career-baseline.json`, not derived, so
  // that explanation for the gap is inferred rather than tested.
  //
  // Every point that reaches this function comes from `developFromSeason` or
  // from a perk's bonus (perks.ts, `takePerk`). Both grant and spend within
  // a single call, so `player.growthPoints` is never left holding a balance
  // between preseasons.
  const gain =
    current >= 90 ? 0.101 : current >= 84 ? 0.27 : current >= 76 ? 0.574 : current >= 64 ? 1.013 : 1.552

  player.attributes[key] = clamp(current + gain, 5, 96)
  player.growthPoints -= 1
  return true
}

/**
 * Positional value of each attribute. Drives both rating and how season
 * development (`developFromSeason`, above) distributes its growth points.
 *
 * Each row sums to 1, though `overallRating` normalises anyway. The old
 * seven-key rows folded in here: handling and part of iq into playmaking,
 * athleticism and strength into physical, leadership and the rest of iq into
 * mental, with iq leaning toward playmaking for guards, who read the floor
 * with the ball, and toward mental for bigs, who read it without.
 */
const POSITION_WEIGHTS: Record<string, Partial<Record<AttributeKey, number>>> = {
  PG: { playmaking: 0.38, scoring: 0.22, physical: 0.16, mental: 0.14, defense: 0.1 },
  SG: { scoring: 0.3, playmaking: 0.24, physical: 0.22, defense: 0.16, mental: 0.08 },
  SF: { physical: 0.34, scoring: 0.22, defense: 0.2, playmaking: 0.18, mental: 0.06 },
  PF: { physical: 0.44, defense: 0.24, scoring: 0.16, playmaking: 0.08, mental: 0.08 },
  C: { physical: 0.48, defense: 0.28, scoring: 0.1, mental: 0.09, playmaking: 0.05 },
}

/**
 * Overall rating: one number for "how good is this player right now", weighted
 * by position because a centre who can't dribble is not a flawed player.
 */
export function overallRating(player: Player): number {
  const a = player.attributes
  const w = POSITION_WEIGHTS[player.position]
  let total = 0
  let weightSum = 0
  for (const key of ATTRIBUTE_KEYS) {
    const weight = w[key] ?? 0
    total += a[key] * weight
    weightSum += weight
  }
  return clamp(total / (weightSum || 1), 5, 99)
}

/** Sum of all attributes, used for "did this player develop" style checks. */
export function attributeTotal(attributes: Attributes): number {
  return ATTRIBUTE_KEYS.reduce((sum, key) => sum + attributes[key], 0)
}

/**
 * Nobody walks away from the game before this age on their own. A career can
 * still end earlier, but only through a catastrophic-injury event that sets
 * `retire` explicitly, never through the ageing roll. Without this floor a
 * raw 17-year-old reads as "washed up" purely because their rating is low.
 */
export const MIN_RETIREMENT_AGE = 29

/**
 * Whether the player's body is telling them to stop. Not a hard rule, since
 * the engine also offers retirement as a choice, but it is the forcing
 * function.
 */
export function retirementPressure(player: Player): number {
  if (player.age < MIN_RETIREMENT_AGE) return 0

  const ageFactor = Math.max(0, player.age - 32) * 0.11
  const wearFactor = Math.max(0, player.hidden.wear - 55) * 0.012
  // Losing your job only ends a career once you are old enough that nobody is
  // developing you any more.
  const skillFactor = player.age >= 30 ? Math.max(0, 55 - overallRating(player)) * 0.02 : 0
  const moraleFactor = Math.max(0, 35 - player.hidden.morale) * 0.01
  return clamp(ageFactor + wearFactor + skillFactor + moraleFactor, 0, 0.97)
}
