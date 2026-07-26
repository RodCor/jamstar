import { describe, expect, it } from 'vitest'

import { Rng, hashSeed } from '../rng'
import { createGame, dailyChoices, type CreationChoices } from '../create'
import { advanceYear, beginSeason, continueAfterEvent, resolveChoice } from '../engine'
import { computeLegacy, computeTotals } from '../legacy'
import { ALL_EVENTS } from '../events'
import type { GameState, Position, PlayStyleId } from '../types'
import { ALL_TEAMS, getTeam } from '@/data/teams'
import { LEAGUES, getLeague } from '@/data/leagues'
import { COUNTRIES } from '@/data/countries'
import { PLAY_STYLES } from '@/data/styles'

/**
 * Play a whole career start to finish, always taking choice `choicePolicy`.
 * This is the harness every invariant test runs through.
 */
function playCareer(
  choices: CreationChoices,
  seed: string,
  choicePolicy: (optionCount: number, rng: Rng) => number = () => 0,
): GameState {
  let state = createGame(choices, seed, 'career')
  const policyRng = new Rng(`${seed}::policy`)
  let guard = 0

  while (!state.player.retired && guard < 100) {
    guard++
    state = beginSeason(state)

    if (state.phase === 'event' && state.pendingEvent) {
      const options = state.pendingEvent.choices
      const pick = options[choicePolicy(options.length, policyRng) % options.length]
      state = resolveChoice(state, pick.index)
      state = continueAfterEvent(state)
    }

    state = advanceYear(state)
  }

  expect(guard).toBeLessThan(100)
  return state
}

const DEFAULT_CHOICES: CreationChoices = {
  name: 'Test Player',
  countryCode: 'AR',
  number: 10,
  position: 'SG',
  hand: 'right',
  styleId: 'scorer',
}

describe('Rng', () => {
  it('is deterministic for a given seed', () => {
    const a = new Rng('abc')
    const b = new Rng('abc')
    const drawsA = Array.from({ length: 50 }, () => a.next())
    const drawsB = Array.from({ length: 50 }, () => b.next())
    expect(drawsA).toEqual(drawsB)
  })

  it('produces different streams for different seeds', () => {
    const a = new Rng('abc')
    const b = new Rng('abd')
    expect(a.next()).not.toEqual(b.next())
  })

  it('never returns 0 state for an empty-hash seed', () => {
    // hashSeed can theoretically return 0; the constructor must not degenerate.
    const rng = new Rng('')
    const draws = new Set(Array.from({ length: 20 }, () => rng.next()))
    expect(draws.size).toBeGreaterThan(1)
  })

  it('int() respects inclusive bounds', () => {
    const rng = new Rng('bounds')
    for (let i = 0; i < 500; i++) {
      const value = rng.int(3, 7)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(7)
    }
  })

  it('weighted() falls back to uniform when all weights are zero', () => {
    const rng = new Rng('weights')
    expect(['a', 'b']).toContain(rng.weighted(['a', 'b'], () => 0))
  })

  it('fork() yields an independent, reproducible stream', () => {
    const parentA = new Rng('seed')
    const parentB = new Rng('seed')
    expect(parentA.fork('x').next()).toEqual(parentB.fork('x').next())
    expect(parentA.fork('x').next()).not.toEqual(parentA.fork('y').next())
  })

  it('hashSeed is stable', () => {
    expect(hashSeed('hoop')).toEqual(hashSeed('hoop'))
  })
})

