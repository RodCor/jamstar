/**
 * Climbing (and falling down) the ladder.
 *
 * Decides where the player is each season: which academy, which domestic league,
 * whether the NBA calls, and whether a fading veteran drops back down a tier.
 * This is where "origin country" earns its place on the creation screen.
 */

import type { CareerStage, Country, League, Player, Team } from './types'
import { Rng, clamp } from './rng'
import { getCountry, domesticLeagueFor, youthTeamFor } from '@/data/countries'
import { getLeague, LEAGUES } from '@/data/leagues'
import { getTeam, teamsInLeague } from '@/data/teams'
import { overallRating } from './progression'

export interface Placement {
  teamId: string
  leagueId: string
  /** Localized note explaining the move, shown on the season screen. */
  note: { es: string; en: string } | null
}

/** Stage for a given age. The draft is a moment, not a year, so it is handled separately. */
export function stageForAge(age: number, hasTurnedPro: boolean): CareerStage {
  if (age < 17) return 'youth'
  if (age < 19 && !hasTurnedPro) return 'breakout'
  if (age < 22 && !hasTurnedPro) return 'development'
  if (age < 30) return 'prime'
  if (age < 36) return 'veteran'
  return 'twilight'
}

/**
 * Where does the player go this preseason?
 *
 * The rules, in order: stay in youth until 17; follow the country's path into a
 * domestic or college league; get drafted or go pro somewhere between 19 and 22;
 * then move up and down by merit for the rest of the career.
 */
export function placeForSeason(player: Player, rng: Rng, seasonsPlayed: number): Placement {
  const country = getCountry(player.countryCode)
  const rating = overallRating(player)
  const hype = player.hidden.hype

  // --- Youth ---------------------------------------------------------------
  if (player.age < 17) {
    const youthId = youthTeamFor()
    return { teamId: youthId, leagueId: 'youth', note: null }
  }

  // --- Turning pro / college ----------------------------------------------
  const currentLeague = getLeague(player.currentLeagueId)
  if (currentLeague.id === 'youth') {
    return firstProPlacement(player, country, rating, hype, rng)
  }

  // --- The jump from college / development to the pros --------------------
  if (currentLeague.tier === 4 && (player.age >= 19 || rating > 68)) {
    const drafted = attemptDraft(player, country, rating, hype, rng)
    if (drafted) return drafted
  }

  // --- Merit-based movement ------------------------------------------------
  return meritMove(player, country, currentLeague, rating, hype, rng, seasonsPlayed)
}

/** The first pro (or college) contract, dictated by the country's path. */
function firstProPlacement(
  player: Player,
  country: Country,
  rating: number,
  hype: number,
  rng: Rng,
): Placement {
  if (country.path === 'usa_ncaa') {
    // Strong US prospects go to a blue-blood program; weaker ones to the G League.
    if (rating > 52 || hype > 40) {
      const programs = teamsInLeague('ncaa')
      const team = rng.weighted(programs, (t) => Math.max(1, 100 - Math.abs(t.strength - (rating + 18))))
      return {
        teamId: team.id,
        leagueId: 'ncaa',
        note: {
          es: `Aceptaste la beca de ${team.name.es}. Empieza la vitrina universitaria.`,
          en: `You took the scholarship at ${team.name.en}. The college showcase begins.`,
        },
      }
    }
    const gl = rng.pick(teamsInLeague('g_league'))
    return {
      teamId: gl.id,
      leagueId: 'g_league',
      note: {
        es: `Ninguna universidad grande te llamó. Firmaste con ${gl.name.es} en la G League.`,
        en: `No major program called. You signed with ${gl.name.en} in the G League.`,
      },
    }
  }

  // Everyone else debuts in their domestic first division — or its second tier
  // if they are not ready.
  const domesticId = domesticLeagueFor(country)
  const readyForFirstTeam = rating > 48 || hype > 34
  const targetLeagueId = readyForFirstTeam ? domesticId : secondTierFor(domesticId) ?? domesticId

  const options = teamsInLeague(targetLeagueId)
  const team = rng.weighted(options, (t) => Math.max(1, 90 - Math.abs(t.strength - (rating + 12))))
  const league = getLeague(targetLeagueId)

  return {
    teamId: team.id,
    leagueId: targetLeagueId,
    note: readyForFirstTeam
      ? {
          es: `Debutás como profesional en ${team.name.es} (${league.name.es}).`,
          en: `You turn professional with ${team.name.en} (${league.name.en}).`,
        }
      : {
          es: `Te cedieron a ${team.name.es} para sumar minutos. Hay que ganarse el ascenso.`,
          en: `You were loaned to ${team.name.en} to get minutes. You have to earn the step up.`,
        },
  }
}

