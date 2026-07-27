/**
 * The development years: nineteen to twenty-one.
 *
 * Old enough to be somewhere real — the college years, the second team, a first
 * contract at a club that cannot pay, a season on loan in a league nobody
 * watches — and too young for any of it to have been decided yet. The stage had
 * fourteen cards before this file and only three of them were ungated, which
 * meant most of what a player met here was decided by the flag on their passport
 * rather than by anything they did.
 *
 * Every card below is ungated for that reason, and every one of them is a trade:
 * at this age nothing is bought without something being sold, and the deck's
 * expected value is deliberately thinner than the youth deck's to say so.
 */

import type { GameEvent } from '../types'
import { event, gamble, loc, outcome } from './helpers'

export const DEVELOPMENT_EVENTS: GameEvent[] = [
  event({
    id: 'dev_exam_week',
    weight: 24,
    stages: ['development'],
    category: 'personal',
    title: loc('La materia que te falta', 'The One Subject Left'),
    body: () =>
      loc(
        'Te quedó una materia, y sin esa materia no hay ficha, no hay beca y no hay temporada. El examen cae en febrero, en el medio de la única gira del año donde te va a ver alguien.',
        'You failed one subject, and without that subject there is no registration, no scholarship and no season. The exam falls in February, in the middle of the only road trip all year where anybody will see you.',
      ),
    choices: [
      {
        label: loc('Quedarme a estudiar y perderme la gira', 'Stay behind to study and miss the trip'),
        resolve: () =>
          outcome(
            'Aprobaste raspando y volviste a estar habilitado. El equipo ganó cuatro de seis sin vos y el que jugó en tu lugar no piensa devolver el puesto.',
            'You scraped a pass and were cleared to play. The team won four of six without you, and the boy who played in your place has no intention of giving the spot back.',
            'neutral',
            { attributes: { mental: 4, scoring: -2 }, hidden: { coachTrust: -6, hype: -2 } },
          ),
      },
      {
        label: loc('Ir a la gira y rendir cuando vuelva', 'Go on the trip and sit the exam after'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Jugaste los seis partidos, volviste y aprobaste de pedo, con un profesor de buen humor. Nadie te cuenta esta historia sin reírse.',
              'You played all six, came back and passed by sheer luck, with an examiner in a good mood. Nobody tells you this story without laughing.',
              'good',
              { attributes: { scoring: 4, mental: 1 }, hidden: { hype: 16, morale: 6 } },
            ),
            outcome(
              'Jugaste los seis partidos y no aprobaste. Cuatro meses afuera de la lista, mirando desde la tribuna con el buzo puesto.',
              'You played all six and failed. Four months off the eligibility list, watching from the stand in your tracksuit.',
              'bad',
              { attributes: { mental: 1, physical: -2 }, hidden: { hype: -6, morale: -10, coachTrust: -8 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'dev_eight_kilos',
    weight: 24,
    stages: ['development'],
    category: 'coach',
    title: loc('Ocho kilos', 'Eight Kilos'),
    body: () =>
      loc(
        'El preparador te escribió un plan para ganar ocho kilos antes de septiembre: cinco comidas, tres sesiones de fuerza por semana y la balanza los lunes a la mañana. Los ocho kilos los vas a ganar. La duda es qué se llevan con ellos.',
        'The strength coach has written you a plan to add eight kilos before September: five meals, three lifting sessions a week and the scale on Monday mornings. You will gain the eight kilos. The question is what they take with them.',
      ),
    choices: [
      {
        label: loc('Hacer el plan entero', 'Do the whole plan'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.6,
            outcome(
              'Llegaste a septiembre pesando lo que pesa un profesional y moviéndote como te movías antes. Eso no le pasa a casi nadie.',
              'You reached September weighing what a professional weighs and moving the way you moved before. That happens to almost nobody.',
              'good',
              { attributes: { physical: 6, defense: 1 }, hidden: { coachTrust: 8, wear: 3 } },
            ),
            outcome(
              'Ganaste los ocho kilos y perdiste el primer paso. Sos más fuerte que nunca y llegás tarde a todo.',
              'You gained the eight kilos and lost your first step. You are stronger than you have ever been and late to everything.',
              'bad',
              {
                attributes: { physical: 5, scoring: -3, playmaking: -3, defense: -2 },
                hidden: { coachTrust: 6, morale: -8 },
              },
            ),
          ),
      },
      {
        label: loc('Hacer la mitad y quedarme con las manos', 'Do half of it and keep my hands'),
        resolve: () =>
          outcome(
            'Ganaste tres kilos y seguiste tirando dos horas por día. En noviembre te sacó del quinteto un tipo que te empujaba y no te podía marcar.',
            'You gained three kilos and kept shooting two hours a day. In November you lost your place to a boy who could shove you off the ball and could not guard you.',
            'neutral',
            { attributes: { scoring: 3, playmaking: 1, physical: -2 }, hidden: { coachTrust: -10, hype: 5 } },
          ),
      },
    ],
  }),

  event({
    id: 'dev_sit_a_year',
    weight: 22,
    stages: ['development'],
    category: 'coach',
    title: loc('El año que no jugás', 'The Year You Do Not Play'),
    body: (ctx) =>
      loc(
        `El cuerpo técnico te ofrece un trato: esta temporada no jugás un minuto oficial, entrenás todos los días con los grandes y volvés dentro de un año con doce meses de ventaja. Tenés ${ctx.player.age} y todos los que empezaron con vos ya debutaron.`,
        `The staff offer you a deal: this season you play not one official minute, you train with the senior men every day, and you come back a year from now twelve months ahead. You are ${ctx.player.age}, and everyone who started out with you has already debuted.`,
      ),
    choices: [
      {
        label: loc('Aceptar el año', 'Take the year'),
        resolve: () =>
          outcome(
            'Doce meses entrenando contra profesionales y ni un partido. Volviste sabiendo más y con un año menos de vidriera.',
            'Twelve months training against professionals and not one game. You came back knowing more, with a year less in the shop window.',
            'neutral',
            { attributes: { defense: 2, mental: 3, scoring: -2 }, hidden: { coachTrust: 10, hype: -6, morale: -2 } },
          ),
      },
      {
        label: loc('Irme a jugar a donde sea', 'Go and play, anywhere'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Treinta minutos por partido en una liga que no mira nadie, y una planilla que sí miran. En junio llamaron tres clubes.',
              'Thirty minutes a game in a league nobody watches, and a stat sheet people do watch. In June three clubs called.',
              'good',
              { attributes: { scoring: 4, playmaking: 1 }, hidden: { hype: 20, coachTrust: -8 } },
            ),
            outcome(
              'Jugaste un año entero contra nadie y te volviste muy bueno en cosas que arriba no sirven. Volviste con números y sin oficio.',
              'You played a whole year against nobody and got very good at things that do not work at the level above. You came back with numbers and no craft.',
              'bad',
              { attributes: { scoring: 2, defense: -3, mental: -1 }, hidden: { hype: 4, morale: -2 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'dev_first_agent',
    weight: 22,
    stages: ['development'],
    category: 'business',
    title: loc('El primer representante', 'The First Agent'),
    body: () =>
      loc(
        'Un representante con dos jugadores en Europa te quiere firmar por cinco años y jura que te consigue contrato antes de junio. Tu entrenador dice que ese tipo se queda con el veinte por ciento y deja de atender el teléfono cuando las cosas se ponen feas.',
        'An agent with two players in Europe wants to sign you for five years and swears he will have you a contract before June. Your coach says the man keeps twenty per cent and stops answering his phone when things turn ugly.',
      ),
    choices: [
      {
        label: loc('Firmarle los cinco años', 'Sign him the five years'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Te consiguió equipo en agosto y te pagó el vuelo. Hizo todo lo que dijo que iba a hacer y se quedó exactamente con lo que dijo que se iba a quedar.',
              'He found you a club in August and paid for the flight. He did everything he said he would do and kept exactly what he said he would keep.',
              'good',
              { attributes: { scoring: 3, mental: 1 }, hidden: { hype: 16 } },
            ),
            outcome(
              'Te mandó a tres pruebas en tres países en cinco semanas y no salió ninguna. Seguís atado cuatro años más.',
              'He sent you to three trials in three countries in five weeks and none of them came off. You are tied to him for four more years.',
              'bad',
              { attributes: { physical: -2, mental: 2 }, hidden: { morale: -6, wear: 5 } },
            ),
          ),
      },
      {
        label: loc('Que me maneje mi entrenador un año más', 'Let my coach handle it one more year'),
        resolve: () =>
          outcome(
            'Atendió el teléfono todo el año y no cobró nada. También dejó pasar dos ofertas porque no le gustaban los clubes, y una de esas dos era buena.',
            'He answered the phone all year and charged nothing. He also let two offers go because he did not like the clubs, and one of those two was a good one.',
            'neutral',
            { attributes: { mental: 2, scoring: 1 }, hidden: { coachTrust: 12, hype: -2 } },
          ),
      },
    ],
  }),

  event({
    id: 'dev_new_staff',
    weight: 22,
    stages: ['development'],
    category: 'coach',
    title: loc('Cuerpo técnico nuevo', 'A New Staff'),
    body: () =>
      loc(
        'Echaron al entrenador que te subió. El que llegó trajo su ayudante, su sistema y su propia idea de qué es un jugador de tu puesto. En la primera reunión no te miró una vez.',
        'They sacked the coach who promoted you. The new one brought his own assistant, his own system and his own idea of what a player in your position is. In the first meeting he did not look at you once.',
      ),
    choices: [
      {
        label: loc('Aprenderme el sistema nuevo de memoria', 'Learn the new system by heart'),
        resolve: () =>
          outcome(
            'Fuiste el primero en saberse las veinte jugadas y el último en entrar. Te ganaste el respeto del ayudante y ni un minuto del entrenador.',
            'You were the first to know all twenty sets and the last one off the bench. You earned the assistant’s respect and none of the head coach’s minutes.',
            'neutral',
            { attributes: { mental: 3, defense: 2, scoring: -3 }, hidden: { coachTrust: 8, morale: -4, hype: -2 } },
          ),
      },
      {
        label: loc('Jugar a mi manera hasta que me saque', 'Play my own way until he takes me off'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.45,
            outcome(
              'Para la quinta fecha el sistema se había acomodado a vos. Nadie lo dijo en voz alta y lo vieron todos.',
              'By the fifth game the system had bent around you. Nobody said it out loud and everybody saw it.',
              'good',
              { attributes: { scoring: 5, playmaking: 2 }, hidden: { hype: 16, coachTrust: 4 } },
            ),
            outcome(
              'Te sacó a los siete minutos del primer partido y no volviste a entrar hasta marzo.',
              'He took you off after seven minutes of the first game and you did not get back on until March.',
              'bad',
              { attributes: { scoring: -2, mental: 1 }, hidden: { coachTrust: -16, morale: -8 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'dev_unpaid_wages',
    weight: 20,
    stages: ['development'],
    category: 'business',
    title: loc('El sueldo que no llega', 'The Wage That Does Not Arrive'),
    body: (ctx) =>
      loc(
        `Hace tres meses que ${ctx.team.name.es} no paga. Los grandes ya arreglaron por afuera y se van; los pibes se quedan porque no tienen a dónde ir. El entrenador te pide que juegues igual y no promete nada.`,
        `${ctx.team.name.en} has not paid anybody for three months. The senior men have settled privately and are leaving; the kids stay because they have nowhere to go. The coach asks you to keep playing and promises nothing.`,
      ),
    choices: [
      {
        label: loc('Jugar igual y esperar', 'Play anyway and wait'),
        resolve: () =>
          outcome(
            'Jugaste treinta partidos gratis y terminaste jugando treinta minutos porque no quedaba nadie más. En septiembre te pagaron la mitad.',
            'You played thirty games for nothing and ended up playing thirty minutes a night because there was nobody else left. In September they paid you half of it.',
            'neutral',
            {
              attributes: { scoring: 2, playmaking: 2, physical: -2 },
              hidden: { coachTrust: 10, morale: -4, wear: 2, hype: 8 },
            },
          ),
      },
      {
        label: loc('Rescindir y buscar equipo en enero', 'Terminate and look for a club in January'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.45,
            outcome(
              'Firmaste en un club chico que paga poco y paga. Media temporada tranquila y un cuerpo técnico que te enseñó a defender.',
              'You signed with a small club that pays little and pays. Half a quiet season and a staff who taught you how to guard people.',
              'good',
              { attributes: { defense: 4, mental: 2 }, hidden: { morale: 8, coachTrust: 4 } },
            ),
            outcome(
              'En enero no hay mercado. Entrenaste solo hasta agosto y arrancaste de cero.',
              'There is no market in January. You trained alone until August and started again from nothing.',
              'bad',
              { attributes: { physical: 2, scoring: -3 }, hidden: { hype: -8, morale: -12 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'dev_man_ahead',
    weight: 22,
    stages: ['development'],
    category: 'locker_room',
    title: loc('El que estaba adelante', 'The Man Ahead of You'),
    body: () =>
      loc(
        'Al titular de tu puesto se le dobló el tobillo en el calentamiento del sábado. Escuchaste el ruido desde el otro aro. El entrenador dice tu apellido sin mirar la planilla y salís a la cancha.',
        'The starter in your position rolled his ankle in Saturday’s warm-up. You heard the noise from the other basket. The coach says your surname without looking at the sheet, and out you go.',
      ),
    choices: [
      {
        label: loc('Jugar como si el puesto fuera mío', 'Play as though the job is mine'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Cuando volvió, en marzo, el puesto ya no estaba libre. Él lo entendió antes que vos.',
              'When he came back in March the job was no longer free. He understood that before you did.',
              'good',
              { attributes: { scoring: 4, mental: 1 }, hidden: { hype: 12, coachTrust: 6 } },
            ),
            outcome(
              'Once partidos de titular y once partidos tirando sin pensar. Cuando volvió, el entrenador respiró.',
              'Eleven games as a starter and eleven games of shooting without thinking. When he came back, the coach exhaled.',
              'bad',
              { attributes: { scoring: 2, playmaking: -3 }, hidden: { hype: -2, coachTrust: -10, morale: -4 } },
            ),
          ),
      },
      {
        label: loc('Guardarle el lugar y jugar simple', 'Keep his seat warm and play simple'),
        resolve: () =>
          outcome(
            'Cero pérdidas, quince minutos y ni un tiro que no fuera obvio. Cuando volvió te dio las gracias, y el entrenador te mandó al banco contento con vos.',
            'No turnovers, fifteen minutes, and not one shot that was not obvious. When he came back he thanked you, and the coach sent you to the bench pleased with you.',
            'neutral',
            { attributes: { playmaking: 2, defense: 2, scoring: -2 }, hidden: { coachTrust: 10 } },
          ),
      },
    ],
  }),

  event({
    id: 'dev_rented_room',
    weight: 22,
    stages: ['development'],
    category: 'personal',
    title: loc('La pieza alquilada', 'The Rented Room'),
    body: () =>
      loc(
        'Vivís solo por primera vez, en una ciudad donde no conocés a nadie. El gimnasio abre a las siete y cierra a las diez, y en el medio hay catorce horas y una pieza con una ventana.',
        'You are living alone for the first time, in a city where you know nobody. The gym opens at seven and closes at ten, and in between there are fourteen hours and a room with one window.',
      ),
    choices: [
      {
        label: loc('Llenar las horas en el gimnasio', 'Fill the hours in the gym'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Tres sesiones por día porque no había otra cosa que hacer. Nunca en tu vida mejoraste tanto en tan poco tiempo.',
              'Three sessions a day because there was nothing else to do. You never improved so much in so little time, before or since.',
              'good',
              { attributes: { scoring: 4, physical: 3 }, hidden: { hype: 6, wear: 3, morale: -6 } },
            ),
            outcome(
              'Te rompiste solo, sin nadie que te dijera basta. En febrero tenías una rodilla que se quejaba y a nadie a quien contárselo.',
              'You broke yourself down alone, with nobody there to say enough. By February you had a knee that complained and nobody to tell.',
              'bad',
              { attributes: { scoring: 2, physical: -4 }, hidden: { wear: 6, morale: -12 } },
            ),
          ),
      },
      {
        label: loc('Buscar gente y una vida afuera del gimnasio', 'Find people and a life outside the gym'),
        resolve: () =>
          outcome(
            'Conseguiste tres amigos que no juegan al básquet y una rutina de persona. Entrenaste bien y no entrenaste de más, que a los veinte parece poco.',
            'You found three friends who do not play basketball and the routine of a human being. You trained well and did not train too much, which at twenty feels like nothing.',
            'neutral',
            { attributes: { mental: 3, scoring: -1 }, hidden: { morale: 12, wear: -4, hype: 2 } },
          ),
      },
    ],
  }),

  event({
    id: 'dev_armband',
    weight: 20,
    stages: ['development'],
    category: 'locker_room',
    title: loc('La cinta en un equipo que pierde', 'The Armband on a Losing Team'),
    body: () =>
      loc(
        'Sos el más joven del plantel y el entrenador te da la capitanía porque los grandes ya bajaron los brazos. Perdieron nueve de diez y quedan veinte partidos.',
        'You are the youngest in the dressing room and the coach gives you the armband because the senior men have already dropped their arms. You have lost nine of ten with twenty games to go.',
      ),
    choices: [
      {
        label: loc('Hablar en el vestuario aunque sea el más chico', 'Speak up in the dressing room, youngest or not'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Dos tipos de treinta te escucharon y el resto los siguió. Ganaron seis de los últimos veinte, que en ese equipo era una barbaridad.',
              'Two thirty-year-olds listened, and the rest followed them. You won six of the last twenty, which at that club was an outrage.',
              'good',
              { attributes: { mental: 5, playmaking: 2 }, hidden: { coachTrust: 12, morale: 8 } },
            ),
            outcome(
              'Hablaste y se hizo un silencio que duró hasta junio. Aprendiste a los veinte que la cinta no te la da el entrenador.',
              'You spoke and there was a silence that lasted until June. You learned at twenty that the armband is not the coach’s to give.',
              'bad',
              { attributes: { mental: 3, scoring: -3 }, hidden: { morale: -12 } },
            ),
          ),
      },
      {
        label: loc('Callarme y jugar mis minutos', 'Say nothing and play my minutes'),
        resolve: () =>
          outcome(
            'Cerraste la boca y metiste dieciocho por noche en un equipo que perdía por veinte. Los números fueron tuyos; la temporada no fue de nadie.',
            'You kept your mouth shut and put up eighteen a night for a team losing by twenty. The numbers were yours; the season belonged to nobody.',
            'neutral',
            { attributes: { scoring: 3, defense: -3 }, hidden: { hype: 8, coachTrust: -6 } },
          ),
      },
    ],
  }),

  event({
    id: 'dev_knee_cleanup',
    weight: 20,
    stages: ['development'],
    category: 'injury',
    title: loc('La rodilla que se puede limpiar', 'The Knee They Could Clean Out'),
    body: () =>
      loc(
        'Hace un año que la rodilla se te llena de líquido cada quince días. El médico dice que es una artroscopía de cuarenta minutos y tres meses afuera, y que si no la hacés ahora la vas a hacer más adelante y peor.',
        'For a year your knee has filled with fluid every fortnight. The doctor says it is a forty-minute arthroscopy and three months out, and that if you do not do it now you will do it later and worse.',
      ),
    choices: [
      {
        label: loc('Operarme ahora y perder la temporada', 'Have it done now and lose the season'),
        resolve: () =>
          outcome(
            'Tres meses de camilla a los veinte años, mirando cómo se armaba el equipo sin vos. Volviste en abril con una rodilla que no se acuerda de nada.',
            'Three months on a treatment table at twenty, watching the team take shape without you. You came back in April with a knee that remembers nothing.',
            'neutral',
            { attributes: { physical: 3, scoring: -2 }, hidden: { wear: -14, hype: -4, morale: -4 } },
          ),
      },
      {
        label: loc('Aguantar la temporada y después vemos', 'Get through the season and see'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Jugaste los treinta y cuatro partidos con hielo y una faja. La rodilla aguantó y la temporada fue tuya.',
              'You played all thirty-four games with ice and a strap. The knee held and the season was yours.',
              'good',
              { attributes: { scoring: 5, mental: 2 }, hidden: { hype: 16, wear: 8 } },
            ),
            outcome(
              'Aguantó hasta febrero. Lo que era una artroscopía de cuarenta minutos terminó siendo una operación de verdad.',
              'It held until February. What was a forty-minute arthroscopy turned into a real operation.',
              'bad',
              { attributes: { physical: -5, scoring: -2 }, hidden: { wear: 16, morale: -8 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'dev_friend_quits',
    weight: 20,
    stages: ['development'],
    category: 'personal',
    title: loc('El que se bajó', 'The One Who Got Off'),
    body: () =>
      loc(
        'Tu amigo de las inferiores dejó de jugar y entró a trabajar de ocho a seis. Cobra todos los meses, tiene auto y los sábados a la mañana duerme. En el asado te pregunta, sin maldad, hasta cuándo vas a seguir con esto.',
        'Your friend from the youth team stopped playing and took a job, eight to six. He gets paid every month, he has a car, and on Saturday mornings he sleeps. At the barbecue he asks you, with no malice in it, how long you are going to keep doing this.',
      ),
    choices: [
      {
        label: loc('Ponerme un plazo y decirlo en voz alta', 'Set myself a deadline and say it out loud'),
        resolve: () =>
          outcome(
            'Te diste dos años. Desde el lunes entrenaste distinto: sin vueltas, sin excusas y con un reloj adentro que no se apaga nunca.',
            'You gave yourself two years. From that Monday you trained differently: no detours, no excuses, and a clock inside you that never switches off.',
            'neutral',
            { attributes: { mental: 4, scoring: 1, physical: -1 }, hidden: { morale: -8, wear: 1, hype: 4 } },
          ),
      },
      {
        label: loc('Buscarme un trabajo de medio tiempo por las dudas', 'Find a part-time job, just in case'),
        resolve: () =>
          outcome(
            'Cuatro horas por día atrás de un mostrador y entrenamiento a las siete de la tarde. Dormís menos, tenés plata propia y dejaste de jugar con miedo.',
            'Four hours a day behind a counter and training at seven in the evening. You sleep less, you have money of your own, and you stopped playing afraid.',
            'neutral',
            { attributes: { mental: 3, physical: -2, scoring: -1 }, hidden: { morale: 10, wear: 1 } },
          ),
      },
    ],
  }),
]
