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
import { computeLegacy, computeTotals } from '../legacy'
import type { AttributeKey, GameState, LegacyTier, Position } from '../types'
import { COUNTRIES } from '@/data/countries'
import { PLAY_STYLES } from '@/data/styles'
import { getLeague } from '@/data/leagues'
import { getPerk } from '@/data/perks'

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
 * Drive a career through every phase. Minigame results and perk picks are
 * inputs, exactly like event choices, so a seed plus these decisions still
 * reproduces a career byte for byte.
 */
function drive(
  state: GameState,
  opts: {
    choice?: (count: number, rng: Rng) => number
    minigame?: (required: number, rounds: number, rng: Rng) => number
    offer?: (count: number, rng: Rng) => number
    perk?: (choices: string[], rng: Rng) => string
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
        const index = opts.offer ? opts.offer(offers.length, opts.rng) % Math.max(1, offers.length) : 0
        s = acceptOffer(s, index)
        break
      }
      case 'preseason': {
        const choices = s.player.perkChoices
        if (choices.length > 0 && opts.perk) s = choosePerk(s, opts.perk(choices, opts.rng))
        s = beginSeason(s)
        break
      }
      case 'event': {
        const options = s.pendingEvent?.choices ?? []
        const index = opts.choice ? opts.choice(options.length, opts.rng) % Math.max(1, options.length) : 0
        s = resolveChoice(s, options[index]?.index ?? 0)
        s = continueAfterEvent(s)
        break
      }
      case 'minigame': {
        const mg = s.pendingMinigame!
        const successes = opts.minigame
          ? opts.minigame(mg.required, mg.rounds, opts.rng)
          : mg.required
        s = s.pendingTournament ? resolveNationalFinal(s, successes) : resolveMinigame(s, successes)
        break
      }
      case 'season_result':
        s = continueFromSeason(s)
        break
      case 'national':
        if (s.pendingMinigame) {
          const mg = s.pendingMinigame
          const successes = opts.minigame
            ? opts.minigame(mg.required, mg.rounds, opts.rng)
            : mg.required
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

/**
 * Play a career. `focused` models a player who picks perks matching their
 * position; the alternative takes whatever is listed first.
 */
function play(seed: string, focused: boolean, winsFinals = true): GameState {
  const rng = new Rng(seed)
  const choices: CreationChoices = {
    name: seed,
    countryCode: rng.pick(COUNTRIES).code,
    number: rng.int(0, 99),
    position: rng.pick(POSITIONS),
    hand: 'right',
    styleId: rng.pick(PLAY_STYLES).id,
  }
  const state = createGame(choices, seed, 'career')
  const policy = new Rng(`${seed}::policy`)
  return drive(state, {
    rng: policy,
    choice: (count, r) => (count > 0 ? r.int(0, count - 1) : 0),
    minigame: (required) => (winsFinals ? required : Math.max(0, required - 1)),
    // A focused player signs with the strongest league offered; a casual one
    // takes whatever is on top of the pile.
    offer: () => 0,
    perk: (list, r) => {
      if (!focused) return list[0]
      const wanted = FOCUS[state.player.position]
      const match = list.find((id) => {
        const bonus = getPerk(id).bonus
        return wanted.some((key) => (bonus[key] ?? 0) > 0)
      })
      return match ?? r.pick(list)
    },
  })
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

  it('rewards perks chosen to suit the position with better careers', () => {
    const casual = verdicts(90, false)
    const focused = verdicts(90, true)

    const avg = (rows: typeof casual) =>
      rows.reduce((sum, r) => sum + r.legacy.score, 0) / rows.length
    const eliteRate = (rows: typeof casual) =>
      rows.filter((r) => ['hall_of_famer', 'legend', 'goat'].includes(r.legacy.tier)).length /
      rows.length

    // Player agency has to actually matter — this is the whole point of the
    // perk screen. Measured on legacy rather than on reaching the NBA, since
    // that is now gated on draft night rather than on year-to-year quality.
    expect(avg(focused)).toBeGreaterThan(avg(casual))
    expect(eliteRate(focused)).toBeGreaterThan(eliteRate(casual))
  })

  it('keeps elite outcomes rare for a player who never thinks about their perks', () => {
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
