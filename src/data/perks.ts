/**
 * Perks — the thing you actually choose each preseason.
 *
 * Allocating raw stat points was arithmetic, not a decision: the optimal spread
 * was the same every year. A perk is a named, flavoured upgrade with a shape,
 * and picking one of three means giving up two.
 *
 * `bonus` values are *growth points*, not raw attribute numbers — they are spent
 * through `spendGrowthPoint`, so the same diminishing returns apply and an
 * already-elite attribute cannot be pumped forever.
 *
 * `effects` are passives the simulation reads directly. Keep them few and
 * legible; a perk the player cannot feel is just a stat line with a title.
 */

import type { AttributeKey, Position } from '@/game/types'

/** Weakest to strongest. Required on every `Perk` — the draw falls back to
 * `basic` only for the mechanism's own tests, never for real content. */
export type PerkRarity = 'basic' | 'silver' | 'gold' | 'legend' | 'top1'

/**
 * The growth-point budget each rarity must spend its `bonus` inside.
 *
 * Re-derived from spec §6, whose figures were authored against the
 * pre-Wave-2a ladder: these are those figures divided by 0.675 (the factor
 * `spendGrowthPoint` was scaled by) and rounded to whole points. `top1` has no
 * members yet — that tier is Task 3's content — but the budget is defined now
 * so the guard below already covers it once those perks land.
 */
export const PERK_BUDGET: Record<PerkRarity, { min: number; max: number }> = {
  basic: { min: 3, max: 4 },
  silver: { min: 6, max: 6 },
  gold: { min: 7, max: 9 },
  legend: { min: 10, max: 12 },
  top1: { min: 13, max: 15 },
}

export interface PerkEffects {
  /** Multiplies injury chance. Below 1 is protective. */
  injuryFactor?: number
  /** Subtracted from minigame difficulty. Positive makes finals easier. */
  clutch?: number
  /** Multiplies wear accumulated per season. Below 1 extends the career. */
  wearFactor?: number
  /** Added to hype gained each season. */
  hype?: number
  /** Multiplies contract offers' quality and money. */
  contractPull?: number
  /** Added to the odds of individual awards. */
  awardPull?: number
  /** Multiplies scoring output. */
  scoring?: number
  /** Multiplies playmaking output. */
  playmaking?: number
  /** Multiplies defensive counting stats. */
  defense?: number
  /** Multiplies rebounding output. */
  rebounding?: number
}

export interface Perk {
  id: string
  name: { es: string; en: string }
  description: { es: string; en: string }
  /** Growth points granted, per attribute. */
  bonus: Partial<Record<AttributeKey, number>>
  effects?: PerkEffects
  /** Positions this perk is offered to. Empty means everyone. */
  positions?: Position[]
  /** Earliest age this can appear — keeps the late-career perks meaningful. */
  minAge?: number
  /** Latest age this can appear. */
  maxAge?: number
  /** Higher shows up more often. */
  weight: number
  /** How rare this is to be offered — gates both draw odds and `bonus` budget. */
  rarity: PerkRarity
}

