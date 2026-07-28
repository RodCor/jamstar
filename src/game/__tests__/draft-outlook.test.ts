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
      makePlayer({ rating: 58, hype: 10 }), // second-round-band stock
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

  it('tiers by the range centre, falling back to fringe when the draft floor is not met', () => {
    // fringe: stock <= 52, the same floor runDraft uses for a zero chance of being drafted.
    expect(draftOutlook(makePlayer({ rating: 45, hype: 10 }), ES, 0)?.tier).toBe('fringe')
    // second_round: comfortably drafted, centre well past 30.
    expect(draftOutlook(makePlayer({ rating: 58, hype: 10 }), ES, 0)?.tier).toBe('second_round')
    // first_round: centre in (14, 30].
    expect(draftOutlook(makePlayer({ rating: 75, hype: 20 }), ES, 0)?.tier).toBe('first_round')
    // lottery: centre <= 14.
    expect(draftOutlook(makePlayer({ rating: 88, hype: 30 }), ES, 0)?.tier).toBe('lottery')
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
