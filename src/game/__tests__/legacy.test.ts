import { describe, expect, it } from 'vitest'

import { Rng } from '../rng'
import { createGame, type CreationChoices } from '../create'
import {
  advanceYear,
  beginSeason,
  continueAfterEvent,
  resolveChoice,
  resolveMinigame,
} from '../engine'
import { spendGrowthPoint } from '../progression'
import { computeLegacy, computeTotals } from '../legacy'
import type { AttributeKey, GameState, LegacyTier, Position } from '../types'
import { COUNTRIES } from '@/data/countries'
import { PLAY_STYLES } from '@/data/styles'
import { getLeague } from '@/data/leagues'

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']

/**
 * What an informed player invests in, per position — the attributes the UI's
 * help text points them at. Deliberately not imported from the engine: this is
 * the player's view of the game, and it should win on its own merits.
 */
const FOCUS: Record<Position, AttributeKey[]> = {
  PG: ['handling', 'shooting', 'iq'],
  SG: ['shooting', 'athleticism', 'handling'],
  SF: ['shooting', 'athleticism', 'defense'],
  PF: ['strength', 'defense', 'athleticism'],
  C: ['strength', 'defense', 'athleticism'],
}

/**
 * Play a career, optionally specialising growth points like an engaged player.
 * `finalsWon` models how good the player is at the minigames that decide titles.
 */
function play(seed: string, specialise: boolean, winsFinals = true): GameState {
  const rng = new Rng(seed)
  const choices: CreationChoices = {
    name: seed,
    countryCode: rng.pick(COUNTRIES).code,
    number: rng.int(0, 99),
    position: rng.pick(POSITIONS),
    hand: 'right',
    styleId: rng.pick(PLAY_STYLES).id,
  }
  let state = createGame(choices, seed, 'career')
  const policy = new Rng(`${seed}::policy`)
  let guard = 0

  while (!state.player.retired && guard < 100) {
    guard++
    if (specialise) {
      const focus = FOCUS[state.player.position]
      let spent = 0
      while (state.player.growthPoints > 0 && spent < 40) {
        if (!spendGrowthPoint(state.player, focus[spent % focus.length])) break
        spent++
      }
    }
    state = beginSeason(state)
    if (state.phase === 'event' && state.pendingEvent) {
      const options = state.pendingEvent.choices
      state = resolveChoice(state, options[policy.int(0, options.length - 1)].index)
      state = continueAfterEvent(state)
    }
    if (state.phase === 'minigame' && state.pendingMinigame) {
      const { required } = state.pendingMinigame
      state = resolveMinigame(state, winsFinals ? required : Math.max(0, required - 1))
    }
    state = advanceYear(state)
  }
  return state
}

function verdicts(count: number, specialise: boolean) {
  return Array.from({ length: count }, (_, i) => {
    const state = play(`dist-${specialise ? 's' : 'c'}-${i}`, specialise)
    const totals = computeTotals(state.seasons)
    return {
      state,
      totals,
      legacy: computeLegacy(totals, state.seasons, state.rival),
      reachedNba: state.seasons.some((s) => s.leagueId === 'nba'),
    }
  })
}

describe('legacy verdicts', () => {
  it('never labels a non-Hall-of-Fame tier as a Hall of Famer', () => {
    // The share card prints both; they must never contradict each other.
    const hofTiers: LegacyTier[] = ['hall_of_famer', 'legend', 'goat']
    for (const result of verdicts(80, false)) {
      expect(result.legacy.hallOfFame, `tier ${result.legacy.tier}`).toBe(
        hofTiers.includes(result.legacy.tier),
      )
    }
  })

  it('rewards deliberate growth-point spending with better careers', () => {
    const casual = verdicts(90, false)
    const focused = verdicts(90, true)

    const avg = (rows: typeof casual) =>
      rows.reduce((sum, r) => sum + r.legacy.score, 0) / rows.length
    const nbaRate = (rows: typeof casual) =>
      rows.filter((r) => r.reachedNba).length / rows.length

    // Player agency has to actually matter — this is the whole point of the
    // preseason screen.
    expect(avg(focused)).toBeGreaterThan(avg(casual))
    expect(nbaRate(focused)).toBeGreaterThan(nbaRate(casual))
  })

  it('keeps elite outcomes rare for a player who never allocates points', () => {
    const casual = verdicts(120, false)
    const eliteRate =
      casual.filter((r) => r.legacy.tier === 'goat' || r.legacy.tier === 'legend').length /
      casual.length
    const nbaRate = casual.filter((r) => r.reachedNba).length / casual.length

    expect(eliteRate).toBeLessThan(0.25)
    expect(nbaRate).toBeLessThan(0.4)
  })

  it('scales achievements by the level they were earned at', () => {
    // Two identical trophy hauls, one in the NBA and one in a fourth tier,
    // must not produce the same legacy score.
    const base = play('level-compare', true)
    const totals = computeTotals(base.seasons)

    const asNba = base.seasons.map((s) => ({ ...s, leagueId: 'nba' }))
    const asLower = base.seasons.map((s) => ({ ...s, leagueId: 'leb_oro' }))

    const high = computeLegacy(totals, asNba, base.rival).score
    const low = computeLegacy(totals, asLower, base.rival).score
    expect(high).toBeGreaterThan(low)
  })

  it('produces a spread of outcomes rather than one dominant tier', () => {
    const tiers = new Set(verdicts(100, false).map((r) => r.legacy.tier))
    expect(tiers.size).toBeGreaterThanOrEqual(3)
  })

  it('only awards international medals to players good enough to be called up', () => {
    for (const result of verdicts(60, false)) {
      if (result.totals.internationalGolds + result.totals.internationalMedals > 0) {
        // Call-ups require tier <= 3, so a purely youth career cannot medal.
        const played = result.state.seasons.filter((s) => getLeague(s.leagueId).tier <= 3)
        expect(played.length).toBeGreaterThan(0)
      }
    }
  })
})
