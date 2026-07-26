/**
 * Turning a player into a box score.
 *
 * The job here is believability: a 78-rated wing in the LNB should average
 * something like 19/5/3, and that exact same player in the NBA should average
 * something like 11/3/2. League difficulty does that scaling, and role (which
 * comes from coach trust) does the minutes.
 */

import type {
  League,
  PlayerRole,
  PlayoffResult,
  Player,
  Season,
  Team,
} from './types'
import { Rng, clamp, round } from './rng'
import { difficultyOf } from '@/data/leagues'
import { getStyle } from '@/data/styles'
import { overallRating } from './progression'

/** Minutes per game by role — everything counting-stat flows from this. */
const MINUTES_BY_ROLE: Record<PlayerRole, [number, number]> = {
  star: [33, 38],
  starter: [27, 33],
  rotation: [18, 26],
  bench: [7, 16],
  prospect: [3, 11],
  injured: [0, 0],
}

/**
 * Decide the player's role on this roster. A great player on a stacked team
 * still has to earn minutes, which is why coach trust and team strength both
 * matter here.
 */
export function determineRole(player: Player, team: Team, league: League, rng: Rng): PlayerRole {
  const rating = overallRating(player)
  // How you compare to the roster around you, roughly centred on 0.
  const gap = rating - team.strength * 0.92
  const trust = (player.hidden.coachTrust - 50) * 0.28
  const youthPenalty = player.age < 20 ? (20 - player.age) * 3.2 : 0
  const score = gap + trust - youthPenalty + rng.gauss(0, 5)

  if (score > 14) return 'star'
  if (score > 4) return 'starter'
  if (score > -8) return 'rotation'
  if (player.age <= 21) return 'prospect'
  return 'bench'
}

export interface SeasonStatsInput {
  player: Player
  team: Team
  league: League
  role: PlayerRole
  gamesPlayed: number
  rng: Rng
}

export interface GeneratedStats {
  minutesPerGame: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fgPct: number
  threePct: number
  ftPct: number
  tsPct: number
  rating: number
}

