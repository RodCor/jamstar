import { describe, expect, it } from 'vitest'

import { getCountry, domesticLeagueFor } from '@/data/countries'
import { getLeague } from '@/data/leagues'
import { teamsInLeague } from '@/data/teams'
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
import { ALL_EVENTS, eligibleEvents } from '../events'
import { ORIGIN_EVENTS } from '../events/origin'
import { Rng } from '../rng'
import type {
  CareerStage,
  EventContext,
  GameState,
  Player,
  PlayStyleId,
  Position,
  Rival,
} from '../types'

/**
 * The coverage guard.
 *
 * Wave 3's whole point was "careers stop being repetitive": 29 country-gated
 * origin cards, 17 early-stage cards, and a fix that made `development`
 * reachable at all. None of that was ever asserted anywhere — a future PR
 * could quietly thin any of it back out (a card re-gated into uselessness, an
 * id collision that shadows a card, a country's dedicated pair deleted) and
 * every other test in this suite would stay green, because they measure
 * aggregate distributions, not what any *one* player actually sees.
 *
 * These floors are about variety per player, not deck size. A deck of three
 * hundred cards is worthless to a Cameroonian player if the country gate
 * only ever lets eight of them through — they would still replay the same
 * eight-card opening every single career. So every assertion below is scoped
 * to a single country (and, for the richest one, a single position too)
 * rather than to `ALL_EVENTS.length`.
 *
 * Harness choice: a hand-built `EventContext` rather than the
 * `career-distribution.test.ts` harness. That harness is the right tool for
 * "does the simulation still feel like the simulation" because it has to run
 * real, RNG-driven careers to answer that question. This guard asks a
 * narrower, structural question — "for this country (and stage, and
 * position), how big is the eligible pool" — and a driven career only visits
 * one stage/country/position combination per run, with no control over which
 * one. Reaching all 315 combinations that way (21 countries x 5 positions x
 * 3 stages — a 105-wide country x position sweep, repeated per stage) would
 * mean steering hundreds of careers through RNG; building the context
 * directly makes every combination reachable in one deterministic pass and
 * keeps the failure message pointing at the exact country/stage/position
 * that broke, rather than an average that already absorbed it.
 *
 * `buildContext` is deliberately permissive on every gate that is *not* under
 * test: high hype, low coachTrust (the one card that wants it low), generous
 * attributes, an empty fired-event set. That is what makes a low reading mean
 * something — if the probe context satisfies every incidental `requires` it
 * can, a pool that still comes up short is short because of the country gate
 * (or, for assertion 3, the position), not because the probe forgot to clear
 * some unrelated threshold.
 *
 * Floors, and why they sit where they do:
 *  - >= 4 origin-gated cards per country: origin.ts's own design rule is a
 *    dedicated pair per country plus a shared regional pair. Four is that
 *    rule turned into a number, not a round figure picked after the fact.
 *  - >= 2 origin-gated cards at `youth` per country: the shared regional
 *    pair generally lands later (breakout/development), so youth needs its
 *    own floor — that is the stage where a first career's opening is
 *    entirely origin-gated cards or nothing.
 *  - >= 16 total eligible cards at `youth`/`development`/`breakout`, each
 *    checked across all 21 countries x 5 positions: this is the number that
 *    actually protects "not repetitive." A player draws roughly four
 *    seasons per stage; sixteen distinct eligible
 *    cards keeps a single stage from exhausting its `once`-fired pool inside
 *    one career. The brief for this wave flagged that two cards were
 *    reworked for being incoherent at some positions and were deliberately
 *    *not* re-gated by position, because gating them would have dropped
 *    centres below this exact floor — so the position sweep exists
 *    specifically to catch a future attempt to add that gate back without
 *    checking the consequence.
 *  - No id collisions in `ALL_EVENTS`: `findEvent` is a `Map` keyed by id: a
 *    duplicate silently shadows one card with another and only becomes
 *    visible once the deck is large enough that nobody notices a card never
 *    fires. It is cheap to check and expensive to debug, which is exactly
 *    the kind of assertion that belongs in a guard like this one.
 *  - >= 1.5 origin cards drawn per career, pooled across driven careers: see
 *    the note on that test for why eligibility is not exposure.
 */

