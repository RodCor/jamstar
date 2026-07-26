/**
 * Free agency.
 *
 * Being told where you play was the least interesting part of the year, so the
 * ladder now produces a shortlist and the player signs. The offers themselves
 * are the feedback: a good season brings a bigger league, a bigger role and
 * bigger money to the table, and a bad one brings a step down.
 */

import type { ContractOffer, Country, League, Player, PlayerRole, Team } from './types'
import { Rng, clamp } from './rng'
import { getLeague, LEAGUES } from '@/data/leagues'
import { getTeam, teamsInLeague } from '@/data/teams'
import { overallRating } from './progression'
import { effectsFor } from './perks'

/** How many contracts land on the table. */
const MAX_OFFERS = 4

/**
 * Tier boundaries, from the top down.
 *
 * Set against `stockFor`, which sits a little above raw rating. The top bar is
 * deliberately near the ceiling of what a career reaches: the NBA is meant to
 * be entered through draft night, not strolled into at 31 as a free agent.
 */
const TIER_THRESHOLDS = [86, 72, 56] as const

/** How good this player looks to a club with a contract to give. */
export function stockFor(player: Player): number {
  const rating = overallRating(player)
  // Perks that improve your standing are worth a few points of perceived
  // quality, not a multiplier on it — multiplying turned every developed player
  // into a top-tier prospect and made the NBA meaningless.
  const pullBonus = (effectsFor(player).contractPull - 1) * 15
  return rating + pullBonus + player.hidden.hype * 0.06 - Math.max(0, player.age - 33) * 2.2
}

/**
 * The tier a player of this quality belongs in. Same thresholds the old
 * auto-placement used, so the difficulty curve is unchanged — only who decides.
 */
export function tierForPlayer(player: Player): 1 | 2 | 3 | 4 {
  const stock = stockFor(player)
  if (stock > TIER_THRESHOLDS[0]) return 1
  if (stock > TIER_THRESHOLDS[1]) return 2
  if (stock > TIER_THRESHOLDS[2]) return 3
  return 4
}

/** What a club of this strength would offer a player of this quality. */
function roleFor(player: Player, team: Team, rng: Rng): PlayerRole {
  const rating = overallRating(player)
  const gap = rating - team.strength * 0.92 + rng.gauss(0, 3)
  if (player.age < 20 && gap < 10) return 'prospect'
  if (gap > 12) return 'star'
  if (gap > 2) return 'starter'
  if (gap > -8) return 'rotation'
  return 'bench'
}

function salaryFor(league: League, role: PlayerRole, player: Player, rng: Rng): number {
  const [floor, ceiling] = league.salaryBand
  if (ceiling === 0) return 0
  const roleShare: Record<PlayerRole, number> = {
    star: 0.86,
    starter: 0.48,
    rotation: 0.22,
    bench: 0.09,
    prospect: 0.05,
    injured: 0.1,
  }
  const pull = effectsFor(player).contractPull
  const hypeShare = clamp(player.hidden.hype / 100, 0, 1) * 0.22
  const share = clamp((roleShare[role] + hypeShare) * pull + rng.gauss(0, 0.04), 0.02, 1)
  return Math.round((floor + (ceiling - floor) * share) / 1000) * 1000
}

function yearsFor(role: PlayerRole, age: number, rng: Rng): number {
  if (age > 34) return 1
  if (role === 'star') return rng.int(3, 5)
  if (role === 'starter') return rng.int(2, 4)
  return rng.int(1, 3)
}

function pitchFor(team: Team, league: League, role: PlayerRole, isCurrent: boolean) {
  if (isCurrent) {
    return {
      es: `Te queremos renovar. Conocés la casa y la casa te conoce.`,
      en: `We want to keep you. You know this place and it knows you.`,
    }
  }
  switch (role) {
    case 'star':
      return {
        es: `Construimos el equipo alrededor tuyo. La pelota es tuya en los momentos que importan.`,
        en: `We build the team around you. The ball is yours when it matters.`,
      }
    case 'starter':
      return {
        es: `Sos titular desde el primer día. Vení a competir por algo.`,
        en: `You start from day one. Come and compete for something.`,
      }
    case 'rotation':
      return {
        es: `Rol claro, minutos reales, y un vestuario que funciona.`,
        en: `A clear role, real minutes, and a locker room that works.`,
      }
    case 'prospect':
      return {
        es: `Te vamos a desarrollar sin apuro. Acá se forman jugadores.`,
        en: `We will develop you without rushing. Players get made here.`,
      }
    default:
      return {
        es: `No prometemos minutos, pero sí un lugar donde seguir jugando.`,
        en: `We promise no minutes, but a place to keep playing.`,
      }
  }
}

/**
 * Which leagues would realistically call this player.
 *
 * Your own tier and the one below always call — there is always somewhere
 * willing to take you. The tier *above* only calls when you are genuinely
 * knocking on its door, otherwise free agency becomes an escalator where every
 * player is handed a promotion they did not earn and the NBA stops meaning
 * anything.
 */
