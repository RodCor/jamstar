/**
 * Where you are from, as a deck rather than as a flag.
 *
 * Every other file here writes cards that any player can draw; this one writes
 * cards that only make sense in one place. A `fromCountry` gate takes several
 * codes at a time because the cultures overlap: the potrero is the same on both
 * banks of the Río de la Plata, and a cantera in Málaga and one in Bologna ask
 * a fifteen-year-old the same question.
 *
 * Coverage is a hard requirement rather than a nice-to-have: every country gets
 * a pair of cards of its own at youth and a pair shared with the countries that
 * run their basketball the same way, so nobody's early career is thinner than
 * anybody else's.
 */

import type { GameEvent } from '../types'
import { event, gamble, gate, loc, outcome } from './helpers'

export const ORIGIN_EVENTS: GameEvent[] = [
  // --- Río de la Plata: AR, UY ---

  event({
    id: 'origin_rp_potrero',
    weight: 24,
    stages: ['youth'],
    category: 'personal',
    requires: gate.fromCountry('AR', 'UY'),
    title: loc('El potrero', 'The Dirt Court'),
    body: (ctx) =>
      loc(
        `Atrás del club hay una cancha de cemento partido, con un aro sin red y un tablero de madera hinchada. Los sábados se llena de tipos de treinta que juegan por la gaseosa. Tenés ${ctx.player.age} años y te miran como a un pibe.`,
        `Behind the club there is a cracked concrete court, a netless rim and a warped wooden backboard. On Saturdays it fills with thirty-year-olds playing for a bottle of Coke. You are ${ctx.player.age} and they look at you like a kid.`,
      ),
    choices: [
      {
        label: loc('Meterme en la rueda y aguantar los codazos', 'Get in the run and take the elbows'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.65,
            outcome(
              'Te empujaron hasta que dejaste de retroceder. Ya nadie de tu categoría te saca del poste bajo.',
              'They shoved you until you stopped giving ground. Nobody in your age group moves you off the low post now.',
              'good',
              { attributes: { physical: 4, defense: 3, mental: 3 }, hidden: { morale: 4, hype: 8 } },
            ),
            outcome(
              'Un manotazo en la muñeca que quedó mal. Dos semanas escribiendo con la otra mano y tirando de memoria.',
              'A slap on the wrist that never healed right. Two weeks writing with the other hand and shooting from memory.',
              'bad',
              { attributes: { scoring: -1, physical: -1 }, hidden: { wear: 5 } },
            ),
          ),
      },
      {
        label: loc('Quedarme adentro, donde el piso es de parquet', 'Stay inside, where the floor is parquet'),
        resolve: () =>
          outcome(
            'Mil tiros por semana bajo techo. Tenés una mecánica preciosa y no sabés jugar con un tipo encima.',
            'A thousand shots a week under a roof. Your form is beautiful and you have no idea how to play with a body on you.',
            'neutral',
            { attributes: { scoring: 5, physical: -1 }, hidden: { coachTrust: 5 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_rp_micro',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'locker_room',
    requires: gate.fromCountry('AR', 'UY'),
    title: loc('Doce horas de micro', 'Twelve Hours on the Bus'),
    body: (ctx) =>
      loc(
        `${ctx.team.name.es} juega el domingo a mil kilómetros. El micro sale a las once de la noche, llega a las nueve de la mañana y el partido es a las once.`,
        `${ctx.team.name.en} plays a thousand kilometres away on Sunday. The bus leaves at eleven at night, arrives at nine in the morning, and tip-off is at eleven.`,
      ),
    choices: [
      {
        label: loc('Dormir como se pueda en el pasillo', 'Sleep however you can in the aisle'),
        resolve: () =>
          outcome(
            'Jugaste con el cuerpo dormido y las piernas de otro. Algo aprendiste igual: se puede jugar así.',
            'You played with a numb body and someone else’s legs. You learned something anyway: it can be done.',
            'neutral',
            { attributes: { mental: 6, physical: -1 }, hidden: { wear: 5, morale: -2 } },
          ),
      },
      {
        label: loc(
          'Ver el video del rival con el ayudante hasta que amanezca',
          'Watch the opponent’s tape with the assistant until dawn',
        ),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Sabías de memoria a dónde iba cada pase. Ganaron, y el ayudante te empezó a llevar a todos lados.',
              'You knew every pass before it left the hand. You won, and the assistant started taking you everywhere.',
              'good',
              { attributes: { mental: 7, defense: 4 }, hidden: { coachTrust: 8, wear: 6, hype: 9 } },
            ),
            outcome(
              'Bajaste del micro con los ojos rojos y las piernas muertas. Te sacaron a los seis minutos.',
              'You got off the bus with red eyes and dead legs. You were pulled after six minutes.',
              'bad',
              { attributes: { physical: -2 }, hidden: { morale: -8, wear: 6 } },
            ),
          ),
      },
    ],
  }),

  // --- Brasil: BR ---

  event({
    id: 'origin_br_futsal',
    weight: 24,
    stages: ['youth'],
    category: 'personal',
    requires: gate.fromCountry('BR'),
    title: loc('Pies de futsal', 'Futsal Feet'),
    body: () =>
      loc(
        'Hasta los catorce jugaste futsal sobre la baldosa del colegio. Tenés los pies más rápidos del club y las manos duras de tanto atajar. Los dos entrenadores te quieren el mismo sábado.',
        'Until you were fourteen you played futsal on the school’s tiled court. You have the quickest feet in the club and hands hardened from keeping goal. Both coaches want you on the same Saturday.',
      ),
    choices: [
      {
        label: loc('Seguir con los dos un año más', 'Keep doing both for one more year'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.6,
            outcome(
              'Cambiás de dirección como nadie de tu edad, y encima sabés dónde va a estar el que corre sin la pelota.',
              'You change direction like nobody your age, and you already know where the man without the ball is going.',
              'good',
              { attributes: { playmaking: 6, physical: 2 }, hidden: { wear: 5, hype: 8 } },
            ),
            outcome(
              'Dos deportes, un solo cuerpo. Te agarró una pubalgia que no se fue hasta diciembre.',
              'Two sports, one body. A groin injury turned up in March and did not leave until December.',
              'bad',
              { attributes: { physical: -2 }, hidden: { wear: 8, morale: -5 } },
            ),
          ),
      },
      {
        label: loc('Colgar los botines', 'Hang up the boots'),
        resolve: () =>
          outcome(
            'Ganaste medio año de tiro y perdiste al grupo con el que crecías desde los seis.',
            'You gained half a year of shooting and lost the group you had been growing up with since you were six.',
            'neutral',
            { attributes: { scoring: 5, playmaking: 1 }, hidden: { morale: -8, coachTrust: 6 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_br_clube_de_futebol',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'transfer',
    requires: gate.fromCountry('BR'),
    title: loc('El club es un club de fútbol', 'The Club Is a Football Club'),
    body: (ctx) =>
      loc(
        `El básquet de ${ctx.team.name.es} entrena en el gimnasio del fondo, atrás de las canchas de tenis. El fútbol se llevó el presupuesto, el micro y al único kinesiólogo.`,
        `Basketball at ${ctx.team.name.en} trains in the back gym, behind the tennis courts. The football side took the budget, the bus and the only physio.`,
      ),
    choices: [
      {
        label: loc('Bancar y jugar donde sea', 'Stick it out and play wherever'),
        resolve: () =>
          outcome(
            'Dos años sobre un piso que te comía las rodillas. Te hizo duro y te pasó la factura.',
            'Two years on a floor that ate your knees. It made you hard and it sent you the bill.',
            'neutral',
            { attributes: { mental: 7, physical: -2 }, hidden: { morale: -6, coachTrust: 5, hype: 2 } },
          ),
      },
      {
        label: loc('Irme a un club chico que solo hace básquet', 'Move to a small club that only plays basketball'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Cuatro aros, un gimnasio prestado y un entrenador que solo piensa en esto. Te dieron la pelota y no te la sacaron más.',
              'Four hoops, a borrowed gym and a coach who thinks about nothing else. They gave you the ball and never took it back.',
              'good',
              { attributes: { scoring: 9, playmaking: 3 }, hidden: { hype: 12 } },
            ),
            outcome(
              'El club chico se quedó sin plata en septiembre y el torneo lo terminaste sin equipo.',
              'The small club ran out of money in September and you finished the season without a team.',
              'bad',
              { attributes: { scoring: -1 }, hidden: { hype: -6, morale: -8 } },
            ),
          ),
      },
    ],
  }),

  // --- Caribe y México: DO, MX ---

  event({
    id: 'origin_latam_hombres',
    weight: 24,
    stages: ['youth'],
    category: 'personal',
    requires: gate.fromCountry('DO', 'MX'),
    title: loc('El torneo de los grandes', 'The Men’s Tournament'),
    body: (ctx) =>
      loc(
        `En el barrio hay un torneo de mayores que se juega de noche, con apuestas en la tribuna y un árbitro que cobra lo que le conviene. Te ofrecen un lugar: tenés ${ctx.player.age} años y el resto pasa los treinta.`,
        `There is a men’s tournament in the neighbourhood, played at night, with money changing hands in the stands and a referee who calls what suits him. They offer you a spot: you are ${ctx.player.age} and everyone else is past thirty.`,
      ),
    choices: [
      {
        label: loc('Jugarlo. Ahí se paga por ganar', 'Play it. Over there, winning pays'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.6,
            outcome(
              'Aprendiste a jugar sin que te cobren nada. Volviste a tu categoría y te parecía un recreo.',
              'You learned to play with nothing whistled in your favour. Back in your age group it felt like recess.',
              'good',
              { attributes: { physical: 5, mental: 3, defense: 2 }, hidden: { morale: 4, hype: 8 }, money: 900 },
            ),
            outcome(
              'Te pegaron toda la noche y el árbitro miró para otro lado. Terminaste el verano rengueando.',
              'They hit you all night and the referee looked the other way. You spent the rest of the summer limping.',
              'bad',
              { attributes: { physical: -3 }, hidden: { wear: 7, morale: -6 } },
            ),
          ),
      },
      {
        label: loc('Quedarme en la categoría que me toca', 'Stay in my own age group'),
        resolve: () =>
          outcome(
            'Fuiste el mejor de tu edad por mucho, que es otra manera de no aprender nada nuevo.',
            'You were the best your age by a mile, which is another way of learning nothing new.',
            'neutral',
            { attributes: { scoring: 6, mental: -1 }, hidden: { coachTrust: 6 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_latam_scout',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'transfer',
    requires: gate.fromCountry('DO', 'MX'),
    title: loc('El que vino a mirar', 'The Man Who Came to Watch'),
    body: () =>
      loc(
        'Un tipo con acento de otro lado apareció en un partido de tu categoría con una carpeta y una cámara. Dice que trabaja con un colegio en Florida y que te consigue una beca completa.',
        'A man with a foreign accent turned up at one of your youth games with a folder and a camera. He says he works with a school in Florida and can get you a full scholarship.',
      ),
    choices: [
      {
        label: loc('Ir. Es un pasaje y una cama', 'Go. It is a plane ticket and a bed'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'El colegio era real, el gimnasio era enorme y jugaste contra pibes que ya sabían todo lo que a vos te faltaba.',
              'The school was real, the gym was enormous, and you played against kids who already knew everything you were missing.',
              'good',
              { attributes: { scoring: 5, mental: 3, defense: 2 }, hidden: { hype: 14, morale: -8 } },
            ),
            outcome(
              'El colegio era un galpón con dos aros y el tipo cobraba por cabeza. Volviste en enero con la cuenta de tu vieja vacía.',
              'The school was a shed with two hoops and the man was paid by the head. You came home in January with your mother’s account empty.',
              'bad',
              { attributes: { physical: -1, mental: 1 }, hidden: { hype: -6, morale: -14 } },
            ),
          ),
      },
      {
        label: loc('Pedirle que hable con mi entrenador primero', 'Ask him to speak to my coach first'),
        resolve: () =>
          outcome(
            'El tipo dijo que sí y no volvió a aparecer nunca. Tu entrenador te dijo que hiciste bien; capaz tenga razón.',
            'The man said of course, and was never seen again. Your coach told you that you did the right thing; he may even be right.',
            'neutral',
            { attributes: { mental: 4, scoring: 1 }, hidden: { coachTrust: 8 } },
          ),
      },
    ],
  }),

  // --- Balcanes: RS, SI ---

  event({
    id: 'origin_balkan_academy',
    weight: 24,
    stages: ['youth'],
    category: 'transfer',
    requires: gate.fromCountry('RS', 'SI'),
    title: loc('La academia', 'The Academy'),
    body: () =>
      loc(
        'El club tiene un edificio con cuchetas al lado del gimnasio. Doce pibes por habitación, escuela a la mañana, dos entrenamientos por día, y el que no sirve se vuelve a su pueblo en marzo.',
        'The club has a building with bunk beds beside the gym. Twelve boys to a room, school in the morning, two sessions a day, and anyone who is not good enough goes home in March.',
      ),
    choices: [
      {
        label: loc('Entrar. Es la única puerta que hay', 'Go in. It is the only door there is'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.62,
            outcome(
              'Saliste con los pies de un tipo de veinticinco y la cabeza de uno de treinta. Nadie te tuvo que explicar nada dos veces.',
              'You came out with the footwork of a twenty-five-year-old and the head of a thirty-year-old. Nobody had to explain anything twice.',
              'good',
              { attributes: { defense: 5, mental: 4, physical: 2 }, hidden: { coachTrust: 8, morale: -6, hype: 8 } },
            ),
            outcome(
              'En marzo salió la lista y no estabas. Volviste a tu casa en tren, solo, con el bolso del club.',
              'The list went up in March and you were not on it. You went home by train, alone, carrying the club bag.',
              'bad',
              { attributes: { physical: -2, mental: 1 }, hidden: { morale: -16 } },
            ),
          ),
      },
      {
        label: loc('Quedarme en el club del pueblo', 'Stay at the town club'),
        resolve: () =>
          outcome(
            'Seguiste jugando donde te conocen desde chico. Te faltó todo lo que da el roce y te sobró todo lo demás.',
            'You kept playing where they have known you since you were small. You lack everything the grind gives you and have plenty of everything else.',
            'neutral',
            { attributes: { scoring: 4, defense: -1 }, hidden: { morale: 8 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_balkan_coach',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'coach',
    requires: gate.fromCountry('RS', 'SI'),
    title: loc('El entrenador que sacó a tres', 'The Coach Who Made Three Internationals'),
    body: () =>
      loc(
        'Tu entrenador de cadetes sacó tres internacionales en veinte años. Grita, no aplaude nunca, y te hace repetir el mismo bloqueo cuarenta veces hasta que los pies te salen solos.',
        'Your under-16 coach has produced three internationals in twenty years. He shouts, he never claps, and he makes you run the same screen forty times until your feet do it without you.',
      ),
    choices: [
      {
        label: loc('Aguantarle todo', 'Take everything he gives'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.6,
            outcome(
              'A los diecisiete leías un bloqueo directo mejor que la mitad de los profesionales del país.',
              'At seventeen you read a pick and roll better than half the professionals in the country.',
              'good',
              { attributes: { defense: 5, mental: 5, physical: 2 }, hidden: { coachTrust: 10, hype: 4 } },
            ),
            outcome(
              'Dos años de gritos y llegaste a odiar entrar al gimnasio. Jugabas mirando al banco.',
              'Two years of shouting and you came to hate walking into the gym. You played watching the bench.',
              'bad',
              { attributes: { mental: -1, physical: -1 }, hidden: { morale: -14 } },
            ),
          ),
      },
      {
        label: loc('Plantarle cara delante de todos', 'Face him down in front of everyone'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.4,
            outcome(
              'Se hizo un silencio de diez segundos y después siguió el entrenamiento. Nunca más te gritó a vos.',
              'There was a ten-second silence and then practice carried on. He never shouted at you again.',
              'good',
              { attributes: { mental: 7, scoring: 2 }, hidden: { morale: 10, coachTrust: -6, hype: 6 } },
            ),
            outcome(
              'Te mandó a las duchas y te dejó en el quinto equipo hasta fin de año.',
              'He sent you to the showers and left you in the fifth team until June.',
              'bad',
              { attributes: { defense: -1 }, hidden: { coachTrust: -18, morale: -8 } },
            ),
          ),
      },
    ],
  }),

  // --- Lituania y Alemania: LT, DE ---

  event({
    id: 'origin_baltic_town',
    weight: 24,
    stages: ['youth'],
    category: 'media',
    requires: gate.fromCountry('LT', 'DE'),
    title: loc('El pueblo entero en la tribuna', 'The Whole Town in the Stands'),
    body: () =>
      loc(
        'Es un partido de juveniles un martes a la tarde y hay cuatrocientas personas. Te conocen por el nombre, y saben cuántos tiros libres erraste el sábado pasado.',
        'It is a youth game on a Tuesday afternoon and there are four hundred people in. They know your name, and they know how many free throws you missed on Saturday.',
      ),
    choices: [
      {
        label: loc('Jugar para ellos', 'Play for them'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.58,
            outcome(
              'Veintiocho puntos y la gente golpeando la madera. Salir a jugar con ruido dejó de darte miedo.',
              'Twenty-eight points and the whole stand banging on the wood. Playing in noise stopped frightening you.',
              'good',
              { attributes: { scoring: 7, mental: 4 }, hidden: { hype: 12 } },
            ),
            outcome(
              'Erraste dos libres sobre el final y lo escuchaste en la panadería durante un mes.',
              'You missed two free throws late and heard about it in the bakery for a month.',
              'bad',
              { attributes: { scoring: -1, mental: -1 }, hidden: { morale: -10, hype: -4 } },
            ),
          ),
      },
      {
        label: loc('Ponerme los auriculares y no escuchar a nadie', 'Put the headphones on and hear nobody'),
        resolve: () =>
          outcome(
            'Aprendiste a apagar el ruido, y con el ruido se te apagó también algo que empujaba.',
            'You learned to switch the noise off, and something that used to push you switched off with it.',
            'neutral',
            { attributes: { mental: 5, scoring: -1 }, hidden: { morale: 4 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_baltic_key',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'personal',
    requires: gate.fromCountry('LT', 'DE'),
    title: loc('La llave del gimnasio', 'The Key to the Gym'),
    body: () =>
      loc(
        'El encargado del polideportivo te dio una copia de la llave. Podés entrar a las seis de la mañana, antes del colegio, si te bancás que la calefacción no arranca hasta las ocho.',
        'The caretaker at the sports hall cut you a key. You can let yourself in at six in the morning, before school, if you can stand the heating not coming on until eight.',
      ),
    choices: [
      {
        label: loc('Todos los días, aunque haya nieve', 'Every day, snow or not'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.65,
            outcome(
              'Doscientos tiros antes de la primera hora, todo el invierno. La muñeca aprendió sola.',
              'Two hundred shots before first period, all winter. The wrist learned it on its own.',
              'good',
              { attributes: { scoring: 8, mental: 2 }, hidden: { wear: 4, hype: 8 } },
            ),
            outcome(
              'Tanto tiro solo y en frío te dejó un codo que se queja cada vez que baja la temperatura.',
              'All that shooting alone in the cold left you an elbow that complains whenever it gets cold.',
              'bad',
              { attributes: { scoring: 1, physical: -2 }, hidden: { wear: 8, morale: -6 } },
            ),
          ),
      },
      {
        label: loc('Devolverla. Prefiero dormir y crecer', 'Give it back. I would rather sleep and grow'),
        resolve: () =>
          outcome(
            'Dormiste nueve horas por noche durante dos años y el cuerpo lo agradeció. Las manos, no tanto.',
            'You slept nine hours a night for two years and your body thanked you for it. Your hands, less so.',
            'neutral',
            { attributes: { physical: 5, scoring: -1 }, hidden: { wear: -5, morale: 4 } },
          ),
      },
    ],
  }),

  // --- Mediterráneo: ES, IT, GR, TR ---

  event({
    id: 'origin_med_cantera',
    weight: 24,
    stages: ['youth'],
    category: 'coach',
    requires: gate.fromCountry('ES', 'IT', 'GR', 'TR'),
    title: loc('La cantera', 'The Cantera'),
    body: (ctx) =>
      loc(
        `${ctx.team.name.es} tiene ocho equipos por debajo del primero y una lista de espera para entrar. Te subieron de categoría: sos el más chico del vestuario por dos años.`,
        `${ctx.team.name.en} has eight teams below the first and a waiting list to get in. They moved you up a level: you are the youngest in that dressing room by two years.`,
      ),
    choices: [
      {
        label: loc('Callarme la boca y aprender', 'Shut up and learn'),
        resolve: () =>
          outcome(
            'Un año entero de siete minutos por partido y de mirar. Salís sabiendo jugar sin la pelota, que es lo que casi nadie sabe.',
            'A whole year of seven minutes a game and watching. You come out knowing how to play without the ball, which almost nobody does.',
            'neutral',
            { attributes: { mental: 5, defense: 4, scoring: -2 }, hidden: { coachTrust: 8, morale: -4, hype: -2 } },
          ),
      },
      {
        label: loc('Golpear la puerta y pedir minutos', 'Knock on the door and ask for minutes'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.45,
            outcome(
              'Te los dieron, y a la tercera semana ya no te los sacaron. En el club dicen que tenés cara de duro.',
              'They gave them to you, and by the third week they stopped taking them away. Around the club they say you have a hard face.',
              'good',
              { attributes: { scoring: 8, mental: 1 }, hidden: { hype: 14 } },
            ),
            outcome(
              'Te escucharon con mucha educación y te bajaron de categoría en enero.',
              'They heard you out very politely and moved you back down a level in January.',
              'bad',
              { attributes: { scoring: -1, mental: -1 }, hidden: { coachTrust: -14, morale: -8 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'origin_med_fondo',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'media',
    requires: gate.fromCountry('ES', 'IT', 'GR', 'TR'),
    title: loc('El fondo del pabellón', 'The End Behind the Basket'),
    body: () =>
      loc(
        'Vas a jugar a la cancha del clásico rival. Es un partido de juveniles y hay trescientos tipos en el fondo cantando tu apellido con una canción que no es un elogio.',
        'You are playing away at the club you are not allowed to lose to. It is a youth game and there are three hundred of them behind the basket singing your surname to a tune that is not a compliment.',
      ),
    choices: [
      {
        label: loc('Contestarles con el partido', 'Answer them with the game'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Les metiste treinta y te fuiste caminando despacio. Ese fondo todavía se acuerda de tu apellido, y ahora lo dice distinto.',
              'You dropped thirty and walked off slowly. That end still remembers your surname, and now they say it differently.',
              'good',
              { attributes: { scoring: 6, mental: 5 }, hidden: { hype: 14, morale: 8 } },
            ),
            outcome(
              'Jugaste enfurecido y forzaste todo. Tres tiros libres al hierro con la cancha entera contando en voz alta.',
              'You played furious and forced everything. Three free throws off the iron with the whole hall counting out loud.',
              'bad',
              { attributes: { scoring: -1, mental: -1 }, hidden: { morale: -12, hype: -4 } },
            ),
          ),
      },
      {
        label: loc('No mirar la tribuna y jugar simple', 'Do not look up and play simple'),
        resolve: () =>
          outcome(
            'Once pases, cero pérdidas y ni una palabra. El entrenador lo vio; la gente no.',
            'Eleven assists, no turnovers and not one word. The coach saw it; nobody else did.',
            'neutral',
            { attributes: { playmaking: 5, mental: 2, scoring: -1 }, hidden: { coachTrust: 8 } },
          ),
      },
    ],
  }),

  // --- Francia: FR ---

  event({
    id: 'origin_fr_centre',
    weight: 24,
    stages: ['youth'],
    category: 'transfer',
    requires: gate.fromCountry('FR'),
    title: loc('El centro de formación', 'The National Centre'),
    body: () =>
      loc(
        'La federación te quiere en su centro: internado, colegio adentro, y un cuerpo técnico que te va a medir todo, desde el salto hasta las horas de sueño. Tu club te formó desde los ocho y no cobra un peso por vos.',
        'The federation wants you in their centre: boarding, school on site, and a staff that will measure everything from your vertical to your hours of sleep. Your club raised you from the age of eight and gets nothing for you.',
      ),
    choices: [
      {
        label: loc('Firmar con la federación', 'Sign with the federation'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.6,
            outcome(
              'Tres años de gente que sabe exactamente qué te falta. Salís con un cuerpo construido a propósito.',
              'Three years of people who know exactly what you are missing. You come out with a body that was built on purpose.',
              'good',
              { attributes: { defense: 4, physical: 4, mental: 2 }, hidden: { hype: 10, morale: -8 } },
            ),
            outcome(
              'Te trataron como a un expediente. Cumpliste todos los tests y no jugaste un partido que importara.',
              'They treated you like a file. You passed every test and did not play a game that mattered.',
              'bad',
              { attributes: { scoring: -1, mental: 1 }, hidden: { morale: -12, hype: -4 } },
            ),
          ),
      },
      {
        label: loc('Quedarme donde me enseñaron a jugar', 'Stay where they taught me to play'),
        resolve: () =>
          outcome(
            'El club te puso con los mayores a los diecisiete. Aprendiste jugando, que es más lento y se olvida menos.',
            'The club put you with the seniors at seventeen. You learned by playing, which is slower and sticks better.',
            'neutral',
            { attributes: { playmaking: 4, mental: 1, physical: -1 }, hidden: { coachTrust: 12 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_fr_dos_camisetas',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'national',
    requires: gate.fromCountry('FR'),
    title: loc('Dos camisetas el mismo verano', 'Two Shirts, One Summer'),
    body: (ctx) =>
      loc(
        `El europeo juvenil y la pretemporada de ${ctx.team.name.es} caen en las mismas seis semanas. Los dos te dijeron, con mucha educación, que la decisión es tuya.`,
        `The junior Europeans and preseason at ${ctx.team.name.en} fall in the same six weeks. Both of them told you, very politely, that it is your decision.`,
      ),
    choices: [
      {
        label: loc('El seleccionado juvenil', 'The junior national team'),
        resolve: () =>
          outcome(
            'Seis partidos en once días contra lo mejor del continente. Volviste fundido y sabiendo exactamente dónde estás parado.',
            'Six games in eleven days against the best on the continent. You came back wrecked and knowing exactly where you stand.',
            'neutral',
            { attributes: { mental: 4, defense: 2, physical: -1 }, hidden: { hype: 10, coachTrust: -10, wear: 6 } },
          ),
      },
      {
        label: loc('La pretemporada del club', 'Club preseason'),
        resolve: () =>
          outcome(
            'Seis semanas de fuerza con el primer equipo y un lugar en la rotación en octubre. Nadie afuera del club se enteró.',
            'Six weeks in the weight room with the first team and a rotation spot in October. Nobody outside the club noticed.',
            'good',
            { attributes: { physical: 5, scoring: 1, mental: -1 }, hidden: { coachTrust: 12, hype: -5 } },
          ),
      },
    ],
  }),

  // --- Norteamérica: US, CA ---

  event({
    id: 'origin_na_circuito',
    weight: 24,
    stages: ['youth'],
    category: 'transfer',
    requires: gate.fromCountry('US', 'CA'),
    title: loc('El circuito de verano', 'The Summer Circuit'),
    body: () =>
      loc(
        'Un equipo de verano con patrocinador te ofrece un lugar: cuatro torneos en seis semanas, aeropuertos, hoteles y cien entrenadores universitarios con una carpeta cada uno. Cuatro partidos por día y nadie defiende a nadie.',
        'A sponsored summer team offers you a spot: four tournaments in six weeks, airports, hotels and a hundred college coaches with a folder each. Four games a day and nobody guards anybody.',
      ),
    choices: [
      {
        label: loc('Ir a todos los torneos', 'Go to every tournament'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.6,
            outcome(
              'Metiste treinta en la cancha tres con doce entrenadores parados atrás del banco. El teléfono no paró en todo julio.',
              'You dropped thirty on court three with twelve coaches standing behind the bench. Your phone did not stop all July.',
              'good',
              { attributes: { scoring: 8, defense: -2 }, hidden: { hype: 16, wear: 8 } },
            ),
            outcome(
              'Seis semanas de aeropuertos y partidos sin defensa. Llegaste a septiembre sin piernas y jugando peor.',
              'Six weeks of airports and games with no defence in them. You got to September with no legs and a worse game.',
              'bad',
              { attributes: { scoring: 1, physical: -2 }, hidden: { hype: -4, wear: 10, morale: -6 } },
            ),
          ),
      },
      {
        label: loc('Quedarme a entrenar con el de siempre', 'Stay home and train with the coach I have always had'),
        resolve: () =>
          outcome(
            'Un verano entero de pies, mano izquierda y pesas, en un gimnasio donde no había nadie mirando.',
            'A whole summer of footwork, left hand and weights, in a gym with nobody watching.',
            'neutral',
            { attributes: { defense: 5, physical: 3, scoring: -1 }, hidden: { hype: -4, coachTrust: 8 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_na_otro_deporte',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'personal',
    requires: gate.fromCountry('US', 'CA'),
    title: loc('El entrenador del otro deporte', 'The Other Coach'),
    body: () =>
      loc(
        'El entrenador del otro deporte del colegio te para en el pasillo. Dice que con tu tamaño, en su deporte, en dos años tenés beca asegurada, y que él ya mandó a cuatro.',
        'The coach of the school’s other sport stops you in the hallway. He says that at your size, in his sport, you have a scholarship locked up in two years, and that he has already sent four.',
      ),
    choices: [
      {
        label: loc('Probar una temporada', 'Try a season'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Volviste al básquet en marzo con ocho kilos de más y sin miedo al contacto de nadie.',
              'You came back to basketball in March eight kilos heavier and afraid of contact from nobody.',
              'good',
              { attributes: { physical: 7, mental: 2 }, hidden: { wear: 8, coachTrust: -6, hype: 8 } },
            ),
            outcome(
              'Perdiste una temporada de manos y volviste con un hombro que ya no es el que era.',
              'You lost a season of touch and came back with a shoulder that is not the shoulder you had.',
              'bad',
              { attributes: { physical: 3, scoring: -2, playmaking: -2 }, hidden: { wear: 10, coachTrust: -8, hype: -4 } },
            ),
          ),
      },
      {
        label: loc('Decirle que no y volver al gimnasio', 'Tell him no and go back to the gym'),
        resolve: () =>
          outcome(
            'Elegiste un deporte y lo hiciste bien. En el pasillo te saluda igual, un poco más frío.',
            'You picked one sport and did it properly. He still says hello in the hallway, a little colder.',
            'neutral',
            { attributes: { scoring: 4, playmaking: 3, physical: -1 }, hidden: { coachTrust: 6, hype: 3 } },
          ),
      },
    ],
  }),

  // --- África Occidental: NG, SN, CM ---

  event({
    id: 'origin_waf_camp',
    weight: 24,
    stages: ['youth'],
    category: 'milestone',
    requires: gate.fromCountry('NG', 'SN', 'CM'),
    title: loc('El camp', 'The Camp'),
    body: () =>
      loc(
        'Vinieron a la capital tres días de pruebas: cien pibes, dos aros y una lista de veinte nombres al final. Primero te miden la altura, la envergadura y cuánto saltás. Después, si sobra tiempo, te dejan jugar.',
        'Three days of trials came to the capital: a hundred kids, two hoops and a list of twenty names at the end. First they measure your height, your wingspan and your vertical. Then, if there is time, they let you play.',
      ),
    choices: [
      {
        label: loc('Jugar para que me midan', 'Play so they measure me'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Tapaste seis y volcaste dos. Tu nombre quedó cuarto en la lista y alguien anotó tu teléfono.',
              'You blocked six and dunked twice. Your name went fourth on the list and somebody wrote down your phone number.',
              'good',
              { attributes: { physical: 6, scoring: 2 }, hidden: { hype: 12 } },
            ),
            outcome(
              'Te pasaste tres días saltando para la foto y jugaste como no jugás. La lista salió sin vos.',
              'You spent three days jumping for the photograph and played like someone else. The list went up without you.',
              'bad',
              { attributes: { physical: 1, mental: -1 }, hidden: { hype: -4, morale: -10 } },
            ),
          ),
      },
      {
        label: loc('Jugar como sé, sin mostrar nada', 'Play the way I play, showing nothing'),
        resolve: () =>
          outcome(
            'No entraste en la lista, pero el entrenador de un equipo local te vio pasar la pelota y te llamó al día siguiente.',
            'You did not make the list, but a local coach saw you make one pass and called you the next day.',
            'neutral',
            { attributes: { playmaking: 4, mental: 3, physical: -2 }, hidden: { coachTrust: 8 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_waf_reunion',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'transfer',
    requires: gate.fromCountry('NG', 'SN', 'CM'),
    title: loc('La reunión en casa', 'The Meeting at Home'),
    body: (ctx) =>
      loc(
        `La academia paga el pasaje, el colegio y la comida, y a cambio se queda con una parte de lo que ganes el día que ganes algo. Tenés ${ctx.player.age} años y la reunión es en el patio de tu casa, con toda la familia sentada.`,
        `The academy pays the flight, the school and the food, and in return takes a share of whatever you earn the day you earn anything. You are ${ctx.player.age} and the meeting is in your family’s yard, with everybody sitting down.`,
      ),
    choices: [
      {
        label: loc('Firmar y viajar', 'Sign it and get on the plane'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.6,
            outcome(
              'Comida cuatro veces por día, un preparador físico y rivales de verdad. En un año fuiste otro jugador.',
              'Four meals a day, a strength coach and real opposition. In one year you were a different player.',
              'good',
              { attributes: { scoring: 5, defense: 4, physical: 2 }, hidden: { hype: 14, morale: -10 } },
            ),
            outcome(
              'La academia cerró en febrero y el contrato siguió vivo. Estás lejos, sin equipo, y le debés plata a alguien.',
              'The academy shut in February and the contract stayed alive. You are far away, with no team, and you owe somebody money.',
              'bad',
              { attributes: { mental: 1, physical: -1 }, hidden: { hype: -4, morale: -18 } },
            ),
          ),
      },
      {
        label: loc('No firmar nada. Me quedo', 'Sign nothing. I stay'),
        resolve: () =>
          outcome(
            'Te quedaste jugando en tierra, con tus primos y sin preparador. Nadie te debe nada y nadie te va a venir a buscar.',
            'You stayed playing on dirt, with your cousins and no trainer. Nobody owns a piece of you and nobody is coming to find you.',
            'neutral',
            { attributes: { mental: 5, physical: -1 }, hidden: { morale: 10, hype: -2 } },
          ),
      },
    ],
  }),

  // --- Oceanía: AU ---

  event({
    id: 'origin_au_instituto',
    weight: 24,
    stages: ['youth'],
    category: 'transfer',
    requires: gate.fromCountry('AU'),
    title: loc('El instituto', 'The Institute'),
    body: () =>
      loc(
        'El programa nacional te ofrece una plaza: te mudás solo a la otra punta del país a los dieciséis, con un plan de fuerza escrito por gente que sabe y una cama en una residencia con otros veinte.',
        'The national program offers you a place: you move alone to the other side of the country at sixteen, with a strength plan written by people who know what they are doing and a bed in a residence with twenty others.',
      ),
    choices: [
      {
        label: loc('Aceptar la plaza', 'Take the place'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.62,
            outcome(
              'Dos años de gimnasio bien hecho y de jugar contra los mejores de tu edad todas las semanas.',
              'Two years of properly built strength work and playing the best of your age every single week.',
              'good',
              { attributes: { physical: 5, defense: 4, mental: 1 }, hidden: { hype: 10, morale: -10 } },
            ),
            outcome(
              'Cuatro mil kilómetros de tu casa a los dieciséis. Entrenaste bien y no dormiste bien en dos años.',
              'Four thousand kilometres from home at sixteen. You trained well and did not sleep well for two years.',
              'bad',
              { attributes: { physical: 1, mental: -1 }, hidden: { morale: -16 } },
            ),
          ),
      },
      {
        label: loc('Quedarme en mi ciudad y jugar la liga local', 'Stay in my town and play the local league'),
        resolve: () =>
          outcome(
            'Jugaste contra hombres de treinta en un gimnasio con techo de chapa, con tu viejo en la primera fila.',
            'You played thirty-year-old men in a tin-roofed gym with your dad in the front row.',
            'neutral',
            { attributes: { scoring: 4, mental: 2, physical: -2 }, hidden: { morale: 8, hype: -2 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_au_distancia',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'personal',
    requires: gate.fromCountry('AU'),
    title: loc('Cuatro horas hasta el partido', 'Four Hours to the Game'),
    body: () =>
      loc(
        'El rival más cercano está a cuatro horas de auto. Tu vieja maneja los sábados a las cinco de la mañana y vuelve de noche, todos los fines de semana desde que tenés doce.',
        'The nearest opponent is a four-hour drive away. Your mum drives at five on Saturday mornings and gets back at night, every weekend since you were twelve.',
      ),
    choices: [
      {
        label: loc('Mudarme solo a la ciudad grande', 'Move to the city on my own'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Un club con cuatro entrenamientos por semana y rivales a veinte minutos. El nivel te subió de golpe.',
              'A club with four sessions a week and opponents twenty minutes away. Your level jumped all at once.',
              'good',
              { attributes: { scoring: 5, defense: 4 }, hidden: { hype: 12, morale: -12 } },
            ),
            outcome(
              'Una pieza alquilada, dieciséis años y nadie con quien comer. Jugabas pensando en otra cosa.',
              'A rented room, sixteen years old and nobody to eat with. You played thinking about something else.',
              'bad',
              { attributes: { scoring: -1 }, hidden: { morale: -16, hype: -4 } },
            ),
          ),
      },
      {
        label: loc('Seguir viajando con ella', 'Keep making the drive with her'),
        resolve: () =>
          outcome(
            'Ocho horas de auto por partido durante tres años. Llegabas duro y no te faltó ni uno.',
            'Eight hours in the car per game for three years. You arrived stiff and you never missed one.',
            'neutral',
            { attributes: { mental: 5, physical: 1 }, hidden: { morale: 8, wear: 5 } },
          ),
      },
    ],
  }),

  // --- China: CN ---

  event({
    id: 'origin_cn_escuela_deportiva',
    weight: 24,
    stages: ['youth'],
    category: 'coach',
    requires: gate.fromCountry('CN'),
    title: loc('La escuela deportiva', 'The Sports School'),
    body: () =>
      loc(
        'Te eligieron a los doce por la altura de tus padres y una radiografía de la muñeca. Entrenás seis horas por día en un edificio donde también dormís, y el colegio es lo que queda en el medio.',
        'They picked you at twelve for your parents’ height and an X-ray of your wrist. You train six hours a day in a building where you also sleep, and school is whatever fits in between.',
      ),
    choices: [
      {
        label: loc('Entrenar las seis horas y no preguntar', 'Do the six hours and ask nothing'),
        resolve: () =>
          outcome(
            'Fundamentos repetidos diez mil veces. Nada te sale mal y nada te sale distinto.',
            'Fundamentals repeated ten thousand times. Nothing you do is wrong and nothing you do is different.',
            'neutral',
            {
              attributes: { physical: 4, defense: 4, playmaking: -2 },
              hidden: { coachTrust: 10, morale: -8, wear: 6, hype: 2 },
            },
          ),
      },
      {
        label: loc('Robar horas para jugar suelto con los mayores', 'Steal hours to play loose with the older ones'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'En esas horas robadas aprendiste lo único que no te podían enseñar ahí adentro: a decidir solo.',
              'In those stolen hours you learned the one thing they could not teach you in there: how to decide on your own.',
              'good',
              { attributes: { playmaking: 6, scoring: 2 }, hidden: { morale: 8, coachTrust: -8, hype: 6 } },
            ),
            outcome(
              'Te encontraron afuera dos veces. La segunda te sacaron de la lista del equipo A por seis meses.',
              'They caught you outside twice. The second time they took you off the A-team list for six months.',
              'bad',
              { attributes: { playmaking: 1, physical: -1 }, hidden: { coachTrust: -16, morale: -6 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'origin_cn_ficha',
    weight: 22,
    stages: ['youth', 'breakout'],
    category: 'transfer',
    requires: gate.fromCountry('CN'),
    title: loc('El club es dueño de tu ficha', 'The Club Owns Your Registration'),
    body: (ctx) =>
      loc(
        `${ctx.team.name.es} te formó y tiene tu ficha hasta los veintiocho años. Un club más grande preguntó por vos y la respuesta fue que no estás en venta, ni ahora ni en cinco años.`,
        `${ctx.team.name.en} raised you and holds your registration until you are twenty-eight. A bigger club asked about you and the answer was that you are not for sale, not now and not in five years.`,
      ),
    choices: [
      {
        label: loc('Aceptarlo y hacerme dueño del equipo que tengo', 'Accept it and take over the team I have'),
        resolve: () =>
          outcome(
            'Sos el mejor jugador de un club que no va a ganar nada. Te dieron la pelota y todos los minutos que quieras.',
            'You are the best player at a club that will not win anything. They gave you the ball and every minute you want.',
            'neutral',
            { attributes: { scoring: 7, playmaking: 3, mental: -1 }, hidden: { coachTrust: 12 } },
          ),
      },
      {
        label: loc('Pelear la ficha', 'Fight the registration'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.4,
            outcome(
              'Salió a favor tuyo después de un año de papeles. Sos libre y en el club no te saludan más.',
              'It went your way after a year of paperwork. You are free and nobody at the club says hello any more.',
              'good',
              { attributes: { mental: 5, scoring: 1 }, hidden: { hype: 12, coachTrust: -10 } },
            ),
            outcome(
              'Perdiste, y encima perdiste un año entrenando aparte con el segundo entrenador.',
              'You lost, and you lost a year on top of it, training on your own with the second coach.',
              'bad',
              { attributes: { mental: -1, scoring: -1 }, hidden: { coachTrust: -16, morale: -12 } },
            ),
          ),
      },
    ],
  }),

  // --- Compartidas: los países donde una institución maneja tu desarrollo ---

  event({
    id: 'origin_system_plan',
    weight: 20,
    stages: ['breakout', 'development'],
    category: 'coach',
    requires: gate.fromCountry('US', 'CA', 'FR', 'DE', 'AU', 'CN'),
    title: loc('El plan de cuatro años', 'The Four-Year Plan'),
    body: () =>
      loc(
        'Arriba tuyo hay un plan con tu nombre escrito: cuánto tenés que pesar, en qué posición vas a jugar y en qué temporada te toca ser importante. Esta temporada, según el plan, no te toca.',
        'Somewhere above you there is a plan with your name on it: what you should weigh, what position you will play, and which season is the one where you matter. This season, according to the plan, is not it.',
      ),
    choices: [
      {
        label: loc('Cumplir el plan', 'Follow the plan'),
        resolve: () =>
          outcome(
            'Hiciste todo lo que decía la carpeta. Ganaste ocho kilos de músculo y perdiste un año de jugar.',
            'You did everything the folder said. You gained eight kilos of muscle and lost a year of playing.',
            'neutral',
            { attributes: { physical: 5, mental: 3, scoring: -3 }, hidden: { coachTrust: 10, hype: -2 } },
          ),
      },
      {
        label: loc('Romperlo y jugar como quiero', 'Break it and play the way I want'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.45,
            outcome(
              'Veintidós puntos en un partido que no tenías que jugar. El plan se reescribió esa misma semana.',
              'Twenty-two points in a game you were not supposed to play. The plan was rewritten that week.',
              'good',
              { attributes: { scoring: 7, playmaking: 2 }, hidden: { hype: 16, coachTrust: -8 } },
            ),
            outcome(
              'Te fuiste del sistema y el sistema siguió sin vos. Terminaste el año en el cuarto puesto de tu puesto.',
              'You stepped outside the system and the system carried on without you. You ended the year fourth in the depth chart.',
              'bad',
              { attributes: { scoring: -2, mental: -1 }, hidden: { coachTrust: -18, morale: -10 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'origin_system_medical',
    weight: 18,
    stages: ['development', 'prime'],
    category: 'injury',
    requires: gate.fromCountry('US', 'CA', 'FR', 'DE', 'AU', 'CN'),
    title: loc('El parte médico', 'The Medical Report'),
    body: () =>
      loc(
        'El cuerpo médico del programa te encontró algo en la espalda en una resonancia de rutina. No te duele nada. Quieren pararte tres meses por prevención, justo en el mejor momento de tu temporada.',
        'The program’s medical staff found something in your back on a routine scan. Nothing hurts. They want to shut you down for three months as a precaution, in the best stretch of your season.',
      ),
    choices: [
      {
        label: loc('Parar los tres meses', 'Take the three months'),
        resolve: () =>
          outcome(
            'Tres meses de camilla y bicicleta fija. Volviste entero, tarde, y con el equipo ya armado sin vos.',
            'Three months of treatment tables and a stationary bike. You came back whole, late, and the team was already built without you.',
            'neutral',
            { attributes: { physical: -1, mental: 4 }, hidden: { wear: -10, hype: -3, coachTrust: 4 } },
          ),
      },
      {
        label: loc('Jugar igual y firmar el papel que me den', 'Play anyway and sign whatever they put in front of me'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'No era nada. Jugaste los treinta partidos y la mejor racha de tu carrera hasta ese momento.',
              'It was nothing. You played all thirty games and the best run of your career to that point.',
              'good',
              { attributes: { scoring: 5, mental: 2 }, hidden: { hype: 15, wear: 8 } },
            ),
            outcome(
              'Era algo. Se te fue la espalda en febrero y volviste en octubre moviéndote distinto.',
              'It was something. Your back went in February and you came back in October moving differently.',
              'bad',
              { attributes: { physical: -4, scoring: -2 }, hidden: { wear: 14, morale: -10 } },
            ),
          ),
      },
    ],
  }),

  // --- Compartidas: los países donde el club es una institución con socios ---

  event({
    id: 'origin_club_asamblea',
    weight: 20,
    stages: ['breakout', 'development'],
    category: 'media',
    requires: gate.fromCountry('AR', 'UY', 'BR', 'ES', 'IT', 'GR', 'TR', 'RS', 'SI', 'LT'),
    title: loc('La asamblea de socios', 'The Members’ Meeting'),
    body: (ctx) =>
      loc(
        `A ${ctx.team.name.es} lo manejan los socios y esta noche votan el presupuesto. Un grupo quiere vender jugadores para pagar deudas; el otro quiere aguantar un año más. Los dos bandos dicen tu apellido desde el micrófono.`,
        `${ctx.team.name.en} is run by its members and tonight they vote on the budget. One side wants to sell players to pay debts; the other wants to hold on one more year. Both sides say your surname into the microphone.`,
      ),
    choices: [
      {
        label: loc('Ir a la asamblea y hablar', 'Go to the meeting and speak'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.45,
            outcome(
              'Hablaste dos minutos y te aplaudieron de pie ochocientas personas. Sos del club de una manera que no se compra.',
              'You spoke for two minutes and eight hundred people stood up. You belong to that club in a way nobody can buy.',
              'good',
              { attributes: { mental: 6, scoring: 2 }, hidden: { hype: 12, morale: 6 } },
            ),
            outcome(
              'Te usaron los dos bandos y al día siguiente estabas en la tapa del diario deportivo, en el medio de un quilombo que no era tuyo.',
              'Both sides used you, and the next day you were on the front of the sports paper, in the middle of a mess that was not yours.',
              'bad',
              { attributes: { mental: -1, scoring: -2 }, hidden: { hype: -4, coachTrust: -12, morale: -10 } },
            ),
          ),
      },
      {
        label: loc('No ir y entrenar', 'Skip it and train'),
        resolve: () =>
          outcome(
            'Estuviste tirando mientras se votaba tu futuro a doscientos metros. En el club alguno tomó nota de que no fuiste.',
            'You were shooting while your future was voted on two hundred metres away. Somebody at the club noted that you did not come.',
            'neutral',
            { attributes: { scoring: 5 }, hidden: { hype: 2, coachTrust: 4, morale: -4 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_club_clausula',
    weight: 18,
    stages: ['development', 'prime'],
    category: 'transfer',
    requires: gate.fromCountry('AR', 'UY', 'BR', 'ES', 'IT', 'GR', 'TR', 'RS', 'SI', 'LT'),
    title: loc('La cláusula', 'The Buyout'),
    body: () =>
      loc(
        'Tu contrato tiene una cláusula de salida que hace tres años parecía enorme y hoy la paga cualquiera. El club se niega a negociarla y tu representante te dice que la pongas vos, de tu bolsillo.',
        'Your contract has a buyout that looked enormous three years ago and today anybody can pay it. The club refuses to negotiate it and your agent tells you to pay it yourself, out of your own pocket.',
      ),
    choices: [
      {
        label: loc('Pagarla yo y salir', 'Pay it myself and leave'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Pagaste, saliste y en agosto ya estabas jugando otra cosa, en otro nivel, con otra cabeza.',
              'You paid, you left, and by August you were playing a different game at a different level with a different head.',
              'good',
              { attributes: { mental: 4, scoring: 3 }, hidden: { hype: 15, morale: -6 }, money: -350_000 },
            ),
            outcome(
              'Pagaste, saliste y el club que te quería cambió de entrenador en julio. Empezaste de cero y más pobre.',
              'You paid, you left, and the club that wanted you changed coach in July. You started from nothing, and poorer.',
              'bad',
              { attributes: { scoring: -3, mental: -1 }, hidden: { hype: -4, morale: -12 }, money: -350_000 },
            ),
          ),
      },
      {
        label: loc('Quedarme y cumplir el contrato', 'Stay and see the contract out'),
        resolve: () =>
          outcome(
            'Dos años más en un club que te quiere y no te puede pagar lo que valés. Los socios te aman; el mercado se olvidó.',
            'Two more years at a club that loves you and cannot pay you what you are worth. The members adore you; the market moved on.',
            'neutral',
            { attributes: { mental: 4, physical: -2 }, hidden: { coachTrust: 12, hype: -1, wear: 6 } },
          ),
      },
    ],
  }),

  // --- Compartidas: los países desde donde hay que salir ---

  event({
    id: 'origin_exit_visa',
    weight: 20,
    stages: ['breakout', 'development'],
    category: 'personal',
    requires: gate.fromCountry('NG', 'SN', 'CM', 'DO', 'MX'),
    title: loc('La visa', 'The Visa'),
    body: () =>
      loc(
        'El torneo donde te van a ver es en diez días y tu visa no salió. En la embajada dan turno para dentro de dos meses. Hay un tipo que dice que lo resuelve por dos mil dólares.',
        'The tournament where they will see you is in ten days and your visa has not come through. The embassy is booking appointments two months out. There is a man who says he can fix it for two thousand dollars.',
      ),
    choices: [
      {
        label: loc('Pagarle al tipo', 'Pay the man'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.45,
            outcome(
              'Salió el papel dos días antes. Llegaste al torneo con lo puesto y jugaste los seis partidos.',
              'The paper came through two days early. You got to the tournament with the clothes you had on and played all six games.',
              'good',
              { attributes: { mental: 3, scoring: 4 }, hidden: { hype: 16 }, money: -2000 },
            ),
            outcome(
              'El tipo dejó de contestar el teléfono. Perdiste el torneo y dos mil dólares que no eran tuyos.',
              'The man stopped answering his phone. You missed the tournament and lost two thousand dollars that were not yours.',
              'bad',
              { attributes: { mental: -1 }, hidden: { hype: -2, morale: -12 }, money: -2000 },
            ),
          ),
      },
      {
        label: loc('Esperar el turno y perderme el torneo', 'Wait for the appointment and miss the tournament'),
        resolve: () =>
          outcome(
            'Dos meses de gimnasio vacío mientras el torneo pasaba por televisión. Volviste más fuerte y más tarde.',
            'Two months in an empty gym while the tournament was on television. You came back stronger and later.',
            'neutral',
            { attributes: { physical: 5, scoring: -1 }, hidden: { morale: -8, wear: -5 } },
          ),
      },
    ],
  }),

  event({
    id: 'origin_exit_casa',
    weight: 18,
    stages: ['development', 'prime'],
    category: 'business',
    requires: gate.fromCountry('NG', 'SN', 'CM', 'DO', 'MX'),
    title: loc('La casa de allá', 'The House Back Home'),
    body: () =>
      loc(
        'Tu primer contrato de verdad cobra en euros y en tu barrio ya lo sabe todo el mundo. Empiezan a llegar los pedidos: un techo, una operación, y el negocio de un tío que no puede fallar.',
        'Your first real contract pays in euros and everybody back home already knows it. The requests start arriving: a roof, an operation, and an uncle’s business that cannot fail.',
      ),
    choices: [
      {
        label: loc('Bancar a todos', 'Carry all of them'),
        resolve: () =>
          outcome(
            'Pagaste el techo, la operación y el negocio del tío. Jugaste toda la temporada con el teléfono prendido.',
            'You paid for the roof, the operation and the uncle’s business. You played the whole season with your phone on.',
            'neutral',
            { attributes: { mental: 5, scoring: -2 }, hidden: { morale: 6, hype: 4 }, money: -120_000 },
          ),
      },
      {
        label: loc('Poner un límite y bancarme las llamadas', 'Set a limit and live with the phone calls'),
        resolve: () =>
          outcome(
            'Dijiste que no dos veces y en tu casa se enteraron las dos. Guardaste la plata y perdiste algo peor.',
            'You said no twice and both times they heard about it at home. You kept the money and lost something worse.',
            'neutral',
            { attributes: { scoring: 3, mental: -2 }, hidden: { morale: -12 } },
          ),
      },
    ],
  }),
]
