import { describe, expect, it, vi } from 'vitest'

/**
 * `generateOffers` almost never actually returns zero offers with real league
 * data — there is always a weaker league willing to take a player, confirmed
 * by a 2000-trial search with a worst-case (old, unskilled, unloved) player
 * that never once produced an empty slate. So the zero-offer branch in
 * `startOffseason` is tested here by stubbing `generateOffers` to return the
 * one slate shape that branch exists for: nothing on the table, and a reason
 * the current club said no. Everything else in the module is untouched.
 */
vi.mock('../offers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../offers')>()
  return {
    ...actual,
    generateOffers: () => ({
      offers: [],
      renewalDeclined: {
        es: 'El club no te renueva y nadie más llamó.',
        en: 'The club let you go, and nobody else called.',
      },
    }),
  }
})

import { createGame } from '../create'
import { startOffseason } from '../engine'

describe('the zero-offer path routes the decline note to the placement note', () => {
  it('sets pendingPlacementNote when nobody calls after a declined renewal', () => {
    const state = createGame(
      { name: 'Test', countryCode: 'ES', number: 9, position: 'SF', hand: 'right', styleId: 'scorer' },
      'zero-offers-fixture',
      'career',
    )

    // Clear of the youth and draft-night branches, which never reach
    // `generateOffers` at all, so the mocked zero-offer slate above is the one
    // this offseason resolves through.
    state.player.currentLeagueId = 'acb'
    state.player.currentTeamId = 'acb_bas'
    state.player.age = 24
    state.player.draftDone = true

    const next = startOffseason(state)

    const expectedNote = {
      es: 'El club no te renueva y nadie más llamó.',
      en: 'The club let you go, and nobody else called.',
    }
    expect(next.pendingRenewalNote).toEqual(expectedNote)
    // The offers screen is skipped entirely on this path (phase goes straight
    // to preseason), so without this routing the note would be set and never
    // shown before the next offseason wipes it.
    expect(next.phase).toBe('preseason')
    expect(next.pendingOffers).toBeNull()
    expect(next.pendingPlacementNote).toEqual(expectedNote)
  })
})
