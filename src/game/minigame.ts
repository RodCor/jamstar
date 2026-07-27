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
  CompetitionKind,
  League,
  Localized,
  MinigameChallenge,
  MinigameType,
  Player,
} from './types'
import { Rng, clamp } from './rng'
import { getStyle } from '@/data/styles'
import { effectsFor } from './perks'

/**
 * Which challenge suits this player. A lockdown centre should not have their
 * career decided by a three-point contest.
 */
function chooseType(player: Player, rng: Rng): MinigameType {
  const a = player.attributes
  const style = getStyle(player.styleId)
  const isBig = player.position === 'C' || player.position === 'PF'

  const weights: Record<MinigameType, number> = {
    // Shooters get the shot; everyone can be sent to the line.
    clutch_three: a.shooting * 1.2 * (style.id === 'sharpshooter' ? 2.2 : 1),
    free_throw: 55 + a.shooting * 0.35,
    defensive_stop: a.defense * 1.1 * (style.id === 'lockdown' ? 2.4 : 1) + (isBig ? 35 : 0),
    // Finishing through contact on the break — the athlete's ending.
    fast_break:
      a.athleticism * 1.0 * (style.id === 'highlight' ? 2.4 : 1) + a.strength * 0.35,
    // Executing the set play out of a timeout — the thinker's ending.
    play_recall: a.iq * 1.1 * (style.id === 'floor_general' ? 2.2 : 1) + a.leadership * 0.4,
  }

  return rng.weighted(MINIGAME_TYPES, (type) => weights[type])
}

const MINIGAME_TYPES: MinigameType[] = [
  'clutch_three',
  'free_throw',
  'defensive_stop',
  'fast_break',
  'play_recall',
]

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
    case 'fast_break':
      return a.athleticism * 0.6 + a.strength * 0.4
    case 'play_recall':
      return a.iq * 0.7 + a.leadership * 0.3
  }
}

const TITLES: Record<MinigameType, { es: string; en: string }> = {
  free_throw: { es: 'Tiros libres decisivos', en: 'Free Throws to Win It' },
  clutch_three: { es: 'El triple del partido', en: 'The Shot' },
  defensive_stop: { es: 'La última defensa', en: 'The Last Stop' },
  fast_break: { es: 'El contraataque', en: 'The Break' },
  play_recall: { es: 'La jugada del pizarrón', en: 'The Set Play' },
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
  fast_break: {
    es: 'Robaste la pelota y tenés toda la cancha por delante. Atrás vienen dos y no van a llegar limpio.',
    en: 'You stripped it and the floor is open. Two defenders are chasing and neither will arrive clean.',
  },
  play_recall: {
    es: 'Pidieron tiempo muerto. El entrenador dibuja cuatro movimientos y espera que salgan exactos.',
    en: 'Timeout called. The coach draws four movements and expects every one of them exactly.',
  },
}

export interface ChallengeInput {
  player: Player
  rng: Rng
  /** What is being decided. */
  competition: CompetitionKind
  /** Localized name of the trophy on the line. */
  stake: Localized
  /** 0-100 quality of who is on the other side. */
  opponentStrength: number
  opponentName: Localized
  /** The opposing club, when there is one to show a crest for. */
  opponentTeamId?: string | null
  /** Club league, when this is a club final. */
  league?: League | null
}

/**
 * How hard the stage is, before the player's own quality is taken into account.
 * The Olympic final is the hardest thing in the sport; a third-tier league final
 * is not.
 */
function stagePressure(competition: CompetitionKind, league: League | null | undefined): number {
  switch (competition) {
    case 'olympics':
      return 0.16
    case 'world_cup':
      return 0.12
    case 'continental':
      return 0.04
    case 'league':
      return league?.tier === 1 ? 0.1 : league?.tier === 2 ? 0.04 : 0
    // A cup final is one night against whoever survived the other half of the
    // bracket — less weight than a league final at the same level, and often a
    // weaker opponent, which is what makes it winnable for a smaller club.
    case 'cup':
      return league?.tier === 1 ? 0.04 : -0.04
  }
}

export function buildChallenge(input: ChallengeInput): MinigameChallenge {
  const { player, rng, competition, league } = input
  const type = chooseType(player, rng)
  const attribute = relevantAttribute(type, player)
  // Perks that steady the nerves make every final measurably easier.
  const clutch = effectsFor(player).clutch

  const difficulty = clamp(
    0.46 +
      (input.opponentStrength - 72) / 130 +
      stagePressure(competition, league) -
      (attribute - 62) / 150 -
      clutch,
    0.14,
    0.9,
  )

  // Harder finals give you more attempts but demand more of them, so a title is
  // never one lucky tap. International finals are the longest series of all; a
  // cup final is always the short one, whatever league it sits in.
  const big =
    competition === 'cup'
      ? false
      : competition === 'league'
        ? league?.tier === undefined || league.tier <= 2
        : true
  const rounds = big ? 5 : 3
  const required = big ? 3 : 2

  return {
    type,
    rounds,
    required,
    difficulty,
    title: TITLES[type],
    intro: INTROS[type],
    stake: input.stake,
    competition,
    opponentTeamId: input.opponentTeamId ?? null,
    opponentName: input.opponentName,
  }
}

/**
 * Tuning knobs the UI reads. Kept here so difficulty lives with the rest of the
 * simulation rather than being scattered across three React components.
 */
export interface MinigameTuning {
  /** Fast break: taps needed to finish. */
  breakTaps: number
  /** Fast break: seconds before the defence recovers. */
  breakSeconds: number
  /** Play recall: how many steps in the sequence. */
  recallSteps: number
  /** Play recall: milliseconds each step is shown. */
  recallStepMs: number
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
    breakTaps: Math.round(lerp(8, 20, d)),
    breakSeconds: lerp(4.2, 2.6, d),
    recallSteps: d > 0.7 ? 5 : d > 0.45 ? 4 : 3,
    recallStepMs: Math.round(lerp(620, 300, d)),
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
    fast_break: {
      won: {
        es: `Terminaste la corrida con falta incluida. Campeones ante ${opponent.es}.`,
        en: `You finished the break through the foul. Champions over ${opponent.en}.`,
      },
      lost: {
        es: `Te alcanzaron y la perdiste en la bandeja. ${opponent.es} se llevó el título.`,
        en: `They caught you and the layup died on the rim. ${opponent.en} took the title.`,
      },
    },
    play_recall: {
      won: {
        es: `Salió exacta, movimiento por movimiento. Le ganaron a ${opponent.es} con la pizarra.`,
        en: `It came out exactly as drawn. You beat ${opponent.en} on the whiteboard.`,
      },
      lost: {
        es: `Se rompió la jugada a mitad de camino. ${opponent.es} campeón.`,
        en: `The play broke down halfway through. ${opponent.en} are champions.`,
      },
    },
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
