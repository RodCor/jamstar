/**
 * Real clubs, grouped by league.
 *
 * SWAPPABLE DATA LAYER — see README. Every proper noun in the game lives in this
 * file, `people.ts` and `countries.ts`. The engine only ever refers to teams by
 * `id`, so replacing these names with a licence-safe set requires no changes to
 * `src/game`.
 *
 * `strength` and `prestige` are gameplay dials (0-100), not editorial rankings.
 */

import type { Team } from '@/game/types'

/** Terser than repeating `name: { es: 'x', en: 'x' }` for names that don't translate. */
function t(
  id: string,
  name: string,
  abbr: string,
  leagueId: string,
  city: string,
  strength: number,
  prestige: number,
  colors: [string, string],
  esName?: string,
): Team {
  return {
    id,
    name: { es: esName ?? name, en: name },
    abbr,
    leagueId,
    city,
    strength,
    prestige,
    colors,
  }
}

export const NBA_TEAMS: Team[] = [
  t('bos', 'Boston Celtics', 'BOS', 'nba', 'Boston', 88, 95, ['#007A33', '#BA9653']),
  t('nyk', 'New York Knicks', 'NYK', 'nba', 'New York', 82, 88, ['#006BB6', '#F58426']),
  t('phi', 'Philadelphia 76ers', 'PHI', 'nba', 'Philadelphia', 78, 80, ['#006BB6', '#ED174C']),
  t('bkn', 'Brooklyn Nets', 'BKN', 'nba', 'Brooklyn', 62, 72, ['#000000', '#FFFFFF']),
  t('tor', 'Toronto Raptors', 'TOR', 'nba', 'Toronto', 64, 74, ['#CE1141', '#000000']),
  t('mil', 'Milwaukee Bucks', 'MIL', 'nba', 'Milwaukee', 80, 78, ['#00471B', '#EEE1C6']),
  t('cle', 'Cleveland Cavaliers', 'CLE', 'nba', 'Cleveland', 83, 74, ['#860038', '#FDBB30']),
  t('ind', 'Indiana Pacers', 'IND', 'nba', 'Indianapolis', 79, 68, ['#002D62', '#FDBB30']),
  t('chi', 'Chicago Bulls', 'CHI', 'nba', 'Chicago', 63, 90, ['#CE1141', '#000000']),
  t('det', 'Detroit Pistons', 'DET', 'nba', 'Detroit', 70, 66, ['#C8102E', '#1D42BA']),
  t('mia', 'Miami Heat', 'MIA', 'nba', 'Miami', 74, 86, ['#98002E', '#F9A01B']),
  t('orl', 'Orlando Magic', 'ORL', 'nba', 'Orlando', 76, 62, ['#0077C0', '#C4CED4']),
  t('atl', 'Atlanta Hawks', 'ATL', 'nba', 'Atlanta', 68, 62, ['#E03A3E', '#C1D32F']),
  t('cha', 'Charlotte Hornets', 'CHA', 'nba', 'Charlotte', 55, 58, ['#1D1160', '#00788C']),
  t('was', 'Washington Wizards', 'WAS', 'nba', 'Washington', 52, 58, ['#002B5C', '#E31837']),
  t('okc', 'Oklahoma City Thunder', 'OKC', 'nba', 'Oklahoma City', 92, 76, ['#007AC1', '#EF3B24']),
  t('den', 'Denver Nuggets', 'DEN', 'nba', 'Denver', 85, 80, ['#0E2240', '#FEC524']),
  t('min', 'Minnesota Timberwolves', 'MIN', 'nba', 'Minneapolis', 82, 66, ['#0C2340', '#236192']),
  t('dal', 'Dallas Mavericks', 'DAL', 'nba', 'Dallas', 78, 78, ['#00538C', '#B8C4CA']),
  t('mem', 'Memphis Grizzlies', 'MEM', 'nba', 'Memphis', 72, 64, ['#5D76A9', '#12173F']),
  t('lal', 'Los Angeles Lakers', 'LAL', 'nba', 'Los Angeles', 79, 98, ['#552583', '#FDB927']),
  t('lac', 'LA Clippers', 'LAC', 'nba', 'Los Angeles', 71, 70, ['#C8102E', '#1D428A']),
  t('gsw', 'Golden State Warriors', 'GSW', 'nba', 'San Francisco', 76, 94, ['#1D428A', '#FFC72C']),
  t('phx', 'Phoenix Suns', 'PHX', 'nba', 'Phoenix', 70, 72, ['#1D1160', '#E56020']),
  t('sac', 'Sacramento Kings', 'SAC', 'nba', 'Sacramento', 66, 60, ['#5A2D81', '#63727A']),
  t('hou', 'Houston Rockets', 'HOU', 'nba', 'Houston', 81, 74, ['#CE1141', '#000000']),
  t('sas', 'San Antonio Spurs', 'SAS', 'nba', 'San Antonio', 75, 88, ['#C4CED4', '#000000']),
  t('nop', 'New Orleans Pelicans', 'NOP', 'nba', 'New Orleans', 64, 58, ['#0C2340', '#C8102E']),
  t('por', 'Portland Trail Blazers', 'POR', 'nba', 'Portland', 56, 64, ['#E03A3E', '#000000']),
  t('uta', 'Utah Jazz', 'UTA', 'nba', 'Salt Lake City', 54, 62, ['#002B5C', '#F9A01B']),
]

