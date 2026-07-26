/**
 * Ageing: how attributes grow, peak and decline, and how wear accumulates.
 *
 * The shape the whole game hangs on — teenagers improve fast, players peak
 * roughly 26-30, and after that the decline rate depends on what kind of player
 * you chose to be. Athleticism falls off a cliff; IQ and shooting barely move.
 */

import type { Attributes, AttributeKey, Player } from './types'
import { ATTRIBUTE_KEYS } from './types'
import { Rng, clamp } from './rng'
import { getStyle } from '@/data/styles'

/** Growth points handed out at each preseason, by age. */
export function growthPointsFor(age: number, rng: Rng): number {
  if (age <= 17) return rng.int(5, 7)
  if (age <= 21) return rng.int(4, 6)
  if (age <= 25) return rng.int(3, 5)
  if (age <= 29) return rng.int(2, 4)
  if (age <= 33) return rng.int(1, 2)
  return rng.int(0, 1)
}

/**
 * Development earned on the floor.
 *
 * Progression used to come only from the preseason, which made a great season
 * and a terrible one develop you identically — the year you actually played had
 * no bearing on who you became. This adds growth proportional to how the season
 * went, so form compounds and a breakout year genuinely changes your trajectory.
 * Young players learn fastest from it; a 34-year-old learns almost nothing.
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
    // Weighted toward what the position uses, but not exclusively — you improve
    // at what the season put in front of you.
    const key = rng.weighted(ATTRIBUTE_KEYS, (k) => 1 + (weights[k] ?? 0.02) * 6)
    if (!spendGrowthPoint(player, key)) player.growthPoints -= 1
  }
  player.growthPoints = 0
}

/**
 * How fast each attribute moves with age. Positive = still growing at that age.
 * These per-attribute curves are what make Atletismo a gamble and IQ a hedge.
 */
const DECLINE_RATE: Record<AttributeKey, number> = {
  athleticism: 1.0,
  strength: 0.45,
  handling: 0.3,
  defense: 0.5,
  shooting: 0.15,
  iq: -0.25, // keeps improving into the late 30s
  leadership: -0.35,
}

/** Age at which each attribute stops growing on its own and starts to fade. */
const PEAK_AGE: Record<AttributeKey, number> = {
  athleticism: 24,
  strength: 27,
  handling: 27,
  defense: 28,
  shooting: 30,
  iq: 40,
  leadership: 40,
}

/**
 * Apply one year of natural ageing. Called at the start of each preseason,
 * before the player spends growth points.
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
      if (key === 'athleticism' && style.id === 'highlight') delta *= 1.25
      if (key === 'iq' && style.id === 'highlight') delta *= 0.7
    } else {
      const yearsPast = player.age - peak
      const rate = DECLINE_RATE[key]
      if (rate <= 0) {
        // IQ and leadership keep creeping up — experience is cumulative.
        delta = rng.float(0, -rate * 1.4)
      } else {
        const severity = rate * (0.35 + yearsPast * 0.16) * (1 + wearPenalty * 1.3)
        delta = -rng.float(severity * 0.5, severity * 1.5)
      }
    }

    player.attributes[key] = clamp(player.attributes[key] + delta, 5, 99)
  }

  player.age += 1
  player.growthPoints += growthPointsFor(player.age, rng)
}

/**
 * Spend a growth point on an attribute. Returns false if the spend is illegal.
 *
 * Returns are steeply diminishing on purpose: it keeps a realistic ceiling
 * (a great player tops out in the high 80s, not at 99 across the board) and it
 * makes specialising in two attributes a genuinely different build from
 * spreading points evenly.
 */
export function spendGrowthPoint(player: Player, key: AttributeKey): boolean {
  if (player.growthPoints <= 0) return false
  const current = player.attributes[key]
  if (current >= 96) return false

  const gain =
    current >= 90 ? 0.15 : current >= 84 ? 0.4 : current >= 76 ? 0.85 : current >= 64 ? 1.5 : 2.3

  player.attributes[key] = clamp(current + gain, 5, 96)
  player.growthPoints -= 1
  return true
}