export const PERKS: Perk[] = [
  // ----------------------------------------------------------------- scoring
  {
    id: 'catch_and_shoot',
    name: { es: 'Tiro en suspensión', en: 'Catch and Shoot' },
    description: {
      es: 'Recibís y soltás sin pensarlo. Un cierre de bloqueo tarde y ya es tarde.',
      en: 'You catch and release without thinking. Close out a beat late and it is gone.',
    },
    bonus: { scoring: 3 },
    effects: { scoring: 1.05 },
    weight: 30,
    rarity: 'basic',
  },
  {
    id: 'deep_range',
    name: { es: 'Rango infinito', en: 'Unlimited Range' },
    description: {
      es: 'Tirás desde tres metros detrás de la línea y entra igual. Los defensores no saben dónde pararse.',
      en: 'You shoot from ten feet behind the line and it still drops. Defenders have no idea where to stand.',
    },
    bonus: { scoring: 6 },
    effects: { scoring: 1.08, hype: 2 },
    minAge: 19,
    weight: 22,
    rarity: 'silver',
  },
  {
    id: 'free_throw_ritual',
    name: { es: 'Rutina de tiro libre', en: 'Free Throw Ritual' },
    description: {
      es: 'Mismo bote, misma respiración, mismo resultado. La línea es el lugar más tranquilo de la cancha.',
      en: 'Same dribble, same breath, same result. The line is the calmest place on the floor.',
    },
    bonus: { scoring: 4, mental: 2 },
    effects: { clutch: 0.08 },
    weight: 24,
    rarity: 'silver',
  },

  // ------------------------------------------------------------- playmaking
  {
    id: 'court_vision',
    name: { es: 'Visión de juego', en: 'Court Vision' },
    description: {
      es: 'Ves el pase dos segundos antes que el resto. Tus compañeros aprenden a correr sin mirar.',
      en: 'You see the pass two seconds before everyone else. Teammates learn to cut without looking.',
    },
    bonus: { playmaking: 6 },
    effects: { playmaking: 1.12 },
    positions: ['PG', 'SG', 'SF'],
    weight: 28,
    rarity: 'silver',
  },
  {
    id: 'tight_handle',
    name: { es: 'Manejo blindado', en: 'Tight Handle' },
    description: {
      es: 'Nadie te saca la pelota. Podés subirla contra presión toda la noche.',
      en: 'Nobody takes it off you. You can bring it up against pressure all night.',
    },
    bonus: { playmaking: 4 },
    effects: { playmaking: 1.06 },
    positions: ['PG', 'SG', 'SF'],
    weight: 26,
    rarity: 'basic',
  },
  {
    id: 'pick_and_roll',
    name: { es: 'Lector de bloqueos', en: 'Pick and Roll Maestro' },
    description: {
      es: 'Leés la ayuda antes de que salga. El bloqueo directo se vuelve un problema irresoluble.',
      en: 'You read the help before it commits. The pick and roll becomes unguardable.',
    },
    bonus: { playmaking: 7 },
    effects: { playmaking: 1.1, scoring: 1.04 },
    minAge: 20,
    weight: 20,
    rarity: 'gold',
  },

  // ---------------------------------------------------------------- physical
  {
    id: 'first_step',
    name: { es: 'Primer paso', en: 'First Step' },
    description: {
      es: 'Un cambio de ritmo y ya estás en la pintura. No hay defensa que aguante eso de frente.',
      en: 'One change of pace and you are in the paint. No defender survives that head on.',
    },
    bonus: { physical: 3, playmaking: 1 },
    effects: { scoring: 1.06 },
    maxAge: 30,
    weight: 26,
    rarity: 'basic',
  },
  {
    id: 'motor',
    name: { es: 'Motor', en: 'Motor' },
    description: {
      es: 'Corrés cada transición como si fuera la última. Los entrenadores no te sacan nunca.',
      en: 'You run every break like it is the last one. Coaches never take you off.',
    },
    bonus: { physical: 7 },
    effects: { rebounding: 1.08, defense: 1.05 },
    weight: 26,
    rarity: 'gold',
  },
  {
    id: 'iron_body',
    name: { es: 'Cuerpo de hierro', en: 'Iron Body' },
    description: {
      es: 'Aguantás el contacto y la temporada entera. Los partes médicos hablan de otros.',
      en: 'You absorb contact and the whole season with it. The injury report is about other people.',
    },
    bonus: { physical: 10 },
    effects: { injuryFactor: 0.78, wearFactor: 0.88 },
    weight: 24,
    rarity: 'legend',
  },
  {
    id: 'glass_cleaner',
    name: { es: 'Dueño del rebote', en: 'Glass Cleaner' },
    description: {
      es: 'La pelota que rebota es tuya antes de que caiga. Es una decisión, no un reflejo.',
      en: 'The ball is yours before it comes down. It is a decision, not a reflex.',
    },
    bonus: { physical: 5, mental: 2 },
    effects: { rebounding: 1.18 },
    positions: ['SF', 'PF', 'C'],
    weight: 26,
    rarity: 'gold',
  },

  // ---------------------------------------------------------------- defence
  {
    id: 'lockdown_hands',
    name: { es: 'Manos rápidas', en: 'Quick Hands' },
    description: {
      es: 'Robás sin fallar la marca. El pase perezoso te lo llevás siempre.',
      en: 'You strip it without losing your man. The lazy pass is always yours.',
    },
    bonus: { defense: 7 },
    effects: { defense: 1.14 },
    weight: 26,
    rarity: 'gold',
  },
  {
    id: 'rim_protector',
    name: { es: 'Protector del aro', en: 'Rim Protector' },
    description: {
      es: 'Nadie entra a la pintura por gusto. Cambiás tiros que ni siquiera bloqueás.',
      en: 'Nobody enters the paint for fun. You change shots you do not even block.',
    },
    bonus: { defense: 4, physical: 3 },
    effects: { defense: 1.2 },
    positions: ['PF', 'C'],
    weight: 26,
    rarity: 'gold',
  },
  {
    id: 'defensive_read',
    name: { es: 'Anticipación', en: 'Anticipation' },
    description: {
      es: 'Sabés a dónde va la pelota antes que el que la tiene. Rotás una fracción antes que todos.',
      en: 'You know where the ball is going before the passer does. You rotate a half-beat early.',
    },
    bonus: { defense: 4, mental: 3 },
    effects: { defense: 1.08, clutch: 0.06 },
    weight: 24,
    rarity: 'gold',
  },

  // ------------------------------------------------------------------ mental
  {
    id: 'ice_veins',
    name: { es: 'Sangre fría', en: 'Ice in the Veins' },
    description: {
      es: 'Cuanto más grande el momento, más tranquilo estás. Los finales se te dan.',
      en: 'The bigger the moment, the calmer you get. Endings tend to go your way.',
    },
    bonus: { mental: 5, scoring: 2 },
    effects: { clutch: 0.14 },
    minAge: 20,
    weight: 20,
    rarity: 'gold',
  },
  {
    id: 'film_room',
    name: { es: 'Sala de video', en: 'Film Room' },
    description: {
      es: 'Estudiás rivales hasta tarde. Sabés lo que van a hacer porque ya lo viste.',
      en: 'You study opponents late into the night. You know what is coming because you already watched it.',
    },
    bonus: { mental: 6 },
    effects: { defense: 1.05, awardPull: 0.03 },
    weight: 24,
    rarity: 'silver',
  },
  {
    id: 'captain',
    name: { es: 'Capitán', en: 'Captain' },
    description: {
      es: 'El vestuario te sigue. Los equipos donde jugás ganan más de lo que deberían.',
      en: 'The locker room follows you. Your teams win more than they should.',
    },
    bonus: { mental: 6 },
    effects: { contractPull: 1.08, awardPull: 0.02 },
    minAge: 22,
    weight: 22,
    rarity: 'silver',
  },
  {
    id: 'media_darling',
    name: { es: 'Favorito de la prensa', en: 'Media Darling' },
    description: {
      es: 'Caés bien y lo sabés usar. Tu nombre aparece en conversaciones donde no deberías estar.',
      en: 'People like you and you know how to use it. Your name comes up in conversations you have not earned yet.',
    },
    bonus: { mental: 5, scoring: 5 },
    effects: { hype: 5, contractPull: 1.12, awardPull: 0.04 },
    weight: 20,
    rarity: 'legend',
  },

  // ------------------------------------------------------------ late career
  {
    id: 'old_man_game',
    name: { es: 'Juego de veterano', en: 'Old Man Game' },
    description: {
      es: 'Perdiste el primer paso y ganaste todo lo demás. Los pies, el ángulo, el momento exacto.',
      en: 'You lost the first step and gained everything else. Footwork, angles, exact timing.',
    },
    bonus: { mental: 7, scoring: 3 },
    effects: { wearFactor: 0.82, scoring: 1.04 },
    minAge: 30,
    weight: 34,
    rarity: 'legend',
  },
  {
    id: 'professional',
    name: { es: 'Profesional', en: 'Consummate Professional' },
    description: {
      es: 'Dieta, sueño, gimnasio, repetir. Vas a jugar tres años más que tus compañeros de camada.',
      en: 'Diet, sleep, gym, repeat. You will play three years longer than your draft class.',
    },
    bonus: { physical: 5, mental: 5 },
    effects: { wearFactor: 0.72, injuryFactor: 0.85 },
    minAge: 27,
    weight: 30,
    rarity: 'legend',
  },
  {
    id: 'mentor',
    name: { es: 'Mentor', en: 'Mentor' },
    description: {
      es: 'Los jóvenes del plantel mejoran por estar cerca tuyo. Eso también gana partidos.',
      en: 'The young players get better just by being near you. That wins games too.',
    },
    bonus: { mental: 6 },
    effects: { contractPull: 1.1 },
    minAge: 31,
    weight: 26,
    rarity: 'silver',
  },

  // ----------------------------------------------------------- early career
  {
    id: 'gym_rat',
    name: { es: 'Rata de gimnasio', en: 'Gym Rat' },
    description: {
      es: 'Primero en llegar, último en irse. Todavía no sos bueno, pero vas a serlo.',
      en: 'First in, last out. You are not good yet, but you are going to be.',
    },
    bonus: { scoring: 2, playmaking: 1, defense: 1 },
    maxAge: 24,
    weight: 32,
    rarity: 'basic',
  },
  {
    id: 'late_bloomer',
    name: { es: 'Desarrollo tardío', en: 'Late Bloomer' },
    description: {
      es: 'Creciste tarde y de golpe. Todo el mundo tuvo que recalcular lo que podías llegar a ser.',
      en: 'You grew late and all at once. Everyone had to recalculate what you might become.',
    },
    bonus: { physical: 4 },
    effects: { hype: 4 },
    maxAge: 22,
    weight: 24,
    rarity: 'basic',
  },
  {
    id: 'two_way',
    name: { es: 'Jugador de dos caras', en: 'Two-Way Player' },
    description: {
      es: 'Ni te escondés en defensa ni desaparecés en ataque. Sos titular en cualquier sistema.',
      en: 'You hide on neither end. You start in any system.',
    },
    bonus: { defense: 2, scoring: 2 },
    effects: { contractPull: 1.06 },
    weight: 26,
    rarity: 'basic',
  },
]

