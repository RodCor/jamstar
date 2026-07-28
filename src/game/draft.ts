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

/** Weights behind `draftStock` — pulled out so `draftLimiter` can re-run the
 *  formula with one term swapped for a benchmark, without duplicating it. */
const RATING_WEIGHT = 0.86
const HYPE_WEIGHT = 0.22
const COUNTRY_WEIGHT = 0.06

/**
 * How good you look to scouts, which is not quite how good you are.
 *
 * Weighted toward raw ability with hype as a real but secondary factor — this
 * is the number draft night turns on, so it should mostly reward the player
 * having actually become good.
 */
function stockFor(rating: number, hype: number, country: Country): number {
  return rating * RATING_WEIGHT + hype * HYPE_WEIGHT + country.strength * COUNTRY_WEIGHT
}

function draftStock(player: Player, country: Country): number {
  return stockFor(overallRating(player), player.hidden.hype, country)
}

/**
 * Where scouts had you going, before the picks start. Shared by `runDraft`
 * (the outcome) and `draftOutlook` (the preview) so the two can never drift —
 * there is exactly one place this arithmetic lives.
 */
function projectDraftRange(stock: number): { centre: number; range: [number, number] } {
  // Wide when your stock is middling, which is exactly when draft night is
  // most nerve-racking.
  const centre = clamp(Math.round(96 - stock * 1.05), 1, TOTAL_PICKS)
  const spread = clamp(Math.round(18 - stock * 0.12), 4, 16)
  const range: [number, number] = [
    clamp(centre - spread, 1, TOTAL_PICKS),
    clamp(centre + spread, 1, TOTAL_PICKS),
  ]
  return { centre, range }
}

/** Chance of hearing your name called at all, calibrated against what a real
 *  20-22 year old prospect looks like. Exactly zero at/below the floor — that
 *  same line is what makes an outlook 'fringe' rather than 'second_round'. */
const UNDRAFTED_STOCK_FLOOR = 52
const DRAFT_PROBABILITY_SPAN = 26
const MAX_DRAFT_PROBABILITY = 0.85

function draftProbability(stock: number): number {
  return clamp((stock - UNDRAFTED_STOCK_FLOOR) / DRAFT_PROBABILITY_SPAN, 0, MAX_DRAFT_PROBABILITY)
}

/** Rating gates for "clearly ready regardless of age" — shared with
 *  `couldDeclareEarlyFor` so its proximity check reads off the same numbers
 *  this eligibility check gates on, rather than a second copy of them. */
const NCAA_DRAFT_GATE = 66
const GENERAL_DRAFT_GATE = 58

/** Whether the player is even in the conversation this year. */
export function isDraftEligible(player: Player, seasonsPlayed: number): boolean {
  // Draft night happens once. Undrafted means undrafted.
  if (player.draftDone) return false
  if (player.currentLeagueId === 'youth') return false
  if (player.currentLeagueId === 'nba') return false
  if (player.age < 19) return false
  // College players declare after enough seasons or once they are clearly ready.
  if (player.currentLeagueId === 'ncaa') {
    return seasonsPlayed >= 4 || player.age >= 22 || overallRating(player) > NCAA_DRAFT_GATE
  }
  // Everyone else declares once they look like a prospect, or at 22 when the
  // decision is made for them. Firing at 19 regardless meant every career hit
  // draft night at its weakest possible moment and nobody ever got picked.
  return player.age >= 22 || overallRating(player) > GENERAL_DRAFT_GATE
}

/**
 * Age at which the draft decision is made for you regardless of readiness
 * (mirrors the `age >= 22` branches in `isDraftEligible`). Doubles as the
 * cutoff for `draftOutlook`: past this age the engine guarantees `draftDone`
 * is already set on every real career, so lingering here without it means
 * there is nothing left ahead to project.
 */
const FORCED_DRAFT_AGE = 22

/** Where scouts are projecting you before the draft, or how far off it still
 *  is. Purely a read of state — call it every render, it never mutates
 *  anything and never touches an `Rng`. */
export type DraftTier = 'lottery' | 'first_round' | 'second_round' | 'fringe'

/** Which side of `draftStock` is furthest behind, so the UI can tell the
 *  player what to work on. Never the raw hype number — that stays hidden. */
export type DraftLimiter = 'ability' | 'exposure' | null

export interface DraftOutlook {
  /** True once `isDraftEligible` would fire this season. */
  eligibleNow: boolean
  /** Seasons until age 22, when eligibility stops being optional. 0 once reached. */
  seasonsUntilForced: number
  /** True when a good season could pull the draft forward — the rating gate is close. */
  couldDeclareEarly: boolean
  /** Same maths the draft itself uses. */
  projectedRange: [number, number]
  tier: DraftTier
  /** Which side of the stock formula is furthest behind, or null when balanced. */
  limiter: DraftLimiter
}

