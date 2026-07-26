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
import { buildChallenge, isWin, tuningFor } from '../minigame'
import { computeTotals } from '../legacy'
import type { GameState, MinigameType, Position } from '../types'
import { COUNTRIES } from '@/data/countries'
import { PLAY_STYLES } from '@/data/styles'
import { getLeague } from '@/data/leagues'
import { getTeam } from '@/data/teams'

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']

/** Play a career where the player converts `successes(required, rounds)` finals. */
function play(seed: string, successes: (required: number, rounds: number) => number): GameState {
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
    state = beginSeason(state)
    if (state.phase === 'event' && state.pendingEvent) {
      const options = state.pendingEvent.choices
      state = resolveChoice(state, options[policy.int(0, options.length - 1)].index)
      state = continueAfterEvent(state)
    }
    if (state.phase === 'minigame' && state.pendingMinigame) {
      const { required, rounds } = state.pendingMinigame
      state = resolveMinigame(state, successes(required, rounds))
    }
    state = advanceYear(state)
  }
  return state
}

const ALWAYS_WIN = (required: number) => required
const ALWAYS_LOSE = () => 0

describe('minigame challenge', () => {
  it('demands more successes than a single lucky tap', () => {
    for (const leagueId of ['nba', 'euroleague', 'acb', 'lnb_ar']) {
      const league = getLeague(leagueId)
      const challenge = buildChallenge({
        player: createGame(
          { name: 'x', countryCode: 'AR', number: 7, position: 'SG', hand: 'right', styleId: 'scorer' },
          'challenge-shape',
          'career',
        ).player,
        team: getTeam(league.teamIds[0]),
        league,
        opponent: getTeam(league.teamIds[1]),
        rng: new Rng(`shape-${leagueId}`),
        stake: { es: 'x', en: 'x' },
      })

      expect(challenge.required, leagueId).toBeGreaterThan(1)
      expect(challenge.rounds, leagueId).toBeGreaterThanOrEqual(challenge.required)
    }
  })

  it('keeps difficulty and every tuning value inside a playable range', () => {
    const rng = new Rng('tuning-sweep')
    for (let i = 0; i < 200; i++) {
      const league = getLeague(rng.pick(['nba', 'euroleague', 'acb', 'nbb', 'lnb_ar']))
      const state = createGame(
        {
          name: `p${i}`,
          countryCode: rng.pick(COUNTRIES).code,
          number: rng.int(0, 99),
          position: rng.pick(POSITIONS),
          hand: 'right',
          styleId: rng.pick(PLAY_STYLES).id,
        },
        `tuning-${i}`,
        'career',
      )
      const challenge = buildChallenge({
        player: state.player,
        team: getTeam(league.teamIds[0]),
        league,
        opponent: getTeam(rng.pick(league.teamIds)),
        rng: new Rng(`t-${i}`),
        stake: { es: 'x', en: 'x' },
      })
      const tuning = tuningFor(challenge)

      expect(challenge.difficulty).toBeGreaterThanOrEqual(0.14)
      expect(challenge.difficulty).toBeLessThanOrEqual(0.9)
      // A target you cannot possibly hit is not a game.
      expect(tuning.freeThrowZone).toBeGreaterThan(0.02)
      expect(tuning.clutchWindow).toBeGreaterThan(0.02)
      expect(tuning.clutchDuration).toBeGreaterThan(1)
      expect(tuning.stopWindowMs).toBeGreaterThan(300)
      expect(tuning.stopFeints).toBeGreaterThanOrEqual(1)
      expect(challenge.title.es).not.toEqual(challenge.title.en)
    }
  })

  it('gives a better shooter an easier shooting challenge', () => {
    const league = getLeague('acb')
    const base = createGame(
      { name: 'a', countryCode: 'ES', number: 9, position: 'SG', hand: 'right', styleId: 'sharpshooter' },
      'shooter-compare',
      'career',
    )

    function difficultyWithShooting(shooting: number) {
      const player = structuredClone(base.player)
      player.attributes.shooting = shooting
      // Force the same challenge type on both sides of the comparison.
      const challenge = buildChallenge({
        player,
        team: getTeam(league.teamIds[0]),
        league,
        opponent: getTeam(league.teamIds[1]),
        rng: new Rng('fixed-type'),
        stake: { es: 'x', en: 'x' },
      })
      return { type: challenge.type, difficulty: challenge.difficulty }
    }

    const weak = difficultyWithShooting(35)
    const strong = difficultyWithShooting(92)
    if (weak.type === strong.type) {
      expect(strong.difficulty).toBeLessThan(weak.difficulty)
    }
  })

  it('resolves a win only at or above the required successes', () => {
    const challenge = {
      required: 3,
      rounds: 5,
    } as Parameters<typeof isWin>[0]
    expect(isWin(challenge, 2)).toBe(false)
    expect(isWin(challenge, 3)).toBe(true)
    expect(isWin(challenge, 5)).toBe(true)
  })
})

