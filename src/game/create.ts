/** Character creation: the choices the player makes, turned into a starting Player. */

import type {
  Attributes,
  GameMode,
  GameState,
  Hand,
  Player,
  PlayStyleId,
  Position,
} from './types'
import { ATTRIBUTE_KEYS } from './types'
import { Rng, clamp } from './rng'
import { getCountry, youthTeamFor } from '@/data/countries'
import { getStyle } from '@/data/styles'
import { createRival } from './rival'
import { startOffseason } from './engine'

/**
 * Creation age. `beginSeason` ages the player before simulating, so the first
 * season on the record is played at 14, the age the career is advertised as
 * starting from.
 */
export const START_AGE = 13
export const START_YEAR = 2026
export const SAVE_VERSION = 4

export interface CreationChoices {
  name: string
  countryCode: string
  number: number
  position: Position
  hand: Hand
  styleId: PlayStyleId
}

/** Position drives a plausible height, which in turn nudges the starting build. */
const HEIGHT_BY_POSITION: Record<Position, [number, number]> = {
  PG: [180, 193],
  SG: [190, 200],
  SF: [198, 206],
  PF: [203, 211],
  C: [208, 221],
}

/** Baseline teenage attributes by position, before style and country modifiers. */
const BASE_BY_POSITION: Record<Position, Partial<Attributes>> = {
  PG: { playmaking: 17, scoring: 4, mental: 3, defense: -2, physical: -8 },
  SG: { scoring: 10, playmaking: 5, physical: -1 },
  SF: { physical: 6, defense: 4, scoring: 2 },
  PF: { physical: 10, defense: 6, playmaking: -6, scoring: -4 },
  C: { physical: 10, defense: 8, playmaking: -12, scoring: -8 },
}

export function createPlayer(choices: CreationChoices, rng: Rng): Player {
  const country = getCountry(choices.countryCode)
  const style = getStyle(choices.styleId)

  // Everyone starts as a raw 14-year-old: mid-30s baseline with real spread.
  const attributes = {} as Attributes
  for (const key of ATTRIBUTE_KEYS) {
    const positional = BASE_BY_POSITION[choices.position][key] ?? 0
    const styleBonus = style.bonus[key] ?? 0
    const noise = rng.gauss(0, 5)
    // Country strength gives a small head start: better coaching, better competition.
    const countryBoost = (country.strength - 60) * 0.08
    attributes[key] = clamp(34 + positional * 0.5 + styleBonus * 0.5 + countryBoost + noise, 10, 62)
  }

  const [minH, maxH] = HEIGHT_BY_POSITION[choices.position]
  const heightCm = Math.round(rng.float(minH, maxH + 1))

  const youthTeam = youthTeamFor()

  return {
    name: choices.name.trim() || 'Anónimo',
    countryCode: choices.countryCode,
    number: choices.number,
    position: choices.position,
    hand: choices.hand,
    styleId: choices.styleId,
    heightCm,
    age: START_AGE,
    stage: 'youth',
    attributes,
    hidden: {
      wear: 0,
      morale: 65,
      // Left-handers are remembered. A small, cheap flavour edge.
      hype: clamp(rng.gauss(12, 5) + (choices.hand === 'left' ? 2 : 0), 0, 40),
      coachTrust: clamp(rng.gauss(50, 8), 20, 80),
    },
    currentTeamId: youthTeam,
    currentLeagueId: 'youth',
    growthPoints: 0,
    draftDone: false,
    perks: [],
    perkChoices: [],
    earnings: 0,
    firedEventIds: [],
    teamHistory: [youthTeam],
    retired: false,
    retirementYear: null,
    retirementReason: null,
  }
}

export function createGame(choices: CreationChoices, seed: string, mode: GameMode): GameState {
  const rng = new Rng(seed)
  const player = createPlayer(choices, rng)
  const rival = createRival(player, rng.fork('rival-origin'))

  const initial: GameState = {
    mode,
    seed,
    year: START_YEAR,
    player,
    rival,
    seasons: [],
    pendingEvent: null,
    pendingPlacementNote: null,
    pendingRenewalNote: null,
    draftSeason: null,
    pendingMinigame: null,
    pendingFinals: [],
    cupRun: null,
    finalHeadlines: [],
    pendingOffers: null,
    pendingDraft: null,
    pendingTournament: null,
    phase: 'preseason',
    version: SAVE_VERSION,
  }

  // Open the first offseason immediately so the player lands on their first
  // perk choice rather than an empty screen.
  return startOffseason(initial)
}

/**
 * The daily challenge: a fixed archetype derived from the date, so every player
 * in the world gets the same country, number, position and style. The only
 * variable is how well they decide.
 */
export function dailyChoices(seed: string, playerName: string): CreationChoices {
  const rng = new Rng(`daily-setup::${seed}`)
  const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']
  const styles: PlayStyleId[] = [
    'scorer',
    'floor_general',
    'sharpshooter',
    'lockdown',
    'highlight',
    'franchise',
  ]
  const countryCodes = ['AR', 'US', 'ES', 'FR', 'RS', 'BR', 'LT', 'GR', 'CA', 'AU', 'NG', 'DE']

  return {
    name: playerName,
    countryCode: rng.pick(countryCodes),
    number: rng.int(0, 99),
    position: rng.pick(positions),
    hand: rng.chance(0.12) ? 'left' : 'right',
    styleId: rng.pick(styles),
  }
}
