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
import { stageForAge } from './ladder'

/** Picks in a draft. Two rounds, thirty apiece, minus a couple for realism. */
const TOTAL_PICKS = 58

/** Weights behind `draftStock`, pulled out so `draftLimiter` can re-run the
 *  formula with one term swapped for a benchmark, without duplicating it. */
const RATING_WEIGHT = 0.86
const HYPE_WEIGHT = 0.22
const COUNTRY_WEIGHT = 0.06

/**
 * How good you look to scouts, which is not quite how good you are.
 *
 * Weighted toward raw ability, with hype a real but secondary factor. This is
 * the number draft night turns on.
 */
function stockFor(rating: number, hype: number, country: Country): number {
  return rating * RATING_WEIGHT + hype * HYPE_WEIGHT + country.strength * COUNTRY_WEIGHT
}

function draftStock(player: Player, country: Country): number {
  return stockFor(overallRating(player), player.hidden.hype, country)
}

/**
 * Where scouts had you going, before the picks start. Shared by `runDraft`
 * (the outcome) and `draftOutlook` (the preview) so the two can never drift:
 * there is exactly one place this arithmetic lives.
 */
function projectDraftRange(stock: number): { centre: number; range: [number, number] } {
  // Wide when your stock is middling.
  const centre = clamp(Math.round(96 - stock * 1.05), 1, TOTAL_PICKS)
  const spread = clamp(Math.round(18 - stock * 0.12), 4, 16)
  const range: [number, number] = [
    clamp(centre - spread, 1, TOTAL_PICKS),
    clamp(centre + spread, 1, TOTAL_PICKS),
  ]
  return { centre, range }
}

/** Chance of hearing your name called at all, calibrated against what a real
 *  20-22 year old prospect looks like. Exactly zero at or below the floor;
 *  that same line makes an outlook 'fringe' rather than 'second_round'. */
const UNDRAFTED_STOCK_FLOOR = 52
const DRAFT_PROBABILITY_SPAN = 26
const MAX_DRAFT_PROBABILITY = 0.85

function draftProbability(stock: number): number {
  return clamp((stock - UNDRAFTED_STOCK_FLOOR) / DRAFT_PROBABILITY_SPAN, 0, MAX_DRAFT_PROBABILITY)
}

/** Rating gates for "clearly ready regardless of age". Shared with
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

/**
 * Age at which `draftOutlook` starts handing out real numbers instead of
 * just noting the draft exists and naming it a while off.
 *
 * Below this, a fresh character and a well-developed one look almost
 * identical, because everyone starts around the same low rating and hype, so
 * a precise range/tier/likelihood would confidently describe a state that is
 * universal rather than diagnostic of *this* build. Derived from `stageForAge`
 * (`ladder.ts`) rather than a second hardcoded 17 here: that function's own
 * youth -> breakout boundary is the point the ladder moves a player out of
 * the youth league and builds start to diverge. If that boundary ever moves,
 * this moves with it.
 */
const DETAILED_OUTLOOK_AGE = (() => {
  for (let age = 0; age <= 100; age++) {
    if (stageForAge(age) === 'breakout') return age
  }
  throw new Error('stageForAge never reaches breakout — DETAILED_OUTLOOK_AGE cannot be derived')
})()

/** Where scouts are projecting you before the draft, or how far off it still
 *  is. Purely a read of state: call it every render, it never mutates
 *  anything and never touches an `Rng`. */
export type DraftTier = 'lottery' | 'first_round' | 'second_round' | 'fringe'

/** Which side of `draftStock` is furthest behind, so the UI can tell the
 *  player what to work on. Never the raw hype number, which stays hidden. */
export type DraftLimiter = 'ability' | 'exposure' | null

/**
 * How confident the projection is, independent of where it lands. `tier`
 * answers "where"; this answers "how sure". They are kept apart because a
 * single band that tried to carry both ended up overselling itself (see
 * `FRINGE_PROBABILITY_FLOOR`). A category, never the raw percentage: this
 * game never surfaces odds as numbers anywhere else, and a number invites
 * optimising it rather than understanding the situation.
 */
export type DraftLikelihood = 'strong' | 'likely' | 'uncertain' | 'longshot' | 'unlikely' | 'remote'