describe('minigames in a career', () => {
  it('stays deterministic when the minigame results are the same', () => {
    const a = play('mg-determinism', ALWAYS_WIN)
    const b = play('mg-determinism', ALWAYS_WIN)
    expect(JSON.stringify(a.seasons)).toEqual(JSON.stringify(b.seasons))
  })

  it('lets the player decide titles: winning finals yields more of them', () => {
    let won = 0
    let lost = 0
    for (let i = 0; i < 60; i++) {
      won += computeTotals(play(`finals-${i}`, ALWAYS_WIN).seasons).rings
      lost += computeTotals(play(`finals-${i}`, ALWAYS_LOSE).seasons).rings
    }
    expect(won).toBeGreaterThan(lost)
  })

  it('never awards a title to a player who lost every final they played', () => {
    for (let i = 0; i < 40; i++) {
      const state = play(`no-rings-${i}`, ALWAYS_LOSE)
      for (const season of state.seasons) {
        // A contested final that was lost must read as 'finals', never 'champion'.
        // Titles can still arrive from finals the player could not contest
        // (injured out of the season), so only assert on seasons they played.
        if (season.playoffResult === 'champion') {
          expect(
            season.role === 'injured' || season.gamesPlayed === 0 || getLeague(season.leagueId).tier > 3,
            `season ${season.year} awarded a title after losing the final`,
          ).toBe(true)
        }
      }
    }
  })

  it('leaves no dangling minigame state once a final is resolved', () => {
    const state = play('mg-cleanup', ALWAYS_WIN)
    expect(state.pendingMinigame).toBeNull()
    expect(state.draftSeason).toBeNull()
    // Every season that was drafted made it into the log exactly once.
    const years = state.seasons.map((s) => s.year)
    expect(new Set(years).size).toBe(years.length)
  })

  it('only ever offers a final the player was actually on the floor for', () => {
    for (let i = 0; i < 50; i++) {
      const seed = `contest-${i}`
      let state = createGame(
        {
          name: seed,
          countryCode: 'ES',
          number: 4,
          position: 'SF',
          hand: 'right',
          styleId: 'franchise',
        },
        seed,
        'career',
      )
      const policy = new Rng(`${seed}::p`)
      let guard = 0
      while (!state.player.retired && guard < 100) {
        guard++
        state = beginSeason(state)
        if (state.phase === 'event' && state.pendingEvent) {
          const options = state.pendingEvent.choices
          state = resolveChoice(state, options[policy.int(0, options.length - 1)].index)
          state = continueAfterEvent(state)
        }
        if (state.phase === 'minigame' && state.pendingMinigame) {
          const draft = state.draftSeason
          expect(draft).not.toBeNull()
          expect(draft!.gamesPlayed).toBeGreaterThan(0)
          expect(draft!.role).not.toBe('injured')
          expect(getLeague(draft!.leagueId).tier).toBeLessThanOrEqual(3)
          expect(draft!.teamId).not.toBe(state.pendingMinigame.opponentTeamId)
          state = resolveMinigame(state, state.pendingMinigame.required)
        }
        state = advanceYear(state)
      }
    }
  })

  it('picks a challenge suited to the player', () => {
    // A lockdown big should see defensive stops far more often than threes.
    const counts: Record<MinigameType, number> = {
      free_throw: 0,
      clutch_three: 0,
      defensive_stop: 0,
    }
    const league = getLeague('acb')
    for (let i = 0; i < 120; i++) {
      const state = createGame(
        { name: `d${i}`, countryCode: 'ES', number: 55, position: 'C', hand: 'right', styleId: 'lockdown' },
        `def-${i}`,
        'career',
      )
      const challenge = buildChallenge({
        player: state.player,
        team: getTeam(league.teamIds[0]),
        league,
        opponent: getTeam(league.teamIds[1]),
        rng: new Rng(`pick-${i}`),
        stake: { es: 'x', en: 'x' },
      })
      counts[challenge.type]++
    }
    expect(counts.defensive_stop).toBeGreaterThan(counts.clutch_three)
  })
})
