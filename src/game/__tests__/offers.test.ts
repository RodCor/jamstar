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
      const offers = generateOffers(p, getCountry('ES'), new Rng(`renew-${i}`), season()).offers
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
      const offers = generateOffers(p, getCountry('ES'), new Rng(`table-${i}`), season()).offers
      if (offers.some((o) => o.isCurrentClub)) withRenewal++
    }
    expect(withRenewal).toBeGreaterThan(85)
  })

  it('says so when the club walks away, and stays quiet when it does not', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'

    let declinedSeen = 0
    let renewedSeen = 0
    for (let i = 0; i < 60; i++) {
      const slate = generateOffers(p, getCountry('ES'), new Rng(`note-${i}`), season({ rating: 44 }))
      const renewed = slate.offers.some((o) => o.isCurrentClub)
      // The note and the renewal are exact opposites: never both, never neither.
      expect(Boolean(slate.renewalDeclined)).toBe(!renewed)
      if (renewed) renewedSeen++
      else declinedSeen++
    }
    expect(declinedSeen).toBeGreaterThan(0)
    expect(renewedSeen).toBeGreaterThan(0)
  })

  it('names the club and the reason, identically for the same season', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'
    p.age = 36

    const hurt = season({ rating: 40, gamesPlayed: 4, gamesMissed: 30 })
    const first = generateOffers(p, getCountry('ES'), new Rng('reason-a'), hurt).renewalDeclined
    const again = generateOffers(p, getCountry('ES'), new Rng('reason-b'), hurt).renewalDeclined

    expect(first).not.toBeNull()
    // Availability outranks age: this player missed most of the year.
    expect(first!.es).toContain('Baskonia')
    expect(first!.es).toContain('físic')
    expect(first!.en).toContain('Baskonia')
    // Pure function of the season, so a replayed seed narrates the same way.
    expect(again).toEqual(first)
  })

  it('never reports a declined renewal for a player who had no club', () => {
    const p = player()
    // Straight out of the youth system: there is nothing to decline.
    p.currentLeagueId = 'youth'
    const slate = generateOffers(p, getCountry('ES'), new Rng('youth'), null)
    expect(slate.renewalDeclined).toBeNull()
  })

  it('does not re-offer the club that just dropped you as though it were new', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'

    for (let i = 0; i < 80; i++) {
      const slate = generateOffers(p, getCountry('ES'), new Rng(`dup-${i}`), season({ rating: 44 }))
      if (!slate.renewalDeclined) continue
      expect(slate.offers.every((o) => o.teamId !== 'acb_bas')).toBe(true)
    }
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
      const offers = generateOffers(p, getCountry('AR'), new Rng(`quiet-${i}`), season({ rating: 58 })).offers
      expect(offers.some((o) => o.leagueId === 'nba'), `roll ${i}`).toBe(false)
    }
  })

  it('never calls on the back of a season that was not a statement', () => {
    // Quality alone is not enough: the call comes off one loud year.
    const p = standout()
    for (let i = 0; i < 250; i++) {
      const offers = generateOffers(p, getCountry('ES'), new Rng(`flat-${i}`), season({ rating: 64 })).offers
      expect(offers.some((o) => o.leagueId === 'nba'), `roll ${i}`).toBe(false)
    }
  })

  it('does call a visible player coming off a statement season', () => {
    const p = standout()
    expect(stockFor(p)).toBeGreaterThan(78)
    let called = 0
    for (let i = 0; i < 300; i++) {
      const offers = generateOffers(p, getCountry('ES'), new Rng(`loud-${i}`), season({ rating: 82 })).offers
      if (offers.some((o) => o.leagueId === 'nba')) called++
    }
    // A door, not a corridor: it opens, and it is far from every summer.
    expect(called).toBeGreaterThan(0)
    expect(called / 300).toBeLessThan(0.25)
  })

  it('does not hand a merely good arrival a franchise role and a maximum contract', () => {
    // The weakest NBA roster is still an NBA roster. Club strength is on one
    // scale across every league, so without a level adjustment the worst team in
    // the NBA offered a modest player the ball and $52M. A truly elite arrival
    // may still be offered a star role; that is not the bug.
    const p = borderline()
    let seen = 0
    for (let i = 0; i < 900 && seen < 25; i++) {
      const offers = generateOffers(p, getCountry('ES'), new Rng(`role-${i}`), season({ rating: 74 })).offers
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
      const offers = generateOffers(p, getCountry('ES'), new Rng(`old-${i}`), season({ rating: 82 })).offers
      if (offers.some((o) => o.leagueId === 'nba')) called++
    }
    expect(called).toBe(0)
  })
})

describe('free agency inside the NBA', () => {
  /** An NBA-calibre player already on an NBA roster. */
  function nbaPlayer() {
    const p = player()
    p.currentLeagueId = 'nba'
    p.currentTeamId = 'bos'
    p.age = 27
    p.attributes.scoring = 88
    p.attributes.playmaking = 82
    p.attributes.defense = 84
    p.attributes.mental = 84
    // Physical is the mean of the old athleticism 86 and strength 80.
    p.attributes.physical = 83
    p.hidden.hype = 80
    return p
  }

  it('offers an NBA player mostly NBA clubs', () => {
    let nba = 0
    let total = 0
    for (let i = 0; i < 60; i++) {
      const offers = generateOffers(
        nbaPlayer(),
        getCountry('US'),
        new Rng(`stay-${i}`),
        season({ leagueId: 'nba', teamId: 'bos', rating: 80 }),
      ).offers
      for (const offer of offers) {
        total++
        if (offer.leagueId === 'nba') nba++
      }
    }
    expect(total).toBeGreaterThan(0)
    // Not "all": a declining NBA player should still hear from Europe.
    expect(nba / total).toBeGreaterThan(0.6)
  })

  it('still refuses to let free agency be the way into the NBA', () => {
    // A solid third-tier player is exactly who this guard protects the draft from.
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'
    p.age = 29
    p.hidden.hype = 20

    for (let i = 0; i < 80; i++) {
      const offers = generateOffers(
        p,
        getCountry('ES'),
        new Rng(`gate-${i}`),
        season({ rating: 62 }),
      ).offers
      expect(offers.every((o) => o.leagueId !== 'nba')).toBe(true)
    }
  })
})
