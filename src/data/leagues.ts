/**
 * Leagues, with the dials that make a 25-point season in the LNB mean something
 * different from a 25-point season in the NBA.
 *
 * SWAPPABLE DATA LAYER — see README.
 */

import type { League } from '@/game/types'
import { teamsInLeague } from './teams'

interface LeagueSpec extends Omit<League, 'teamIds'> {}

const SPECS: LeagueSpec[] = [
  {
    id: 'nba',
    name: { es: 'NBA', en: 'NBA' },
    abbr: 'NBA',
    tier: 1,
    country: 'US',
    prestige: 100,
    gamesPerSeason: 82,
    salaryBand: [1_200_000, 52_000_000],
    hasMvp: true,
    hasAllStar: true,
  },
  {
    id: 'euroleague',
    name: { es: 'EuroLeague', en: 'EuroLeague' },
    abbr: 'EL',
    tier: 2,
    country: 'EU',
    prestige: 84,
    gamesPerSeason: 38,
    salaryBand: [250_000, 4_500_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'acb',
    name: { es: 'Liga ACB', en: 'Liga ACB (Spain)' },
    abbr: 'ACB',
    tier: 3,
    country: 'ES',
    prestige: 72,
    gamesPerSeason: 34,
    salaryBand: [90_000, 2_200_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'lega_a',
    name: { es: 'Lega Basket Serie A', en: 'Lega Basket Serie A (Italy)' },
    abbr: 'LBA',
    tier: 3,
    country: 'IT',
    prestige: 66,
    gamesPerSeason: 30,
    salaryBand: [80_000, 1_800_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'betclic',
    name: { es: 'Betclic Élite', en: 'Betclic Élite (France)' },
    abbr: 'LNB',
    tier: 3,
    country: 'FR',
    prestige: 66,
    gamesPerSeason: 34,
    salaryBand: [80_000, 1_800_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'aba',
    name: { es: 'Liga ABA', en: 'ABA League (Adriatic)' },
    abbr: 'ABA',
    tier: 3,
    country: 'RS',
    prestige: 64,
    gamesPerSeason: 26,
    salaryBand: [50_000, 1_100_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'lkl',
    name: { es: 'LKL (Lituania)', en: 'LKL (Lithuania)' },
    abbr: 'LKL',
    tier: 3,
    country: 'LT',
    prestige: 60,
    gamesPerSeason: 28,
    salaryBand: [45_000, 1_000_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'gbl',
    name: { es: 'Liga Griega', en: 'Greek Basket League' },
    abbr: 'GBL',
    tier: 3,
    country: 'GR',
    prestige: 65,
    gamesPerSeason: 26,
    salaryBand: [60_000, 1_600_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'bsl',
    name: { es: 'Liga Turca (BSL)', en: 'Turkish Super League' },
    abbr: 'BSL',
    tier: 3,
    country: 'TR',
    prestige: 65,
    gamesPerSeason: 30,
    salaryBand: [60_000, 1_900_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'lnb_ar',
    name: { es: 'Liga Nacional de Básquet', en: 'Liga Nacional (Argentina)' },
    abbr: 'LNB',
    tier: 3,
    country: 'AR',
    prestige: 52,
    gamesPerSeason: 40,
    salaryBand: [18_000, 320_000],
    hasMvp: true,
    hasAllStar: true,
  },
  {
    id: 'nbb',
    name: { es: 'NBB (Brasil)', en: 'NBB (Brazil)' },
    abbr: 'NBB',
    tier: 3,
    country: 'BR',
    prestige: 54,
    gamesPerSeason: 34,
    salaryBand: [20_000, 400_000],
    hasMvp: true,
    hasAllStar: true,
  },
  {
    id: 'cba',
    name: { es: 'CBA (China)', en: 'CBA (China)' },
    abbr: 'CBA',
    tier: 3,
    country: 'CN',
    prestige: 58,
    gamesPerSeason: 46,
    salaryBand: [120_000, 3_000_000],
    hasMvp: true,
    hasAllStar: true,
  },
  {
    id: 'nbl',
    name: { es: 'NBL (Australia)', en: 'NBL (Australia)' },
    abbr: 'NBL',
    tier: 3,
    country: 'AU',
    prestige: 60,
    gamesPerSeason: 28,
    salaryBand: [60_000, 900_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'ncaa',
    name: { es: 'NCAA (División I)', en: 'NCAA Division I' },
    abbr: 'NCAA',
    tier: 4,
    country: 'US',
    prestige: 62,
    gamesPerSeason: 32,
    // NIL money — not a salary, but it spends the same.
    salaryBand: [0, 3_500_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'g_league',
    name: { es: 'G League', en: 'G League' },
    abbr: 'GL',
    tier: 4,
    country: 'US',
    prestige: 46,
    gamesPerSeason: 50,
    salaryBand: [40_000, 500_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'leb_oro',
    name: { es: 'LEB Oro', en: 'LEB Oro (Spain, 2nd tier)' },
    abbr: 'LEB',
    tier: 4,
    country: 'ES',
    prestige: 40,
    gamesPerSeason: 34,
    salaryBand: [25_000, 180_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'pro_b',
    name: { es: 'Pro B (Francia)', en: 'Pro B (France, 2nd tier)' },
    abbr: 'ProB',
    tier: 4,
    country: 'FR',
    prestige: 38,
    gamesPerSeason: 34,
    salaryBand: [25_000, 160_000],
    hasMvp: true,
    hasAllStar: false,
  },
  {
    id: 'youth',
    name: { es: 'Inferiores', en: 'Youth basketball' },
    abbr: 'YTH',
    tier: 5,
    country: '—',
    prestige: 20,
    gamesPerSeason: 24,
    salaryBand: [0, 0],
    hasMvp: false,
    hasAllStar: false,
  },
]

export const LEAGUES: League[] = SPECS.map((spec) => ({
  ...spec,
  teamIds: teamsInLeague(spec.id).map((team) => team.id),
}))

const LEAGUE_INDEX = new Map(LEAGUES.map((league) => [league.id, league]))

export function getLeague(id: string): League {
  const league = LEAGUE_INDEX.get(id)
  if (!league) throw new Error(`Unknown league id: ${id}`)
  return league
}

export function leaguesAtTier(tier: number): League[] {
  return LEAGUES.filter((league) => league.tier === tier && league.id !== 'youth')
}

/**
 * How much harder it is to produce in this league. Multiplies raw production so
 * the same player scores 22 in the LNB and 14 in the NBA.
 */
export function difficultyOf(leagueId: string): number {
  const tier = getLeague(leagueId).tier
  switch (tier) {
    case 1:
      return 1.0
    case 2:
      return 0.86
    case 3:
      return 0.74
    case 4:
      return 0.66
    default:
      return 0.58
  }
}
