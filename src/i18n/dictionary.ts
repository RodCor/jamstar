/**
 * UI chrome strings.
 *
 * Content strings (events, awards, legacy verdicts, league and team names) carry
 * their own `{es, en}` in the data layer, so a card can never end up half
 * translated. This file only covers the shell around them.
 *
 * `es` is the source of truth for the key set; a test asserts `en` matches it
 * exactly, because a missing key is the failure mode that rots silently.
 */

export const es = {
  appName: 'Hoop Glory',
  tagline: 'De las inferiores al Salón de la Fama',

  // Mode select
  modeCareer: 'Mi Carrera',
  modeCareerDesc: 'Tu suerte, tu historia. Empezás distinto cada vez y jugás las veces que quieras.',
  modeDaily: 'Carrera del Día',
  modeDailyDesc:
    'Todos arrancan con la MISMA suerte: mismo país, mismo club, mismas lesiones. Gana el que decide mejor. Una por día.',
  modeDailyDone: 'Ya jugaste la carrera de hoy',
  modeDailyReplay: 'Ver mi resultado de hoy',
  archiveTitle: 'Tus carreras',
  archiveEmpty: 'Todavía no terminaste ninguna carrera.',
  archiveClear: 'Borrar historial',

  // Creation
  createTitle: 'Creá tu jugador',
  createSubtitle: 'Estas decisiones te acompañan veinte años. Elegí con cuidado.',
  fieldName: 'Nombre',
  fieldNamePlaceholder: 'Tu nombre',
  fieldCountry: 'País de origen',
  fieldCountryHelp: 'Define tu camino: universidad, cantera o academia.',
  fieldNumber: 'Número',
  fieldPosition: 'Posición',
  fieldHand: 'Mano hábil',
  handRight: 'Derecha',
  handLeft: 'Izquierda',
  fieldStyle: 'Estilo de juego',
  fieldStyleHelp: 'Cada estilo es una apuesta. No hay uno mejor.',
  startCareer: 'Empezar la carrera',
  pathLabel: 'Tu camino',

  // Positions
  posPG: 'Base',
  posSG: 'Escolta',
  posSF: 'Alero',
  posPF: 'Ala-pívot',
  posC: 'Pívot',

  // Attributes
  attrShooting: 'Tiro',
  attrHandling: 'Manejo',
  attrAthleticism: 'Atletismo',
  attrDefense: 'Defensa',
  attrStrength: 'Físico',
  attrIq: 'Lectura de juego',
  attrLeadership: 'Liderazgo',

  attrShootingHelp: 'Más puntos y eficiencia. Envejece bien.',
  attrHandlingHelp: 'Asistencias y menos pérdidas.',
  attrAthleticismHelp: 'Explosión y jugadas de highlight — pero más lesiones y la caída más dura después de los 30.',
  attrDefenseHelp: 'Robos, tapones y premios defensivos.',
  attrStrengthHelp: 'Rebotes y aguante. Limita un poco la agilidad.',
  attrIqHelp: 'Mejores decisiones en los eventos y una carrera más larga.',
  attrLeadershipHelp: 'Manda en el vestuario y hace ganar al equipo.',

  // Preseason
  preseasonTitle: 'Pretemporada',
  preseasonPoints: 'Puntos de mejora',
  preseasonPointsLeft: '{n} sin asignar',
  preseasonSpend: 'Repartí tus puntos entre tus atributos.',
  preseasonAuto: 'Lo que no repartas se asigna solo, pero sin foco.',
  playSeason: 'Jugar la temporada',
  season: 'Temporada',
  age: 'Edad',

  // Season result
  seasonResult: 'Resultado de la temporada',
  statsPerGame: 'Por partido',
  statPts: 'PTS',
  statReb: 'REB',
  statAst: 'AST',
  statStl: 'ROB',
  statBlk: 'TAP',
  statMin: 'MIN',
  statGames: 'PJ',
  statFg: 'TC%',
  statThree: 'T3%',
  statFt: 'TL%',
  statTs: 'TS%',
  record: 'Récord',
  role: 'Rol',
  awards: 'Premios',
  noAwards: 'Sin premios esta temporada',
  salary: 'Salario',
  continue: 'Continuar',

  // Roles
  roleStar: 'Figura',
  roleStarter: 'Titular',
  roleRotation: 'Rotación',
  roleBench: 'Suplente',
  roleProspect: 'Promesa',
  roleInjured: 'Lesionado',

  // Playoff results
  poChampion: 'Campeón',
  poFinals: 'Finalista',
  poConferenceFinals: 'Semifinal de conferencia',
  poSemifinals: 'Semifinales',
  poFirstRound: 'Primera ronda',
  poMissed: 'Sin playoffs',
  poNone: '—',

  // Events
  eventDecision: 'Tenés que decidir',
  eventOutcome: 'Lo que pasó',

  // Career panel
  careerTab: 'Carrera',
  rivalTab: 'Rival',
  statsTab: 'Estadísticas',
  careerAverages: 'Promedios de carrera',
  seasonsPlayed: 'Temporadas',
  earnings: 'Ganancias',
  rivalTitle: 'Tu rival de siempre',
  rivalVs: 'Vos vs. {name}',
  rivalRetired: 'Retirado en {year}',
  rings: 'Títulos',
  mvps: 'MVPs',
  allStars: 'All-Star',

  // Retirement
  retirementTitle: 'Fin de la carrera',
  retirementAt: 'Te retiraste a los {age} años, en {year}.',
  legacyScore: 'Puntaje de legado',
  hallOfFame: 'Salón de la Fama',
  hallOfFameYes: 'Elegido para el Salón de la Fama',
  hallOfFameNo: 'No llegaste al Salón de la Fama',
  jerseyRetired: 'Tu camiseta cuelga del techo del estadio',
  highlights: 'Lo que quedó',
  shareCard: 'Descargar imagen',
  copyResult: 'Copiar resultado',
  copied: '¡Copiado!',
  playAgain: 'Jugar de nuevo',
  seed: 'Semilla',
  seedHelp: 'Compartila para que otros jueguen tu misma carrera.',

  // Misc
  language: 'Idioma',
  loading: 'Cargando…',
  resumeRun: 'Seguir mi carrera',
  newRun: 'Empezar de nuevo',
  discardWarning: 'Vas a perder la carrera en curso.',
  teamHistory: 'Clubes',
  timeline: 'Trayectoria',
  injuryOut: 'Se perdió {n} partidos',
} as const