const COUNTRY_CODES = [
  'AR', 'US', 'ES', 'FR', 'RS', 'LT', 'GR', 'IT', 'TR', 'BR', 'CA', 'AU',
  'NG', 'SN', 'CM', 'CN', 'DE', 'SI', 'DO', 'MX', 'UY',
] as const

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']

/**
 * Midpoint height per position, from `HEIGHT_BY_POSITION` in `create.ts`.
 *
 * Attributes are flattened identically across positions below (see
 * `buildContext`) so `BASE_BY_POSITION` noise cannot masquerade as a
 * position gate. Height gets the opposite treatment on purpose: it is not
 * noise, it is a deterministic function of position with disjoint PG/C
 * ranges, and it is already read by two card bodies. A future gate written
 * as `heightCm < 205` would silently pass identically for every position if
 * this probe used one fixed height — so each position gets its own real
 * number instead.
 */
const PROBE_HEIGHT: Record<Position, number> = { PG: 186, SG: 195, SF: 202, PF: 207, C: 214 }

/**
 * The three stages assertion 3 covers, with an age/seasons-played pair that
 * sits comfortably inside each stage's range (see `stageForAge` in
 * `ladder.ts`) and clears the one `hasPlayed` gate in scope: the
 * `development`-stage rival card in `rival.ts` requires `seasonsPlayed >= 1`.
 */
const PROBE_STAGES: { stage: CareerStage; age: number; seasonsPlayed: number }[] = [
  { stage: 'youth', age: 15, seasonsPlayed: 0 },
  { stage: 'breakout', age: 18, seasonsPlayed: 2 },
  { stage: 'development', age: 20, seasonsPlayed: 4 },
]

const ORIGIN_IDS = new Set(ORIGIN_EVENTS.map((e) => e.id))

/** Stand-in rival. No gate in the youth/breakout/development scope reads it. */
function dummyRival(): Rival {
  return {
    name: 'Rival',
    countryCode: 'US',
    position: 'SF',
    origin: { es: '', en: '' },
    totals: { seasons: 0, points: 0, rebounds: 0, assists: 0, rings: 0, mvps: 0, allStars: 0, peakRating: 0 },
    history: [],
    retired: false,
    retirementYear: null,
  }
}

/**
 * A permissive probe context for one (country, position, stage) combination.
 *
 * Attributes and hidden stats are set generously and identically across
 * every position, so varying `position` only moves the position *gate* (if
 * any exists), never an incidental attribute threshold — see the file
 * comment above for why that separation is the point.
 */
function buildContext(
  countryCode: string,
  position: Position,
  probe: { stage: CareerStage; age: number; seasonsPlayed: number },
): EventContext {
  const country = getCountry(countryCode)
  const leagueId = probe.stage === 'youth' ? 'youth' : domesticLeagueFor(country)
  const league = getLeague(leagueId)
  const team = teamsInLeague(leagueId)[0]
  if (!team) throw new Error(`No team found for league '${leagueId}' (probing ${countryCode})`)

  const player: Player = {
    name: 'Probe',
    countryCode,
    number: 0,
    position,
    hand: 'right',
    styleId: 'scorer',
    heightCm: PROBE_HEIGHT[position],
    age: probe.age,
    stage: probe.stage,
    attributes: { scoring: 60, playmaking: 60, defense: 60, physical: 60, mental: 60 },
    hidden: { wear: 0, morale: 65, hype: 60, coachTrust: 40 },
    currentTeamId: team.id,
    currentLeagueId: league.id,
    growthPoints: 0,
    draftDone: probe.stage !== 'youth',
    perks: [],
    perkChoices: [],
    earnings: 0,
    firedEventIds: [],
    teamHistory: [team.id],
    retired: false,
    retirementYear: null,
    retirementReason: null,
  }

  return {
    player,
    season: null,
    team,
    league,
    country,
    rival: dummyRival(),
    rng: new Rng(`coverage-probe::${countryCode}::${position}::${probe.stage}`),
    seasonsPlayed: probe.seasonsPlayed,
  }
}