export const EUROLEAGUE_TEAMS: Team[] = [
  t('el_rma', 'Real Madrid', 'RMA', 'euroleague', 'Madrid', 92, 96, ['#FFFFFF', '#FEBE10']),
  t('el_fcb', 'FC Barcelona', 'BAR', 'euroleague', 'Barcelona', 88, 94, ['#A50044', '#004D98']),
  t('el_pan', 'Panathinaikos', 'PAO', 'euroleague', 'Atenas', 89, 90, ['#007A33', '#FFFFFF']),
  t('el_oly', 'Olympiacos', 'OLY', 'euroleague', 'El Pireo', 88, 90, ['#C8102E', '#FFFFFF']),
  t('el_fen', 'Fenerbahçe', 'FEN', 'euroleague', 'Estambul', 87, 86, ['#FFED00', '#001F5B']),
  t('el_efs', 'Anadolu Efes', 'EFS', 'euroleague', 'Estambul', 82, 84, ['#003DA5', '#FFFFFF']),
  t('el_zal', 'Žalgiris Kaunas', 'ZAL', 'euroleague', 'Kaunas', 80, 82, ['#007A33', '#FFFFFF']),
  t('el_mac', 'Maccabi Tel Aviv', 'MTA', 'euroleague', 'Tel Aviv', 81, 86, ['#FFD500', '#003DA5']),
  t('el_mil', 'Olimpia Milano', 'MIL', 'euroleague', 'Milán', 80, 84, ['#C8102E', '#FFFFFF']),
  t('el_vir', 'Virtus Bologna', 'VIR', 'euroleague', 'Bolonia', 78, 78, ['#000000', '#FFFFFF']),
  t('el_asv', 'LDLC ASVEL', 'ASV', 'euroleague', 'Villeurbanne', 74, 72, ['#000000', '#C8102E']),
  t('el_mon', 'AS Monaco', 'MON', 'euroleague', 'Mónaco', 84, 76, ['#C8102E', '#FFFFFF']),
  t('el_par', 'Paris Basketball', 'PAR', 'euroleague', 'París', 82, 74, ['#000000', '#00A3E0']),
  t('el_bay', 'FC Bayern München', 'BAY', 'euroleague', 'Múnich', 78, 78, ['#DC052D', '#FFFFFF']),
  t('el_alb', 'ALBA Berlin', 'ALB', 'euroleague', 'Berlín', 72, 72, ['#FFD500', '#000000']),
  t('el_bas', 'Baskonia', 'BAS', 'euroleague', 'Vitoria-Gasteiz', 76, 80, ['#0033A0', '#FFFFFF']),
  t('el_czv', 'Crvena Zvezda', 'CZV', 'euroleague', 'Belgrado', 79, 80, ['#C8102E', '#FFFFFF']),
  t('el_ptz', 'Partizan', 'PTZ', 'euroleague', 'Belgrado', 80, 84, ['#000000', '#FFFFFF']),
]

