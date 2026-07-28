/**
 * People: the real players you measure yourself against, and the name pools used
 * to generate everyone else (teammates, coaches, journeyman rivals).
 *
 * SWAPPABLE DATA LAYER — see README. `REAL_STARS` is the only place real player
 * names appear. Replacing this array with generated names yields a fully
 * licence-safe build with no changes to `src/game`.
 */

import type { Position } from '@/game/types'

export interface RealStar {
  name: string
  countryCode: string
  position: Position
  /** 0-100 ceiling. Drives how hard this rival is to beat over a career. */
  ceiling: number
}

/**
 * Rival candidates. Chosen at creation to roughly match your position and
 * origin, so the rivalry has a reason to exist.
 */
export const REAL_STARS: RealStar[] = [
  // Guards
  { name: 'Luka Dončić', countryCode: 'SI', position: 'PG', ceiling: 96 },
  { name: 'Shai Gilgeous-Alexander', countryCode: 'CA', position: 'PG', ceiling: 97 },
  { name: 'Stephen Curry', countryCode: 'US', position: 'PG', ceiling: 97 },
  { name: 'Cade Cunningham', countryCode: 'US', position: 'PG', ceiling: 90 },
  { name: 'Tyrese Haliburton', countryCode: 'US', position: 'PG', ceiling: 89 },
  { name: 'Ja Morant', countryCode: 'US', position: 'PG', ceiling: 88 },
  { name: 'Facundo Campazzo', countryCode: 'AR', position: 'PG', ceiling: 76 },
  { name: 'Ricky Rubio', countryCode: 'ES', position: 'PG', ceiling: 80 },
  { name: 'Kevin Punter', countryCode: 'US', position: 'SG', ceiling: 78 },
  { name: 'Anthony Edwards', countryCode: 'US', position: 'SG', ceiling: 94 },
  { name: 'Devin Booker', countryCode: 'US', position: 'SG', ceiling: 92 },
  { name: 'Donovan Mitchell', countryCode: 'US', position: 'SG', ceiling: 92 },
  { name: 'Jalen Green', countryCode: 'US', position: 'SG', ceiling: 86 },
  { name: 'Nickeil Alexander-Walker', countryCode: 'CA', position: 'SG', ceiling: 80 },
  { name: 'Carlik Jones', countryCode: 'SS', position: 'PG', ceiling: 76 },
  { name: 'Théo Maledon', countryCode: 'FR', position: 'PG', ceiling: 78 },
  { name: 'Vasilije Micić', countryCode: 'RS', position: 'PG', ceiling: 84 },
  { name: 'Kostas Sloukas', countryCode: 'GR', position: 'PG', ceiling: 82 },

  // Wings
  { name: 'Jayson Tatum', countryCode: 'US', position: 'SF', ceiling: 95 },
  { name: 'Kevin Durant', countryCode: 'US', position: 'SF', ceiling: 97 },
  { name: 'Jaylen Brown', countryCode: 'US', position: 'SF', ceiling: 91 },
  { name: 'Scottie Barnes', countryCode: 'US', position: 'SF', ceiling: 88 },
  { name: 'Franz Wagner', countryCode: 'DE', position: 'SF', ceiling: 89 },
  { name: 'Paolo Banchero', countryCode: 'US', position: 'PF', ceiling: 91 },
  { name: 'Amen Thompson', countryCode: 'US', position: 'SF', ceiling: 90 },
  { name: 'Zaccharie Risacher', countryCode: 'FR', position: 'SF', ceiling: 86 },
  { name: 'Deni Avdija', countryCode: 'IL', position: 'SF', ceiling: 85 },
  { name: 'Willy Hernangómez', countryCode: 'ES', position: 'PF', ceiling: 78 },
  { name: 'Juancho Hernangómez', countryCode: 'ES', position: 'SF', ceiling: 74 },
  { name: 'Gabriel Deck', countryCode: 'AR', position: 'SF', ceiling: 78 },
  { name: 'Mathias Lessort', countryCode: 'FR', position: 'PF', ceiling: 82 },
  { name: 'Nikola Mirotić', countryCode: 'ES', position: 'PF', ceiling: 84 },

  // Bigs
  { name: 'Nikola Jokić', countryCode: 'RS', position: 'C', ceiling: 99 },
  { name: 'Victor Wembanyama', countryCode: 'FR', position: 'C', ceiling: 98 },
  { name: 'Giannis Antetokounmpo', countryCode: 'GR', position: 'PF', ceiling: 97 },
  { name: 'Joel Embiid', countryCode: 'CM', position: 'C', ceiling: 95 },
  { name: 'Anthony Davis', countryCode: 'US', position: 'PF', ceiling: 93 },
  { name: 'Chet Holmgren', countryCode: 'US', position: 'C', ceiling: 89 },
  { name: 'Alperen Şengün', countryCode: 'TR', position: 'C', ceiling: 90 },
  { name: 'Jonas Valančiūnas', countryCode: 'LT', position: 'C', ceiling: 82 },
  { name: 'Domantas Sabonis', countryCode: 'LT', position: 'PF', ceiling: 89 },
  { name: 'Walker Kessler', countryCode: 'US', position: 'C', ceiling: 84 },
  { name: 'Rudy Gobert', countryCode: 'FR', position: 'C', ceiling: 87 },
  { name: 'Nikola Vučević', countryCode: 'ME', position: 'C', ceiling: 84 },
  { name: 'Bruno Caboclo', countryCode: 'BR', position: 'PF', ceiling: 74 },
  { name: 'Yuta Watanabe', countryCode: 'JP', position: 'SF', ceiling: 72 },
]

