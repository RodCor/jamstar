/**
 * Summers with the national team.
 *
 * The World Cup and the Olympics used to be a silent dice roll folded into the
 * awards pass, which meant the two biggest tournaments in the sport never
 * happened to you. Now they get their own screen, their own run, and a final
 * you have to win.
 */

import type { AwardId, Country, NationalTournament, Player } from './types'
import { Rng, clamp } from './rng'
import { continentalCup } from '@/data/countries'
import { overallRating } from './progression'
import { COUNTRIES } from '@/data/countries'

/** Which tournament, if any, is on this summer. Real four-year cadence. */
export function tournamentForYear(year: number): NationalTournament['kind'] | null {
  if (year % 4 === 0) return 'olympics'
  if (year % 4 === 2) return 'world_cup'
  if (year % 2 === 1) return 'continental'
  return null
}

export function tournamentName(kind: NationalTournament['kind'], country: Country) {
  switch (kind) {
    case 'olympics':
      return { es: 'Juegos Olímpicos', en: 'Olympic Games' }
    case 'world_cup':
      return { es: 'Copa del Mundo', en: 'World Cup' }
    case 'continental':
      return continentalCup(country)
  }
}

/**
 * Whether the player gets the call.
 *
 * Deliberately not automatic: being left off the roster is one of the sharper
 * things that can happen to a career, and it already has an event card.
 */
export function isCalledUp(
  player: Player,
  country: Country,
  kind: NationalTournament['kind'],
  rng: Rng,
): boolean {
  if (player.age < 19 || player.retired) return false
  // You have to be playing somewhere serious to be seen.
  if (player.currentLeagueId === 'youth') return false

  const rating = overallRating(player)
  const base = clamp((rating - 48) / 42 + (player.hidden.hype - 40) / 160, 0, 0.95)
  // The Olympics field is twelve teams; the continental one is far wider.
  const selectivity = kind === 'olympics' ? 0.72 : kind === 'world_cup' ? 0.82 : 0.95
  return rng.chance(base * selectivity)
}

/** A plausible opponent from another basketball country. */
function opponentFor(country: Country, rng: Rng) {
  const others = COUNTRIES.filter((c) => c.code !== country.code)
  const opponent = rng.weighted(others, (c) => c.strength)
  return opponent.name
}

/**
 * Run the tournament up to (but not including) the final.
 *
 * Reaching the final is simulated from how strong the country is and how good
 * the player has become; winning it is the player's problem.
 */
export function runTournament(
  player: Player,
  country: Country,
  kind: NationalTournament['kind'],
  year: number,
  rng: Rng,
): NationalTournament {
  const name = tournamentName(kind, country)
  const rating = overallRating(player)
  // National team strength: mostly the country, partly you.
  const strength = clamp(country.strength / 100 + (rating - 62) / 220, 0.08, 0.97)
  // The Olympics are the hardest field, the continental cup the softest.
  const difficulty = kind === 'olympics' ? 0.78 : kind === 'world_cup' ? 0.86 : 1.05

  const awards: AwardId[] = []
  const medalFor = (place: 'gold' | 'medal'): AwardId => {
    if (kind === 'olympics') return place === 'gold' ? 'olympic_gold' : 'olympic_medal'
    if (kind === 'world_cup') return place === 'gold' ? 'world_cup_gold' : 'world_cup_medal'
    return place === 'gold' ? 'continental_gold' : 'continental_medal'
  }

  const advance = (odds: number) => rng.chance(clamp(odds * strength * difficulty, 0.04, 0.9))

  if (!advance(0.92)) {
    return {
      kind,
      name,
      year,
      outcome: 'group',
      opponent: null,
      awards,
      summary: {
        es: `Quedaron eliminados en la fase de grupos. Un verano corto y amargo.`,
        en: `You went out in the group stage. A short, sour summer.`,
      },
    }
  }

  if (!advance(0.78)) {
    return {
      kind,
      name,
      year,
      outcome: 'quarterfinal',
      opponent: null,
      awards,
      summary: {
        es: `Cayeron en cuartos de final. Estuvieron cerca y no alcanzó.`,
        en: `You lost in the quarterfinals. Close, and not close enough.`,
      },
    }
  }

  if (!advance(0.62)) {
    // Losing the semi still leaves the bronze game, which is its own small story.
    if (rng.chance(0.5)) {
      awards.push(medalFor('medal'))
      return {
        kind,
        name,
        year,
        outcome: 'bronze',
        opponent: null,
        awards,
        summary: {
          es: `Perdieron la semifinal y ganaron el bronce. Una medalla es una medalla.`,
          en: `You lost the semifinal and won the bronze. A medal is a medal.`,
        },
      }
    }
    return {
      kind,
      name,
      year,
      outcome: 'semifinal',
      opponent: null,
      awards,
      summary: {
        es: `Perdieron la semifinal y después el partido por el bronce. Cuarto puesto: el peor lugar posible.`,
        en: `You lost the semifinal, then the bronze game. Fourth: the worst place to finish.`,
      },
    }
  }

  return {
    kind,
    name,
    year,
    outcome: 'final',
    opponent: opponentFor(country, rng),
    awards,
    summary: {
      es: `Llegaron a la final. Un partido entre tu país y la gloria.`,
      en: `You reached the final. One game between your country and glory.`,
    },
  }
}

/** Awards once the final has been played. */
export function medalsForFinal(
  kind: NationalTournament['kind'],
  won: boolean,
): AwardId[] {
  if (kind === 'olympics') return [won ? 'olympic_gold' : 'olympic_medal']
  if (kind === 'world_cup') return [won ? 'world_cup_gold' : 'world_cup_medal']
  return [won ? 'continental_gold' : 'continental_medal']
}

export function finalHeadline(
  tournament: NationalTournament,
  country: Country,
  won: boolean,
) {
  const opponent = tournament.opponent
  if (won) {
    return {
      es: `¡Campeones! ${country.name.es} ganó ${tournament.name.es}${opponent ? ` ante ${opponent.es}` : ''}. Vas a ser recordado por esto.`,
      en: `Champions! ${country.name.en} won the ${tournament.name.en}${opponent ? ` against ${opponent.en}` : ''}. This is what you will be remembered for.`,
    }
  }
  return {
    es: `Perdieron la final${opponent ? ` con ${opponent.es}` : ''}. Plata, y un silencio que dura años.`,
    en: `You lost the final${opponent ? ` to ${opponent.en}` : ''}. Silver, and a silence that lasts years.`,
  }
}
