import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SAVE_VERSION, createGame } from '../create'
import { computeLegacy, computeTotals } from '../legacy'
import { loadArchive, loadDailyPlayed, loadRun, saveRun } from '../save'
import { trophiesFor } from '../trophies'
import type { ArchivedCareer, GameState, Season } from '../types'

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
 * with a season attached, then the three fields this wave added deleted
 * outright rather than set to `null`, so the object lacks them instead of
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
  // in-progress career the instant they reload. The attribute model changed
  // shape in this wave (seven attributes → five), so a pre-wave save read by
  // five-attribute code gives every player undefined for every attribute;
  // arithmetic on undefined yields NaN and the career silently rots. The bump
  // to 4 is deliberate and required.
  it('has bumped SAVE_VERSION to 4', () => {
    expect(SAVE_VERSION).toBe(4)
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

      // Proves the fixture is old-shaped, not merely old-valued: if a future
      // refactor re-added these keys before writing, this would still pass
      // without testing anything.
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

  // The game used to be called Hoop Glory, and its localStorage keys carried
  // that name. `hoop-glory:archive` is completed careers, the hall of fame,
  // and it has outlived every SAVE_VERSION bump this project has shipped, so
  // the rename to `la-naranja:*` must not be the thing that finally loses it.
  describe('migration from hoop-glory:* keys', () => {
    beforeEach(installWindowShim)
    afterEach(removeWindowShim)

    function seedOldKey(key: string, value: unknown): void {
      window.localStorage.setItem(key, JSON.stringify(value))
    }

    it('migrates the archive: old data comes back through loadArchive, and the old key is gone', () => {
      const state = preWaveState()
      const totals = computeTotals(state.seasons)
      const entry: ArchivedCareer = {
        seed: state.seed,
        mode: state.mode,
        playerName: state.player.name,
        countryCode: state.player.countryCode,
        number: state.player.number,
        position: state.player.position,
        totals,
        legacy: computeLegacy(totals, state.seasons, state.rival),
        completedAt: Date.now(),
      }
      seedOldKey('hoop-glory:archive', [entry])

      const loaded = loadArchive()

      expect(loaded).toHaveLength(1)
      expect(loaded[0].playerName).toBe('Pre-Wave')
      expect(loaded[0].seed).toBe(state.seed)
      expect(window.localStorage.getItem('hoop-glory:archive')).toBeNull()
      expect(window.localStorage.getItem('la-naranja:archive')).not.toBeNull()
    })

    it('migrates the in-progress run: old data comes back through loadRun, and the old key is gone', () => {
      const written = preWaveState()
      seedOldKey('hoop-glory:run', written)

      const loaded = loadRun()

      expect(loaded).not.toBeNull()
      expect(loaded!.player.name).toBe('Pre-Wave')
      expect(window.localStorage.getItem('hoop-glory:run')).toBeNull()
      expect(window.localStorage.getItem('la-naranja:run')).not.toBeNull()
    })

    it('migrates the daily-played marker: old data comes back through loadDailyPlayed, and the old key is gone', () => {
      seedOldKey('hoop-glory:daily', '2026-07-27')

      const loaded = loadDailyPlayed()

      expect(loaded).toBe('2026-07-27')
      expect(window.localStorage.getItem('hoop-glory:daily')).toBeNull()
      expect(window.localStorage.getItem('la-naranja:daily')).not.toBeNull()
    })

    it('does not overwrite a run already saved under the new key', () => {
      const oldRun = preWaveState()
      const newRun = { ...preWaveState(), player: { ...preWaveState().player, name: 'Already-Migrated' } }
      seedOldKey('hoop-glory:run', oldRun)
      saveRun(newRun)

      const loaded = loadRun()

      expect(loaded!.player.name).toBe('Already-Migrated')
      // A stale old key left behind is harmless; what matters is the new key
      // was never clobbered by it.
      expect(window.localStorage.getItem('hoop-glory:run')).not.toBeNull()
    })
  })
})
