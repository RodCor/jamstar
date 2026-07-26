/**
 * Finals you have to actually win.
 *
 * Reaching the last round is simulated; winning it is not. When the player gets
 * to a final they play a short skill challenge, and its result is fed back into
 * the season as an *input* — never an RNG draw. That keeps a seed reproducible
 * (same seed + same decisions + same minigame results reproduce a career
 * exactly) while making titles genuinely harder to collect.
 */

import type {
  League,
  Localized,
  MinigameChallenge,
  MinigameType,
  Player,
  Team,
} from './types'
import { Rng, clamp } from './rng'
import { getStyle } from '@/data/styles'

/**
 * Which challenge suits this player. A lockdown centre should not have their
 * career decided by a three-point contest.
 */
function chooseType(player: Player, rng: Rng): MinigameType {
  const a = player.attributes
  const style = getStyle(player.styleId)

  const weights: Record<MinigameType, number> = {
    // Shooters get the shot; everyone can be sent to the line.
    clutch_three: a.shooting * 1.2 * (style.id === 'sharpshooter' ? 2.2 : 1),
    free_throw: 55 + a.shooting * 0.35,
    defensive_stop:
      a.defense * 1.1 * (style.id === 'lockdown' ? 2.4 : 1) +
      (player.position === 'C' || player.position === 'PF' ? 35 : 0),
  }

  return rng.weighted(
    ['clutch_three', 'free_throw', 'defensive_stop'] as MinigameType[],
    (type) => weights[type],
  )
}

/** The attribute each challenge leans on, so your build shapes the difficulty. */
function relevantAttribute(type: MinigameType, player: Player): number {
  const a = player.attributes
  switch (type) {
    case 'clutch_three':
      return a.shooting * 0.8 + a.iq * 0.2
    case 'free_throw':
      return a.shooting * 0.7 + a.iq * 0.3
    case 'defensive_stop':
      return a.defense * 0.6 + a.iq * 0.4
  }
}

const TITLES: Record<MinigameType, { es: string; en: string }> = {
  free_throw: { es: 'Tiros libres decisivos', en: 'Free Throws to Win It' },
  clutch_three: { es: 'El triple del partido', en: 'The Shot' },
  defensive_stop: { es: 'La última defensa', en: 'The Last Stop' },
}

const INTROS: Record<MinigameType, { es: string; en: string }> = {
  free_throw: {
    es: 'Falta cuando no quedaba tiempo. Todo el estadio de pie y vos solo en la línea.',
    en: 'A foul with no time left. The whole arena on its feet, and you alone at the line.',
  },
  clutch_three: {
    es: 'Últimos segundos, van abajo, y la pelota termina en tus manos. No hay otra jugada.',
    en: 'Final seconds, you are down, and the ball ends up in your hands. There is no other play.',
  },
  defensive_stop: {
    es: 'Un punto arriba, quedan seis segundos y ellos sacan de banda. Una parada y son campeones.',
    en: 'One point up, six seconds left, and they inbound. One stop and you are champions.',
  },
}

export interface ChallengeInput {
  player: Player
  team: Team
  league: League
  opponent: Team
  rng: Rng
  /** Localized name of what is being decided, e.g. the league title. */
  stake: { es: string; en: string }
}

export function buildChallenge(input: ChallengeInput): MinigameChallenge {
  const { player, league, opponent, rng } = input
  const type = chooseType(player, rng)
  const attribute = relevantAttribute(type, player)

  // Difficulty rises with the opponent and the level, and falls with the
  // attribute the challenge tests.
  const difficulty = clamp(
    0.46 + (opponent.strength - 72) / 130 + (league.tier === 1 ? 0.1 : league.tier === 2 ? 0.04 : 0) -
      (attribute - 62) / 150,
    0.14,
    0.9,
  )

  // Harder finals give you more attempts but demand more of them, so a title is
  // never one lucky tap.
  const rounds = league.tier <= 2 ? 5 : 3
  const required = league.tier <= 2 ? 3 : 2

  return {
    type,
    rounds,
    required,
    difficulty,
    title: TITLES[type],
    intro: INTROS[type],
    stake: input.stake,
    opponentTeamId: opponent.id,
  }
}

/**
 * Tuning knobs the UI reads. Kept here so difficulty lives with the rest of the
 * simulation rather than being scattered across three React components.
 */
export interface MinigameTuning {
  /** Free throw: half-width of the make zone, as a fraction of the bar. */
  freeThrowZone: number
  /** Free throw: sweep speed, bar-widths per second. */
  freeThrowSpeed: number
  /** Clutch three: half-width of the release window, as a fraction of the ring. */
  clutchWindow: number
  /** Clutch three: seconds for the ring to collapse. */
  clutchDuration: number
  /** Defensive stop: milliseconds the correct lane stays tell-able. */
  stopWindowMs: number
  /** Defensive stop: how many fakes before the real pass. */
  stopFeints: number
}

export function tuningFor(challenge: MinigameChallenge): MinigameTuning {
  const d = challenge.difficulty
  return {
    freeThrowZone: lerp(0.15, 0.045, d),
    freeThrowSpeed: lerp(0.75, 1.85, d),
    clutchWindow: lerp(0.17, 0.05, d),
    clutchDuration: lerp(2.5, 1.25, d),
    stopWindowMs: Math.round(lerp(1150, 480, d)),
    stopFeints: d > 0.66 ? 3 : d > 0.36 ? 2 : 1,
  }
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * clamp(t, 0, 1)
}

/** Did the player take the title? */
export function isWin(challenge: MinigameChallenge, successes: number): boolean {
  return successes >= challenge.required
}

/**
 * How the final ended, for the season headline. Takes the opponent's bilingual
 * name so each language interpolates its own — a club can be "Múnich" in one
 * and "Munich" in the other.
 */
export function resultHeadline(
  challenge: MinigameChallenge,
  won: boolean,
  opponent: Localized,
): Localized {
  const templates: Record<MinigameType, { won: Localized; lost: Localized }> = {
    free_throw: {
      won: {
        es: `Los metiste desde la línea con el estadio encima. Campeones ante ${opponent.es}.`,
        en: `You sank them from the line with the arena screaming. Champions over ${opponent.en}.`,
      },
      lost: {
        es: `Los erraste desde la línea. ${opponent.es} se llevó el título y vos no vas a dormir.`,
        en: `You missed them from the line. ${opponent.en} took the title and you will not sleep.`,
      },
    },
    clutch_three: {
      won: {
        es: `Entró sobre la chicharra. Le ganaron la final a ${opponent.es} con el último tiro.`,
        en: `It dropped at the buzzer. You took the final from ${opponent.en} with the last shot.`,
      },
      lost: {
        es: `Se fue afuera. ${opponent.es} campeón y tu tiro repetido en todos los canales.`,
        en: `It rimmed out. ${opponent.en} are champions and your shot is on every replay.`,
      },
    },
    defensive_stop: {
      won: {
        es: `Aguantaron la última pelota. ${opponent.es} no pudo y el título es de ustedes.`,
        en: `You held on the last possession. ${opponent.en} had nothing, and the title is yours.`,
      },
      lost: {
        es: `Te ganaron la espalda en la última. ${opponent.es} campeón sobre la hora.`,
        en: `They got behind you on the last play. ${opponent.en} champions at the buzzer.`,
      },
    },
  }

  const entry = templates[challenge.type]
  return won ? entry.won : entry.lost
}