/** Given/family name pools for everyone the sim invents on the fly. */
export const NAME_POOLS: Record<string, { first: string[]; last: string[] }> = {
  hispanic: {
    first: [
      'Facundo', 'Nicolás', 'Santiago', 'Matías', 'Lucas', 'Juan', 'Gonzalo', 'Tomás',
      'Agustín', 'Franco', 'Bruno', 'Máximo', 'Álvaro', 'Sergio', 'Carlos', 'Diego',
      'Pablo', 'Javier', 'Rodrigo', 'Emiliano',
    ],
    last: [
      'Campazzo', 'Vildoza', 'Laprovíttola', 'Garino', 'Brussino', 'Delfino', 'Scola',
      'Nocioni', 'Prigioni', 'Fernández', 'González', 'Rodríguez', 'Martínez', 'López',
      'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Herrera', 'Aguilar',
    ],
  },
  american: {
    first: [
      'Marcus', 'Tyrese', 'Jalen', 'DeAndre', 'Cameron', 'Malik', 'Trey', 'Darius',
      'Jaylen', 'Xavier', 'Elijah', 'Isaiah', 'Quentin', 'Devin', 'Bryce', 'Keegan',
      'Amari', 'Zion', 'Terrance', 'Julian',
    ],
    last: [
      'Johnson', 'Williams', 'Carter', 'Robinson', 'Mitchell', 'Harris', 'Coleman',
      'Bradley', 'Thompson', 'Jackson', 'Foster', 'Reed', 'Sanders', 'Griffin',
      'Powell', 'Bryant', 'Hayes', 'Brooks', 'Nash', 'Wallace',
    ],
  },
  french: {
    first: [
      'Théo', 'Killian', 'Nadir', 'Sylvain', 'Mathias', 'Ousmane', 'Élie', 'Adrien',
      'Bilal', 'Yoan', 'Alexandre', 'Nicolas', 'Rayan', 'Enzo', 'Melvin', 'Zaccharie',
    ],
    last: [
      'Maledon', 'Coulibaly', 'Diallo', 'Lessort', 'Poirier', 'Fournier', 'Ntilikina',
      'Yabusele', 'Okobo', 'Cordinier', 'Hoard', 'Jaiteh', 'Luwawu', 'Bertrand',
      'Moreau', 'Girard',
    ],
  },
  balkan: {
    first: [
      'Nikola', 'Vasilije', 'Marko', 'Aleksa', 'Stefan', 'Filip', 'Luka', 'Ognjen',
      'Bogdan', 'Nemanja', 'Vlatko', 'Dragan', 'Miloš', 'Uroš', 'Zoran', 'Dejan',
    ],
    last: [
      'Jokić', 'Micić', 'Bogdanović', 'Petrušev', 'Avramović', 'Nedović', 'Marjanović',
      'Đorđević', 'Jovanović', 'Todorović', 'Milutinov', 'Simanić', 'Vuković',
      'Radonjić', 'Popović', 'Ilić',
    ],
  },
  baltic: {
    first: [
      'Jonas', 'Domantas', 'Rokas', 'Mindaugas', 'Arnas', 'Marius', 'Tadas', 'Ignas',
      'Deividas', 'Laurynas', 'Gytis', 'Paulius',
    ],
    last: [
      'Valančiūnas', 'Sabonis', 'Jokubaitis', 'Giedraitis', 'Butkevičius', 'Normantas',
      'Sedekerskis', 'Brazdeikis', 'Kariniauskas', 'Masiulis', 'Lukošiūnas', 'Radzevičius',
    ],
  },
  greek: {
    first: [
      'Giannis', 'Kostas', 'Nikos', 'Dimitris', 'Vasilis', 'Georgios', 'Panagiotis',
      'Thanasis', 'Alexandros', 'Ioannis', 'Michalis', 'Christos',
    ],
    last: [
      'Antetokounmpo', 'Sloukas', 'Papanikolaou', 'Calathes', 'Papagiannis', 'Larentzakis',
      'Mitoglou', 'Katsivelis', 'Toliopoulos', 'Dorsey', 'Kalaitzakis', 'Agravanis',
    ],
  },
  italian: {
    first: [
      'Simone', 'Nicolò', 'Marco', 'Alessandro', 'Danilo', 'Stefano', 'Luigi', 'Matteo',
      'Giampaolo', 'Achille', 'Amedeo', 'Riccardo',
    ],
    last: [
      'Fontecchio', 'Melli', 'Datome', 'Gallinari', 'Polonara', 'Tonut', 'Spissu',
      'Ricci', 'Pajola', 'Procida', 'Diouf', 'Severini',
    ],
  },
  turkish: {
    first: [
      'Alperen', 'Cedi', 'Furkan', 'Şehmus', 'Ercan', 'Berkan', 'Onuralp', 'Kenan',
      'Sertaç', 'Melih', 'Buğrahan', 'Emircan',
    ],
    last: [
      'Şengün', 'Osman', 'Korkmaz', 'Hazer', 'Osmani', 'Veseli', 'Sipahi', 'Şanlı',
      'Yılmaz', 'Mahmutoğlu', 'Bitim', 'Arslan',
    ],
  },
  brazilian: {
    first: [
      'Bruno', 'Raulzinho', 'Marcelinho', 'Yago', 'Gui', 'Lucas', 'Vitor', 'Léo',
      'Rafael', 'Alexey', 'Georginho', 'Cristiano',
    ],
    last: [
      'Caboclo', 'Neto', 'Huertas', 'Santos', 'Deck', 'Dias', 'Benite', 'Meindl',
      'Hettsheimeir', 'Garcia', 'Machado', 'Felício',
    ],
  },
  african: {
    first: [
      'Ousmane', 'Cheikh', 'Ibrahima', 'Amadou', 'Chinedu', 'Emeka', 'Tunde', 'Kelechi',
      'Youssou', 'Mamadou', 'Serge', 'Pascal',
    ],
    last: [
      'Ndiaye', 'Diop', 'Fall', 'Traoré', 'Okafor', 'Nwora', 'Achiuwa', 'Adebayo',
      'Diarra', 'Cissé', 'Ibaka', 'Siakam',
    ],
  },
  chinese: {
    first: [
      'Zhou', 'Guo', 'Wang', 'Zhao', 'Hu', 'Wu', 'Sun', 'Yang', 'Zhang', 'Li',
      'Chen', 'Liu',
    ],
    last: [
      'Qi', 'Ailun', 'Zhelin', 'Jiwei', 'Mingxuan', 'Qian', 'Minghui', 'Hansen',
      'Zhenlin', 'Yuanyu', 'Linghao', 'Chuanxing',
    ],
  },
  german: {
    first: [
      'Franz', 'Moritz', 'Dennis', 'Daniel', 'Maodo', 'Johannes', 'Andreas', 'Niels',
      'Justus', 'David', 'Isaac', 'Leon',
    ],
    last: [
      'Wagner', 'Schröder', 'Theis', 'Lô', 'Voigtmann', 'Obst', 'Thiemann', 'Giffey',
      'Hollatz', 'Krämer', 'Bonga', 'Kleber',
    ],
  },
}

