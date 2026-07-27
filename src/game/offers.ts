/**
 * Free agency.
 *
 * Being told where you play was the least interesting part of the year, so the
 * ladder now produces a shortlist and the player signs. The offers themselves
 * are the feedback: a good season brings a bigger league, a bigger role and
 * bigger money to the table, and a bad one brings a step down.
 */

import type {
  ContractOffer,
  Country,
  League,
  Player,
  PlayerRole,
  Season,
  Team,
} from './types'
import { Rng, clamp } from './rng'
import { difficultyOf, getLeague, LEAGUES } from '@/data/leagues'
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

/**
 * What a club of this strength would offer a player of this quality.
 *
 * `familiarity` is the edge a club that already has you enjoys: they have
 * watched you every day for a year, so their read on you is their own rather
 * than a scouting report, and a coach who trusts you offers a bigger role than a
 * stranger would.
 */
function roleFor(player: Player, team: Team, rng: Rng, familiarity = 0): PlayerRole {
  const rating = overallRating(player)
  const gap = rating - team.strength * 0.92 - levelBar(team.leagueId) + familiarity + rng.gauss(0, 3)
  if (player.age < 20 && gap < 10) return 'prospect'
  if (gap > 12) return 'star'
  if (gap > 2) return 'starter'
  if (gap > -8) return 'rotation'
  return 'bench'
}

/**
 * How much higher the bar for minutes sits in a stronger league.
 *
 * Club strength is on one 0-100 scale across every league, so a weak NBA roster
 * and a weak third-division roster read as the same number — and without this, a
 * modest player was offered a franchise role and a maximum contract by the worst
 * team in the NBA. Stepping up a level has to mean fighting for minutes again.
 * Calibrated at zero for the third tier, where the rest of the game is tuned.
 */
function levelBar(leagueId: string): number {
  return (difficultyOf(leagueId) - 0.74) * 60
}

/**
 * Whether your club wants you back, and how badly.
 *
 * This used to be a flat coin weighted at 3-in-4, which meant a player coming
 * off the best season of their life could still find no way to stay — the club
 * simply never called, for no reason the player could see. A renewal should be
 * the most predictable thing on the table: play well and staying is your choice
 * to make, play badly and the club moves on.
 */