function candidateLeagues(player: Player, country: Country, rng: Rng): League[] {
  const tier = tierForPlayer(player)
  const stock = stockFor(player)
  const wanted = new Set<number>([tier, Math.min(4, tier + 1)])

  // A step up is possible into EuroLeague or a strong domestic league, but
  // never into the NBA: that door is draft night, or already being elite. Left
  // open, free agency quietly became the main route to the best league in the
  // world and draft night stopped mattering.
  if (tier > 2) {
    const nextThreshold = TIER_THRESHOLDS[tier - 2]
    const shortfall = nextThreshold - stock
    if (shortfall <= 4 && rng.chance(clamp(0.55 - shortfall * 0.1, 0.1, 0.55))) {
      wanted.add(tier - 1)
    }
  }

  return LEAGUES.filter((league) => {
    if (league.id === 'youth') return false
    // The NCAA route runs one way; a professional never goes back to college.
    if (league.id === 'ncaa') return false
    return wanted.has(league.tier)
  })
}

/**
 * Build the shortlist.
 *
 * The current club is included when they would plausibly re-sign you, so
 * loyalty is an actual choice rather than something that happens to you.
 */
export function generateOffers(player: Player, country: Country, rng: Rng): ContractOffer[] {
  const leagues = candidateLeagues(player, country, rng)
  if (leagues.length === 0) return []

  const tier = tierForPlayer(player)
  const currentTeamId = player.currentTeamId
  const offers: ContractOffer[] = []
  const usedTeams = new Set<string>()

  const makeOffer = (team: Team, isCurrentClub: boolean): ContractOffer => {
    const league = getLeague(team.leagueId)
    const role = isCurrentClub
      ? roleFor(player, team, rng)
      : roleFor(player, team, rng)
    return {
      teamId: team.id,
      leagueId: league.id,
      role,
      salary: salaryFor(league, role, player, rng),
      years: yearsFor(role, player.age, rng),
      pitch: pitchFor(team, league, role, isCurrentClub),
      isCurrentClub,
    }
  }

  // A renewal, if the club still rates you.
  if (player.currentLeagueId !== 'youth' && rng.chance(0.75)) {
    const team = getTeam(currentTeamId)
    offers.push(makeOffer(team, true))
    usedTeams.add(team.id)
  }

  let guard = 0
  while (offers.length < MAX_OFFERS && guard < 40) {
    guard++
    // Weight toward the player's own tier, and toward home late in a career.
    const league = rng.weighted(leagues, (l) => {
      const distance = Math.abs(l.tier - tier)
      const home = l.country === country.code ? (player.age > 32 ? 3 : 1.4) : 1
      return (distance === 0 ? 6 : distance === 1 ? 2 : 0.5) * home * (l.prestige / 60)
    })

    const options = teamsInLeague(league.id).filter((t) => !usedTeams.has(t.id))
    if (options.length === 0) continue

    // Clubs near your level are likelier to want you.
    const rating = overallRating(player)
    const team = rng.weighted(options, (t) => Math.max(1, 100 - Math.abs(t.strength - (rating + 6))))
    usedTeams.add(team.id)
    offers.push(makeOffer(team, false))
  }

  // Best first — but "best" is deliberately ambiguous, which is the point.
  return offers.sort((a, b) => {
    const tierDiff = getLeague(a.leagueId).tier - getLeague(b.leagueId).tier
    return tierDiff !== 0 ? tierDiff : b.salary - a.salary
  })
}

/** The very first contract, for a player leaving high school. */
export function generateFirstOffers(
  player: Player,
  country: Country,
  rng: Rng,
): ContractOffer[] {
  const rating = overallRating(player)
  const offers: ContractOffer[] = []
  const used = new Set<string>()

  const add = (leagueId: string, count: number) => {
    const pool = teamsInLeague(leagueId).filter((t) => !used.has(t.id))
    for (let i = 0; i < count && pool.length > 0; i++) {
      const team = rng.weighted(pool, (t) => Math.max(1, 100 - Math.abs(t.strength - (rating + 14))))
      pool.splice(pool.indexOf(team), 1)
      used.add(team.id)
      const league = getLeague(leagueId)
      const role = roleFor(player, team, rng)
      offers.push({
        teamId: team.id,
        leagueId,
        role,
        salary: salaryFor(league, role, player, rng),
        years: yearsFor(role, player.age, rng),
        pitch: pitchFor(team, league, role, false),
        isCurrentClub: false,
      })
    }
  }

  if (country.path === 'usa_ncaa') {
    // College or straight to the developmental route.
    add('ncaa', rating > 50 ? 3 : 1)
    add('g_league', 1)
  } else {
    const domestic = country.domesticLeagueIds[0] ?? 'aba'
    add(domestic, 2)
    // A second-division club offering real minutes is a genuine alternative.
    const second = { acb: 'leb_oro', betclic: 'pro_b' }[domestic]
    if (second) add(second, 1)
    else add(domestic, 1)
  }

  return offers
}