/**
 * Benchmarks `draftLimiter` substitutes in to see which side of the formula
 * is holding stock back. Hype starts around 12 at creation and is bounded
 * 0-100, so 40 reads as a solid, unremarkable media profile a couple of
 * seasons in — a fair midpoint to test against, not the ceiling. `overallRating`
 * runs roughly 40-90 over a career, so 60 reads as a useful rotation player,
 * the equivalent midpoint on that scale. Substituting each term for its
 * benchmark and comparing which move helps stock more identifies the side
 * that is actually behind, instead of picking an arbitrary split of the raw
 * formula weights.
 */
const HYPE_BENCHMARK = 40
const RATING_BENCHMARK = 60
/** A gap smaller than this is noise, not a real story — keeps `limiter` from
 *  flipping between near-identical benchmarks. */
const LIMITER_MARGIN = 1

function draftLimiter(player: Player, country: Country): DraftLimiter {
  const rating = overallRating(player)
  const hype = player.hidden.hype
  const actual = stockFor(rating, hype, country)
  const gainFromHypeBenchmark = stockFor(rating, HYPE_BENCHMARK, country) - actual
  const gainFromRatingBenchmark = stockFor(RATING_BENCHMARK, hype, country) - actual

  if (gainFromHypeBenchmark > gainFromRatingBenchmark + LIMITER_MARGIN && gainFromHypeBenchmark > 0) {
    return 'exposure'
  }
  if (gainFromRatingBenchmark > gainFromHypeBenchmark + LIMITER_MARGIN && gainFromRatingBenchmark > 0) {
    return 'ability'
  }
  return null
}

/**
 * How close to the applicable rating gate counts as "a strong season could
 * close it". Five points is roughly what a good preseason plus a good year
 * buys a player already in that range — close enough that declaring early is
 * a live decision, not wishful thinking.
 */
const EARLY_DECLARE_MARGIN = 5

function couldDeclareEarlyFor(player: Player): boolean {
  if (player.age < 19) return false
  const gate = player.currentLeagueId === 'ncaa' ? NCAA_DRAFT_GATE : GENERAL_DRAFT_GATE
  return overallRating(player) > gate - EARLY_DECLARE_MARGIN
}

function draftTier(centre: number, stock: number): DraftTier {
  // Same floor `runDraft` uses to decide nobody calls at all — below it,
  // calling this a round projection would be misleading.
  if (draftProbability(stock) <= 0) return 'fringe'
  if (centre <= 14) return 'lottery'
  if (centre <= 30) return 'first_round'
  return 'second_round'
}

/**
 * The projection screen for the draft that hasn't happened yet. Pure and
 * `Rng`-free by design: it is called on every render, and the number it
 * shows must never move between calls or drift from what `runDraft` actually
 * produces on the night — both read `projectDraftRange`/`draftStock`, the
 * exact functions `runDraft` itself calls.
 */
export function draftOutlook(player: Player, country: Country, seasonsPlayed: number): DraftOutlook | null {
  // No draft is ahead: it already happened, they're already in the league
  // that draft would have sent them to, or they're well past the age it's
  // guaranteed to have resolved by.
  if (player.draftDone) return null
  if (player.currentLeagueId === 'nba') return null
  if (player.age > FORCED_DRAFT_AGE) return null

  const stock = draftStock(player, country)
  const { centre, range } = projectDraftRange(stock)
  const eligibleNow = isDraftEligible(player, seasonsPlayed)

  return {
    eligibleNow,
    seasonsUntilForced: Math.max(0, FORCED_DRAFT_AGE - player.age),
    // Nothing to "pull forward" once the draft is already this season — that
    // branch belongs to `eligibleNow`, not this one.
    couldDeclareEarly: !eligibleNow && couldDeclareEarlyFor(player),
    projectedRange: range,
    tier: draftTier(centre, stock),
    limiter: draftLimiter(player, country),
  }
}

/** Invent a name for someone taken ahead of you. */
function inventName(rng: Rng): string {
  const country = rng.weighted(COUNTRIES, (c) => c.strength)
  const pool = namePool(country.namePoolId)
  return `${rng.pick(pool.first)} ${rng.pick(pool.last)}`
}

export function runDraft(player: Player, country: Country, rng: Rng): DraftResult {
  const stock = draftStock(player, country)
  const drafted = rng.chance(draftProbability(stock))
  const { range: projectedRange } = projectDraftRange(stock)

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