export function renewalOdds(player: Player, lastSeason: Season | null): number {
  if (player.currentLeagueId === 'youth') return 0

  // No season to judge you on (a transfer year, a lost year): the club leans on
  // what it already thought of you.
  if (!lastSeason || lastSeason.gamesPlayed === 0) {
    return clamp(0.25 + player.hidden.coachTrust / 220, 0.15, 0.7)
  }

  const performance = (lastSeason.rating - 52) / 26
  const trust = (player.hidden.coachTrust - 50) / 130
  // Clubs let old players go, however fondly they remember them.
  const age = Math.max(0, player.age - 33) * 0.07
  const odds = clamp(0.62 + performance + trust - age, 0.08, 0.97)

  // Missing most of the year makes a club hesitate over a player it otherwise
  // rates. Applied as a discount rather than a subtraction, because a great
  // season is good enough to pin the odds at the ceiling on its own, and there
  // a penalty worth a fifth of the scale simply vanished — leaving the player
  // most affected by injury as the one it never touched.
  const availability = lastSeason.gamesMissed > lastSeason.gamesPlayed ? 0.72 : 1

  return clamp(odds * availability, 0.08, 0.97)
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

function pitchFor(
  team: Team,
  league: League,
  role: PlayerRole,
  isCurrent: boolean,
  isNbaCall = false,
) {
  if (isCurrent) {
    return {
      es: `Te queremos renovar. Conocés la casa y la casa te conoce.`,
      en: `We want to keep you. You know this place and it knows you.`,
    }
  }
  // An NBA club calling a player who was never drafted is not a routine offer,
  // and it should not read like one.
  if (isNbaCall) {
    return {
      es: `Te vimos todo el año. Nadie te eligió en el draft: nosotros te elegimos ahora.`,
      en: `We watched you all year. Nobody called your name at the draft — we are calling it now.`,
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
    // NBA interest is handled on its own terms below, never through the tier
    // pool — left in the pool it becomes an escalator that quietly turns free
    // agency into the main route to the best league in the world.
    if (league.tier === 1) return false
    return wanted.has(league.tier)
  })
}

/**
 * How closely NBA front offices are watching this league.
 *
 * Scouts are not evenly distributed. Every G League game is watched by someone
 * whose whole job is finding the next call-up, the EuroLeague is on television
 * in every front office, and a good season in a smaller domestic league can go
 * almost unseen.
 */
const VISIBILITY: Record<string, number> = {
  g_league: 22,
  euroleague: 20,
  ncaa: 16,
  acb: 12,
  bsl: 9,
  gbl: 9,
  lega_a: 8,
  betclic: 8,
  aba: 8,
  lkl: 6,
  nbl: 6,
  cba: 4,
  lnb_ar: 4,
  nbb: 4,
}

/**
 * An NBA club calling a player who never went through the draft.
 *
 * This happens constantly in the real sport — undrafted free agents, G League
 * call-ups, a EuroLeague star finally taking the offer at 27 — and without it
 * the only door to the NBA is one night at 22, which makes every career that
 * missed it a closed story.
 *
 * The bar is deliberately high on two separate axes. You have to be good enough
 * that an NBA roster spot is defensible, *and* you have to have been seen: a
 * quietly excellent season in a league nobody scouts does not get you a call.
 */
function nbaSuitor(player: Player, lastSeason: Season | null, rng: Rng): Team | null {
  if (player.currentLeagueId === 'nba') return null
  // Nobody signs a 34-year-old out of another league.
  if (player.age > 33) return null

  // A season worth a plane ticket. Being quietly adequate for a decade is not
  // what gets this call — a year someone noticed is.
  if (!lastSeason || lastSeason.gamesPlayed === 0) return null
  if (lastSeason.rating < 68 && lastSeason.awards.length === 0) return null

  const stock = stockFor(player)
  // Below this you are not on an NBA board at all, whatever the highlight reel.
  if (stock < 74) return null

  const seen = player.hidden.hype + (VISIBILITY[player.currentLeagueId] ?? 0)
  if (seen < 55) return null

  // A young player is worth a roster spot as a project. An older one has to be
  // ready to help immediately, and fewer are.
  const youth = player.age <= 26 ? 1 : player.age <= 30 ? 0.75 : 0.45

  // Still bounded per year rather than per career: the chance compounds over
  // fifteen offer screens, so what reads here as a modest number is what decides
  // whether most good careers eventually get a look.
  const odds = clamp(((stock - 74) / 34 + (seen - 55) / 240) * youth, 0, 0.22)
  if (!rng.chance(odds)) return null

  // Who calls: the clubs whose level actually matches yours, so an NBA arrival
  // is a two-way contract at a rebuilding club far more often than a starting
  // job in a contender's rotation.
  const rating = overallRating(player)
  const options = teamsInLeague('nba')
  return rng.weighted(options, (t) => Math.max(1, 100 - Math.abs(t.strength - (rating + 4))))
}

/**
 * Build the shortlist.
 *
 * The current club is included when they would plausibly re-sign you, so
 * loyalty is an actual choice rather than something that happens to you.
 */
export function generateOffers(
  player: Player,
  country: Country,
  rng: Rng,
  /** Last season, which is what the club is actually deciding on. */
  lastSeason: Season | null = null,
): ContractOffer[] {
  const leagues = candidateLeagues(player, country, rng)

  const tier = tierForPlayer(player)
  const currentTeamId = player.currentTeamId
  const offers: ContractOffer[] = []
  const usedTeams = new Set<string>()

  const makeOffer = (
    team: Team,
    opts: { isCurrentClub?: boolean; isNbaCall?: boolean } = {},
  ): ContractOffer => {
    const league = getLeague(team.leagueId)
    const isCurrentClub = opts.isCurrentClub ?? false
    // A club that already has you backs its own eyes: a coach who trusts you
    // offers a bigger role than a stranger reading a scouting report.
    const familiarity = isCurrentClub ? (player.hidden.coachTrust - 50) * 0.1 : 0
    const role = roleFor(player, team, rng, familiarity)
    return {
      teamId: team.id,
      leagueId: league.id,
      role,
      salary: salaryFor(league, role, player, rng),
      // Your own club will commit for longer than one that has never had you.
      years: yearsFor(role, player.age, rng) + (isCurrentClub && player.age <= 32 ? 1 : 0),
      pitch: pitchFor(team, league, role, isCurrentClub, opts.isNbaCall),
      isCurrentClub,
    }
  }

  // A renewal, when the club still rates you — which, after a good season, is
  // very nearly always.
  if (rng.chance(renewalOdds(player, lastSeason))) {
    const team = getTeam(currentTeamId)
    offers.push(makeOffer(team, { isCurrentClub: true }))
    usedTeams.add(team.id)
  }

  // The call that does not go through draft night.
  const nbaTeam = nbaSuitor(player, lastSeason, rng)
  if (nbaTeam && !usedTeams.has(nbaTeam.id)) {
    offers.push(makeOffer(nbaTeam, { isNbaCall: true }))
    usedTeams.add(nbaTeam.id)
  }

  if (leagues.length === 0) return offers

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
    offers.push(makeOffer(team))
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
