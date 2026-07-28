import { describe, expect, it } from 'vitest'

import { Rng } from '../rng'
import { createGame, type CreationChoices } from '../create'
import {
  acceptOffer,
  beginSeason,
  choosePerk,
  confirmDraft,
  continueAfterEvent,
  continueFromNational,
  continueFromSeason,
  resolveChoice,
  resolveMinigame,
  resolveNationalFinal,
} from '../engine'
import { computeTotals } from '../legacy'
import { PERK_RARITIES } from '../perks'
import { getPerk } from '@/data/perks'
import type { GameState, PlayStyleId, Position } from '../types'

/**
 * Does chasing rarity actually matter, and does it break the game?
 *
 * This is a separate file rather than an addition to `perks.test.ts` because
 * that file mocks `@/data/perks` at module scope with a small fixture pool
 * (see its header comment). This test needs `getPerk` to resolve real ids
 * drawn from the real 53-perk pool through the real engine, so it must never
 * see that mock. A new file sidesteps the issue entirely instead of relying
 * on every test in a shared file remembering to `importActual`.
 *
 * The harness (`drive`, the creation-choice cycling) is copied from
 * `career-distribution.test.ts`, which was itself copied from
 * `legacy.test.ts` for the same reason stated there: a helper shared across
 * measurement instruments would let a change to one silently move another.
 *
 * The two cohorts below use identical seeds, positions, styles and countries
 * per matched index: `createGame` is called with the same seed string for
 * career `i` in both cohorts, and the perk draw itself (`drawPerkChoices`,
 * called from `engine.ts` with `Rng(`${seed}::${year}::perks`)`) is seeded
 * off that same game seed, not off the policy's own `Rng` stream. So the
 * offered choices for a given career-year start out identical between the
 * greedy and timid runs. Only the *policy*, which of the three offered ids
 * gets taken, differs. Once the two runs take different perks, their
 * owned-perk sets diverge, which changes future eligibility and standing,
 * which changes future offers: the careers diverge. That is expected and is
 * the point; the fixed part is the starting conditions, not the trajectory.
 */

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']
const STYLES: PlayStyleId[] = [
  'scorer',
  'floor_general',
  'sharpshooter',
  'lockdown',
  'highlight',
  'franchise',
]
const COUNTRY_CODES = ['US', 'ES', 'AR', 'RS', 'FR']

const COHORT_SIZE = 120

/** Rank of a perk's rarity: 0 (basic) weakest, up to top1 strongest. */
function rarityRank(id: string): number {
  return PERK_RARITIES.indexOf(getPerk(id).rarity)
}

/** Always take the strongest tier on offer. */
function highestRarity(choices: string[]): string {
  return choices.reduce((best, id) => (rarityRank(id) > rarityRank(best) ? id : best))
}

/** Always take the weakest tier on offer. */
function lowestRarity(choices: string[]): string {
  return choices.reduce((worst, id) => (rarityRank(id) < rarityRank(worst) ? id : worst))
}

/**
 * Drive a career through every phase. Copied rather than imported/shared;
 * see the file header.
 */
function drive(
  state: GameState,
  opts: {
    choice: (count: number, rng: Rng) => number
    minigame: (required: number, rounds: number, rng: Rng) => number
    offer: (count: number, rng: Rng) => number
    perk: (choices: string[], rng: Rng) => string
    rng: Rng
  },
): GameState {
  let s = state
  let guard = 0
  while (!s.player.retired && guard < 220) {
    guard++
    switch (s.phase) {
      case 'draft':
        s = confirmDraft(s)
        break
      case 'offers': {
        const offers = s.pendingOffers ?? []
        const index = opts.offer(offers.length, opts.rng) % Math.max(1, offers.length)
        s = acceptOffer(s, index)
        break
      }
      case 'preseason': {
        const choices = s.player.perkChoices
        if (choices.length > 0) s = choosePerk(s, opts.perk(choices, opts.rng))
        s = beginSeason(s)
        break
      }
      case 'event': {
        const options = s.pendingEvent?.choices ?? []
        const index = opts.choice(options.length, opts.rng) % Math.max(1, options.length)
        s = resolveChoice(s, options[index]?.index ?? 0)
        s = continueAfterEvent(s)
        break
      }
      case 'minigame': {
        const mg = s.pendingMinigame!
        const successes = opts.minigame(mg.required, mg.rounds, opts.rng)
        s = s.pendingTournament ? resolveNationalFinal(s, successes) : resolveMinigame(s, successes)
        break
      }
      case 'season_result':
        s = continueFromSeason(s)
        break
      case 'national':
        if (s.pendingMinigame) {
          const mg = s.pendingMinigame
          const successes = opts.minigame(mg.required, mg.rounds, opts.rng)
          s = resolveNationalFinal(s, successes)
        } else {
          s = continueFromNational(s)
        }
        break
      case 'retirement':
        return s
    }
  }
  return s
}

