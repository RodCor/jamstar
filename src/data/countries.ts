/**
 * Origin countries and the ladder each one puts you on.
 *
 * This is what makes "select your origin country" a strategic choice rather than
 * a flag: a US player goes High School → AAU → NCAA → Draft, an Argentine goes
 * cantera → LNB → Europe → NBA, a Serbian goes academy → ABA → EuroLeague → NBA.
 *
 * SWAPPABLE DATA LAYER — see README.
 */

import type { Country, CareerPathId } from '@/game/types'

export const COUNTRIES: Country[] = [
  {
    code: 'AR',
    name: { es: 'Argentina', en: 'Argentina' },
    flag: '🇦🇷',
    strength: 72,
    path: 'latam_club',
    domesticLeagueIds: ['lnb_ar'],
    nationalTeam: { es: 'Selección Argentina', en: 'Argentina' },
    continental: 'americas',
    namePoolId: 'hispanic',
  },
  {
    code: 'US',
    name: { es: 'Estados Unidos', en: 'United States' },
    flag: '🇺🇸',
    strength: 100,
    path: 'usa_ncaa',
    domesticLeagueIds: ['ncaa', 'g_league'],
    nationalTeam: { es: 'Selección de EE. UU.', en: 'United States' },
    continental: 'americas',
    namePoolId: 'american',
  },
  {
    code: 'ES',
    name: { es: 'España', en: 'Spain' },
    flag: '🇪🇸',
    strength: 88,
    path: 'euro_academy',
    domesticLeagueIds: ['acb', 'leb_oro'],
    nationalTeam: { es: 'Selección Española', en: 'Spain' },
    continental: 'europe',
    namePoolId: 'hispanic',
  },
  {
    code: 'FR',
    name: { es: 'Francia', en: 'France' },
    flag: '🇫🇷',
    strength: 90,
    path: 'euro_academy',
    domesticLeagueIds: ['betclic', 'pro_b'],
    nationalTeam: { es: 'Selección Francesa', en: 'France' },
    continental: 'europe',
    namePoolId: 'french',
  },
  {
    code: 'RS',
    name: { es: 'Serbia', en: 'Serbia' },
    flag: '🇷🇸',
    strength: 92,
    path: 'euro_academy',
    domesticLeagueIds: ['aba'],
    nationalTeam: { es: 'Selección Serbia', en: 'Serbia' },
    continental: 'europe',
    namePoolId: 'balkan',
  },
  {
    code: 'LT',
    name: { es: 'Lituania', en: 'Lithuania' },
    flag: '🇱🇹',
    strength: 82,
    path: 'euro_academy',
    domesticLeagueIds: ['lkl'],
    nationalTeam: { es: 'Selección Lituana', en: 'Lithuania' },
    continental: 'europe',
    namePoolId: 'baltic',
  },
  {
    code: 'GR',
    name: { es: 'Grecia', en: 'Greece' },
    flag: '🇬🇷',
    strength: 80,
    path: 'euro_academy',
    domesticLeagueIds: ['gbl'],
    nationalTeam: { es: 'Selección Griega', en: 'Greece' },
    continental: 'europe',
    namePoolId: 'greek',
  },
  {
    code: 'IT',
    name: { es: 'Italia', en: 'Italy' },
    flag: '🇮🇹',
    strength: 76,
    path: 'euro_academy',
    domesticLeagueIds: ['lega_a'],
    nationalTeam: { es: 'Selección Italiana', en: 'Italy' },
    continental: 'europe',
    namePoolId: 'italian',
  },
  {
    code: 'TR',
    name: { es: 'Turquía', en: 'Türkiye' },
    flag: '🇹🇷',
    strength: 74,
    path: 'euro_academy',
    domesticLeagueIds: ['bsl'],
    nationalTeam: { es: 'Selección Turca', en: 'Türkiye' },
    continental: 'europe',
    namePoolId: 'turkish',
  },
  {
    code: 'BR',
    name: { es: 'Brasil', en: 'Brazil' },
    flag: '🇧🇷',
    strength: 70,
    path: 'latam_club',
    domesticLeagueIds: ['nbb'],
    nationalTeam: { es: 'Selección Brasileña', en: 'Brazil' },
    continental: 'americas',
    namePoolId: 'brazilian',
  },
  {
    code: 'CA',
    name: { es: 'Canadá', en: 'Canada' },
    flag: '🇨🇦',
    strength: 86,
    path: 'usa_ncaa',
    domesticLeagueIds: ['ncaa'],
    nationalTeam: { es: 'Selección Canadiense', en: 'Canada' },
    continental: 'americas',
    namePoolId: 'american',
  },
  {
    code: 'AU',
    name: { es: 'Australia', en: 'Australia' },
    flag: '🇦🇺',
    strength: 84,
    path: 'oceania_nbl',
    domesticLeagueIds: ['nbl'],
    nationalTeam: { es: 'Selección Australiana', en: 'Australia' },
    continental: 'oceania',
    namePoolId: 'american',
  },
  {
    code: 'NG',
    name: { es: 'Nigeria', en: 'Nigeria' },
    flag: '🇳🇬',
    strength: 62,
    path: 'africa_academy',
    domesticLeagueIds: [],
    nationalTeam: { es: 'Selección Nigeriana', en: 'Nigeria' },
    continental: 'africa',
    namePoolId: 'african',
  },
  {
    code: 'SN',
    name: { es: 'Senegal', en: 'Senegal' },
    flag: '🇸🇳',
    strength: 58,
    path: 'africa_academy',
    domesticLeagueIds: [],
    nationalTeam: { es: 'Selección Senegalesa', en: 'Senegal' },
    continental: 'africa',
    namePoolId: 'african',
  },
  {
    code: 'CM',
    name: { es: 'Camerún', en: 'Cameroon' },
    flag: '🇨🇲',
    strength: 54,
    path: 'africa_academy',
    domesticLeagueIds: [],
    nationalTeam: { es: 'Selección Camerunesa', en: 'Cameroon' },
    continental: 'africa',
    namePoolId: 'african',
  },
  {
    code: 'CN',
    name: { es: 'China', en: 'China' },
    flag: '🇨🇳',
    strength: 58,
    path: 'asia_domestic',
    domesticLeagueIds: ['cba'],
    nationalTeam: { es: 'Selección China', en: 'China' },
    continental: 'asia',
    namePoolId: 'chinese',
  },
  {
    code: 'DE',
    name: { es: 'Alemania', en: 'Germany' },
    flag: '🇩🇪',
    strength: 88,
    path: 'euro_academy',
    domesticLeagueIds: [],
    nationalTeam: { es: 'Selección Alemana', en: 'Germany' },
    continental: 'europe',
    namePoolId: 'german',
  },
  {
    code: 'SI',
    name: { es: 'Eslovenia', en: 'Slovenia' },
    flag: '🇸🇮',
    strength: 78,
    path: 'euro_academy',
    domesticLeagueIds: ['aba'],
    nationalTeam: { es: 'Selección Eslovena', en: 'Slovenia' },
    continental: 'europe',
    namePoolId: 'balkan',
  },
  {
    code: 'DO',
    name: { es: 'República Dominicana', en: 'Dominican Republic' },
    flag: '🇩🇴',
    strength: 56,
    path: 'latam_club',
    domesticLeagueIds: [],
    nationalTeam: { es: 'Selección Dominicana', en: 'Dominican Republic' },
    continental: 'americas',
    namePoolId: 'hispanic',
  },
  {
    code: 'MX',
    name: { es: 'México', en: 'Mexico' },
    flag: '🇲🇽',
    strength: 50,
    path: 'latam_club',
    domesticLeagueIds: [],
    nationalTeam: { es: 'Selección Mexicana', en: 'Mexico' },
    continental: 'americas',
    namePoolId: 'hispanic',
  },
  {
    code: 'UY',
    name: { es: 'Uruguay', en: 'Uruguay' },
    flag: '🇺🇾',
    strength: 52,
    path: 'latam_club',
    domesticLeagueIds: [],
    nationalTeam: { es: 'Selección Uruguaya', en: 'Uruguay' },
    continental: 'americas',
    namePoolId: 'hispanic',
  },
]

