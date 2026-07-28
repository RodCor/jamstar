import { describe, expect, it } from 'vitest'

import { draftOutlook, runDraft } from '../draft'
import { getCountry } from '@/data/countries'
import { Rng } from '../rng'
import type { Player } from '../types'

/**
 * A player with every attribute set to the same value has `overallRating`
 * exactly equal to that value, regardless of position weights — a weighted
 * mean of five identical numbers is that number. That makes stock (and every
 * band derived from it) exact and easy to reason about, instead of fighting
 * position weighting in every fixture.
 */
function makePlayer(overrides: Partial<Player> & { rating?: number; hype?: number } = {}): Player {
  const { rating = 60, hype = 12, ...rest } = overrides
  return {
    name: 'Probe',
    countryCode: 'ES',
    number: 9,
    position: 'SF',
    hand: 'right',
    styleId: 'scorer',
    heightCm: 200,
    age: 20,
    stage: 'development',
    attributes: { scoring: rating, playmaking: rating, defense: rating, physical: rating, mental: rating },
    hidden: { wear: 0, morale: 65, hype, coachTrust: 50 },
    currentTeamId: 'acb_bas',
    currentLeagueId: 'acb',
    growthPoints: 0,
    draftDone: false,
    perks: [],
    perkChoices: [],
    earnings: 0,
    firedEventIds: [],
    teamHistory: ['acb_bas'],
    retired: false,
    retirementYear: null,
    retirementReason: null,
    ...rest,
  }
}

const ES = getCountry('ES') // strength 88 — a fixed, known offset in every fixture below.