export function generateStats(input: SeasonStatsInput): GeneratedStats {
  const { player, league, role, rng } = input
  const a = player.attributes
  const style = getStyle(player.styleId)
  const difficulty = difficultyOf(league.id)

  const [minMin, maxMin] = MINUTES_BY_ROLE[role]
  const minutesPerGame = input.gamesPlayed === 0 ? 0 : round(rng.float(minMin, maxMin), 1)
  // Per-36 production scaled to actual minutes.
  const minuteScale = minutesPerGame / 36

  // Every per-36 figure below is clamped AFTER its multipliers, so the ceiling
  // is a real ceiling. Clamping first lets style and league bonuses stack on
  // top of the cap and produce 45-point seasons.

  // --- Scoring -------------------------------------------------------------
  // Per-36 points come off shooting and athleticism, bent by style and league.
  const scoringBase = a.shooting * 0.3 + a.athleticism * 0.16 + a.handling * 0.08
  const positionScoring = player.position === 'C' ? 0.92 : player.position === 'PG' ? 1.0 : 1.06
  const per36Points = clamp(
    scoringBase * 0.5 * style.scoringBias * positionScoring * (0.72 + difficulty * 0.34),
    2,
    31,
  )
  const points = round(Math.max(0, rng.gauss(per36Points * minuteScale, per36Points * 0.1)), 1)

  // --- Rebounding ----------------------------------------------------------
  const reboundPositional: Record<string, number> = { PG: 0.42, SG: 0.6, SF: 0.85, PF: 1.22, C: 1.5 }
  const per36Rebounds = clamp(
    (a.strength * 0.1 + a.athleticism * 0.055) * reboundPositional[player.position] * (0.78 + difficulty * 0.28),
    0.8,
    14.5,
  )
  const rebounds = round(Math.max(0, rng.gauss(per36Rebounds * minuteScale, per36Rebounds * 0.12)), 1)

  // --- Playmaking ----------------------------------------------------------
  const assistPositional: Record<string, number> = { PG: 1.6, SG: 1.0, SF: 0.8, PF: 0.6, C: 0.55 }
  const per36Assists = clamp(
    (a.handling * 0.075 + a.iq * 0.05) *
      assistPositional[player.position] *
      style.playmakingBias *
      (0.78 + difficulty * 0.28),
    0.3,
    11.5,
  )
  const assists = round(Math.max(0, rng.gauss(per36Assists * minuteScale, per36Assists * 0.14)), 1)

  // --- Defence -------------------------------------------------------------
  const per36Steals =
    clamp((a.defense * 0.022 + a.athleticism * 0.012) * (player.position === 'C' ? 0.6 : 1.15), 0.1, 3.2) *
    style.defenseBias
  const blockPositional: Record<string, number> = { PG: 0.18, SG: 0.28, SF: 0.55, PF: 1.05, C: 1.6 }
  const per36Blocks =
    clamp((a.defense * 0.016 + a.athleticism * 0.012) * blockPositional[player.position], 0.05, 4) *
    style.defenseBias

  const steals = round(Math.max(0, rng.gauss(per36Steals * minuteScale, 0.25)), 1)
  const blocks = round(Math.max(0, rng.gauss(per36Blocks * minuteScale, 0.25)), 1)

  // Turnovers scale with usage and fall with IQ and handling.
  const per36Turnovers = clamp(points * 0.09 + assists * 0.22 - a.iq * 0.012 - a.handling * 0.008, 0.3, 5.5)
  const turnovers = round(Math.max(0, rng.gauss(per36Turnovers * Math.max(minuteScale, 0.3), 0.3)), 1)

  // --- Efficiency ----------------------------------------------------------
  // Volume costs efficiency; IQ and shooting buy it back.
  const volumePenalty = Math.max(0, points - 18) * 0.24
  const fgPct = round(
    clamp(rng.gauss(38 + a.shooting * 0.14 + a.iq * 0.05 - volumePenalty * 0.1, 1.6), 28, 66) / 100,
    3,
  )
  const threePct = round(
    clamp(
      rng.gauss(
        24 + a.shooting * 0.16 - (player.position === 'C' ? 6 : 0) - volumePenalty * 0.08,
        2.2,
      ),
      0,
      48,
    ) / 100,
    3,
  )
  const ftPct = round(
    clamp(rng.gauss(52 + a.shooting * 0.28 - (player.position === 'C' ? 8 : 0), 3), 34, 95) / 100,
    3,
  )
  // TS% built from the shot mix rather than invented, so it stays consistent.
  const tsPct = round(clamp(fgPct * 1.06 + threePct * 0.16 + ftPct * 0.08, 0.32, 0.72), 3)

  // --- Composite rating ----------------------------------------------------
  // How good was this *season*, not this player. Production, weighted by how
  // hard the league is, plus an efficiency bonus.
  //
  // Deliberately compressive at the top: production feeds a saturating curve so
  // that 100 is asymptotic rather than routine. Without this, every developed
  // player pins the scale and every award fires every year.
  const production =
    points * 1.0 + rebounds * 0.7 + assists * 1.1 + steals * 1.6 + blocks * 1.4 - turnovers * 0.9
  const leagueWeight = 0.62 + difficulty * 0.38
  const raw = Math.max(0, production * leagueWeight + (tsPct - 0.53) * 45)
  // Saturating map: raw 0→18, 20→62, 30→77, 45→89, 60→94.
  const rating = round(clamp(18 + 82 * (1 - Math.exp(-raw / 26)), 0, 100), 1)

  return {
    minutesPerGame,
    points,
    rebounds,
    assists,
    steals,
    blocks,
    turnovers,
    fgPct,
    threePct,
    ftPct,
    tsPct,
    rating,
  }
}

/** Team record for the season, from roster strength plus how much you moved the needle. */
export function simulateTeamRecord(
  team: Team,
  league: League,
  playerRating: number,
  role: PlayerRole,
  rng: Rng,
): { wins: number; losses: number } {
  const games = league.gamesPerSeason
  const roleImpact: Record<PlayerRole, number> = {
    star: 0.09,
    starter: 0.05,
    rotation: 0.02,
    bench: 0.005,
    prospect: 0,
    injured: -0.02,
  }
  const base = 0.28 + (team.strength / 100) * 0.44
  const playerSwing = ((playerRating - 50) / 100) * roleImpact[role] * 2.2
  const winPct = clamp(rng.gauss(base + playerSwing, 0.06), 0.12, 0.88)
  const wins = Math.round(games * winPct)
  return { wins, losses: games - wins }
}