export const ACB_TEAMS: Team[] = [
  t('acb_rma', 'Real Madrid', 'RMA', 'acb', 'Madrid', 92, 96, ['#FFFFFF', '#FEBE10']),
  t('acb_fcb', 'FC Barcelona', 'BAR', 'acb', 'Barcelona', 88, 94, ['#A50044', '#004D98']),
  t('acb_bas', 'Baskonia', 'BAS', 'acb', 'Vitoria-Gasteiz', 80, 82, ['#0033A0', '#FFFFFF']),
  t('acb_val', 'Valencia Basket', 'VAL', 'acb', 'Valencia', 82, 80, ['#FF6600', '#000000']),
  t('acb_uni', 'Unicaja', 'UNI', 'acb', 'Málaga', 81, 76, ['#00A650', '#4B2E83']),
  t('acb_gcn', 'Dreamland Gran Canaria', 'GCA', 'acb', 'Las Palmas', 76, 68, ['#FFCC00', '#005BAA']),
  t('acb_jov', 'Joventut Badalona', 'JOV', 'acb', 'Badalona', 74, 74, ['#00954C', '#000000']),
  t('acb_ten', 'La Laguna Tenerife', 'TEN', 'acb', 'Tenerife', 75, 66, ['#000000', '#FFFFFF']),
  t('acb_bre', 'Río Breogán', 'BRE', 'acb', 'Lugo', 64, 56, ['#C8102E', '#FFFFFF']),
  t('acb_mur', 'UCAM Murcia', 'MUR', 'acb', 'Murcia', 70, 60, ['#C8102E', '#000000']),
  t('acb_zar', 'Casademont Zaragoza', 'ZAR', 'acb', 'Zaragoza', 66, 58, ['#C8102E', '#FFFFFF']),
  t('acb_man', 'BAXI Manresa', 'MAN', 'acb', 'Manresa', 65, 58, ['#C8102E', '#000000']),
]

export const LNB_AR_TEAMS: Team[] = [
  t('lnb_bbc', 'Boca Juniors', 'BOC', 'lnb_ar', 'Buenos Aires', 78, 88, ['#0A2E6E', '#F1C40F']),
  t('lnb_ins', 'Instituto', 'INS', 'lnb_ar', 'Córdoba', 80, 76, ['#C8102E', '#FFFFFF']),
  t('lnb_qui', 'Quimsa', 'QUI', 'lnb_ar', 'Santiago del Estero', 82, 78, ['#008B5A', '#FFFFFF']),
  t('lnb_sma', 'San Lorenzo', 'SLO', 'lnb_ar', 'Buenos Aires', 76, 80, ['#0A2E6E', '#C8102E']),
  t('lnb_obr', 'Obras Basket', 'OBR', 'lnb_ar', 'Buenos Aires', 70, 74, ['#F1C40F', '#000000']),
  t('lnb_gim', 'Gimnasia de Comodoro', 'GIM', 'lnb_ar', 'Comodoro Rivadavia', 74, 70, ['#0A2E6E', '#FFFFFF']),
  t('lnb_pen', 'Peñarol', 'PEN', 'lnb_ar', 'Mar del Plata', 72, 76, ['#F1C40F', '#000000']),
  t('lnb_reg', 'Regatas Corrientes', 'REG', 'lnb_ar', 'Corrientes', 73, 72, ['#0A2E6E', '#C8102E']),
  t('lnb_ate', 'Atenas', 'ATE', 'lnb_ar', 'Córdoba', 68, 86, ['#008B5A', '#FFFFFF']),
  t('lnb_fer', 'Ferro Carril Oeste', 'FER', 'lnb_ar', 'Buenos Aires', 66, 72, ['#008B5A', '#FFFFFF']),
  t('lnb_ola', 'Olímpico', 'OLI', 'lnb_ar', 'La Banda', 69, 66, ['#000000', '#FFFFFF']),
  t('lnb_pla', 'Platense', 'PLA', 'lnb_ar', 'Buenos Aires', 62, 60, ['#8B1A1A', '#FFFFFF']),
]

