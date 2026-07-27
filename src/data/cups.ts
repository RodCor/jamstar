/**
 * Domestic cups — the second trophy on the shelf.
 *
 * A league season is a marathon that ends in a playoff; a cup is a short knockout
 * in the middle of winter that a smaller club can steal. Having both means a
 * career can be defined by a night in February as well as by June, and it gives
 * players at clubs that will never win a league something real to chase.
 *
 * SWAPPABLE DATA LAYER — see README. Every proper noun here is data, not logic.
 * Leagues with no real domestic cup simply have no entry, and the engine skips
 * the whole subsystem for them.
 */

import type { Cup } from '@/game/types'

export const CUPS: Cup[] = [
  {
    id: 'nba_cup',
    leagueId: 'nba',
    name: { es: 'NBA Cup', en: 'NBA Cup' },
    abbr: 'CUP',
    // Every club is in, and the knockout stage is played by the best of them.
    fieldStrength: 84,
    prestige: 58,
  },
  {
    id: 'copa_rey',
    leagueId: 'acb',
    name: { es: 'Copa del Rey', en: 'Copa del Rey' },
    abbr: 'CDR',
    // Eight teams, one weekend, in a country where two clubs are Europe's best.
    fieldStrength: 86,
    prestige: 78,
  },
  {
    id: 'coppa_italia',
    leagueId: 'lega_a',
    name: { es: 'Copa de Italia', en: 'Coppa Italia' },
    abbr: 'COP',
    fieldStrength: 76,
    prestige: 66,
  },
  {
    id: 'coupe_france',
    leagueId: 'betclic',
    name: { es: 'Copa de Francia', en: 'Coupe de France' },
    abbr: 'CDF',
    fieldStrength: 74,
    prestige: 62,
  },
  {
    id: 'coupe_france_b',
    leagueId: 'pro_b',
    name: { es: 'Copa de Francia', en: 'Coupe de France' },
    abbr: 'CDF',
    // Second-tier clubs enter the same cup — and occasionally knock someone over.
    fieldStrength: 62,
    prestige: 46,
  },
  {
    id: 'aba_supercup',
    leagueId: 'aba',
    name: { es: 'Supercopa ABA', en: 'ABA Supercup' },
    abbr: 'SUP',
    fieldStrength: 78,
    prestige: 58,
  },
  {
    id: 'kmt',
    leagueId: 'lkl',
    name: { es: 'Copa Rey Mindaugas', en: 'King Mindaugas Cup' },
    abbr: 'KMT',
    fieldStrength: 74,
    prestige: 60,
  },
  {
    id: 'greek_cup',
    leagueId: 'gbl',
    name: { es: 'Copa de Grecia', en: 'Greek Cup' },
    abbr: 'CUP',
    fieldStrength: 80,
    prestige: 64,
  },
  {
    id: 'turkish_cup',
    leagueId: 'bsl',
    name: { es: 'Copa de Turquía', en: "Turkish President's Cup" },
    abbr: 'CUP',
    fieldStrength: 80,
    prestige: 64,
  },
  {
    id: 'copa_argentina',
    leagueId: 'lnb_ar',
    name: { es: 'Copa Argentina', en: 'Copa Argentina' },
    abbr: 'CAR',
    fieldStrength: 62,
    prestige: 52,
  },
  {
    id: 'copa_super8',
    leagueId: 'nbb',
    name: { es: 'Copa Super 8', en: 'Super 8 Cup' },
    abbr: 'S8',
    fieldStrength: 64,
    prestige: 54,
  },
  {
    id: 'copa_princesa',
    leagueId: 'leb_oro',
    name: { es: 'Copa Princesa de Asturias', en: 'Copa Princesa' },
    abbr: 'CPA',
    fieldStrength: 58,
    prestige: 44,
  },
  {
    id: 'winter_showcase',
    leagueId: 'g_league',
    name: { es: 'Winter Showcase', en: 'Winter Showcase' },
    abbr: 'WS',
    // Every scout in the NBA is in the building, which is the whole point of it.
    fieldStrength: 66,
    prestige: 50,
  },
  {
    id: 'conference_tournament',
    leagueId: 'ncaa',
    name: { es: 'Torneo de conferencia', en: 'Conference Tournament' },
    abbr: 'CT',
    fieldStrength: 70,
    prestige: 54,
  },
  {
    id: 'nbl_blitz',
    leagueId: 'nbl',
    name: { es: 'NBL Blitz', en: 'NBL Blitz' },
    abbr: 'BLZ',
    fieldStrength: 68,
    prestige: 46,
  },
  {
    id: 'cba_allstar_cup',
    leagueId: 'cba',
    name: { es: 'Copa CBA', en: 'CBA Cup' },
    abbr: 'CUP',
    fieldStrength: 70,
    prestige: 48,
  },
]

const CUP_BY_LEAGUE = new Map(CUPS.map((cup) => [cup.leagueId, cup]))

/** The cup this league's clubs play for, if it has one. */
export function cupForLeague(leagueId: string): Cup | null {
  return CUP_BY_LEAGUE.get(leagueId) ?? null
}

export function getCup(id: string): Cup {
  const cup = CUPS.find((c) => c.id === id)
  if (!cup) throw new Error(`Unknown cup id: ${id}`)
  return cup
}