function secondTierFor(leagueId: string): string | null {
  switch (leagueId) {
    case 'acb':
      return 'leb_oro'
    case 'betclic':
      return 'pro_b'
    case 'ncaa':
      return 'g_league'
    default:
      return null
  }
}

/**
 * The draft. Rating and hype decide whether an NBA team calls at all, and how
 * good a situation you land in.
 */
function attemptDraft(
  player: Player,
  country: Country,
  rating: number,
  hype: number,
  rng: Rng,
): Placement | null {
  // The bar is deliberately high — most careers never touch the NBA.
  const stock = rating * 0.75 + hype * 0.3 + country.strength * 0.05
  const draftChance = clamp((stock - 74) / 24, 0, 0.8)
  if (!rng.chance(draftChance)) return null

  const nbaTeams = teamsInLeague('nba')
  // Lottery logic in reverse: better prospects tend to go to worse teams, but a
  // late pick to a contender is a real and interesting outcome.
  const lottery = rng.chance(clamp((stock - 72) / 26, 0.05, 0.75))
  const team = lottery
    ? rng.weighted(nbaTeams, (t) => Math.max(1, 100 - t.strength))
    : rng.weighted(nbaTeams, (t) => Math.max(1, t.strength))

  const pick = lottery ? rng.int(1, 14) : rng.int(15, 58)

  return {
    teamId: team.id,
    leagueId: 'nba',
    note: {
      es: `¡Draft! ${team.name.es} te eligió en el puesto ${pick}. Estás en la NBA.`,
      en: `Draft night! ${team.name.en} took you at pick ${pick}. You are in the NBA.`,
    },
  }
}

/**
 * Year-to-year movement once established: promotion to a stronger league when
 * you outgrow the current one, relegation when you no longer belong, and
 * lateral moves for a better role.
 */
function meritMove(
  player: Player,
  country: Country,
  currentLeague: League,
  rating: number,
  hype: number,
  rng: Rng,
  seasonsPlayed: number,
): Placement {
  const currentTeam = getTeam(player.currentTeamId)

  // NCAA players either declare for the draft or return for another year.
  if (currentLeague.id === 'ncaa') {
    if (seasonsPlayed >= 4 || rating > 66) {
      const drafted = attemptDraft(player, country, rating, hype, rng)
      if (drafted) return drafted
      // Undrafted: go overseas or to the G League and keep trying.
      return fallbackProPlacement(player, country, rating, rng)
    }
    return { teamId: currentTeam.id, leagueId: 'ncaa', note: null }
  }

  const targetTier = tierForRating(rating, hype, player.age)

  // Staying put is the common case; only move when the tier genuinely changed
  // or the player is unhappy enough to force it.
  if (targetTier === currentLeague.tier && !rng.chance(unrestChance(player, rating, currentTeam))) {
    return { teamId: currentTeam.id, leagueId: currentLeague.id, note: null }
  }

  const candidateLeagues = leaguesForPlayer(targetTier)
  if (candidateLeagues.length === 0) {
    return { teamId: currentTeam.id, leagueId: currentLeague.id, note: null }
  }

  const league = rng.weighted(candidateLeagues, (l) => {
    // Players gravitate home late in a career, and abroad in their prime.
    const homeBonus = l.country === country.code ? (player.age > 32 ? 4 : 1.4) : 1
    return l.prestige * homeBonus
  })

  const options = teamsInLeague(league.id).filter((t) => t.id !== currentTeam.id)
  if (options.length === 0) {
    return { teamId: currentTeam.id, leagueId: currentLeague.id, note: null }
  }
  const team = rng.weighted(options, (t) => Math.max(1, 100 - Math.abs(t.strength - (rating + 6))))

  return { teamId: team.id, leagueId: league.id, note: moveNote(currentLeague, league, team, rng) }
}

