/**
 * Persistence. Everything lives in localStorage — no account, no backend, which
 * is what makes the game shareable in one link.
 */

import type { ArchivedCareer, GameState } from './types'
import { SAVE_VERSION } from './create'

const RUN_KEY = 'la-naranja:run'
const ARCHIVE_KEY = 'la-naranja:archive'
const DAILY_KEY = 'la-naranja:daily'

const MAX_ARCHIVE = 50

/**
 * One-time migration from the game's previous name, Hoop Glory. `ARCHIVE_KEY`
 * holds completed careers and has survived every `SAVE_VERSION` bump this
 * project has shipped, so a rename that just changed the key name and left
 * old data behind would silently erase every player's hall of fame. Delete
 * this once players have had time to reopen the game after the rename ships.
 */
function migrateFromOldKey(key: string): void {
  if (typeof window === 'undefined') return
  try {
    if (window.localStorage.getItem(key) !== null) return
    const oldKey = key.replace('la-naranja:', 'hoop-glory:')
    const old = window.localStorage.getItem(oldKey)
    if (old === null) return
    window.localStorage.setItem(key, old)
    window.localStorage.removeItem(oldKey)
  } catch {
    // Storage disabled — nothing to migrate, nothing lost that wasn't already inaccessible.
  }
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  migrateFromOldKey(key)
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage disabled. The game keeps working in memory;
    // losing a save is preferable to crashing mid-career.
  }
}

export function saveRun(state: GameState): void {
  writeJson(RUN_KEY, state)
}

export function loadRun(): GameState | null {
  const state = readJson<GameState>(RUN_KEY)
  if (!state) return null
  // A save from an older engine would deserialise into a shape the current code
  // does not understand. Discarding is the honest option.
  if (state.version !== SAVE_VERSION) return null
  if (!state.player || !Array.isArray(state.seasons)) return null
  return state
}

export function clearRun(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(RUN_KEY)
  } catch {
    /* nothing to do */
  }
}

export function loadArchive(): ArchivedCareer[] {
  return readJson<ArchivedCareer[]>(ARCHIVE_KEY) ?? []
}

export function archiveCareer(entry: ArchivedCareer): void {
  const existing = loadArchive()
  // Re-archiving the same run (a page reload on the retirement screen) must not
  // duplicate the entry.
  const deduped = existing.filter((e) => !(e.seed === entry.seed && e.mode === entry.mode))
  const next = [entry, ...deduped].slice(0, MAX_ARCHIVE)
  writeJson(ARCHIVE_KEY, next)
}

export function clearArchive(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ARCHIVE_KEY)
  } catch {
    /* nothing to do */
  }
}

/** Which daily seed the player has already completed. */
export function loadDailyPlayed(): string | null {
  return readJson<string>(DAILY_KEY)
}

export function markDailyPlayed(seedKey: string): void {
  writeJson(DAILY_KEY, seedKey)
}
