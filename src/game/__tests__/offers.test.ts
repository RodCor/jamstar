import { describe, expect, it } from 'vitest'

import { Rng } from '../rng'
import { createGame } from '../create'
import { generateOffers, renewalOdds, stockFor } from '../offers'
import type { Player, Season } from '../types'
import { getCountry } from '@/data/countries'

function player(): Player {
  return createGame(
    { name: 'Test', countryCode: 'ES', number: 9, position: 'SF', hand: 'right', styleId: 'scorer' },
    'offers-fixture',
    'career',
  ).player
}

/** A season good enough that a club would be mad to let you walk. */
function season(over: Partial<Season> = {}): Season {
  return {
    year: 2035,
    age: 26,
    stage: 'prime',
    teamId: 'acb_bas',
    leagueId: 'acb',
    role: 'star',
    gamesPlayed: 34,
    gamesMissed: 0,
    minutesPerGame: 32,
    points: 20,
    rebounds: 5,
    assists: 4,
    steals: 1.2,
    blocks: 0.4,
    turnovers: 2,
    fgPct: 0.49,
    threePct: 0.38,
    ftPct: 0.83,
    tsPct: 0.6,
    rating: 78,
    teamWins: 22,
    teamLosses: 12,
    playoffResult: 'semifinals',
    awards: [],
    salary: 500_000,
    injuries: [],
    headlines: [],
    ...over,
  }
}

describe('renewals', () => {
  it('all but guarantees a renewal offer after a strong season', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'
    p.hidden.coachTrust = 70
    expect(renewalOdds(p, season())).toBeGreaterThan(0.9)
  })

  it('lets the club walk away after a bad one', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'
    p.hidden.coachTrust = 30
    expect(renewalOdds(p, season({ rating: 40, role: 'bench' }))).toBeLessThan(0.35)
  })

  it('holds a missed season against you without ending the relationship', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'
    p.hidden.coachTrust = 60
    const healthy = renewalOdds(p, season())
    const hurt = renewalOdds(p, season({ gamesPlayed: 6, gamesMissed: 28 }))
    expect(hurt).toBeLessThan(healthy)
    expect(hurt).toBeGreaterThan(0)
  })

  it('offers a renewal only for the club the player is actually at', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'
    p.age = 26
    p.hidden.coachTrust = 75
    for (let i = 0; i < 60; i++) {
      const offers = generateOffers(p, getCountry('ES'), new Rng(`renew-${i}`), season())
      for (const offer of offers) {
        expect(offer.isCurrentClub).toBe(offer.teamId === p.currentTeamId)
      }
    }
  })

  it('actually puts the renewal on the table across a run of good seasons', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'
    p.age = 26
    p.hidden.coachTrust = 70
    let withRenewal = 0
    for (let i = 0; i < 100; i++) {
      const offers = generateOffers(p, getCountry('ES'), new Rng(`table-${i}`), season())
      if (offers.some((o) => o.isCurrentClub)) withRenewal++
    }
    expect(withRenewal).toBeGreaterThan(85)
  })
})

describe('NBA interest outside the draft', () => {
  /** A player nobody in the NBA has any reason to call. */
  function journeyman(): Player {
    const p = player()
    p.currentLeagueId = 'lnb_ar'
    p.currentTeamId = 'lnb_ins'
    p.age = 28
    p.hidden.hype = 20
    for (const key of Object.keys(p.attributes) as (keyof Player['attributes'])[]) {
      p.attributes[key] = 48
    }
    return p
  }

  /** A player the whole league is watching. */
  function standout(): Player {
    const p = player()
    p.currentLeagueId = 'euroleague'
    p.currentTeamId = 'el_rma'
    p.age = 24
    p.hidden.hype = 82
    for (const key of Object.keys(p.attributes) as (keyof Player['attributes'])[]) {
      p.attributes[key] = 84
    }
    return p
  }

  /** Good enough to get the call, nowhere near good enough to be handed a team. */
  function borderline(): Player {
    const p = standout()
    for (const key of Object.keys(p.attributes) as (keyof Player['attributes'])[]) {
      p.attributes[key] = 72
    }
    return p
  }

  it('never calls a player the league has no reason to have noticed', () => {
    const p = journeyman()
    for (let i = 0; i < 250; i++) {
      const offers = generateOffers(p, getCountry('AR'), new Rng(`quiet-${i}`), season({ rating: 58 }))
      expect(offers.some((o) => o.leagueId === 'nba'), `roll ${i}`).toBe(false)
    }
  })

  it('never calls on the back of a season that was not a statement', () => {
    // Quality alone is not enough: the call comes off one loud year.
    const p = standout()
    for (let i = 0; i < 250; i++) {
      const offers = generateOffers(p, getCountry('ES'), new Rng(`flat-${i}`), season({ rating: 64 }))
      expect(offers.some((o) => o.leagueId === 'nba'), `roll ${i}`).toBe(false)
    }
  })

  it('does call a visible player coming off a statement season', () => {
    const p = standout()
    expect(stockFor(p)).toBeGreaterThan(78)
    let called = 0
    for (let i = 0; i < 300; i++) {
      const offers = generateOffers(p, getCountry('ES'), new Rng(`loud-${i}`), season({ rating: 82 }))
      if (offers.some((o) => o.leagueId === 'nba')) called++
    }
    // A door, not a corridor: it opens, and it is far from every summer.
    expect(called).toBeGreaterThan(0)
    expect(called / 300).toBeLessThan(0.25)
  })

  it('does not hand a merely good arrival a franchise role and a maximum contract', () => {
    // The weakest NBA roster is still an NBA roster. Club strength is on one
    // scale across every league, so without a level adjustment the worst team in
    // the NBA offered a modest player the ball and $52M. A genuinely elite
    // arrival may still be offered a star role — that is not the bug.
    const p = borderline()
    let seen = 0
    for (let i = 0; i < 900 && seen < 25; i++) {
      const offers = generateOffers(p, getCountry('ES'), new Rng(`role-${i}`), season({ rating: 74 }))
      for (const offer of offers.filter((o) => o.leagueId === 'nba')) {
        seen++
        expect(offer.role, `roll ${i}`).not.toBe('star')
        expect(offer.salary, `roll ${i}`).toBeLessThan(40_000_000)
      }
    }
    expect(seen).toBeGreaterThan(0)
  })

  it('stops calling once a player is too old to be a project', () => {
    const p = standout()
    p.age = 36
    let called = 0
    for (let i = 0; i < 200; i++) {
      const offers = generateOffers(p, getCountry('ES'), new Rng(`old-${i}`), season({ rating: 82 }))
      if (offers.some((o) => o.leagueId === 'nba')) called++
    }
    expect(called).toBe(0)
  })
})
