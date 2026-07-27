/**
 * What a season actually won, named after the competition that awarded it.
 *
 * Winning the NBA and winning LEB Oro both push the award id `league_champion`,
 * which the award table renders as a flat "Champion" — so the biggest night of
 * a career reads the same as a second-division title. This turns a finished
 * season into named trophies for display.
 *
 * Display only, deliberately. `AwardId` and the award weights stay exactly as
 * they are, so `legacy.ts` scoring and every test keyed to those ids are
 * untouched. A trophy is a label, not a score.
 *
 * Losing finals appear here and nowhere else. A league runner-up was already
 * in `playoffResult`; a cup runner-up had no record at all until `Season.cupWon`,
 * because winning pushes an award id and losing pushes nothing.
 */

import type { Localized, Season } from './types'
import { getLeague } from '@/data/leagues'
import { CUPS } from '@/data/cups'

export type TrophyResult = 'champion' | 'finalist'

export interface Trophy {
  kind: 'league' | 'cup'
  /** League id or cup id. */
  competitionId: string
  /** The competition's own name — "NBA", "Copa del Rey". */
  name: Localized
  result: TrophyResult
}

const CUP_INDEX = new Map(CUPS.map((cup) => [cup.id, cup]))

/** Every trophy this season produced, won or lost. Empty for most seasons. */
export function trophiesFor(season: Season): Trophy[] {
  const trophies: Trophy[] = []

  if (season.playoffResult === 'champion' || season.playoffResult === 'finals') {
    const league = getLeague(season.leagueId)
    trophies.push({
      kind: 'league',
      competitionId: league.id,
      name: league.name,
      result: season.playoffResult === 'champion' ? 'champion' : 'finalist',
    })
  }

  // `getCup` throws on an unknown id, and a season stored by an older build may
  // name a cup this one no longer has. An unnameable trophy is dropped rather
  // than taking the retirement screen down with it.
  const cup = season.cupId ? CUP_INDEX.get(season.cupId) : undefined
  // `cupWon` is null for a run that never reached the final, which is not a
  // runner-up — most cup runs end that way and none of them are trophies.
  if (cup && (season.cupWon === true || season.cupWon === false)) {
    trophies.push({
      kind: 'cup',
      competitionId: cup.id,
      name: cup.name,
      result: season.cupWon ? 'champion' : 'finalist',
    })
  }

  return trophies
}

/**
 * How a trophy is written on a chip.
 *
 * A cup is already a proper noun — "Copa del Rey" needs no decoration. A league
 * is not: "NBA" is a competition, "Campeón NBA" is a thing you won.
 */
export function trophyLabel(trophy: Trophy): Localized {
  if (trophy.kind === 'cup') {
    return trophy.result === 'champion'
      ? trophy.name
      : { es: `Final ${trophy.name.es}`, en: `${trophy.name.en} final` }
  }
  return trophy.result === 'champion'
    ? { es: `Campeón ${trophy.name.es}`, en: `${trophy.name.en} Champion` }
    : { es: `Finalista ${trophy.name.es}`, en: `${trophy.name.en} finalist` }
}

/** The emoji a trophy wears, so a title never looks like a runner-up. */
export function trophyIcon(trophy: Trophy): string {
  if (trophy.result === 'finalist') return trophy.kind === 'cup' ? '🥈' : '🏅'
  return '🏆'
}
