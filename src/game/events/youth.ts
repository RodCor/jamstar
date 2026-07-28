/** Youth and breakout events: ages 14-19, before anyone knows your name. */

import type { GameEvent } from '../types'
import { event, gamble, gate, loc, outcome } from './helpers'

export const YOUTH_EVENTS: GameEvent[] = [
  event({
    id: 'youth_growth_spurt',
    weight: 30,
    stages: ['youth', 'breakout'],
    category: 'personal',
    title: loc('Estirón', 'Growth Spurt'),
    body: (ctx) =>
      loc(
        `Creciste ocho centímetros en un verano. Te duelen las rodillas, perdiste coordinación y el entrenador te mira distinto. Medís ${ctx.player.heightCm} cm.`,
        `You grew three inches in one summer. Your knees ache, your coordination is gone, and the coach is looking at you differently. You are now ${ctx.player.heightCm} cm.`,
      ),
    choices: [
      {
        label: loc('Trabajar la coordinación todos los días', 'Drill coordination every single day'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.72,
            outcome(
              'Recuperaste el control del cuerpo nuevo. Ahora sos igual de ágil, pero más grande.',
              'You got control of the new body back. Same agility, more of you.',
              'good',
              { attributes: { playmaking: 4, physical: 3 }, hidden: { coachTrust: 4 } },
            ),
            outcome(
              'El cuerpo tardó en acomodarse. Perdiste un año de desarrollo técnico.',
              'The body took its time. You lost a year of technical development.',
              'bad',
              { attributes: { playmaking: -2 }, hidden: { morale: -6 } },
            ),
          ),
      },
      {
        label: loc('Aprovechar el tamaño y jugar cerca del aro', 'Lean into the size and play near the rim'),
        resolve: () =>
          outcome(
            'Te volviste dominante contra chicos de tu edad. Simple y efectivo.',
            'You became dominant against kids your own age. Simple and effective.',
            'good',
            { attributes: { physical: 5, defense: 3, playmaking: -2 }, hidden: { hype: 6 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_first_tournament',
    weight: 28,
    stages: ['youth'],
    category: 'milestone',
    title: loc('Primer torneo importante', 'First Big Tournament'),
    body: (ctx) =>
      loc(
        `${ctx.team.name.es} viaja a un torneo nacional. Hay scouts en las gradas por primera vez en tu vida.`,
        `${ctx.team.name.en} is travelling to a national tournament. There are scouts in the stands for the first time in your life.`,
      ),
    choices: [
      {
        label: loc('Jugar para las estadísticas', 'Play for the stat sheet'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Metiste 34 puntos en la semifinal. Tres scouts anotaron tu nombre.',
              'You dropped 34 in the semifinal. Three scouts wrote your name down.',
              'good',
              { hidden: { hype: 14, coachTrust: -4 } },
            ),
            outcome(
              'Forzaste tiros toda la serie. Perdieron y el entrenador te sentó en la final.',
              'You forced shots all tournament. You lost, and the coach benched you for the final.',
              'bad',
              { hidden: { hype: -3, coachTrust: -10, morale: -8 } },
            ),
          ),
      },
      {
        label: loc('Jugar para ganar', 'Play to win'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.68,
            outcome(
              'Salieron campeones. No fuiste el goleador, pero todos saben quién manejó el equipo.',
              'You won the whole thing. You were not the top scorer, but everyone knows who ran that team.',
              'good',
              { attributes: { mental: 7 }, hidden: { coachTrust: 12, morale: 8, hype: 5 } },
            ),
            outcome(
              'Perdieron en cuartos. Tu sacrificio no apareció en ninguna planilla.',
              'You lost in the quarters. Your sacrifice showed up on nobody’s stat sheet.',
              'neutral',
              { attributes: { mental: 2 }, hidden: { coachTrust: 4, hype: -2 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'youth_school_vs_ball',
    weight: 24,
    stages: ['youth', 'breakout'],
    category: 'personal',
    title: loc('El colegio o la pelota', 'School or the Ball'),
    body: () =>
      loc(
        'Tus notas se derrumbaron. En casa te dan un ultimátum: o mejorás el promedio, o se termina el básquet.',
        'Your grades collapsed. At home they give you an ultimatum: fix your average, or basketball is over.',
      ),
    choices: [
      {
        label: loc('Estudiar en serio, aunque pierda entrenamientos', 'Take school seriously, even if I miss training'),
        resolve: () =>
          outcome(
            'Aprobaste todo. Perdiste medio año de gimnasio, pero aprendiste a leer el juego de otra manera.',
            'You passed everything. You lost half a year in the gym, but you learned to read the game differently.',
            'neutral',
            { attributes: { mental: 5, physical: -2 }, hidden: { morale: 6 } },
          ),
      },
      {
        label: loc('Apostar todo al básquet', 'Bet everything on basketball'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Funcionó. Explotaste en la temporada y en casa dejaron de discutir.',
              'It worked. You exploded that season and the arguments at home stopped.',
              'good',
              { attributes: { physical: 4, scoring: 3 }, hidden: { hype: 8, morale: 5 } },
            ),
            outcome(
              'No explotaste, y encima repetiste el año. Un desgaste innecesario.',
              'You did not explode, and you had to repeat the year on top of it.',
              'bad',
              { hidden: { morale: -14, hype: -4 } },
            ),
          ),
      },
      {
        label: loc('Buscar un tutor y hacer las dos cosas', 'Find a tutor and do both'),
        available: (ctx) => ctx.player.attributes.mental > 42,
        resolve: () =>
          outcome(
            'Dormiste cinco horas por noche durante un año. Salió bien, pero lo pagaste.',
            'You slept five hours a night for a year. It worked out, but you paid for it.',
            'good',
            { attributes: { mental: 6 }, hidden: { wear: 4, morale: 2 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_academy_offer',
    weight: 26,
    stages: ['youth', 'breakout'],
    category: 'transfer',
    requires: (ctx) => ctx.player.hidden.hype > 18,
    title: loc('Oferta de una academia', 'Academy Offer'),
    body: (ctx) =>
      loc(
        `Una academia de élite en Europa te quiere. Significa dejar ${ctx.country.name.es}, tu casa y tus amigos a los ${ctx.player.age} años.`,
        `An elite academy in Europe wants you. It means leaving ${ctx.country.name.en}, your home and your friends at ${ctx.player.age}.`,
      ),
    choices: [
      {
        label: loc('Irme. Es la oportunidad de mi vida', 'Go. This is the chance of a lifetime'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.66,
            outcome(
              'Mejor entrenamiento, mejor competencia, mejor todo. Diste un salto enorme.',
              'Better coaching, better competition, better everything. You took an enormous leap.',
              'good',
              {
                attributes: { scoring: 5, mental: 4, defense: 3 },
                hidden: { hype: 12, morale: -6 },
              },
            ),
            outcome(
              'La nostalgia te comió. Jugaste tenso todo el año y volviste peor de lo que fuiste.',
              'Homesickness ate you alive. You played tight all year and came back worse than you left.',
              'bad',
              { attributes: { scoring: 1 }, hidden: { morale: -18, hype: -5 } },
            ),
          ),
      },
      {
        label: loc('Quedarme. Mi club me formó', 'Stay. My club made me'),
        resolve: () =>
          outcome(
            'Te quedaste, seguiste creciendo con la gente de siempre y el club te hizo capitán juvenil.',
            'You stayed, kept growing around the people who raised you, and the club made you youth captain.',
            'good',
            { attributes: { mental: 8 }, hidden: { morale: 12, coachTrust: 8, hype: -4 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_pickup_legend',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'personal',
    title: loc('La cancha del barrio', 'The Neighbourhood Court'),
    body: () =>
      loc(
        'Todos los sábados hay un partido en la cancha de cemento del barrio. Se juega duro y sin árbitro. Tu entrenador te lo prohibió.',
        'Every Saturday there is a game on the neighbourhood concrete court. It is played hard, with no referee. Your coach forbade it.',
      ),
    choices: [
      {
        label: loc('Ir igual. Ahí se aprende de verdad', 'Go anyway. That is where you really learn'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.7,
            outcome(
              'Te curtiste contra tipos de treinta años. Nada en tu categoría te asusta ya.',
              'You got hardened against thirty-year-olds. Nothing in your age group scares you now.',
              'good',
              { attributes: { physical: 4, playmaking: 3, defense: 2 }, hidden: { coachTrust: -5 } },
            ),
            outcome(
              'Un cruce mal caído y te torciste el tobillo. Tres semanas afuera y el entrenador furioso.',
              'One bad landing and you rolled your ankle. Three weeks out and a furious coach.',
              'bad',
              { attributes: { physical: -2 }, hidden: { wear: 5, coachTrust: -12 } },
            ),
          ),
      },
      {
        label: loc('Hacerle caso al entrenador', 'Listen to the coach'),
        resolve: () =>
          outcome(
            'Te quedaste en el gimnasio tirando. Aburrido, seguro y efectivo.',
            'You stayed in the gym shooting. Boring, safe, effective.',
            'neutral',
            { attributes: { scoring: 4 }, hidden: { coachTrust: 6 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_first_dunk',
    weight: 20,
    stages: ['youth', 'breakout'],
    category: 'media',
    requires: (ctx) => ctx.player.attributes.physical > 48,
    title: loc('La primera volcada', 'The First Dunk'),
    body: () =>
      loc(
        'Volcaste en un partido por primera vez. Alguien lo filmó con el celular y el video empezó a circular.',
        'You dunked in a game for the first time. Someone filmed it on their phone and the clip started going around.',
      ),
    choices: [
      {
        label: loc('Subirlo a todas las redes', 'Post it everywhere'),
        resolve: () =>
          outcome(
            'Cien mil reproducciones en una semana. De golpe hay gente que sabe quién sos.',
            'A hundred thousand views in a week. Suddenly people know who you are.',
            'good',
            { hidden: { hype: 16, coachTrust: -3 } },
          ),
      },
      {
        label: loc('Dejarlo pasar y seguir trabajando', 'Let it go and keep working'),
        resolve: () =>
          outcome(
            'No hiciste ruido. El entrenador lo notó y te dio más minutos.',
            'You made no noise about it. The coach noticed and gave you more minutes.',
            'neutral',
            { hidden: { coachTrust: 9, hype: 3 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_position_change',
    weight: 18,
    stages: ['breakout'],
    category: 'coach',
    title: loc('Cambio de posición', 'Position Change'),
    body: (ctx) =>
      loc(
        `El entrenador te quiere sacar de ${ctx.player.position} y probarte en otro rol. Dice que ahí está tu futuro profesional.`,
        `The coach wants to move you off ${ctx.player.position} and try you somewhere else. He says that is where your professional future is.`,
      ),
    choices: [
      {
        label: loc('Aceptar y aprender de cero', 'Accept and learn from scratch'),
        resolve: () =>
          outcome(
            'Fue incómodo durante meses, pero salís de las inferiores sabiendo jugar de dos maneras.',
            'It was uncomfortable for months, but you leave the youth system able to play two ways.',
            'good',
            { attributes: { mental: 5, playmaking: 3, defense: 3 }, hidden: { coachTrust: 10 } },
          ),
      },
      {
        label: loc('Negarme. Sé lo que soy', 'Refuse. I know what I am'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.45,
            outcome(
              'Te mantuviste firme y terminaste teniendo razón. El entrenador te respeta más ahora.',
              'You held your ground and turned out to be right. The coach respects you more for it.',
              'good',
              { attributes: { mental: 5 }, hidden: { morale: 8 } },
            ),
            outcome(
              'Te ganaste fama de difícil. Los minutos se fueron a otro lado.',
              'You got a reputation for being difficult. The minutes went elsewhere.',
              'bad',
              { hidden: { coachTrust: -16, morale: -6 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'youth_ncaa_recruiting',
    weight: 26,
    stages: ['breakout'],
    category: 'transfer',
    requires: gate.all(
      (ctx) => ctx.country.path === 'usa_ncaa',
      (ctx) => ctx.player.hidden.hype > 25,
    ),
    title: loc('Carta de reclutamiento', 'Recruiting Letter'),
    body: () =>
      loc(
        'Tres programas de primer nivel te ofrecen beca completa. Uno es un gigante donde vas a pelear por minutos; otro es más chico pero prometen que jugás desde el primer día.',
        'Three top-tier programs offer a full scholarship. One is a blue blood where you will fight for minutes; another is smaller but promises you start from day one.',
      ),
    choices: [
      {
        label: loc('El gigante. Quiero medirme contra los mejores', 'The blue blood. I want to test myself'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Te ganaste el puesto contra cinco futuros profesionales. Los scouts no miran otra cosa.',
              'You won the job over five future pros. Scouts are not looking anywhere else.',
              'epic',
              { attributes: { defense: 4, mental: 3 }, hidden: { hype: 22, coachTrust: 8 } },
            ),
            outcome(
              'Te comió el banco. Doce minutos por partido y una temporada perdida en la vidriera.',
              'The bench swallowed you. Twelve minutes a game and a wasted season in the shop window.',
              'bad',
              { hidden: { hype: -8, morale: -12, coachTrust: -6 } },
            ),
          ),
      },
      {
        label: loc('El programa chico. Quiero jugar', 'The smaller program. I want to play'),
        resolve: () =>
          outcome(
            'Treinta y cinco minutos por partido desde noviembre. Los números son enormes y los scouts saben leer contexto.',
            'Thirty-five minutes a game from November. The numbers are huge, and scouts know how to read context.',
            'good',
            { attributes: { scoring: 4, playmaking: 3 }, hidden: { hype: 9, coachTrust: 14 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_family_sacrifice',
    weight: 20,
    stages: ['youth', 'breakout'],
    category: 'personal',
    title: loc('El sacrificio de casa', 'The Sacrifice at Home'),
    body: (ctx) =>
      loc(
        `En tu casa las cosas están difíciles. Te ofrecen un trabajo de medio tiempo que ayudaría mucho, pero choca con los entrenamientos de ${ctx.team.name.es}.`,
        `Things are hard at home. You are offered a part-time job that would help a lot, but it clashes with training at ${ctx.team.name.en}.`,
      ),
    choices: [
      {
        label: loc('Tomar el trabajo. La familia primero', 'Take the job. Family first'),
        resolve: () =>
          outcome(
            'Perdiste desarrollo, ganaste perspectiva. Nunca más diste un entrenamiento por sentado.',
            'You lost development and gained perspective. You never took a single practice for granted again.',
            'neutral',
            { attributes: { mental: 7, physical: -2 }, hidden: { morale: 8, hype: -5 } },
          ),
      },
      {
        label: loc('Rechazarlo y jugarme por el básquet', 'Turn it down and bet on basketball'),
        resolve: () =>
          outcome(
            'Fue una decisión egoísta y lo sabés. También fue la correcta para tu carrera.',
            'It was a selfish decision and you know it. It was also the right one for your career.',
            'neutral',
            { attributes: { scoring: 3, physical: 3 }, hidden: { morale: -8, hype: 4 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_mentor',
    weight: 18,
    stages: ['youth', 'breakout'],
    category: 'locker_room',
    title: loc('El veterano del club', 'The Club Veteran'),
    body: () =>
      loc(
        'Un jugador de treinta y ocho años, que jugó dos mundiales, entrena en el mismo gimnasio. Te ofrece quedarse una hora extra con vos, todos los días.',
        'A thirty-eight-year-old who played two World Cups trains in the same gym. They offer to stay an extra hour with you, every day.',
      ),
    choices: [
      {
        label: loc('Aceptar todos los días, sin faltar uno', 'Accept every day, without missing one'),
        resolve: () =>
          outcome(
            'Un año entero de detalles: los pies, la lectura, cuándo no correr. Te cambió el techo.',
            'A full year of details: footwork, reads, when not to run. It changed your ceiling.',
            'epic',
            { attributes: { mental: 7, scoring: 3, defense: 3 }, hidden: { morale: 6 } },
          ),
      },
      {
        label: loc('Agradecer pero entrenar a mi manera', 'Say thanks but train my own way'),
        resolve: () =>
          outcome(
            'Seguiste con tu rutina. Funcionó, aunque siempre te vas a preguntar qué habría pasado.',
            'You stuck with your own routine. It worked, though you will always wonder.',
            'neutral',
            { attributes: { physical: 3, scoring: 2 } },
          ),
      },
    ],
  }),

  /*
   * The six below are ungated on purpose.
   *
   * A career spends three seasons in `youth` and one in `breakout`, and the
   * origin deck only lends two cards to each of those from any one country, so
   * the opening act was being dealt from the same eight-card hand every replay.
   * Anything gated here would thin the general pool rather than thicken it —
   * these have to be drawable by a kid from anywhere.
   */

  event({
    id: 'youth_out_of_position',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'coach',
    title: loc('El más alto que quedó', 'The Tallest One Left'),
    body: (ctx) =>
      loc(
        `Al único cinco de ${ctx.team.name.es} se le partió la mano en octubre. Sos el segundo más alto del plantel y el entrenador te manda al poste hasta junio: de espaldas al aro, codos, y la pelota no te llega nunca más arriba del tiro libre.`,
        `The only centre at ${ctx.team.name.en} broke his hand in October. You are the second tallest on the roster, so the coach puts you in the post until June: back to the basket, elbows, and the ball never reaching you above the free-throw line.`,
      ),
    choices: [
      {
        label: loc('Bancar el puesto hasta junio', 'Hold the spot until June'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.6,
            outcome(
              'Saliste sabiendo aguantar con la cadera y pelear un rebote entre tres cuerpos. La pelota, mientras tanto, estuvo nueve meses en un cajón.',
              'You came out able to hold a man off with your hips and win a rebound between three bodies. Your handle, meanwhile, spent nine months in a drawer.',
              'good',
              { attributes: { physical: 6, defense: 4, playmaking: -2 }, hidden: { coachTrust: 10, wear: 3 } },
            ),
            outcome(
              'Nueve meses de espaldas al aro contra pibes quince kilos más pesados. Volviste a tu puesto sin saber bien qué eras.',
              'Nine months with your back to the basket against boys fifteen kilos heavier. You came back to your own position not quite sure what you were.',
              'bad',
              { attributes: { physical: 2, scoring: -2, playmaking: -3 }, hidden: { coachTrust: 5, morale: -8 } },
            ),
          ),
      },
      {
        label: loc('Pedirle que me devuelva a mi puesto', 'Ask him to put me back where I belong'),
        resolve: () =>
          outcome(
            'Te devolvió después de Año Nuevo y algo quedó frío. Terminaste siendo el mejor de tu puesto en la categoría y el cuarto nombre de su lista.',
            'He moved you back after New Year and something stayed cold. You finished as the best in your position in the age group, and the fourth name on his list.',
            'neutral',
            { attributes: { scoring: 5, playmaking: 3, defense: -2 }, hidden: { hype: 4, coachTrust: -12 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_friend_moves',
    weight: 20,
    stages: ['youth', 'breakout'],
    category: 'locker_room',
    title: loc('Se va el que te pasaba la pelota', 'The One Who Passed You the Ball Is Leaving'),
    body: () =>
      loc(
        'Al padre de tu base lo trasladaron a mil kilómetros. Juegan juntos desde los ocho años y él sabe dónde vas a estar antes de que arranques. En marzo se van todos y no vuelven.',
        'Your point guard’s father has been transferred a thousand kilometres away. You have played together since you were eight; he knows where you are going before you move. In March the whole family goes, and they are not coming back.',
      ),
    choices: [
      {
        label: loc('Aprender a crearme el tiro solo', 'Learn to create my own shot'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.62,
            outcome(
              'Un verano entero botando contra una pared del club. En septiembre ya no necesitabas que nadie te encontrara.',
              'A whole summer bouncing a ball off the club wall. By September you did not need anybody to find you.',
              'good',
              { attributes: { playmaking: 5, scoring: 4, defense: -1 }, hidden: { hype: 5, morale: -2 } },
            ),
            outcome(
              'Te pasaste el año tratando de hacer lo que hacía él y dejaste de hacer bien lo tuyo.',
              'You spent the year trying to do what he did and stopped doing your own thing well.',
              'bad',
              { attributes: { playmaking: 2, scoring: -3 }, hidden: { morale: -6, coachTrust: -4 } },
            ),
          ),
      },
      {
        label: loc('Jugar sin pelota y esperar al que venga', 'Play off the ball and wait for whoever comes next'),
        resolve: () =>
          outcome(
            'Un año cortando, saliendo de bloqueos y llegando siempre con los pies listos. El base nuevo tardó seis meses en encontrarte; el entrenador, ni un partido.',
            'A year of cutting, coming off screens and always arriving with your feet ready. The new point guard took six months to find you; the coach took one game.',
            'good',
            { attributes: { defense: 3, mental: 3, scoring: 2, playmaking: -2 }, hidden: { coachTrust: 10 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_first_money',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'business',
    title: loc('El primer partido pago', 'The First Paid Game'),
    body: () =>
      loc(
        'Un pueblo a ochenta kilómetros arma equipo para el torneo de la fiesta y les falta un alto. Plata en la mano, tres domingos. Tenés ficha con tu club y la ficha dice que no podés jugar en ningún otro lado.',
        'A town eighty kilometres away is putting a side together for the festival tournament and they are short one tall player. Cash in hand, three Sundays. You are registered with your club, and the registration says you may not play anywhere else.',
      ),
    choices: [
      {
        label: loc('Ir y no decirlo en el club', 'Go, and say nothing at the club'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Tres domingos contra hombres que juegan por el orgullo del pueblo y por lo que se apuesta atrás del alambrado. Volviste a tu categoría y te pareció lenta.',
              'Three Sundays against men playing for the pride of the town and for whatever is being bet behind the fence. You went back to your age group and it felt slow.',
              'good',
              { attributes: { physical: 4, mental: 3, defense: 1 }, hidden: { hype: 5, wear: 2 }, money: 700 },
            ),
            outcome(
              'Alguien te reconoció y mandó la foto. Dos fechas de suspensión y una reunión con la comisión, con tu vieja sentada al lado.',
              'Somebody recognised you and sent the photograph in. A two-game ban and a meeting with the committee, with your mother sitting next to you.',
              'bad',
              { attributes: { physical: 1, mental: 2 }, hidden: { coachTrust: -14, morale: -6, hype: -2 }, money: 700 },
            ),
          ),
      },
      {
        label: loc('Decir que no y jugar el domingo con los míos', 'Say no and play Sunday with my own'),
        resolve: () =>
          outcome(
            'Jugaste tu torneo y ganaron todos los partidos por veinte, que no enseña nada. En el pueblo consiguieron otro alto y el que fue volvió con historias y con zapatillas nuevas.',
            'You played your own tournament and won every game by twenty, which teaches nothing. The town found another tall kid, and the one who went came back with stories and new shoes.',
            'neutral',
            { attributes: { scoring: 3, playmaking: 2 }, hidden: { coachTrust: 8, hype: 1 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_scout_remark',
    weight: 24,
    stages: ['youth', 'breakout'],
    category: 'personal',
    title: loc('Lo que dijo el de la carpeta', 'What the Man With the Folder Said'),
    body: (ctx) =>
      loc(
        `Terminó el partido y escuchaste, sin querer, lo que el tipo de la carpeta le decía a tu entrenador: que los pies no te van a alcanzar nunca para el nivel de arriba. No sabe que lo escuchaste. Tenés ${ctx.player.age} años.`,
        `The game ended and you overheard, without meaning to, what the man with the folder said to your coach: that your feet will never be quick enough for the level above. He does not know you heard him. You are ${ctx.player.age}.`,
      ),
    choices: [
      {
        label: loc('Convertir esa frase en el motivo de todo', 'Make that sentence the reason for everything'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Dos años de escalera, soga y arena con esa frase adentro de la cabeza cada mañana. Los pies te alcanzaron.',
              'Two years of ladders, rope and sand with that sentence inside your head every morning. Your feet caught up.',
              'good',
              { attributes: { physical: 6, defense: 3 }, hidden: { hype: 5, wear: 2, morale: -4 } },
            ),
            outcome(
              'Entrenaste con bronca, que no es lo mismo que entrenar bien. Ganaste piernas y perdiste las ganas de entrar al gimnasio.',
              'You trained angry, which is not the same as training well. You gained legs and lost the wish to walk into the gym.',
              'bad',
              { attributes: { physical: 2, mental: -2 }, hidden: { wear: 3, morale: -12 } },
            ),
          ),
      },
      {
        label: loc('Preguntarle al entrenador qué opina él', 'Ask the coach what he thinks'),
        resolve: () =>
          outcome(
            'Te dijo la verdad, que es peor y sirve más: que el tipo tenía razón en los pies y se equivocaba en todo lo demás. Se pusieron a trabajar todo lo demás.',
            'He told you the truth, which is worse and more useful: the man was right about your feet and wrong about everything else. The two of you went to work on everything else.',
            'good',
            { attributes: { mental: 4, playmaking: 1 }, hidden: { coachTrust: 6, morale: 4, hype: 1 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_plateau',
    weight: 24,
    stages: ['youth', 'breakout'],
    category: 'personal',
    title: loc('El que dejó de crecer', 'The One Who Stopped Growing'),
    body: (ctx) =>
      loc(
        `Medís lo mismo que hace dos años. Los que te miraban de abajo ahora te sacan una cabeza, y el entrenador empezó a usar la palabra "base" cuando habla de vos. Son ${ctx.player.heightCm} cm y no van a ser más.`,
        `You are the same height you were two years ago. The boys who used to look up at you are a head taller now, and the coach has started using the word "guard" when he talks about you. It is ${ctx.player.heightCm} cm and that is where it stops.`,
      ),
    choices: [
      {
        label: loc('Rehacerme entero para el puesto nuevo', 'Rebuild myself for the new position'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.65,
            outcome(
              'Un año de bote con las dos manos y de leer la cancha desde abajo. Terminaste sabiendo cosas que los altos no aprenden nunca.',
              'A year of handling with both hands and reading the floor from underneath. You finished knowing things tall players never learn.',
              'good',
              { attributes: { playmaking: 6, mental: 3, physical: -1 }, hidden: { coachTrust: 6, hype: 3 } },
            ),
            outcome(
              'A los dieciséis es tarde para aprender a botar. Quedaste entre dos puestos y no fuiste bueno en ninguno.',
              'Sixteen is late to learn to handle a ball. You ended up between two positions and were good at neither.',
              'bad',
              { attributes: { playmaking: 2, scoring: -3 }, hidden: { morale: -10, coachTrust: -4 } },
            ),
          ),
      },
      {
        label: loc('Seguir jugando adentro aunque me pasen por arriba', 'Keep playing inside, even with everyone taller'),
        resolve: () =>
          outcome(
            'Dos temporadas peleando cada rebote contra tipos diez centímetros más altos. Ganaste un oficio de bajo que no se enseña y perdiste el tiro de afuera que no practicaste.',
            'Two seasons fighting every rebound against boys ten centimetres taller. You gained a low-post trade nobody teaches and lost the outside shot you never practised.',
            'neutral',
            { attributes: { physical: 4, defense: 3, scoring: -2 }, hidden: { wear: 2, coachTrust: 2, hype: 2 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_first_beating',
    weight: 20,
    stages: ['youth', 'breakout'],
    category: 'rival',
    title: loc('La primera vez que te pasaron por arriba', 'The First Time Somebody Went Through You'),
    body: () =>
      loc(
        'Nunca te habían ganado de verdad. El sábado un pibe de tu edad, de un club que no conocía nadie, te metió treinta y dos y te dejó plantado tres veces en la misma jugada. Sonó la chicharra y vino a darte la mano.',
        'Nobody had ever truly beaten you. On Saturday a boy your own age, from a club nobody had heard of, put thirty-two on you and left you standing still three times on the same play. The buzzer went and he came over to shake your hand.',
      ),
    choices: [
      {
        label: loc('Pedirle el teléfono y entrenar con él todo el verano', 'Ask for his number and train with him all summer'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.66,
            outcome(
              'Dos meses de uno contra uno con el único de tu edad que te gana. En agosto le ganaste una serie, y esa serie valió por todo el año.',
              'Two months of one-on-one against the only kid your age who beats you. In August you took a series off him, and that series was worth the whole year.',
              'good',
              { attributes: { defense: 4, scoring: 2, mental: 2 }, hidden: { morale: 4, hype: 3 } },
            ),
            outcome(
              'Se hicieron amigos y jugaron todo el verano sin defenderse. Volvieron los dos en septiembre con los mismos vicios y mejor humor.',
              'You became friends and played the whole summer without guarding each other. You both came back in September with the same bad habits and better moods.',
              'neutral',
              { attributes: { scoring: 2, defense: -2 }, hidden: { morale: 8 } },
            ),
          ),
      },
      {
        label: loc('Guardármelo y no hablar del tema', 'Swallow it and never mention it'),
        resolve: () =>
          outcome(
            'No dijiste una palabra en el viaje de vuelta ni en los seis meses siguientes. Entrenaste como no habías entrenado nunca, solo, con una cara que en el club no te conocían.',
            'You did not say a word on the bus home, or for the six months after it. You trained the way you had never trained, alone, with a face nobody at the club had seen on you.',
            'neutral',
            { attributes: { defense: 3, physical: 3, mental: -1 }, hidden: { morale: -10, coachTrust: 2, hype: 2 } },
          ),
      },
    ],
  }),
]