/**
 * Playoff run, given how good the team turned out to be.
 *
 * Stops at the final and reports whether it was reached — winning it is decided
 * separately, by the player, in a minigame. Seasons with no eligible player
 * (youth, a lost season to injury) fall back to a roll.
 */
export function simulatePlayoffRun(
  wins: number,
  games: number,
  team: Team,
  league: League,
  rng: Rng,
): { result: PlayoffResult; reachedFinal: boolean } {
  if (league.id === 'youth') return { result: 'none', reachedFinal: false }
  const winPct = wins / Math.max(1, games)
  if (winPct < 0.5) {
    return { result: rng.chance(0.1) ? 'first_round' : 'missed', reachedFinal: false }
  }

  // Each round is its own coin flip, weighted by how strong the team is. The
  // base is deliberately below even: reaching the final should be an event.
  const edge = clamp((winPct - 0.55) * 1.8 + (team.strength - 74) / 240, -0.3, 0.3)
  let round: PlayoffResult = 'first_round'
  const ladder: PlayoffResult[] = ['semifinals', 'conference_finals', 'finals']
  for (const next of ladder) {
    if (!rng.chance(clamp(0.42 + edge, 0.08, 0.74))) {
      return { result: round, reachedFinal: false }
    }
    round = next
  }
  return { result: 'finals', reachedFinal: true }
}

/** The final, rolled rather than played — used when the player cannot contest it. */
export function rollFinal(team: Team, rng: Rng): PlayoffResult {
  return rng.chance(clamp(0.36 + (team.strength - 74) / 300, 0.15, 0.6)) ? 'champion' : 'finals'
}

/**
 * How many games the player actually appears in, after injury risk. Athleticism
 * and wear are the two dials — which is the Highlight Athlete's whole bargain.
 */
export function simulateAvailability(
  player: Player,
  league: League,
  rng: Rng,
): { gamesPlayed: number; gamesMissed: number } {
  const games = league.gamesPerSeason
  const style = getStyle(player.styleId)
  const wearRisk = player.hidden.wear / 260
  const ageRisk = Math.max(0, player.age - 30) * 0.011
  const durability = (player.attributes.strength - 50) / 700
  const injuryChance = clamp(0.16 * style.injuryFactor + wearRisk + ageRisk - durability, 0.03, 0.72)

  let missed = 0
  if (rng.chance(injuryChance)) {
    // A knock, a real injury, or a lost season.
    const severity = rng.next()
    const fraction = severity > 0.94 ? rng.float(0.7, 1.0) : severity > 0.72 ? rng.float(0.28, 0.6) : rng.float(0.04, 0.22)
    missed = Math.round(games * fraction)
  }
  // Ordinary rest and knocks that never become a story.
  missed += rng.int(0, Math.round(games * 0.06))
  missed = Math.min(missed, games)

  return { gamesPlayed: games - missed, gamesMissed: missed }
}

/** Salary for the season, from league band, role and hype. */
export function computeSalary(league: League, role: PlayerRole, hype: number, rng: Rng): number {
  const [floor, ceiling] = league.salaryBand
  if (ceiling === 0) return 0
  const roleShare: Record<PlayerRole, number> = {
    star: 0.85,
    starter: 0.45,
    rotation: 0.2,
    bench: 0.08,
    prospect: 0.04,
    injured: 0.1,
  }
  const hypeShare = clamp(hype / 100, 0, 1) * 0.2
  const share = clamp(roleShare[role] + hypeShare + rng.gauss(0, 0.05), 0.02, 1)
  return Math.round((floor + (ceiling - floor) * share) / 1000) * 1000
}

/** Wear added by a season — minutes played, amplified by style and age. */
export function wearFromSeason(season: Pick<Season, 'gamesPlayed' | 'minutesPerGame'>, player: Player): number {
  const style = getStyle(player.styleId)
  const load = (season.gamesPlayed * season.minutesPerGame) / 2400
  const ageMultiplier = player.age > 30 ? 1.35 : player.age < 21 ? 0.8 : 1
  return clamp(load * 7.5 * style.injuryFactor * ageMultiplier, 0, 22)
}
