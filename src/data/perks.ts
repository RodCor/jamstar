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
 * Spec §6 verbatim. An earlier pass divided these by 0.675 — the factor
 * `spendGrowthPoint`'s gain ladder was scaled by in Wave 2a — reasoning that a
 * perk now buys a third less than its author intended. That double-counts.
 * The 0.675 was itself chosen by measuring whole careers against
 * `__fixtures__/career-baseline.json` *with perks in the loop at these
 * magnitudes*, so it already compensates for everything downstream of it,
 * perks included. Correcting a second time inflated the pool from 89 growth
 * points to 148 and put five of nine distribution metrics out of band —
 * `mvpsPerCareer` by +209%. Do not re-derive these; they are measured.
 *
 * The bands are also what keeps the pool honest as it grows: a career of ~20
 * seasons draws ~20 perks, so at 53 perks it consumes under 40% of the pool and
 * the rarity odds — rather than exhaustion — decide what a player ends up with.
 * Every entry below is checked against its band by `perks.test.ts`.
 */
export const PERK_BUDGET: Record<PerkRarity, { min: number; max: number }> = {
  basic: { min: 2, max: 3 },
  silver: { min: 4, max: 4 },
  gold: { min: 5, max: 6 },
  legend: { min: 7, max: 8 },
  top1: { min: 9, max: 10 },
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
    bonus: { scoring: 2 },
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
    bonus: { scoring: 4 },
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
    bonus: { scoring: 3, mental: 1 },
    effects: { clutch: 0.08 },
    weight: 24,
    rarity: 'silver',
  },
  {
    id: 'pump_fake',
    name: { es: 'Amague', en: 'Pump Fake' },
    description: {
      es: 'Levantás la pelota y el defensor se va al techo. Después es cuestión de esperarlo abajo.',
      en: 'You show the ball and the defender leaves his feet. After that you just wait for him to land.',
    },
    bonus: { scoring: 3 },
    weight: 30,
    rarity: 'basic',
  },
  {
    id: 'backdoor_cut',
    name: { es: 'Corte por atrás', en: 'Backdoor Cut' },
    description: {
      es: 'En cuanto tu marca mira la pelota, ya te fuiste. El pase siempre llega.',
      en: 'The moment your man turns to look at the ball you are gone. The pass always arrives.',
    },
    bonus: { scoring: 2, physical: 1 },
    effects: { scoring: 1.04 },
    weight: 28,
    rarity: 'basic',
  },
  {
    id: 'pull_up',
    name: { es: 'Tiro en carrera', en: 'Pull-Up' },
    description: {
      es: 'Un bote, freno y sube. El de atrás nunca llega y el grandote ya se sentó.',
      en: 'One dribble, hard stop, up. The trailer never arrives and the big already sat down.',
    },
    bonus: { scoring: 4 },
    effects: { scoring: 1.07 },
    weight: 24,
    rarity: 'silver',
  },
  {
    id: 'spin_move',
    name: { es: 'Giro', en: 'Spin Move' },
    description: {
      es: 'Sentís el hombro del defensor y girás para el otro lado. Cuando te encuentra ya estás abajo del aro.',
      en: 'You feel the shoulder and turn the other way. By the time he finds you, you are at the rim.',
    },
    bonus: { physical: 3, scoring: 1 },
    effects: { scoring: 1.06 },
    weight: 24,
    rarity: 'silver',
  },
  {
    id: 'heat_check',
    name: { es: 'Mano caliente', en: 'Heat Check' },
    description: {
      es: 'Metés dos seguidos y el tercero sale desde donde te agarre. El banco se para antes de que entre.',
      en: 'Two go down and the third comes from wherever you happen to be standing. The bench is up before it lands.',
    },
    bonus: { scoring: 4, mental: 1 },
    effects: { scoring: 1.09, hype: 3 },
    weight: 22,
    rarity: 'gold',
  },
  {
    id: 'post_footwork',
    name: { es: 'Juego de espaldas', en: 'Post Footwork' },
    description: {
      es: 'Un pie, el otro, y el defensor quedó del lado equivocado. No hace falta saltar.',
      en: 'One foot, then the other, and he is on the wrong side of you. No jumping required.',
    },
    bonus: { scoring: 3, physical: 2 },
    effects: { scoring: 1.08, contractPull: 1.05 },
    positions: ['SF', 'PF', 'C'],
    weight: 22,
    rarity: 'gold',
  },
  {
    id: 'the_bag',
    name: { es: 'La bolsa', en: 'The Bag' },
    description: {
      es: 'Tenés una respuesta para cada marca y las probaste todas en verano. La defensa sólo elige cómo perder.',
      en: 'You have an answer for every coverage and you drilled all of them in July. The defence only gets to pick how it loses.',
    },
    bonus: { scoring: 5, playmaking: 2 },
    effects: { scoring: 1.1, hype: 4 },
    minAge: 23,
    weight: 20,
    rarity: 'legend',
  },
  // `signature_move`, `telepathy` and `the_island` share the shape
  // `{ primary: 7, mental: 3 }`. That is a known review finding, deliberately
  // left open, because differentiating it is not free: `overallRating` is a
  // weighted average and `mental` carries the lowest weight of any attribute
  // at every position (`POSITION_WEIGHTS`, 0.06 at SF against physical's 0.48).
  // Moving points off `mental` therefore raises rating without adding a single
  // growth point. Measured twice on the 240-career cohort: shifting 3 points
  // off `mental` on two of these perks took `allStarsPerCareer` from +11.46% to
  // +14.23% against a ±12% band, and shifting 1 point still landed at +12.25%.
  // Both red the distribution guard. Any future attempt has to keep each
  // perk's `mental` allocation exactly where it is and find the distinction
  // elsewhere — or move the band, which is a separate decision.
  {
    id: 'signature_move',
    name: { es: 'Movimiento propio', en: 'Signature Move' },
    description: {
      es: 'Todos saben lo que vas a hacer. Lo pasan en la tele, lo copian los pibes en el playón, y lo mismo no lo pueden defender.',
      en: 'Everyone knows what is coming. It runs on every highlight reel, kids copy it in the park, and it still cannot be guarded.',
    },
    bonus: { scoring: 7, mental: 3 },
    effects: { scoring: 1.18 },
    weight: 12,
    rarity: 'top1',
  },

  // ------------------------------------------------------------- playmaking
  {
    id: 'court_vision',
    name: { es: 'Visión de juego', en: 'Court Vision' },
    description: {
      es: 'Ves el pase dos segundos antes que el resto. Tus compañeros aprenden a correr sin mirar.',
      en: 'You see the pass two seconds before everyone else. Teammates learn to cut without looking.',
    },
    bonus: { playmaking: 4 },
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
    bonus: { playmaking: 2 },
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
    bonus: { playmaking: 5 },
    effects: { playmaking: 1.1, scoring: 1.04 },
    minAge: 20,
    weight: 20,
    rarity: 'gold',
  },
  {
    id: 'outlet_pass',
    name: { es: 'Primer pase', en: 'Outlet Pass' },
    description: {
      es: 'Bajás el rebote y la pelota ya está cruzando la cancha. El contraataque empieza en tus manos.',
      en: 'You come down with the rebound and the ball is already across half court. The break starts in your hands.',
    },
    bonus: { playmaking: 2, physical: 1 },
    weight: 28,
    rarity: 'basic',
  },
  {
    id: 'off_hand',
    name: { es: 'Mano cambiada', en: 'Off Hand' },
    description: {
      es: 'Terminás con las dos manos igual de bien. Los scouts dejaron de escribir "mandalo a su lado débil".',
      en: 'You finish with either hand. Scouts stopped writing "force him left" a while ago.',
    },
    bonus: { playmaking: 3 },
    weight: 30,
    rarity: 'basic',
  },
  {
    id: 'drive_and_kick',
    name: { es: 'Penetrar y descargar', en: 'Drive and Kick' },
    description: {
      es: 'Entrás para mover la ayuda, no para terminar. El tirador de la esquina te adora.',
      en: 'You drive to move the help, not to finish. The corner shooter loves you for it.',
    },
    bonus: { playmaking: 4 },
    effects: { playmaking: 1.08 },
    weight: 24,
    rarity: 'silver',
  },
  {
    id: 'screen_setter',
    name: { es: 'Bloqueo sólido', en: 'Screen Setter' },
    description: {
      es: 'Plantás los pies y no te movés. El compañero sale libre porque vos te comiste el choque.',
      en: 'You set your feet and you do not move. Your teammate comes off clean because you ate the contact.',
    },
    bonus: { physical: 3, playmaking: 1 },
    effects: { playmaking: 1.07 },
    weight: 24,
    rarity: 'silver',
  },
  {
    id: 'transition_engine',
    name: { es: 'Motor de contraataque', en: 'Transition Engine' },
    description: {
      es: 'Apenas cae el rebote ya estás en el otro campo. El rival corre para atrás toda la noche.',
      en: 'The rebound is barely down and you are past half court. They spend the night running backwards.',
    },
    bonus: { physical: 3, playmaking: 2 },
    effects: { playmaking: 1.07, scoring: 1.05 },
    weight: 22,
    rarity: 'gold',
  },
  {
    id: 'metronome',
    name: { es: 'Metrónomo', en: 'Metronome' },
    description: {
      es: 'El partido va al ritmo que vos marcás. Nadie se acuerda de haber decidido seguirte.',
      en: 'The game runs at whatever tempo you set. Nobody remembers agreeing to it.',
    },
    bonus: { playmaking: 5, mental: 2 },
    effects: { playmaking: 1.15, clutch: 0.06 },
    weight: 18,
    rarity: 'legend',
  },
  {
    id: 'telepathy',
    name: { es: 'Telepatía', en: 'Telepathy' },
    description: {
      es: 'Tus compañeros cortan antes de que los mires. Aprendieron que la pelota va a estar ahí aunque no tenga sentido.',
      en: 'Teammates cut before you even look at them. They learned the ball will be there even when it makes no sense.',
    },
    bonus: { playmaking: 7, mental: 3 },
    effects: { playmaking: 1.22 },
    weight: 12,
    rarity: 'top1',
  },

  // ---------------------------------------------------------------- physical
  {
    id: 'first_step',
    name: { es: 'Primer paso', en: 'First Step' },
    description: {
      es: 'Un cambio de ritmo y ya estás en la pintura. No hay defensa que aguante eso de frente.',
      en: 'One change of pace and you are in the paint. No defender survives that head on.',
    },
    bonus: { physical: 2, playmaking: 1 },
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
    bonus: { physical: 5 },
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
    bonus: { physical: 7 },
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
    bonus: { physical: 4, mental: 1 },
    effects: { rebounding: 1.18 },
    positions: ['SF', 'PF', 'C'],
    weight: 26,
    rarity: 'gold',
  },
  {
    id: 'box_out',
    name: { es: 'Bloqueo de rebote', en: 'Box Out' },
    description: {
      es: 'Buscás el cuerpo antes que la pelota. Nadie te pasa por adelante en el segundo tiro.',
      en: 'You find the body before you find the ball. Nobody gets in front of you on the second shot.',
    },
    bonus: { physical: 2, mental: 1 },
    weight: 30,
    rarity: 'basic',
  },
  {
    id: 'extra_reps',
    name: { es: 'Repeticiones de más', en: 'Extra Reps' },
    description: {
      es: 'Apagan las luces del gimnasio y vos seguís. El cuerpo se nota recién en marzo.',
      en: 'They kill the gym lights and you keep going. The body only shows up in March.',
    },
    bonus: { physical: 3 },
    weight: 30,
    rarity: 'basic',
  },
  {
    id: 'built_different',
    name: { es: 'Hecho de otra cosa', en: 'Built Different' },
    description: {
      es: 'Te levantás de choques que dejan a otros un mes afuera. El preparador te pregunta qué hacés distinto y no sabés qué contestarle.',
      en: 'You get up from collisions that put other men out for a month. The trainer asks what you do differently and you have no answer for him.',
    },
    bonus: { physical: 6, mental: 3 },
    effects: { injuryFactor: 0.5 },
    weight: 12,
    rarity: 'top1',
  },

  // ---------------------------------------------------------------- defence
  {
    id: 'lockdown_hands',
    name: { es: 'Manos rápidas', en: 'Quick Hands' },
    description: {
      es: 'Robás sin fallar la marca. El pase perezoso te lo llevás siempre.',
      en: 'You strip it without losing your man. The lazy pass is always yours.',
    },
    bonus: { defense: 5 },
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
    bonus: { defense: 3, physical: 2 },
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
    bonus: { defense: 3, mental: 2 },
    effects: { defense: 1.08, clutch: 0.06 },
    weight: 24,
    rarity: 'gold',
  },
  {
    id: 'contest_discipline',
    name: { es: 'Mano arriba', en: 'Hand Up' },
    description: {
      es: 'No mordés ningún amague. Llegás al tiro con la mano estirada y sin cometer falta.',
      en: 'You never bite on the fake. You arrive with a hand up and without fouling.',
    },
    bonus: { defense: 2 },
    effects: { defense: 1.05 },
    weight: 28,
    rarity: 'basic',
  },
  {
    id: 'switchable',
    name: { es: 'Marcás a los cinco', en: 'Switchable' },
    description: {
      es: 'Cambiás a cualquiera y no se nota. Los bloqueos del rival dejan de significar algo.',
      en: 'You switch onto anyone and nothing changes. Their screens stop meaning anything.',
    },
    bonus: { defense: 4 },
    effects: { defense: 1.09 },
    weight: 24,
    rarity: 'silver',
  },
  {
    id: 'charge_taker',
    name: { es: 'Sacar cargas', en: 'Charge Taker' },
    description: {
      es: 'Te plantás y esperás el golpe. Te levantás del piso con la falta a favor.',
      en: 'You plant your feet and wait for the hit. You get up off the floor with the call.',
    },
    bonus: { defense: 3, physical: 1 },
    effects: { defense: 1.07 },
    weight: 22,
    rarity: 'silver',
  },
  {
    id: 'point_of_attack',
    name: { es: 'Primera línea', en: 'Point of Attack' },
    description: {
      es: 'Te le pegás al base desde que sacan de fondo. El ataque rival arranca tarde todas las veces.',
      en: 'You pick the ball handler up at the baseline. Their offence starts late every single time.',
    },
    bonus: { defense: 3, physical: 2 },
    effects: { defense: 1.12, clutch: 0.04 },
    weight: 22,
    rarity: 'gold',
  },
  {
    id: 'help_anchor',
    name: { es: 'Ancla de la ayuda', en: 'Help Anchor' },
    description: {
      es: 'Hablás toda la posesión y los cinco se mueven con vos. La defensa del equipo es tu voz.',
      en: 'You talk through the whole possession and all five move with you. The team defence is your voice.',
    },
    bonus: { defense: 4, mental: 3 },
    effects: { defense: 1.18, awardPull: 0.03 },
    weight: 20,
    rarity: 'legend',
  },
  {
    id: 'the_island',
    name: { es: 'La isla', en: 'The Island' },
    description: {
      es: 'Te dejan solo con el mejor del otro equipo y el resto se olvida de ayudar. Al tipo lo sientan en el tercer cuarto.',
      en: 'They leave you alone with their best player and the rest of the defence forgets help exists. He is on the bench by the third quarter.',
    },
    bonus: { defense: 7, mental: 3 },
    effects: { defense: 1.3 },
    weight: 12,
    rarity: 'top1',
  },

  // ------------------------------------------------------------------ mental
  {
    id: 'ice_veins',
    name: { es: 'Sangre fría', en: 'Ice in the Veins' },
    description: {
      es: 'Cuanto más grande el momento, más tranquilo estás. Los finales se te dan.',
      en: 'The bigger the moment, the calmer you get. Endings tend to go your way.',
    },
    bonus: { mental: 4, scoring: 1 },
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
    bonus: { mental: 4 },
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
    bonus: { mental: 4 },
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
    bonus: { mental: 4, scoring: 3 },
    effects: { hype: 5, contractPull: 1.12, awardPull: 0.04 },
    weight: 20,
    rarity: 'legend',
  },
  {
    id: 'bench_spark',
    name: { es: 'Chispa desde el banco', en: 'Spark off the Bench' },
    description: {
      es: 'Entrás con el partido frío y a los dos minutos el estadio está de pie. El que salió te mira desde el banco y no entiende qué pasó.',
      en: 'You check in with the game flat and two minutes later the building is standing. The man you replaced watches from the bench and cannot work out what happened.',
    },
    bonus: { mental: 2, defense: 1 },
    effects: { hype: 2 },
    weight: 26,
    rarity: 'basic',
  },
  {
    id: 'tempo_control',
    name: { es: 'Manejo del tempo', en: 'Tempo Control' },
    description: {
      es: 'Cuando el partido se acelera, vos frenás. El equipo respira porque vos respirás.',
      en: 'When the game speeds up, you slow down. The team breathes because you do.',
    },
    bonus: { mental: 4 },
    effects: { clutch: 0.07 },
    weight: 24,
    rarity: 'silver',
  },
  {
    id: 'road_warrior',
    name: { es: 'De gira', en: 'Road Warrior' },
    description: {
      es: 'Dormís en el avión, comés lo que hay y jugás igual. Cinco partidos en siete noches no se te notan en la cara.',
      en: 'You sleep on the plane, eat whatever is there, and play the same. Five games in seven nights never shows on you.',
    },
    bonus: { mental: 3, physical: 1 },
    effects: { wearFactor: 0.92 },
    weight: 22,
    rarity: 'silver',
  },
  {
    id: 'short_memory',
    name: { es: 'Memoria corta', en: 'Short Memory' },
    description: {
      es: 'Errás tres seguidos y pedís la cuarta. Lo que pasó hace un minuto no existe.',
      en: 'You miss three straight and call for the fourth. A minute ago does not exist.',
    },
    bonus: { mental: 4, scoring: 1 },
    effects: { clutch: 0.09, awardPull: 0.02 },
    weight: 20,
    rarity: 'gold',
  },
  {
    id: 'cornerstone',
    name: { es: 'Piedra angular', en: 'Cornerstone' },
    description: {
      es: 'La franquicia se construye alrededor tuyo y en la oficina lo saben. Te cuidan como se cuida un edificio.',
      en: 'The franchise gets built around you and the front office knows it. They look after you the way you look after a building.',
    },
    bonus: { mental: 4, physical: 3 },
    effects: { contractPull: 1.15, injuryFactor: 0.82 },
    weight: 18,
    rarity: 'legend',
  },
  {
    id: 'the_moment',
    name: { es: 'El momento', en: 'The Moment' },
    description: {
      es: 'Los dos bancos saben a quién le va a llegar la pelota. Se la dan igual, y termina como termina siempre.',
      en: 'Both benches know exactly who the ball is going to. They give it to you anyway, and it ends the way it always ends.',
    },
    bonus: { mental: 6, scoring: 3 },
    effects: { clutch: 0.28 },
    weight: 12,
    rarity: 'top1',
  },

  // ------------------------------------------------------------ late career
  {
    id: 'old_man_game',
    name: { es: 'Juego de veterano', en: 'Old Man Game' },
    description: {
      es: 'Perdiste el primer paso y ganaste todo lo demás. Los pies, el ángulo, el momento exacto.',
      en: 'You lost the first step and gained everything else. Footwork, angles, exact timing.',
    },
    bonus: { mental: 5, scoring: 2 },
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
    bonus: { physical: 4, mental: 3 },
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
    bonus: { mental: 4 },
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
    bonus: { scoring: 1, playmaking: 1, defense: 1 },
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
    bonus: { physical: 2 },
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
    bonus: { defense: 1, scoring: 1 },
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