export interface DraftOutlook {
  /** True once `isDraftEligible` would fire this season. */
  eligibleNow: boolean
  /** Seasons until age 22, when eligibility stops being optional. 0 once reached. */
  seasonsUntilForced: number
  /** True when a good season could pull the draft forward: the rating gate is close. */
  couldDeclareEarly: boolean
  /** Same maths the draft itself uses. Where you'd land *if* picked; see
   *  `likelihood` for whether that's likely to happen at all. */
  projectedRange: [number, number]
  tier: DraftTier
  /** How confident that placement is. Read this alongside `tier`, not instead of it. */
  likelihood: DraftLikelihood
  /** Which side of the stock formula is furthest behind, or null when balanced. */
  limiter: DraftLimiter
  /** False below `DETAILED_OUTLOOK_AGE`: the draft still looms, but nothing
   *  below is yet a read on *this* player rather than on every fresh
   *  character alike. Every other field above is still populated regardless;
   *  this function states the rule, the surfaces decide what to render. */
  detailed: boolean
}

/**
 * Benchmarks `draftLimiter` substitutes in to see which side of the formula
 * is holding stock back. Hype starts around 12 at creation and is bounded
 * 0-100, so 40 reads as a solid, unremarkable media profile a couple of
 * seasons in: a fair midpoint to test against, not the ceiling. `overallRating`
 * runs roughly 40-90 over a career, so 60 reads as a useful rotation player,
 * the equivalent midpoint on that scale. Substituting each term for its
 * benchmark and comparing which move helps stock more identifies the side
 * that is behind, instead of picking an arbitrary split of the raw formula
 * weights.
 */
const HYPE_BENCHMARK = 40
const RATING_BENCHMARK = 60
/**
 * A gap smaller than this is noise, so `limiter` does not flip between
 * near-identical benchmarks.
 *
 * Because rating and hype cancel out of the *other* term's substitution,
 * `gainFromHypeBenchmark` reduces to `(HYPE_BENCHMARK - hype) * HYPE_WEIGHT`
 * and depends on nothing else. Verification caught a trace where `limiter`
 * flickered `ability -> null -> exposure -> null` across three seasons on
 * hype noise alone. At the old margin of 1, a hype move of just
 * `1 / HYPE_WEIGHT ≈ 4.5` points was enough to flip the verdict, and a
 * single offseason can move hype far past that: `finalizeSeason` alone
 * (`engine.ts`) moves it by roughly `(rating - 55) * 0.28 + awards * 4`, and
 * on top of that a single event card can add a lot more (a `development` card
 * grants +20 hype, an origin-story card +18, a national-tournament win +14;
 * see `events/development.ts`, `events/origin.ts`, `events/national.ts`), so
 * one offseason's total swing commonly runs 30-45 points, not the ±16 the
 * base formula alone would suggest.
 *
 * At margin 5, flipping on hype alone needs a move of
 * `5 / HYPE_WEIGHT ≈ 22.7` points, comfortably *inside* that envelope, so the
 * margin does not stop a big offseason from flipping `limiter` and isn't
 * meant to. What justifies margin 5 is measured, not arithmetic: a
 * 1,560-career re-trace (see `task-1-report.md`) found `limiter` flicker at
 * 1.5% of traces at this margin, down from 8.3% at margin 1, low enough to
 * leave as is, while the lopsided exposure/ability fixtures below (gaps of
 * 7-13 points) still clear it easily.
 */
const LIMITER_MARGIN = 5

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
 * buys a player already in that range: close enough that declaring early is
 * a live decision, not wishful thinking.
 */
const EARLY_DECLARE_MARGIN = 5

function couldDeclareEarlyFor(player: Player): boolean {
  if (player.age < 19) return false
  const gate = player.currentLeagueId === 'ncaa' ? NCAA_DRAFT_GATE : GENERAL_DRAFT_GATE
  return overallRating(player) > gate - EARLY_DECLARE_MARGIN
}

/**
 * Verification drove real careers through the engine and compared the tier
 * against what `runDraft` did: of the traces whose final pre-draft reading was
 * `'second_round'`, only 27% were drafted, worse than a coin flip and not what
 * "second round" tells a player. 0.30 draws the fringe line just above that
 * observed rate. Below it, "you might not be drafted at all" matters more than
 * "if you are, it's around pick 40", so `'fringe'` overrides whatever the
 * centre alone would suggest. A 1,560-career re-trace after this landed
 * confirmed it: `'second_round'` moved to 49.1% drafted and `'first_round'`
 * held at 60.4% (the original "0/3 first_round traces drafted" was
 * small-sample noise, not a second defect), both comfortably above a coin
 * flip.
 *
 * It is *not* set at the second/first-round boundary (~0.42, where `centre`
 * crosses 30), which would have retired `'second_round'` as a reachable tier
 * entirely. 27% is an average over that whole band, not a per-instance
 * measurement, and the band's upper half (toward 0.42) is closer to 40%, a
 * real placement worth keeping. What is left of `'second_round'` after this
 * floor (~0.30-0.42) is uncertain rather than fringe, which is what
 * `draftLikelihood` says out loud alongside it.
 *
 * `draftLikelihood`'s bands are built from this same constant: every band
 * below it is a `'fringe'`-side reading and every band at or above it is not,
 * so the two can never disagree about where "probably not drafted" begins.
 * See `draftLikelihood` for how that invariant is kept explicit.
 */
