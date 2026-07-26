/**
 * Draft night.
 *
 * This used to be a one-line note on the season screen, which badly undersold
 * the single most consequential evening of a basketball career. Now it is its
 * own moment: a projection beforehand, names coming off the board, then yours.
 */

import type { Country, DraftResult, Player } from './types'
import { Rng, clamp } from './rng'
import { getTeam, teamsInLeague } from '@/data/teams'
import { overallRating } from './progression'
import { namePool } from '@/data/people'
import { COUNTRIES } from '@/data/countries'

/** Picks in a draft. Two rounds, thirty apiece, minus a couple for realism. */
const TOTAL_PICKS = 58

/**
 * How good you look to scouts, which is not quite how good you are.
 *
 * Weighted toward raw ability with hype as a real but secondary factor — this
 * is the number draft night turns on, so it should mostly reward the player
 * having actually become good.
 */
function draftStock(player: Player, country: Country): number {
  return overallRating(player) * 0.86 + player.hidden.hype * 0.22 + country.strength * 0.06
}

/** Whether the player is even in the conversation this year. */
export function isDraftEligible(player: Player, seasonsPlayed: number): boolean {
  // Draft night happens once. Undrafted means undrafted.
  if (player.draftDone) return false
  if (player.currentLeagueId === 'youth') return false
  if (player.currentLeagueId === 'nba') return false
  if (player.age < 19) return false
  // College players declare after enough seasons or once they are clearly ready.
  if (player.currentLeagueId === 'ncaa') {
    return seasonsPlayed >= 4 || player.age >= 22 || overallRating(player) > 66
  }
  // Everyone else declares once they look like a prospect, or at 22 when the
  // decision is made for them. Firing at 19 regardless meant every career hit
  // draft night at its weakest possible moment and nobody ever got picked.
  return player.age >= 22 || overallRating(player) > 58
}

/** Invent a name for someone taken ahead of you. */
function inventName(rng: Rng): string {
  const country = rng.weighted(COUNTRIES, (c) => c.strength)
  const pool = namePool(country.namePoolId)
  return `${rng.pick(pool.first)} ${rng.pick(pool.last)}`
}

export function runDraft(player: Player, country: Country, rng: Rng): DraftResult {
  const stock = draftStock(player, country)
  // Calibrated against what a 20-22 year old prospect actually looks like.
  const drafted = rng.chance(clamp((stock - 52) / 26, 0, 0.85))

  // Where the mock drafts had you. Wide when your stock is middling, which is
  // exactly when draft night is most nerve-racking.
  const centre = clamp(Math.round(96 - stock * 1.05), 1, TOTAL_PICKS)
  const spread = clamp(Math.round(18 - stock * 0.12), 4, 16)
  const projectedRange: [number, number] = [
    clamp(centre - spread, 1, TOTAL_PICKS),
    clamp(centre + spread, 1, TOTAL_PICKS),
  ]

  const nbaTeams = teamsInLeague('nba')
  const fallbackLeagueId = rng.pick(
    overallRating(player) > 58 ? ['euroleague', 'acb', 'lega_a', 'betclic'] : ['g_league', 'leb_oro', 'pro_b'],
  )
  const fallbackTeamId = rng.pick(teamsInLeague(fallbackLeagueId)).id

  if (!drafted) {
    return {
      projectedRange,
      pick: null,
      teamId: null,
      // Undrafted still means sitting through the whole thing.
      precedingPicks: buildPrecedingPicks(rng, Math.min(6, TOTAL_PICKS), nbaTeams),
      fallbackTeamId,
      fallbackLeagueId,
    }
  }

  // A lottery pick lands on a rebuilding team; a late one on a contender.
  const lottery = rng.chance(clamp((stock - 62) / 26, 0.05, 0.75))
  const pick = lottery ? rng.int(1, 14) : rng.int(15, TOTAL_PICKS)
  const team = lottery
    ? rng.weighted(nbaTeams, (t) => Math.max(1, 100 - t.strength))
    : rng.weighted(nbaTeams, (t) => Math.max(1, t.strength))

  return {
    projectedRange,
    pick,
    teamId: team.id,
    precedingPicks: buildPrecedingPicks(rng, Math.min(pick - 1, 5), nbaTeams),
    fallbackTeamId,
    fallbackLeagueId,
  }
}

function buildPrecedingPicks(
  rng: Rng,
  count: number,
  nbaTeams: ReturnType<typeof teamsInLeague>,
) {
  const picks: DraftResult['precedingPicks'] = []
  for (let i = 0; i < Math.max(0, count); i++) {
    picks.push({
      pick: i + 1,
      name: inventName(rng),
      teamAbbr: rng.pick(nbaTeams).abbr,
    })
  }
  return picks
}

/** Headline for the season log. */
export function draftHeadline(result: DraftResult) {
  if (result.pick !== null && result.teamId) {
    const team = getTeam(result.teamId)
    return {
      es: `Draft: ${team.name.es} te eligió en el puesto ${result.pick}.`,
      en: `Draft night: ${team.name.en} took you at pick ${result.pick}.`,
    }
  }
  const team = getTeam(result.fallbackTeamId)
  return {
    es: `Nadie te eligió en el draft. Firmaste con ${team.name.es}.`,
    en: `You went undrafted. You signed with ${team.name.en}.`,
  }
}