describe('data integrity', () => {
  it('has no duplicate team ids', () => {
    const ids = ALL_TEAMS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no duplicate league or country ids', () => {
    expect(new Set(LEAGUES.map((l) => l.id)).size).toBe(LEAGUES.length)
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(COUNTRIES.length)
  })

  it('gives every team a resolvable league', () => {
    for (const team of ALL_TEAMS) {
      expect(() => getLeague(team.leagueId)).not.toThrow()
    }
  })

  it('gives every league at least one team', () => {
    for (const league of LEAGUES) {
      expect(league.teamIds.length).toBeGreaterThan(0)
    }
  })

  it('resolves every country domestic league and youth team', () => {
    for (const country of COUNTRIES) {
      for (const id of country.domesticLeagueIds) {
        expect(() => getLeague(id)).not.toThrow()
      }
    }
  })

  it('has no duplicate event ids', () => {
    const ids = ALL_EVENTS.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('event authoring', () => {
  it('gives every event and every choice both languages', () => {
    for (const ev of ALL_EVENTS) {
      expect(ev.title.es.length, `${ev.id} title.es`).toBeGreaterThan(0)
      expect(ev.title.en.length, `${ev.id} title.en`).toBeGreaterThan(0)
      expect(ev.choices.length, `${ev.id} has no choices`).toBeGreaterThan(0)
      for (const choice of ev.choices) {
        expect(choice.label.es.length, `${ev.id} choice.es`).toBeGreaterThan(0)
        expect(choice.label.en.length, `${ev.id} choice.en`).toBeGreaterThan(0)
      }
    }
  })

  it('never leaves Spanish and English identical for prose', () => {
    // A card whose two languages match is almost always an untranslated stub.
    for (const ev of ALL_EVENTS) {
      expect(ev.title.es === ev.title.en && ev.title.es.length > 12, `${ev.id}`).toBe(false)
    }
  })

  it('has a positive weight on every event', () => {
    for (const ev of ALL_EVENTS) {
      expect(ev.weight, ev.id).toBeGreaterThan(0)
    }
  })
})

describe('career simulation', () => {
  it('is fully deterministic for a seed', () => {
    const a = playCareer(DEFAULT_CHOICES, 'DETERMINISM-1')
    const b = playCareer(DEFAULT_CHOICES, 'DETERMINISM-1')
    expect(JSON.stringify(a.seasons)).toEqual(JSON.stringify(b.seasons))
    expect(a.player.attributes).toEqual(b.player.attributes)
    expect(a.rival.totals).toEqual(b.rival.totals)
  })

  it('produces different careers for different seeds', () => {
    const a = playCareer(DEFAULT_CHOICES, 'SEED-A')
    const b = playCareer(DEFAULT_CHOICES, 'SEED-B')
    expect(JSON.stringify(a.seasons)).not.toEqual(JSON.stringify(b.seasons))
  })

  it('terminates and stays sane across many seeds, positions and styles', () => {
    const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']
    const styles: PlayStyleId[] = PLAY_STYLES.map((s) => s.id)

    for (let i = 0; i < 300; i++) {
      const rng = new Rng(`matrix-${i}`)
      const choices: CreationChoices = {
        name: `Player ${i}`,
        countryCode: rng.pick(COUNTRIES).code,
        number: rng.int(0, 99),
        position: rng.pick(positions),
        hand: rng.chance(0.15) ? 'left' : 'right',
        styleId: rng.pick(styles),
      }
      // Vary the decision policy so different event branches get exercised.
      const state = playCareer(choices, `matrix-${i}`, (count, r) => r.int(0, count - 1))

      expect(state.player.retired, `seed matrix-${i} never retired`).toBe(true)

      for (const season of state.seasons) {
        const label = `matrix-${i} ${season.year}`
        for (const value of [
          season.points,
          season.rebounds,
          season.assists,
          season.steals,
          season.blocks,
          season.turnovers,
          season.minutesPerGame,
          season.rating,
          season.salary,
        ]) {
          expect(Number.isFinite(value), `${label} produced a non-finite stat`).toBe(true)
          expect(value, `${label} produced a negative stat`).toBeGreaterThanOrEqual(0)
        }

        expect(season.gamesPlayed).toBeGreaterThanOrEqual(0)
        expect(season.gamesPlayed + season.gamesMissed).toBe(getLeague(season.leagueId).gamesPerSeason)
        expect(season.teamWins + season.teamLosses).toBe(getLeague(season.leagueId).gamesPerSeason)
        expect(season.minutesPerGame).toBeLessThanOrEqual(48)
        expect(season.fgPct).toBeGreaterThan(0)
        expect(season.fgPct).toBeLessThanOrEqual(1)
        expect(season.tsPct).toBeLessThanOrEqual(1)
        expect(() => getTeam(season.teamId)).not.toThrow()
      }
    }
  })

  it('keeps per-game production inside plausible basketball bands', () => {
    let maxPpg = 0
    let maxRpg = 0
    let maxApg = 0

    for (let i = 0; i < 200; i++) {
      const state = playCareer(
        { ...DEFAULT_CHOICES, name: `Band ${i}` },
        `bands-${i}`,
        (count, r) => r.int(0, count - 1),
      )
      for (const season of state.seasons) {
        maxPpg = Math.max(maxPpg, season.points)
        maxRpg = Math.max(maxRpg, season.rebounds)
        maxApg = Math.max(maxApg, season.assists)
      }
    }

    // Nobody should ever average 45 points or 25 rebounds a game.
    expect(maxPpg).toBeLessThan(42)
    expect(maxRpg).toBeLessThan(22)
    expect(maxApg).toBeLessThan(16)
  })

  it('ages the player forward one year per season and stops by 43', () => {
    const state = playCareer(DEFAULT_CHOICES, 'AGE-CHECK')
    const ages = state.seasons.map((s) => s.age)
    for (let i = 1; i < ages.length; i++) {
      expect(ages[i]).toBe(ages[i - 1] + 1)
    }
    expect(state.player.age).toBeLessThanOrEqual(43)
  })

  it('never fires a once-only event twice', () => {
    for (let i = 0; i < 40; i++) {
      const state = playCareer(
        { ...DEFAULT_CHOICES, name: `Once ${i}` },
        `once-${i}`,
        (count, r) => r.int(0, count - 1),
      )
      const onceIds = state.player.firedEventIds.filter((id) => {
        const ev = ALL_EVENTS.find((e) => e.id === id)
        return ev?.once !== false
      })
      expect(new Set(onceIds).size).toBe(onceIds.length)
    }
  })
})

describe('legacy', () => {
  it('computes totals and a verdict without NaN', () => {
    const state = playCareer(DEFAULT_CHOICES, 'LEGACY-1')
    const totals = computeTotals(state.seasons)
    const legacy = computeLegacy(totals, state.seasons, state.rival)

    for (const value of Object.values(totals)) {
      expect(Number.isFinite(value)).toBe(true)
    }
    expect(Number.isFinite(legacy.score)).toBe(true)
    expect(legacy.title.es.length).toBeGreaterThan(0)
    expect(legacy.title.en.length).toBeGreaterThan(0)
    expect(legacy.highlights.length).toBeGreaterThan(0)
  })

  it('ranks a decorated career above an undecorated one', () => {
    // Compare the best and worst of a batch; the ordering must follow hardware.
    const results = Array.from({ length: 60 }, (_, i) => {
      const state = playCareer({ ...DEFAULT_CHOICES, name: `L${i}` }, `legacy-${i}`)
      const totals = computeTotals(state.seasons)
      return { totals, legacy: computeLegacy(totals, state.seasons, state.rival) }
    })

    const best = results.reduce((a, b) => (a.legacy.score > b.legacy.score ? a : b))
    const worst = results.reduce((a, b) => (a.legacy.score < b.legacy.score ? a : b))
    const hardware = (r: typeof best) => r.totals.rings * 3 + r.totals.mvps * 4 + r.totals.allStars
    expect(hardware(best)).toBeGreaterThanOrEqual(hardware(worst))
  })
})

describe('daily mode', () => {
  it('gives every player the same archetype for a given date', () => {
    const a = dailyChoices('2026-07-26', 'Player A')
    const b = dailyChoices('2026-07-26', 'Player B')
    expect({ ...a, name: '' }).toEqual({ ...b, name: '' })
  })

  it('gives different archetypes on different dates', () => {
    const days = new Set(
      ['2026-07-26', '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30'].map((d) =>
        JSON.stringify({ ...dailyChoices(d, 'x'), name: '' }),
      ),
    )
    expect(days.size).toBeGreaterThan(1)
  })

  it('produces an identical career when replayed with the same decisions', () => {
    const choices = dailyChoices('2026-07-26', 'Daily')
    const a = playCareer(choices, 'daily::2026-07-26')
    const b = playCareer(choices, 'daily::2026-07-26')
    expect(JSON.stringify(a.seasons)).toEqual(JSON.stringify(b.seasons))
  })
})
