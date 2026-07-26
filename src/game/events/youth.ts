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
              { attributes: { handling: 4, athleticism: 3 }, hidden: { coachTrust: 4 } },
            ),
            outcome(
              'El cuerpo tardó en acomodarse. Perdiste un año de desarrollo técnico.',
              'The body took its time. You lost a year of technical development.',
              'bad',
              { attributes: { handling: -2 }, hidden: { morale: -6 } },
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
            { attributes: { strength: 5, defense: 3, handling: -2 }, hidden: { hype: 6 } },
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
              { attributes: { iq: 3, leadership: 4 }, hidden: { coachTrust: 12, morale: 8, hype: 5 } },
            ),
            outcome(
              'Perdieron en cuartos. Tu sacrificio no apareció en ninguna planilla.',
              'You lost in the quarters. Your sacrifice showed up on nobody’s stat sheet.',
              'neutral',
              { attributes: { iq: 2 }, hidden: { coachTrust: 4, hype: -2 } },
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
            { attributes: { iq: 5, athleticism: -2 }, hidden: { morale: 6 } },
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
              { attributes: { athleticism: 4, shooting: 3 }, hidden: { hype: 8, morale: 5 } },
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
        available: (ctx) => ctx.player.attributes.iq > 42,
        resolve: () =>
          outcome(
            'Dormiste cinco horas por noche durante un año. Salió bien, pero lo pagaste.',
            'You slept five hours a night for a year. It worked out, but you paid for it.',
            'good',
            { attributes: { iq: 4, leadership: 2 }, hidden: { wear: 4, morale: 2 } },
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
                attributes: { shooting: 5, iq: 4, defense: 3 },
                hidden: { hype: 12, morale: -6 },
              },
            ),
            outcome(
              'La nostalgia te comió. Jugaste tenso todo el año y volviste peor de lo que fuiste.',
              'Homesickness ate you alive. You played tight all year and came back worse than you left.',
              'bad',
              { attributes: { shooting: 1 }, hidden: { morale: -18, hype: -5 } },
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
            { attributes: { leadership: 6, iq: 2 }, hidden: { morale: 12, coachTrust: 8, hype: -4 } },
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
              { attributes: { strength: 4, handling: 3, defense: 2 }, hidden: { coachTrust: -5 } },
            ),
            outcome(
              'Un cruce mal caído y te torciste el tobillo. Tres semanas afuera y el entrenador furioso.',
              'One bad landing and you rolled your ankle. Three weeks out and a furious coach.',
              'bad',
              { attributes: { athleticism: -2 }, hidden: { wear: 5, coachTrust: -12 } },
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
            { attributes: { shooting: 4 }, hidden: { coachTrust: 6 } },
          ),
      },
    ],
  }),

  event({
    id: 'youth_first_dunk',
    weight: 20,
    stages: ['youth', 'breakout'],
    category: 'media',
    requires: (ctx) => ctx.player.attributes.athleticism > 48,
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
            { attributes: { iq: 5, handling: 3, defense: 3 }, hidden: { coachTrust: 10 } },
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
              { attributes: { leadership: 5 }, hidden: { morale: 8 } },
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
              { attributes: { defense: 4, iq: 3 }, hidden: { hype: 22, coachTrust: 8 } },
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
            { attributes: { shooting: 4, handling: 3 }, hidden: { hype: 9, coachTrust: 14 } },
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
            { attributes: { leadership: 5, iq: 2, athleticism: -2 }, hidden: { morale: 8, hype: -5 } },
          ),
      },
      {
        label: loc('Rechazarlo y jugarme por el básquet', 'Turn it down and bet on basketball'),
        resolve: () =>
          outcome(
            'Fue una decisión egoísta y lo sabés. También fue la correcta para tu carrera.',
            'It was a selfish decision and you know it. It was also the right one for your career.',
            'neutral',
            { attributes: { shooting: 3, athleticism: 3 }, hidden: { morale: -8, hype: 4 } },
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
            { attributes: { iq: 7, shooting: 3, defense: 3 }, hidden: { morale: 6 } },
          ),
      },
      {
        label: loc('Agradecer pero entrenar a mi manera', 'Say thanks but train my own way'),
        resolve: () =>
          outcome(
            'Seguiste con tu rutina. Funcionó, aunque siempre te vas a preguntar qué habría pasado.',
            'You stuck with your own routine. It worked, though you will always wonder.',
            'neutral',
            { attributes: { athleticism: 3, shooting: 2 } },
          ),
      },
    ],
  }),
]