export type Dictionary = Record<keyof typeof es, string>

export const en: Dictionary = {
  appName: 'Hoop Glory',
  tagline: 'From the academy to the Hall of Fame',

  modeCareer: 'My Career',
  modeCareerDesc: 'Your luck, your story. You start differently every time and play as often as you like.',
  modeDaily: 'Daily Career',
  modeDailyDesc:
    'Everyone starts with the SAME luck: same country, same club, same injuries. The best decisions win. One per day.',
  modeDailyDone: 'You already played today’s career',
  modeDailyReplay: 'See today’s result',
  archiveTitle: 'Your careers',
  archiveEmpty: 'You have not finished a career yet.',
  archiveClear: 'Clear history',

  createTitle: 'Create your player',
  createSubtitle: 'These choices stay with you for twenty years. Choose carefully.',
  fieldName: 'Name',
  fieldNamePlaceholder: 'Your name',
  fieldCountry: 'Country of origin',
  fieldCountryHelp: 'Sets your path: college, club academy or development programme.',
  fieldNumber: 'Number',
  fieldPosition: 'Position',
  fieldHand: 'Dominant hand',
  handRight: 'Right',
  handLeft: 'Left',
  fieldStyle: 'Play style',
  fieldStyleHelp: 'Every style is a gamble. None of them is the best one.',
  startCareer: 'Start the career',
  pathLabel: 'Your path',

  posPG: 'Point Guard',
  posSG: 'Shooting Guard',
  posSF: 'Small Forward',
  posPF: 'Power Forward',
  posC: 'Center',

  attrShooting: 'Shooting',
  attrHandling: 'Handling',
  attrAthleticism: 'Athleticism',
  attrDefense: 'Defense',
  attrStrength: 'Strength',
  attrIq: 'Basketball IQ',
  attrLeadership: 'Leadership',

  attrShootingHelp: 'More points and efficiency. Ages well.',
  attrHandlingHelp: 'Assists, and fewer turnovers.',
  attrAthleticismHelp: 'Explosion and highlight plays — but more injuries and the steepest fall after 30.',
  attrDefenseHelp: 'Steals, blocks and defensive awards.',
  attrStrengthHelp: 'Rebounds and durability. Caps your quickness a little.',
  attrIqHelp: 'Better outcomes in events and a longer career.',
  attrLeadershipHelp: 'Runs the locker room and makes the team win.',

  preseasonTitle: 'Preseason',
  preseasonPoints: 'Growth points',
  preseasonPointsLeft: '{n} unspent',
  preseasonSpend: 'Spread your points across your attributes.',
  preseasonAuto: 'Anything you leave is spent for you, but without focus.',
  playSeason: 'Play the season',
  season: 'Season',
  age: 'Age',

  seasonResult: 'Season result',
  statsPerGame: 'Per game',
  statPts: 'PTS',
  statReb: 'REB',
  statAst: 'AST',
  statStl: 'STL',
  statBlk: 'BLK',
  statMin: 'MIN',
  statGames: 'GP',
  statFg: 'FG%',
  statThree: '3P%',
  statFt: 'FT%',
  statTs: 'TS%',
  record: 'Record',
  role: 'Role',
  awards: 'Awards',
  noAwards: 'No awards this season',
  salary: 'Salary',
  continue: 'Continue',

  roleStar: 'Star',
  roleStarter: 'Starter',
  roleRotation: 'Rotation',
  roleBench: 'Bench',
  roleProspect: 'Prospect',
  roleInjured: 'Injured',

  poChampion: 'Champion',
  poFinals: 'Lost the final',
  poConferenceFinals: 'Conference finals',
  poSemifinals: 'Semifinals',
  poFirstRound: 'First round',
  poMissed: 'Missed the playoffs',
  poNone: '—',

  eventDecision: 'You have to decide',
  eventOutcome: 'What happened',

  careerTab: 'Career',
  rivalTab: 'Rival',
  statsTab: 'Stats',
  careerAverages: 'Career averages',
  seasonsPlayed: 'Seasons',
  earnings: 'Earnings',
  rivalTitle: 'Your lifelong rival',
  rivalVs: 'You vs. {name}',
  rivalRetired: 'Retired in {year}',
  rings: 'Titles',
  mvps: 'MVPs',
  allStars: 'All-Star',

  retirementTitle: 'End of career',
  retirementAt: 'You retired at {age}, in {year}.',
  legacyScore: 'Legacy score',
  hallOfFame: 'Hall of Fame',
  hallOfFameYes: 'Elected to the Hall of Fame',
  hallOfFameNo: 'You did not make the Hall of Fame',
  jerseyRetired: 'Your jersey hangs from the rafters',
  highlights: 'What remains',
  shareCard: 'Download image',
  copyResult: 'Copy result',
  copied: 'Copied!',
  playAgain: 'Play again',
  seed: 'Seed',
  seedHelp: 'Share it so others can play your exact career.',

  language: 'Language',
  loading: 'Loading…',
  resumeRun: 'Resume my career',
  newRun: 'Start over',
  discardWarning: 'You will lose the career in progress.',
  teamHistory: 'Clubs',
  timeline: 'Timeline',
  injuryOut: 'Missed {n} games',
}

export const DICTIONARIES = { es, en } as const