describe('event coverage: variety per player', () => {
  it('no two events in ALL_EVENTS share an id', () => {
    const ids = ALL_EVENTS.map((e) => e.id)
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id)
      seen.add(id)
    }
    expect(duplicates, `duplicate event ids: ${duplicates.join(', ')}`).toEqual([])
  })

  describe('every country has at least 4 origin-gated cards', () => {
    it.each(COUNTRY_CODES)('%s', (code) => {
      // `requires` on every ORIGIN_EVENTS card is a pure gate.fromCountry check,
      // so any valid context (any stage/position) evaluates it correctly.
      const ctx = buildContext(code, 'SF', PROBE_STAGES[0])
      const eligible = ORIGIN_EVENTS.filter((e) => e.requires?.(ctx) ?? true)
      expect(eligible.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('every country has at least 2 origin-gated cards eligible at youth', () => {
    it.each(COUNTRY_CODES)('%s', (code) => {
      const ctx = buildContext(code, 'SF', PROBE_STAGES[0])
      const youthOrigin = eligibleEvents(ctx).filter((e) => ORIGIN_IDS.has(e.id))
      expect(youthOrigin.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('eligible pool floor across every country x stage x position', () => {
    // 21 countries x 3 stages x 5 positions = 315 combinations (105 per
    // stage, matching the brief's country x position sweep, repeated for
    // each of the three stages named in assertion 3). Built as one test
    // (rather than 315 `it.each` rows) so a run always reports every
    // combination that fails, plus the global minimum, in one place — the
    // number this wave exists to move, and the one likeliest to matter the
    // next time an event card grows a gate.
    it('holds >= 16 eligible cards for every one of the 315 combinations', () => {
      const results: { country: string; stage: CareerStage; position: Position; count: number }[] = []
      for (const country of COUNTRY_CODES) {
        for (const probe of PROBE_STAGES) {
          for (const position of POSITIONS) {
            const ctx = buildContext(country, position, probe)
            results.push({ country, stage: probe.stage, position, count: eligibleEvents(ctx).length })
          }
        }
      }

      const min = results.reduce((a, b) => (b.count < a.count ? b : a))
      const failures = results.filter((r) => r.count < 16)

      console.log(
        `\nevent coverage: eligible pool across ${results.length} country x stage x position combinations` +
          `\nminimum: ${min.count} at ${min.country}/${min.stage}/${min.position}` +
          (failures.length > 0
            ? `\nbelow floor (16): ${failures
                .map((f) => `${f.country}/${f.stage}/${f.position}=${f.count}`)
                .join(', ')}`
            : '\nall combinations at or above the floor of 16'),
      )

      expect(
        failures,
        `combinations below the floor of 16: ${failures
          .map((f) => `${f.country}/${f.stage}/${f.position}=${f.count}`)
          .join(', ')}`,
      ).toEqual([])
    })
  })
})

/**
 * The exposure guard.
 *
 * Everything above measures the *pool*: which cards a country's gate lets
 * through. Nothing above measures the *draw*. Those are different properties
 * and only one of them is what a player experiences. `drawEvent` picks one
 * card per season by weight, so a country's four eligible origin cards
 * compete against every other eligible card in the pool for that single slot.
 * A deck that is perfectly covered and never drawn is indistinguishable, from
 * the seat the game is played from, from a deck that does not exist — and the
 * assertions above would stay green through all of it, because a weight is not
 * an eligibility.
 *
 * That is not hypothetical. This deck shipped at weights of 18-24 against an
 * early-stage field averaging about 23 per card, which measured 1.08 origin
 * draws per career with 29% of careers drawing none at all: the wave's whole
 * premise ("your country shows up in your career") was true of the data and
 * false of the experience. The weights were raised in response — see the
 * header of `origin.ts` for why the lift is uneven across the deck — and this
 * assertion is what stops the next well-meaning weight edit from undoing it
 * silently. Eligibility is asserted three ways above; without this, exposure
 * is asserted zero ways.
 *
 * Sampling: all 21 countries, 6 careers each. Every gate gets exercised
 * (a country whose cards became unreachable is a country whose careers stop
 * contributing draws), and the assertion is on the *pooled* mean rather than a
 * per-country one. Per-country means at any n this suite can afford are mostly
 * seed noise — at n=40 the spread across countries was 1.88 to 2.40 — so a
 * per-country floor would be a brittleness generator, not a guard.
 *
 * The floor of 1.5 sits well below the measured 2.1 and well above the 1.08
 * that prompted the change, which is the room it needs: comfortably clear of
 * ordinary drift from unrelated event or pacing work, and comfortably short of
 * a revert to the old weights.
 *
 * A ceiling is deliberately *not* asserted here, even though more exposure is
 * not simply better: pushing the mean past about 2.2 required weight the
 * origin deck cannot carry without draining the early `coachTrust` surplus,
 * which inverts the perk-agency invariant in `legacy.test.ts`. That property
 * already owns its own guard and is a better instrument for it than a number
 * in this file would be. See
 * `docs/superpowers/plans/2026-07-28-perk-agency-margin.md`.
 */

const EXPOSURE_STYLES: PlayStyleId[] = [
  'scorer',
  'floor_general',
  'sharpshooter',
  'lockdown',
  'highlight',
  'franchise',
]

/** Careers driven per country. 21 x 6 = 126 careers, a few seconds of runtime. */
const CAREERS_PER_COUNTRY = 6

/** Mean origin-card draws per career this deck must keep clearing. */
const EXPOSURE_FLOOR = 1.5

/**
 * Drive a career through every phase. Copied from `career-distribution.test.ts`
 * for the reason that file gives for copying it from `legacy.test.ts`: these
 * are independent measurement instruments, and a shared helper would let a
 * change made for one of them move the others without anyone noticing.
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

/**
 * One career from a given country, every decision taken at random from its own
 * seeded stream — a player who is not steering towards or away from anything,
 * which is the population this floor is about.
 */
function playCareer(countryCode: string, index: number): GameState {
  const seed = `exposure::${countryCode}::${index}`
  const choices: CreationChoices = {
    name: `P${index}`,
    countryCode,
    number: (index % 55) + 1,
    position: POSITIONS[index % POSITIONS.length],
    hand: 'right',
    styleId: EXPOSURE_STYLES[index % EXPOSURE_STYLES.length],
  }
  const policy = new Rng(seed)
  return drive(createGame(choices, seed, 'career'), {
    rng: policy,
    choice: (count, r) => (count > 0 ? r.int(0, count - 1) : 0),
    offer: (count, r) => (count > 0 ? r.int(0, count - 1) : 0),
    perk: (list, r) => r.pick(list),
    minigame: (_required, rounds, r) => r.int(0, rounds),
  })
}

describe('event coverage: origin cards are actually drawn', () => {
  it(`draws at least ${EXPOSURE_FLOOR} origin cards per career on average`, () => {
    // Every origin card is `once`, so counting its id in `firedEventIds` at
    // retirement counts draws, not repeats.
    const counts: number[] = []
    const perCountry: { code: string; mean: number }[] = []
    for (const code of COUNTRY_CODES) {
      const own: number[] = []
      for (let i = 0; i < CAREERS_PER_COUNTRY; i++) {
        const player = playCareer(code, i).player
        own.push(player.firedEventIds.filter((id) => ORIGIN_IDS.has(id)).length)
      }
      perCountry.push({ code, mean: own.reduce((a, b) => a + b, 0) / own.length })
      counts.push(...own)
    }

    const overall = counts.reduce((a, b) => a + b, 0) / counts.length
    const none = counts.filter((c) => c === 0).length / counts.length

    console.log(
      `\norigin-card exposure across ${counts.length} driven careers (${CAREERS_PER_COUNTRY} per country)` +
        `\nmean origin draws per career: ${overall.toFixed(3)} (floor ${EXPOSURE_FLOOR})` +
        `\ncareers that met their country not once: ${(none * 100).toFixed(1)}%` +
        `\nper country: ${perCountry.map((p) => `${p.code}=${p.mean.toFixed(2)}`).join(' ')}\n`,
    )

    expect(
      overall,
      `mean origin draws per career fell to ${overall.toFixed(3)}: the country deck is eligible but not being drawn`,
    ).toBeGreaterThanOrEqual(EXPOSURE_FLOOR)
  })
})
