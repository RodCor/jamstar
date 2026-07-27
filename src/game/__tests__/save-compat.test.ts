import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SAVE_VERSION, createGame } from '../create'
import { loadRun, saveRun } from '../save'
import { trophiesFor } from '../trophies'
import type { GameState, Season } from '../types'

/**
 * `save.ts` checks `typeof window` at call time, not at import time, so a
 * minimal in-memory `localStorage` assigned onto `globalThis.window` for the
 * duration of a test is enough to make `saveRun`/`loadRun` behave as they do
 * in a browser. Removed in `afterEach` so it cannot leak into other test
 * files, which all run under vitest's `environment: 'node'` and expect no
 * `window` to exist.
 */
function installWindowShim(): void {
  const store = new Map<string, string>()
  const localStorage: Storage = {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  }
  ;(globalThis as { window?: unknown }).window = { localStorage }
}

function removeWindowShim(): void {
  delete (globalThis as { window?: unknown }).window
}

/** A finished season, in the shape trophiesFor and save round-tripping both care about. */
function season(over: Partial<Season> = {}): Season {
  return {
    year: 2035, age: 26, stage: 'prime', teamId: 'acb_bas', leagueId: 'acb', role: 'star',
    gamesPlayed: 34, gamesMissed: 0, minutesPerGame: 32, points: 20, rebounds: 5,
    assists: 4, steals: 1.2, blocks: 0.4, turnovers: 2, fgPct: 0.49, threePct: 0.38,
    ftPct: 0.83, tsPct: 0.6, rating: 78, teamWins: 22, teamLosses: 12,
    playoffResult: 'champion', awards: [], salary: 500_000, injuries: [], headlines: [],
    ...over,
  }
}

/**
 * A save the way a pre-wave build would have written it: a real `GameState`
 * with a season attached, then the three fields this wave added actually
 * deleted (not set to `null`), so the object genuinely lacks them rather than
 * having them present-but-empty.
 */
function preWaveState(): GameState {
  const state = createGame(
    { name: 'Pre-Wave', countryCode: 'ES', number: 9, position: 'SF', hand: 'right', styleId: 'scorer' },
    'save-compat-fixture',
    'career',
  )
  state.seasons.push(season())

  delete (state as { pendingRenewalNote?: unknown }).pendingRenewalNote
  for (const s of state.seasons) {
    delete (s as { cupId?: unknown }).cupId
    delete (s as { cupWon?: unknown }).cupWon
  }
  return state
}

describe('save compatibility across the wave', () => {
  // The canary. Bumping SAVE_VERSION makes loadRun() reject every save on
  // disk (state.version !== SAVE_VERSION), which ends every player's
  // in-progress career the instant they reload. That is exactly what Wave 2
  // does on purpose once the attribute merge lands — it must not happen here.
  // Whoever trips this test should know immediately whether they meant it.
  it('has not bumped SAVE_VERSION', () => {
    expect(SAVE_VERSION).toBe(3)
  })

  describe('loadRun / saveRun', () => {
    beforeEach(installWindowShim)
    afterEach(removeWindowShim)

    it('round-trips a save shaped like one written before this wave', () => {
      const written = preWaveState()
      saveRun(written)

      const loaded = loadRun()

      expect(loaded).not.toBeNull()
      expect(loaded!.player.name).toBe('Pre-Wave')
      expect(loaded!.seasons).toHaveLength(1)
      expect(loaded!.seasons[0].teamId).toBe('acb_bas')
      expect(loaded!.seasons[0].playoffResult).toBe('champion')

      // Proves the fixture is actually old-shaped, not just old-valued — if a
      // future refactor re-added these keys before writing, this would still
      // pass without testing anything.
      expect('pendingRenewalNote' in loaded!).toBe(false)
      expect('cupId' in loaded!.seasons[0]).toBe(false)
    })
  })

  describe('trophiesFor', () => {
    it('does not throw on a season lacking cupId and cupWon, and awards no cup trophy', () => {
      const s = season({ leagueId: 'acb' })
      delete (s as { cupId?: unknown }).cupId
      delete (s as { cupWon?: unknown }).cupWon

      expect(() => trophiesFor(s)).not.toThrow()
      expect(trophiesFor(s).some((trophy) => trophy.kind === 'cup')).toBe(false)
    })
  })
})