function fallbackProPlacement(player: Player, country: Country, rating: number, rng: Rng): Placement {
  const pool = rating > 58 ? ['euroleague', 'acb', 'lega_a', 'betclic'] : ['g_league', 'leb_oro', 'pro_b']
  const leagueId = rng.pick(pool)
  const team = rng.pick(teamsInLeague(leagueId))
  const league = getLeague(leagueId)
  return {
    teamId: team.id,
    leagueId,
    note: {
      es: `Nadie te eligió en el draft. Cruzaste el charco y firmaste con ${team.name.es} (${league.name.es}).`,
      en: `You went undrafted. You took the overseas route and signed with ${team.name.en} (${league.name.en}).`,
    },
  }
}

/**
 * Which tier a player of this quality belongs in.
 *
 * The NBA threshold is set high on purpose: reaching the best league in the
 * world should be the exception across a population of careers, not the
 * default destination for anyone who develops normally.
 */
function tierForRating(rating: number, hype: number, age: number): 1 | 2 | 3 | 4 {
  const stock = rating + hype * 0.12 - Math.max(0, age - 33) * 2.2
  if (stock > 82) return 1
  if (stock > 71) return 2
  if (stock > 55) return 3
  return 4
}

function leaguesForPlayer(tier: number): League[] {
  const atTier = LEAGUES.filter((l) => l.tier === tier && l.id !== 'youth')
  if (tier === 4) {
    // Don't send a European veteran to the NCAA — that route only runs one way.
    return atTier.filter((l) => l.id !== 'ncaa')
  }
  return atTier
}

/** How likely the player is to want out of their current situation. */
function unrestChance(player: Player, rating: number, team: Team): number {
  const benchWarming = clamp((team.strength - rating) / 100, 0, 0.35)
  const unhappy = clamp((50 - player.hidden.morale) / 160, 0, 0.3)
  const lowTrust = clamp((45 - player.hidden.coachTrust) / 180, 0, 0.25)
  return clamp(0.12 + benchWarming + unhappy + lowTrust, 0, 0.7)
}

function moveNote(from: League, to: League, team: Team, rng: Rng) {
  if (to.tier < from.tier) {
    return {
      es: `Salto de calidad: fichaste por ${team.name.es} (${to.name.es}).`,
      en: `A step up: you signed for ${team.name.en} (${to.name.en}).`,
    }
  }
  if (to.tier > from.tier) {
    const options = [
      {
        es: `Nadie de arriba te ofreció nada. Bajaste a ${team.name.es} (${to.name.es}) para seguir jugando.`,
        en: `Nobody upstairs made an offer. You dropped to ${team.name.en} (${to.name.en}) to keep playing.`,
      },
      {
        es: `Aceptaste un rol más grande en un escenario más chico: ${team.name.es} (${to.name.es}).`,
        en: `You took a bigger role on a smaller stage: ${team.name.en} (${to.name.en}).`,
      },
    ]
    return rng.pick(options)
  }
  return {
    es: `Cambio de aire: fichaste por ${team.name.es}.`,
    en: `A change of scenery: you signed for ${team.name.en}.`,
  }
}
