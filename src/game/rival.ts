/**
 * The career-long rival.
 *
 * Picked at creation from the real-star pool, position-matched, then simulated
 * in parallel on a forked RNG stream so their career never perturbs yours. The
 * point isn't balance — it's having someone specific to be measured against for
 * twenty years.
 */

import type { Player, Rival } from './types'
import { Rng, clamp, round } from './rng'
import { REAL_STARS, type RealStar } from '@/data/people'
import { getCountry } from '@/data/countries'

export function createRival(player: Player, rng: Rng): Rival {
  // Prefer a same-position rival; fall back to the same positional group so a
  // centre never ends up "rivals" with a point guard.
  const samePosition = REAL_STARS.filter((star) => star.position === player.position)
  const group = positionGroup(player.position)
  const sameGroup = REAL_STARS.filter((star) => positionGroup(star.position) === group)
  const pool = samePosition.length >= 3 ? samePosition : sameGroup.length >= 3 ? sameGroup : REAL_STARS

  // A rival from your own country makes the story sharper, so weight for it.
  const star = rng.weighted(pool, (s) => (s.countryCode === player.countryCode ? 3 : 1))

  return {
    name: star.name,
    countryCode: star.countryCode,
    position: star.position,
    origin: originStory(star, player, rng),
    totals: {
      seasons: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      rings: 0,
      mvps: 0,
      allStars: 0,
      peakRating: 0,
    },
    history: [],
    retired: false,
    retirementYear: null,
  }
}

function positionGroup(position: string): 'guard' | 'wing' | 'big' {
  if (position === 'PG' || position === 'SG') return 'guard'
  if (position === 'SF') return 'wing'
  return 'big'
}

function originStory(star: RealStar, player: Player, rng: Rng) {
  const country = getCountry(player.countryCode)
  if (star.countryCode === player.countryCode) {
    return {
      es: `Se criaron juntos en las inferiores de ${country.name.es}. Siempre fueron la comparación del otro.`,
      en: `You came up together in ${country.name.en}'s youth system. You were always each other's benchmark.`,
    }
  }
  const options = [
    {
      es: 'Se cruzaron por primera vez en un torneo juvenil internacional y nunca dejaron de compararse.',
      en: 'You first met at an international youth tournament and never stopped being compared.',
    },
    {
      es: 'Los scouts los pusieron en la misma clase de draft. Desde ahí, cada nota mencionaba a los dos.',
      en: 'Scouts put you in the same draft class. From then on, every article mentioned you both.',
    },
    {
      es: 'Debutaron el mismo año. Los medios necesitaban una rivalidad y ustedes fueron la elegida.',
      en: 'You debuted the same year. The media needed a rivalry, and you two were it.',
    },
  ]
  return rng.pick(options)
}

/**
 * Advance the rival one season. Independent of the player's simulation, driven
 * by their own age curve toward their ceiling.
 */
export function advanceRival(rival: Rival, year: number, playerAge: number, rng: Rng): void {
  if (rival.retired) return

  const star = REAL_STARS.find((s) => s.name === rival.name)
  const ceiling = star?.ceiling ?? 82
  // Rivals share the player's age — they came up together.
  const age = playerAge

  if (age < 18) {
    // Still in the youth system; nothing to log yet.
    return
  }

  // Rating tracks a standard curve toward the rival's ceiling, peaking ~27.
  const developmentCurve = clamp((age - 17) / 10, 0, 1)
  const declineCurve = age > 30 ? clamp((age - 30) / 12, 0, 0.85) : 0
  const rating = clamp(
    rng.gauss(ceiling * (0.55 + developmentCurve * 0.45) * (1 - declineCurve), 5),
    20,
    99,
  )

  // Points roughly track rating; the rival's box score exists to be compared.
  const ppg = round(clamp(rng.gauss(rating * 0.3, 2.2), 2, 36), 1)
  const rpg = round(clamp(rng.gauss(rating * (positionGroup(rival.position) === 'big' ? 0.13 : 0.06), 1.2), 0.5, 15), 1)
  const apg = round(clamp(rng.gauss(rating * (positionGroup(rival.position) === 'guard' ? 0.09 : 0.04), 1.1), 0.3, 12), 1)

  rival.totals.seasons += 1
  rival.totals.points = round(rival.totals.points + ppg, 1)
  rival.totals.rebounds = round(rival.totals.rebounds + rpg, 1)
  rival.totals.assists = round(rival.totals.assists + apg, 1)
  rival.totals.peakRating = Math.max(rival.totals.peakRating, round(rating, 1))

  if (rng.chance(clamp((rating - 62) / 40, 0, 0.7))) rival.totals.allStars += 1
  if (rating > 86 && rng.chance(clamp((rating - 86) / 26, 0, 0.28))) rival.totals.mvps += 1
  if (rng.chance(clamp((rating - 74) / 100, 0, 0.2))) rival.totals.rings += 1

  rival.history.push({
    year,
    ppg,
    rating: round(rating, 1),
    teamName: '',
  })

  // Rivals retire on their own schedule, so outlasting one is an achievement.
  if (age >= 34 && rng.chance(clamp((age - 34) * 0.16, 0, 0.9))) {
    rival.retired = true
    rival.retirementYear = year
  }
}

/** Career averages for the rival, for the head-to-head panel. */
export function rivalAverages(rival: Rival): { ppg: number; rpg: number; apg: number } {
  const seasons = Math.max(1, rival.totals.seasons)
  return {
    ppg: round(rival.totals.points / seasons, 1),
    rpg: round(rival.totals.rebounds / seasons, 1),
    apg: round(rival.totals.assists / seasons, 1),
  }
}