describe('draftOutlook', () => {
  it('returns null once draft night has already happened', () => {
    const player = makePlayer({ draftDone: true })
    expect(draftOutlook(player, ES, 0)).toBeNull()
  })

  it('returns null once already in the NBA', () => {
    const player = makePlayer({ currentLeagueId: 'nba' })
    expect(draftOutlook(player, ES, 0)).toBeNull()
  })

  it('returns null for a player too old for the draft to still be ahead of them', () => {
    const player = makePlayer({ age: 30 })
    expect(draftOutlook(player, ES, 0)).toBeNull()
  })

  it('gives a 17-year-old in a domestic league a non-null outlook, not yet eligible', () => {
    const player = makePlayer({ age: 17 })
    const outlook = draftOutlook(player, ES, 0)
    expect(outlook).not.toBeNull()
    expect(outlook?.eligibleNow).toBe(false)
    expect(outlook?.seasonsUntilForced).toBe(5)
  })

  it('projects exactly the range runDraft produces, across low, mid and high stock', () => {
    const fixtures = [
      makePlayer({ rating: 45, hype: 10 }), // fringe-band stock
      makePlayer({ rating: 63, hype: 10 }), // second-round-band stock
      makePlayer({ rating: 75, hype: 20 }), // first-round-band stock
      makePlayer({ rating: 88, hype: 30 }), // lottery-band stock
    ]

    for (const player of fixtures) {
      const outlook = draftOutlook(player, ES, 0)
      const result = runDraft(player, ES, new Rng('draft-outlook-parity'))
      expect(outlook?.projectedRange).toEqual(result.projectedRange)
    }
  })

  it('narrows the range and moves it toward pick 1 as overallRating rises', () => {
    const weak = draftOutlook(makePlayer({ rating: 50, hype: 12 }), ES, 0)
    const strong = draftOutlook(makePlayer({ rating: 85, hype: 12 }), ES, 0)
    expect(weak).not.toBeNull()
    expect(strong).not.toBeNull()

    const weakWidth = weak!.projectedRange[1] - weak!.projectedRange[0]
    const strongWidth = strong!.projectedRange[1] - strong!.projectedRange[0]
    expect(strongWidth).toBeLessThan(weakWidth)
    expect(strong!.projectedRange[0]).toBeLessThan(weak!.projectedRange[0])
  })

  it('tiers by the range centre, falling back to fringe when the draft odds are too low', () => {
    // fringe: draftProbability well under the 0.30 floor (stock < 52 caps it at 0).
    expect(draftOutlook(makePlayer({ rating: 45, hype: 10 }), ES, 0)?.tier).toBe('fringe')
    // second_round: probability ~0.37, above the 0.30 floor and below the
    // ~0.42 line where the centre itself crosses into first_round.
    expect(draftOutlook(makePlayer({ rating: 63, hype: 10 }), ES, 0)?.tier).toBe('second_round')
    // first_round: centre in (14, 30], probability comfortably above 0.30.
    expect(draftOutlook(makePlayer({ rating: 75, hype: 20 }), ES, 0)?.tier).toBe('first_round')
    // lottery: centre <= 14.
    expect(draftOutlook(makePlayer({ rating: 88, hype: 30 }), ES, 0)?.tier).toBe('lottery')
  })

  it('reports fringe and a below-floor likelihood for a player whose centre lands in a drafted band but whose odds do not clear the floor', () => {
    // This is the regression the fringe/likelihood floor exists for: rating
    // 58 / hype 10 projects a centre of 36 — squarely a "drafted" band by
    // position alone — but draftProbability there is ~0.21, well under the
    // 0.30 floor. Verification found exactly this shape of case: a tier that
    // read as a placement when the player was more likely than not to go
    // undrafted entirely. 0.21 sits in the 'longshot' sub-band ([0.15, 0.30)):
    // still fringe on tier, but the empirical re-trace showed this exact slice
    // drafted about 22% of the time — worth its own word, not lumped in with
    // a near-zero read.
    const outlook = draftOutlook(makePlayer({ rating: 58, hype: 10 }), ES, 0)
    expect(outlook?.tier).toBe('fringe')
    expect(outlook?.likelihood).toBe('longshot')
  })

  it('grades likelihood off draftProbability at real resolution, independent of tier', () => {
    // remote: probability ~0.024 — essentially nothing to work with yet.
    expect(draftOutlook(makePlayer({ rating: 53, hype: 8 }), ES, 0)?.likelihood).toBe('remote')
    // unlikely: probability ~0.107 — a real gap below the fringe floor, but a
    // meaningfully better spot than 'remote'.
    expect(draftOutlook(makePlayer({ rating: 55, hype: 10 }), ES, 0)?.likelihood).toBe('unlikely')
    // uncertain: second_round band (~0.37), better than the fringe floor, nowhere near a lock.
    expect(draftOutlook(makePlayer({ rating: 63, hype: 10 }), ES, 0)?.likelihood).toBe('uncertain')
    // likely: probability ~0.579 — better than even, short of a lock.
    expect(draftOutlook(makePlayer({ rating: 68, hype: 15 }), ES, 0)?.likelihood).toBe('likely')
    // strong: lottery-band stock saturates draftProbability at its 0.85 ceiling.
    expect(draftOutlook(makePlayer({ rating: 88, hype: 30 }), ES, 0)?.likelihood).toBe('strong')
  })

  it('never disagrees with tier: fringe iff likelihood is a below-floor band, across a full sweep of stock', () => {
    // The invariant the coordinator asked to keep explicit: 'longshot' is
    // capped at FRINGE_PROBABILITY_FLOOR itself, so this can't drift by
    // someone editing one constant and not the other — but this test proves
    // it holds in practice, not just by inspection of the source.
    const BELOW_FLOOR = new Set(['remote', 'unlikely', 'longshot'])
    const AT_OR_ABOVE_FLOOR = new Set(['uncertain', 'likely', 'strong'])
    for (let rating = 30; rating <= 95; rating += 1) {
      for (const hype of [0, 12, 25, 40, 60, 90]) {
        const outlook = draftOutlook(makePlayer({ rating, hype, age: 20 }), ES, 0)
        if (!outlook) continue
        if (outlook.tier === 'fringe') {
          expect(BELOW_FLOOR.has(outlook.likelihood), `rating ${rating} hype ${hype}: ${outlook.likelihood}`).toBe(
            true,
          )
        } else {
          expect(
            AT_OR_ABOVE_FLOOR.has(outlook.likelihood),
            `rating ${rating} hype ${hype}: tier ${outlook.tier} but likelihood ${outlook.likelihood}`,
          ).toBe(true)
        }
      }
    }
  })

  it('names exposure as the limiter when rating is strong but hype is low', () => {
    const outlook = draftOutlook(makePlayer({ rating: 80, hype: 5 }), ES, 0)
    expect(outlook?.limiter).toBe('exposure')
  })

  it('names ability as the limiter when hype is strong but rating is low', () => {
    const outlook = draftOutlook(makePlayer({ rating: 45, hype: 90 }), ES, 0)
    expect(outlook?.limiter).toBe('ability')
  })

  it('reports no limiter when rating and hype both sit at their benchmarks', () => {
    const outlook = draftOutlook(makePlayer({ rating: 60, hype: 40 }), ES, 0)
    expect(outlook?.limiter).toBeNull()
  })

  it('stays null on a modest gap that the old margin would have called — the deadband widening this guards', () => {
    // rating 55 / hype 35 gives gainFromRatingBenchmark = (60-55)*0.86 = 4.3
    // and gainFromHypeBenchmark = (40-35)*0.22 = 1.1, a gap of 3.2. Under the
    // old margin of 1 that gap would have cleared the bar and called
    // 'ability' — exactly the kind of modest, noise-sized gap that flickered
    // across seasons in verification as hype alone moved a few points. Under
    // the current margin of 5 it correctly reads as balanced.
    const outlook = draftOutlook(makePlayer({ rating: 55, hype: 35 }), ES, 0)
    expect(outlook?.limiter).toBeNull()
  })

  it('flags couldDeclareEarly when 19+ and just short of the applicable rating gate', () => {
    // General gate is 58; 56 is within the 5-point margin and not yet eligible.
    const close = makePlayer({ age: 20, rating: 56, hype: 12, currentLeagueId: 'acb' })
    const closeOutlook = draftOutlook(close, ES, 0)
    expect(closeOutlook?.eligibleNow).toBe(false)
    expect(closeOutlook?.couldDeclareEarly).toBe(true)

    // NCAA gate is 66; a player at 63 with too few seasons played is close but not eligible.
    const ncaaClose = makePlayer({ age: 20, rating: 63, hype: 12, currentLeagueId: 'ncaa' })
    const ncaaOutlook = draftOutlook(ncaaClose, ES, 1)
    expect(ncaaOutlook?.eligibleNow).toBe(false)
    expect(ncaaOutlook?.couldDeclareEarly).toBe(true)
  })

  it('does not flag couldDeclareEarly once already eligible — nothing left to pull forward', () => {
    const alreadyEligible = makePlayer({ age: 20, rating: 70, hype: 12, currentLeagueId: 'acb' })
    const outlook = draftOutlook(alreadyEligible, ES, 0)
    expect(outlook?.eligibleNow).toBe(true)
    expect(outlook?.couldDeclareEarly).toBe(false)
  })

  it('does not flag couldDeclareEarly under 19, regardless of rating', () => {
    const young = makePlayer({ age: 18, rating: 80, hype: 12, currentLeagueId: 'acb' })
    const outlook = draftOutlook(young, ES, 0)
    expect(outlook?.couldDeclareEarly).toBe(false)
  })

  it('is pure: two calls on the same player return deep-equal results and leave the player untouched', () => {
    const player = makePlayer({ rating: 65, hype: 20 })
    const snapshot = structuredClone(player)

    const first = draftOutlook(player, ES, 0)
    const second = draftOutlook(player, ES, 0)

    expect(first).toEqual(second)
    expect(player).toEqual(snapshot)
  })
})