export const NBB_TEAMS: Team[] = [
  t('nbb_fla', 'Flamengo', 'FLA', 'nbb', 'Río de Janeiro', 84, 88, ['#C8102E', '#000000']),
  t('nbb_fra', 'Franca', 'FRA', 'nbb', 'Franca', 86, 82, ['#0A2E6E', '#FFFFFF']),
  t('nbb_min', 'Minas Tênis Clube', 'MIN', 'nbb', 'Belo Horizonte', 80, 76, ['#000000', '#FFFFFF']),
  t('nbb_sao', 'São Paulo FC', 'SAO', 'nbb', 'São Paulo', 78, 80, ['#C8102E', '#000000']),
  t('nbb_pau', 'Paulistano', 'PAU', 'nbb', 'São Paulo', 74, 74, ['#C8102E', '#FFFFFF']),
  t('nbb_pat', 'Pato Basquete', 'PAT', 'nbb', 'Pato Branco', 68, 62, ['#0A8B3D', '#FFFFFF']),
  t('nbb_bau', 'Bauru Basket', 'BAU', 'nbb', 'Bauru', 72, 70, ['#C8102E', '#FFFFFF']),
  t('nbb_cor', 'Corinthians', 'COR', 'nbb', 'São Paulo', 70, 78, ['#000000', '#FFFFFF']),
]

export const LEGA_TEAMS: Team[] = [
  t('lega_mil', 'Olimpia Milano', 'MIL', 'lega_a', 'Milán', 86, 88, ['#C8102E', '#FFFFFF']),
  t('lega_vir', 'Virtus Bologna', 'VIR', 'lega_a', 'Bolonia', 84, 84, ['#000000', '#FFFFFF']),
  t('lega_ven', 'Reyer Venezia', 'VEN', 'lega_a', 'Venecia', 76, 70, ['#8B1A1A', '#FFFFFF']),
  t('lega_bre', 'Germani Brescia', 'BRE', 'lega_a', 'Brescia', 74, 64, ['#0A2E6E', '#FFFFFF']),
  t('lega_tra', 'Dolomiti Trento', 'TRE', 'lega_a', 'Trento', 72, 62, ['#000000', '#FFFFFF']),
  t('lega_tor', 'Reggiana', 'REG', 'lega_a', 'Reggio Emilia', 70, 62, ['#C8102E', '#FFFFFF']),
  t('lega_tri', 'Pallacanestro Trieste', 'TRI', 'lega_a', 'Trieste', 66, 58, ['#C8102E', '#FFFFFF']),
  t('lega_sas', 'Dinamo Sassari', 'SAS', 'lega_a', 'Sassari', 68, 64, ['#0A2E6E', '#FFFFFF']),
]