/**
 * Spend any points the player left unallocated, weighted toward what their
 * position actually needs.
 *
 * Growth points are the player's main lever, but a career must not quietly
 * collapse because someone clicked past the preseason screen — an unallocated
 * player should develop like a generically well-coached one, just without the
 * focus that specialisation buys.
 */
export function autoSpendGrowth(player: Player, rng: Rng): void {
  let guard = 0
  while (player.growthPoints > 0 && guard < 60) {
    guard++
    const weights = POSITION_WEIGHTS[player.position]
    // Deliberately near-flat. Auto-spending must produce a well-rounded,
    // unremarkable player — if it followed positional weights exactly it would
    // out-optimise the player's own choices and every career would peak elite.
    const key = rng.weighted(ATTRIBUTE_KEYS, (k) => 1 + (weights[k] ?? 0.02) * 1.4)
    if (!spendGrowthPoint(player, key)) {
      // That attribute is maxed. Try the rest before giving up.
      const spendable = ATTRIBUTE_KEYS.filter((k) => player.attributes[k] < 96)
      if (spendable.length === 0) {
        player.growthPoints = 0
        return
      }
      spendGrowthPoint(player, rng.pick(spendable))
    }
  }
}

/** Positional value of each attribute. Drives both rating and auto-spending. */
const POSITION_WEIGHTS: Record<string, Partial<Record<AttributeKey, number>>> = {
  PG: { handling: 0.26, shooting: 0.22, iq: 0.2, athleticism: 0.14, defense: 0.1, leadership: 0.06, strength: 0.02 },
  SG: { shooting: 0.3, handling: 0.18, athleticism: 0.18, defense: 0.16, iq: 0.12, strength: 0.04, leadership: 0.02 },
  SF: { shooting: 0.22, athleticism: 0.22, defense: 0.2, handling: 0.14, strength: 0.12, iq: 0.08, leadership: 0.02 },
  PF: { strength: 0.24, defense: 0.24, athleticism: 0.2, shooting: 0.16, iq: 0.1, handling: 0.04, leadership: 0.02 },
  C: { strength: 0.3, defense: 0.28, athleticism: 0.18, iq: 0.12, shooting: 0.1, handling: 0.01, leadership: 0.01 },
}

/**
 * Overall rating — one number for "how good is this player right now", weighted
 * by position because a centre who can't dribble is not a flawed player.
 */
export function overallRating(player: Player): number {
  const a = player.attributes
  const weights: Record<string, Partial<Record<AttributeKey, number>>> = {
    PG: { handling: 0.26, shooting: 0.22, iq: 0.2, athleticism: 0.14, defense: 0.1, leadership: 0.06, strength: 0.02 },
    SG: { shooting: 0.3, handling: 0.18, athleticism: 0.18, defense: 0.16, iq: 0.12, strength: 0.04, leadership: 0.02 },
    SF: { shooting: 0.22, athleticism: 0.22, defense: 0.2, handling: 0.14, strength: 0.12, iq: 0.08, leadership: 0.02 },
    PF: { strength: 0.24, defense: 0.24, athleticism: 0.2, shooting: 0.16, iq: 0.1, handling: 0.04, leadership: 0.02 },
    C: { strength: 0.3, defense: 0.28, athleticism: 0.18, iq: 0.12, shooting: 0.1, handling: 0.01, leadership: 0.01 },
  }
  const w = weights[player.position]
  let total = 0
  let weightSum = 0
  for (const key of ATTRIBUTE_KEYS) {
    const weight = w[key] ?? 0
    total += a[key] * weight
    weightSum += weight
  }
  return clamp(total / (weightSum || 1), 5, 99)
}

/** Sum of all attributes — used for "did this player develop" style checks. */
export function attributeTotal(attributes: Attributes): number {
  return ATTRIBUTE_KEYS.reduce((sum, key) => sum + attributes[key], 0)
}

/**
 * Nobody walks away from the game before this age on their own. A career can
 * still end earlier, but only through a catastrophic-injury event that sets
 * `retire` explicitly — never through the ageing roll. Without this floor a
 * raw 17-year-old reads as "washed up" purely because their rating is low.
 */
export const MIN_RETIREMENT_AGE = 29

/**
 * Whether the player's body is telling them to stop. Not a hard rule — the
 * engine also offers retirement as a choice — but this is the forcing function.
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