const FRINGE_PROBABILITY_FLOOR = 0.3

function draftTier(centre: number, stock: number): DraftTier {
  if (draftProbability(stock) < FRINGE_PROBABILITY_FLOOR) return 'fringe'
  if (centre <= 14) return 'lottery'
  if (centre <= 30) return 'first_round'
  return 'second_round'
}

/**
 * Bands for `DraftLikelihood`, read straight off `draftProbability`.
 *
 * The same 1,560-career re-trace that confirmed `FRINGE_PROBABILITY_FLOOR`
 * also found the fix's cost: `'fringe'`/what was then a single `'unlikely'`
 * likelihood swallowed 80% of final readings, so a player at 29% and one at
 * 2% saw the identical word. A fresh cohort run for this rebalance (~3,200
 * draft-night readings, same engine, same methodology) reproduced that shape,
 * with everything below 0.30 at 68-69% of the population, and broke it down
 * by drafted-rate to find real sub-bands rather than an even split:
 *
 * ```
 * probability        share   drafted-rate
 * [0.00, 0.05)        11%        1%
 * [0.05, 0.15)        17%       10%
 * [0.15, 0.30)        41%       22%
 * [0.30, 0.55)        28%       39%   (was already 'uncertain')
 * [0.55, 0.70)         3%       52%   (was already 'likely')
 * [0.70, 0.85]        <1%       92%   (was already 'strong')
 * ```
 *
 * Splitting at 0.05 and 0.15 turns one 68-point-share band with a 0-31%
 * internal spread of drafted-rate into three, each with a materially
 * different rate (1%, 10%, 22%), so a 29% and a 2% player now land in
 * different bands. The remaining `[0.15, 0.30)` band is still the single
 * largest at ~41% and stays that way on purpose: splitting it further (tried
 * at 0.20 in the same re-trace) only shaves it to two ~15-26% bands with
 * adjacent drafted-rates (17% and 25%) that are not meaningfully different
 * categories, and this game does not want a wall of near-synonymous hint
 * text. Six categories already strains "categorical, not a percentage."
 *
 * `'unlikely'` and `'longshot'` sit entirely below `FRINGE_PROBABILITY_FLOOR`
 * by construction, since `'longshot'`'s own ceiling *is* that constant, so
 * every band below it reads `'fringe'` on `tier` and every band at or above
 * it never does. `'likely'`/`'strong'` are unchanged from the original pass:
 * `draftProbability` caps at `MAX_DRAFT_PROBABILITY` (0.85), so `'strong'`
 * is reachable but never a guarantee, matching what a projection should
 * promise.
 */
const REMOTE_PROBABILITY_CEILING = 0.05
const UNLIKELY_PROBABILITY_CEILING = 0.15
const LIKELY_PROBABILITY_FLOOR = 0.55
const STRONG_PROBABILITY_FLOOR = 0.7

function draftLikelihood(probability: number): DraftLikelihood {
  if (probability < REMOTE_PROBABILITY_CEILING) return 'remote'
  if (probability < UNLIKELY_PROBABILITY_CEILING) return 'unlikely'
  // FRINGE_PROBABILITY_FLOOR, not a fourth constant: this is the exact line
  // 'fringe' is drawn on, and reusing it is what makes tier/likelihood
  // agreement structural rather than something that has to be kept in sync.
  if (probability < FRINGE_PROBABILITY_FLOOR) return 'longshot'
  if (probability < LIKELY_PROBABILITY_FLOOR) return 'uncertain'
  if (probability < STRONG_PROBABILITY_FLOOR) return 'likely'
  return 'strong'
}

/**
 * The projection screen for the draft that hasn't happened yet. Pure and
 * `Rng`-free by design: it is called on every render, and the number it
 * shows must never move between calls or drift from what `runDraft` produces
 * on the night. Both read `projectDraftRange`/`draftStock`, the exact
 * functions `runDraft` itself calls.
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
    // Nothing to "pull forward" once the draft is already this season; that
    // branch belongs to `eligibleNow`.
    couldDeclareEarly: !eligibleNow && couldDeclareEarlyFor(player),
    projectedRange: range,
    tier: draftTier(centre, stock),
    likelihood: draftLikelihood(draftProbability(stock)),
    limiter: draftLimiter(player, country),
    detailed: player.age >= DETAILED_OUTLOOK_AGE,
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