export const BETCLIC_TEAMS: Team[] = [
  t('fra_mon', 'AS Monaco', 'MON', 'betclic', 'Mónaco', 88, 82, ['#C8102E', '#FFFFFF']),
  t('fra_par', 'Paris Basketball', 'PAR', 'betclic', 'París', 86, 78, ['#000000', '#00A3E0']),
  t('fra_asv', 'LDLC ASVEL', 'ASV', 'betclic', 'Villeurbanne', 80, 80, ['#000000', '#C8102E']),
  t('fra_stb', 'JL Bourg', 'JLB', 'betclic', 'Bourg-en-Bresse', 74, 62, ['#0A2E6E', '#FFFFFF']),
  t('fra_cho', 'Cholet Basket', 'CHO', 'betclic', 'Cholet', 70, 66, ['#C8102E', '#FFFFFF']),
  t('fra_nan', 'Nanterre 92', 'NAN', 'betclic', 'Nanterre', 72, 64, ['#008B5A', '#FFFFFF']),
  t('fra_str', 'SIG Strasbourg', 'STR', 'betclic', 'Estrasburgo', 71, 68, ['#0A2E6E', '#FFFFFF']),
  t('fra_lem', 'Le Mans Sarthe', 'LMS', 'betclic', 'Le Mans', 73, 66, ['#C8102E', '#FFFFFF']),
]

export const ABA_TEAMS: Team[] = [
  t('aba_par', 'Partizan', 'PAR', 'aba', 'Belgrado', 86, 88, ['#000000', '#FFFFFF']),
  t('aba_czv', 'Crvena Zvezda', 'CZV', 'aba', 'Belgrado', 86, 88, ['#C8102E', '#FFFFFF']),
  t('aba_ceo', 'Cedevita Olimpija', 'CEO', 'aba', 'Liubliana', 74, 68, ['#F1C40F', '#008B5A']),
  t('aba_bud', 'Budućnost', 'BUD', 'aba', 'Podgorica', 76, 72, ['#0A2E6E', '#FFFFFF']),
  t('aba_iga', 'Igokea', 'IGO', 'aba', 'Laktaši', 68, 58, ['#C8102E', '#FFFFFF']),
  t('aba_spl', 'Split', 'SPL', 'aba', 'Split', 66, 66, ['#FFFFFF', '#0A2E6E']),
  t('aba_zad', 'Zadar', 'ZAD', 'aba', 'Zadar', 67, 70, ['#0A2E6E', '#FFFFFF']),
  t('aba_meg', 'Mega Basket', 'MEG', 'aba', 'Belgrado', 70, 62, ['#C8102E', '#0A2E6E']),
]

export const LKL_TEAMS: Team[] = [
  t('lkl_zal', 'Žalgiris Kaunas', 'ZAL', 'lkl', 'Kaunas', 88, 90, ['#008B5A', '#FFFFFF']),
  t('lkl_ryt', 'Rytas Vilnius', 'RYT', 'lkl', 'Vilna', 78, 76, ['#C8102E', '#F1C40F']),
  t('lkl_lie', 'Lietkabelis', 'LIE', 'lkl', 'Panevėžys', 72, 64, ['#0A2E6E', '#F1C40F']),
  t('lkl_nep', 'Neptūnas', 'NEP', 'lkl', 'Klaipėda', 68, 62, ['#0A2E6E', '#FFFFFF']),
  t('lkl_sir', 'Šiauliai', 'SIA', 'lkl', 'Šiauliai', 62, 56, ['#C8102E', '#FFFFFF']),
]

export const GBL_TEAMS: Team[] = [
  t('gbl_pan', 'Panathinaikos', 'PAO', 'gbl', 'Atenas', 90, 92, ['#008B5A', '#FFFFFF']),
  t('gbl_oly', 'Olympiacos', 'OLY', 'gbl', 'El Pireo', 89, 92, ['#C8102E', '#FFFFFF']),
  t('gbl_ath', 'AEK Atenas', 'AEK', 'gbl', 'Atenas', 74, 76, ['#F1C40F', '#000000']),
  t('gbl_par', 'PAOK', 'PAOK', 'gbl', 'Salónica', 70, 70, ['#000000', '#FFFFFF']),
  t('gbl_per', 'Peristeri', 'PER', 'gbl', 'Atenas', 66, 58, ['#C8102E', '#FFFFFF']),
]