const PERK_INDEX = new Map(PERKS.map((perk) => [perk.id, perk]))

export function getPerk(id: string): Perk {
  const perk = PERK_INDEX.get(id)
  if (!perk) throw new Error(`Unknown perk: ${id}`)
  return perk
}

/** Merge every owned perk's passives into one set of multipliers. */
export function aggregateEffects(perkIds: string[]): Required<PerkEffects> {
  const total: Required<PerkEffects> = {
    injuryFactor: 1,
    clutch: 0,
    wearFactor: 1,
    hype: 0,
    contractPull: 1,
    awardPull: 0,
    scoring: 1,
    playmaking: 1,
    defense: 1,
    rebounding: 1,
  }

  for (const id of perkIds) {
    const effects = PERK_INDEX.get(id)?.effects
    if (!effects) continue
    // Multiplicative dials compound; additive ones sum.
    if (effects.injuryFactor) total.injuryFactor *= effects.injuryFactor
    if (effects.wearFactor) total.wearFactor *= effects.wearFactor
    if (effects.contractPull) total.contractPull *= effects.contractPull
    if (effects.scoring) total.scoring *= effects.scoring
    if (effects.playmaking) total.playmaking *= effects.playmaking
    if (effects.defense) total.defense *= effects.defense
    if (effects.rebounding) total.rebounding *= effects.rebounding
    if (effects.clutch) total.clutch += effects.clutch
    if (effects.hype) total.hype += effects.hype
    if (effects.awardPull) total.awardPull += effects.awardPull
  }

  return total
}