/** Head coach names, used for coach-conflict and mentorship events. */
export const COACH_NAMES: string[] = [
  'Sergio Scariolo', 'Ettore Messina', 'Xavi Pascual', 'Chus Mateo', 'Dimitris Itoudis',
  'Ergin Ataman', 'Željko Obradović', 'Andrea Trinchieri', 'Sarunas Jasikevicius',
  'Pablo Laso', 'Néstor García', 'Silvio Santander', 'Gustavo Fernández', 'Vitor Hugo',
  'Rick Carlisle', 'Erik Spoelstra', 'Tyronn Lue', 'Mark Daigneault', 'Joe Mazzulla',
  'Michael Malone', 'Chris Finch', 'Ime Udoka', 'Steve Kerr', 'Willie Green',
]

/** Agent names: the voice behind every contract event. */
export const AGENT_NAMES: string[] = [
  'Rich Paul', 'Bill Duffy', 'Misko Raznatovic', 'Giorgos Dimitropoulos', 'Claudio Villanueva',
  'Marc Cornstein', 'Andy Miller', 'Daniel Moreno', 'Federico Danesi', 'Obrad Fimić',
]

export function namePool(poolId: string): { first: string[]; last: string[] } {
  return NAME_POOLS[poolId] ?? NAME_POOLS.american
}