export const BSL_TEAMS: Team[] = [
  t('bsl_fen', 'Fenerbahçe', 'FEN', 'bsl', 'Estambul', 88, 88, ['#FFED00', '#001F5B']),
  t('bsl_efs', 'Anadolu Efes', 'EFS', 'bsl', 'Estambul', 86, 86, ['#003DA5', '#FFFFFF']),
  t('bsl_gal', 'Galatasaray', 'GAL', 'bsl', 'Estambul', 76, 80, ['#C8102E', '#F1C40F']),
  t('bsl_bes', 'Beşiktaş', 'BES', 'bsl', 'Estambul', 72, 76, ['#000000', '#FFFFFF']),
  t('bsl_tof', 'Tofaş', 'TOF', 'bsl', 'Bursa', 70, 64, ['#0A2E6E', '#FFFFFF']),
]

export const CBA_TEAMS: Team[] = [
  t('cba_lia', 'Liaoning Flying Leopards', 'LIA', 'cba', 'Shenyang', 84, 78, ['#C8102E', '#FFFFFF']),
  t('cba_zhe', 'Zhejiang Golden Bulls', 'ZHE', 'cba', 'Hangzhou', 80, 72, ['#F1C40F', '#000000']),
  t('cba_gua', 'Guangdong Southern Tigers', 'GUA', 'cba', 'Dongguan', 82, 88, ['#C8102E', '#F1C40F']),
  t('cba_bei', 'Beijing Ducks', 'BEI', 'cba', 'Pekín', 76, 78, ['#C8102E', '#FFFFFF']),
  t('cba_sha', 'Shanghai Sharks', 'SHA', 'cba', 'Shanghái', 72, 74, ['#0A2E6E', '#FFFFFF']),
  t('cba_xin', 'Xinjiang Flying Tigers', 'XIN', 'cba', 'Ürümqi', 78, 70, ['#0A2E6E', '#C8102E']),
]

export const NBL_TEAMS: Team[] = [
  t('nbl_syd', 'Sydney Kings', 'SYD', 'nbl', 'Sídney', 80, 78, ['#5A2D81', '#F1C40F']),
  t('nbl_mel', 'Melbourne United', 'MEL', 'nbl', 'Melbourne', 82, 78, ['#0A2E6E', '#FFFFFF']),
  t('nbl_per', 'Perth Wildcats', 'PER', 'nbl', 'Perth', 79, 84, ['#C8102E', '#000000']),
  t('nbl_bri', 'Brisbane Bullets', 'BRI', 'nbl', 'Brisbane', 70, 66, ['#C8102E', '#F1C40F']),
  t('nbl_ill', 'Illawarra Hawks', 'ILL', 'nbl', 'Wollongong', 72, 62, ['#C8102E', '#FFFFFF']),
  t('nbl_nzb', 'New Zealand Breakers', 'NZB', 'nbl', 'Auckland', 74, 68, ['#000000', '#FFFFFF']),
]

export const NCAA_TEAMS: Team[] = [
  t('ncaa_duk', 'Duke Blue Devils', 'DUKE', 'ncaa', 'Durham', 90, 96, ['#003087', '#FFFFFF']),
  t('ncaa_unc', 'North Carolina Tar Heels', 'UNC', 'ncaa', 'Chapel Hill', 86, 94, ['#7BAFD4', '#FFFFFF']),
  t('ncaa_kan', 'Kansas Jayhawks', 'KU', 'ncaa', 'Lawrence', 87, 92, ['#0051BA', '#E8000D']),
  t('ncaa_ken', 'Kentucky Wildcats', 'UK', 'ncaa', 'Lexington', 86, 94, ['#0033A0', '#FFFFFF']),
  t('ncaa_gon', 'Gonzaga Bulldogs', 'GONZ', 'ncaa', 'Spokane', 84, 82, ['#041E42', '#C8102E']),
  t('ncaa_uconn', 'UConn Huskies', 'CONN', 'ncaa', 'Storrs', 89, 88, ['#000E2F', '#FFFFFF']),
  t('ncaa_ariz', 'Arizona Wildcats', 'ARIZ', 'ncaa', 'Tucson', 83, 82, ['#003366', '#CC0033']),
  t('ncaa_bay', 'Baylor Bears', 'BAY', 'ncaa', 'Waco', 80, 74, ['#154734', '#FFB81C']),
  t('ncaa_hou', 'Houston Cougars', 'HOU', 'ncaa', 'Houston', 85, 78, ['#C8102E', '#FFFFFF']),
  t('ncaa_mich', 'Michigan State Spartans', 'MSU', 'ncaa', 'East Lansing', 81, 84, ['#18453B', '#FFFFFF']),
  t('ncaa_ucla', 'UCLA Bruins', 'UCLA', 'ncaa', 'Los Angeles', 79, 90, ['#2D68C4', '#F2A900']),
  t('ncaa_ala', 'Alabama Crimson Tide', 'ALA', 'ncaa', 'Tuscaloosa', 82, 74, ['#9E1B32', '#FFFFFF']),
]