const COUNTRY_INDEX = new Map(COUNTRIES.map((country) => [country.code, country]))

export function getCountry(code: string): Country {
  const country = COUNTRY_INDEX.get(code)
  if (!country) throw new Error(`Unknown country code: ${code}`)
  return country
}

/**
 * Flags for countries that appear only as a rival's or teammate's origin and are
 * never playable, so `REAL_STARS` can reference them without needing a full
 * `Country` entry.
 */
const EXTRA_FLAGS: Record<string, string> = {
  IL: '🇮🇱',
  ME: '🇲🇪',
  JP: '🇯🇵',
  SS: '🇸🇸',
  GB: '🇬🇧',
  PR: '🇵🇷',
  VE: '🇻🇪',
}

/** Flag for any country code, playable or not. Never throws. */
export function flagFor(code: string): string {
  return COUNTRY_INDEX.get(code)?.flag ?? EXTRA_FLAGS[code] ?? '🏳️'
}

/** The youth team a player from this country starts at. */
export function youthTeamFor(path: CareerPathId, countryCode: string): string {
  if (countryCode === 'AR') return 'youth_ar'
  if (countryCode === 'ES') return 'youth_es'
  if (countryCode === 'FR') return 'youth_fr'
  if (countryCode === 'BR') return 'youth_br'
  if (countryCode === 'CN') return 'youth_cn'
  switch (path) {
    case 'usa_ncaa':
      return 'youth_us'
    case 'euro_academy':
      return 'youth_eu'
    case 'africa_academy':
      return 'youth_af'
    case 'oceania_nbl':
      return 'youth_au'
    case 'latam_club':
      return 'youth_ar'
    case 'asia_domestic':
      return 'youth_cn'
    default:
      return 'youth_gen'
  }
}

/**
 * The league a player from this country breaks into as a young pro, before any
 * move abroad. Falls back through the path when the country has no league of
 * its own in the data set.
 */
export function domesticLeagueFor(country: Country): string {
  if (country.domesticLeagueIds.length > 0) return country.domesticLeagueIds[0]
  switch (country.path) {
    case 'usa_ncaa':
      return 'ncaa'
    case 'africa_academy':
      return 'lega_a'
    case 'latam_club':
      return 'nbb'
    case 'asia_domestic':
      return 'cba'
    case 'oceania_nbl':
      return 'nbl'
    default:
      return 'aba'
  }
}

/** Continental championship name, used for national-team awards and headlines. */
export function continentalCup(country: Country): { es: string; en: string } {
  switch (country.continental) {
    case 'americas':
      return { es: 'AmeriCup', en: 'AmeriCup' }
    case 'europe':
      return { es: 'EuroBasket', en: 'EuroBasket' }
    case 'africa':
      return { es: 'AfroBasket', en: 'AfroBasket' }
    case 'asia':
      return { es: 'Copa de Asia', en: 'FIBA Asia Cup' }
    case 'oceania':
      return { es: 'Copa de Asia', en: 'FIBA Asia Cup' }
  }
}
