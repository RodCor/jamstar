/**
 * Play styles. Each is a stated gamble, in the spirit of F1 Glory's driving
 * styles ("more poles and wins, but more DNFs"). The tradeoff text is shown on
 * the creation screen — the player should be choosing knowingly.
 */

import type { PlayStyle } from '@/game/types'

export const PLAY_STYLES: PlayStyle[] = [
  {
    id: 'scorer',
    name: { es: 'Anotador', en: 'Scorer' },
    tradeoff: {
      es: 'Más puntos y más portadas, pero el equipo depende de vos y los títulos cuestan más.',
      en: 'More points and more headlines, but the team leans on you and titles come harder.',
    },
    bonus: { scoring: 8, playmaking: 3, defense: -3, mental: -1 },
    scoringBias: 1.18,
    playmakingBias: 0.92,
    defenseBias: 0.9,
    injuryFactor: 1.0,
    hypeFactor: 1.15,
  },
  {
    id: 'floor_general',
    name: { es: 'Base creador', en: 'Floor General' },
    tradeoff: {
      es: 'Hacés mejor a todo el equipo y ganás más, pero tus números personales no deslumbran.',
      en: 'You make everyone better and win more, but your own box score never dazzles.',
    },
    bonus: { playmaking: 14, mental: 5, scoring: -2 },
    scoringBias: 0.86,
    playmakingBias: 1.32,
    defenseBias: 1.0,
    injuryFactor: 0.92,
    hypeFactor: 0.9,
  },
  {
    id: 'sharpshooter',
    name: { es: 'Tirador', en: 'Sharpshooter' },
    tradeoff: {
      es: 'Eficiencia de élite y carrera larga, pero dependés de que te generen los tiros.',
      en: 'Elite efficiency and a long career, but you depend on someone else creating your shots.',
    },
    bonus: { scoring: 10, mental: 3, physical: -7 },
    scoringBias: 1.06,
    playmakingBias: 0.9,
    defenseBias: 0.88,
    injuryFactor: 0.82,
    hypeFactor: 0.95,
  },
  {
    id: 'lockdown',
    name: { es: 'Muralla', en: 'Lockdown Defender' },
    tradeoff: {
      es: 'Ganás partidos sin que se note en la planilla. Los entrenadores te aman, los votantes de MVP no.',
      en: 'You win games in ways the box score hides. Coaches love you, MVP voters do not.',
    },
    bonus: { defense: 10, physical: 5, mental: 3, scoring: -5 },
    scoringBias: 0.78,
    playmakingBias: 0.94,
    defenseBias: 1.4,
    injuryFactor: 0.95,
    hypeFactor: 0.78,
  },
  {
    id: 'highlight',
    name: { es: 'Atleta explosivo', en: 'Highlight Athlete' },
    tradeoff: {
      es: 'Volás, sos viral y firmás contratos enormes — pero tu cuerpo paga la factura después de los 30.',
      en: 'You fly, you go viral, you sign huge deals — and your body sends the bill after 30.',
    },
    bonus: { physical: 15, mental: -4, scoring: -3 },
    scoringBias: 1.1,
    playmakingBias: 0.95,
    defenseBias: 1.08,
    injuryFactor: 1.45,
    hypeFactor: 1.35,
  },
  {
    id: 'franchise',
    name: { es: 'Franquicia', en: 'Franchise Cornerstone' },
    tradeoff: {
      es: 'Equilibrado en todo y sin techo bajo, pero empezás sin ninguna arma de élite.',
      en: 'Balanced everywhere with no low ceiling, but you start with no elite weapon at all.',
    },
    bonus: { scoring: 3, playmaking: 3, defense: 3, mental: 6, physical: 2 },
    scoringBias: 1.0,
    playmakingBias: 1.06,
    defenseBias: 1.06,
    injuryFactor: 1.0,
    hypeFactor: 1.05,
  },
]

const STYLE_INDEX = new Map(PLAY_STYLES.map((style) => [style.id, style]))

export function getStyle(id: string): PlayStyle {
  const style = STYLE_INDEX.get(id as PlayStyle['id'])
  if (!style) throw new Error(`Unknown play style: ${id}`)
  return style
}