/** Second divisions and development leagues, where careers stall or get rebuilt. */
export const DEV_TEAMS: Team[] = [
  t('leb_ovi', 'Unión Financiera Oviedo', 'OVI', 'leb_oro', 'Oviedo', 58, 44, ['#0A2E6E', '#FFFFFF']),
  t('leb_bur', 'San Pablo Burgos', 'BUR', 'leb_oro', 'Burgos', 62, 50, ['#0A2E6E', '#F1C40F']),
  t('leb_alm', 'Cartagena', 'CAR', 'leb_oro', 'Cartagena', 56, 40, ['#C8102E', '#FFFFFF']),
  t('gl_ign', 'G League Ignite', 'IGN', 'g_league', 'Henderson', 60, 56, ['#000000', '#F1C40F']),
  t('gl_ral', 'Raptors 905', '905', 'g_league', 'Mississauga', 58, 46, ['#CE1141', '#000000']),
  t('gl_scw', 'Santa Cruz Warriors', 'SCW', 'g_league', 'Santa Cruz', 57, 46, ['#1D428A', '#FFC72C']),
  t('prob_evr', 'ADA Blois', 'BLO', 'pro_b', 'Blois', 55, 38, ['#0A2E6E', '#FFFFFF']),
  t('prob_ort', 'Orléans Loiret', 'ORL', 'pro_b', 'Orleans', 56, 40, ['#C8102E', '#FFFFFF']),
]

/**
 * Where everyone starts, whatever country they are from.
 *
 * One entry rather than a per-country academy: the country already decides the
 * ladder above this, and a single recognisable starting point reads better than
 * ten differently-named placeholders for the same thing.
 */
export const YOUTH_TEAMS: Team[] = [
  t(
    'youth_hs',
    'High School Basketball',
    'HS',
    'youth',
    '—',
    42,
    32,
    ['#c8873f', '#0a0a0f'],
    'Básquet de secundaria',
  ),
]

export const ALL_TEAMS: Team[] = [
  ...NBA_TEAMS,
  ...EUROLEAGUE_TEAMS,
  ...ACB_TEAMS,
  ...LNB_AR_TEAMS,
  ...NBB_TEAMS,
  ...LEGA_TEAMS,
  ...BETCLIC_TEAMS,
  ...ABA_TEAMS,
  ...LKL_TEAMS,
  ...GBL_TEAMS,
  ...BSL_TEAMS,
  ...CBA_TEAMS,
  ...NBL_TEAMS,
  ...NCAA_TEAMS,
  ...DEV_TEAMS,
  ...YOUTH_TEAMS,
]

const TEAM_INDEX = new Map(ALL_TEAMS.map((team) => [team.id, team]))

export function getTeam(id: string): Team {
  const team = TEAM_INDEX.get(id)
  if (!team) throw new Error(`Unknown team id: ${id}`)
  return team
}

export function teamsInLeague(leagueId: string): Team[] {
  return ALL_TEAMS.filter((team) => team.leagueId === leagueId)
}