function creationFor(index: number): CreationChoices {
  return {
    name: `P${index}`,
    countryCode: COUNTRY_CODES[index % COUNTRY_CODES.length],
    number: (index % 55) + 1,
    position: POSITIONS[index % POSITIONS.length],
    hand: 'right',
    styleId: STYLES[index % STYLES.length],
  }
}

/**
 * One career. Every decision except the perk pick is resolved the same way
 * `career-distribution.test.ts` resolves it, uniformly at random from the
 * seeded stream, so the only deliberate variable between cohorts is which
 * perk gets taken.
 */
function playCareer(index: number, pickPerk: (choices: string[]) => string): GameState {
  const seed = `rarity-policy::${index}`
  const state = createGame(creationFor(index), seed, 'career')
  const rng = new Rng(seed)
  return drive(state, {
    rng,
    choice: (count, r) => (count > 0 ? r.int(0, count - 1) : 0),
    offer: (count, r) => (count > 0 ? r.int(0, count - 1) : 0),
    perk: (choices) => pickPerk(choices),
    minigame: (_required, rounds, r) => r.int(0, rounds),
  })
}

function meanPeakRating(pickPerk: (choices: string[]) => string): number {
  const peaks = Array.from({ length: COHORT_SIZE }, (_, i) =>
    computeTotals(playCareer(i, pickPerk).seasons).peakRating,
  )
  return peaks.reduce((sum, v) => sum + v, 0) / peaks.length
}

describe('perk rarity policy vs career outcome', () => {
  it('rewards a greedy rarity policy over a timid one, without letting it dominate', () => {
    const greedyMean = meanPeakRating(highestRarity)
    const timidMean = meanPeakRating(lowestRarity)
    const gapPct = ((greedyMean - timidMean) / timidMean) * 100

    // Printed on every run, pass or fail: the gap is the finding, not merely
    // a pass/fail signal.
    console.log(
      `\ngreedy vs timid perk policy (n=${COHORT_SIZE} careers each)\n`
        + `greedy mean peak rating: ${greedyMean.toFixed(4)}\n`
        + `timid  mean peak rating: ${timidMean.toFixed(4)}\n`
        + `gap: ${gapPct.toFixed(2)}%\n`,
    )

    // If this fails, the rarity tiers are decorative: report the numbers,
    // do not loosen this assertion to make it pass.
    expect(greedyMean, `greedy ${greedyMean} should exceed timid ${timidMean}`).toBeGreaterThan(
      timidMean,
    )
    // Floor: `greedyMean > timidMean` alone is satisfied by any positive gap,
    // even one so small it means the tiers barely differ. The measured gap is
    // 4.50%; 2% leaves real room while still catching a collapse of the
    // rarity tiers toward each other. If this fails, report the measured
    // number; do not lower the floor to make it pass.
    expect(gapPct, `gap ${gapPct.toFixed(2)}% should be at least 2%`).toBeGreaterThanOrEqual(2)
    // If this fails, rarity dominates every other decision in the game.
    expect(gapPct, `gap ${gapPct.toFixed(2)}% should stay under 25%`).toBeLessThan(25)
  })
})
