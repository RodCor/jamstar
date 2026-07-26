/** Professional-career events: contracts, coaches, locker rooms, money. */

import type { GameEvent } from '../types'
import { teamsInLeague } from '@/data/teams'
import { event, gamble, gate, loc, money, outcome } from './helpers'

export const PRO_EVENTS: GameEvent[] = [
  event({
    id: 'pro_first_contract',
    weight: 30,
    stages: ['development', 'prime'],
    category: 'business',
    requires: gate.isPro,
    title: loc('Primer contrato profesional', 'First Professional Contract'),
    body: (ctx) =>
      loc(
        `${ctx.team.name.es} te pone dos contratos sobre la mesa: uno corto y barato que te deja libre en dos años, y uno largo que te asegura la plata pero te ata.`,
        `${ctx.team.name.en} puts two contracts on the table: a short, cheap one that leaves you free in two years, and a long one that guarantees the money but ties you down.`,
      ),
    choices: [
      {
        label: loc('El corto. Apuesto a mí mismo', 'The short one. I bet on myself'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.58,
            outcome(
              'Explotaste en dos años y renegociaste por el triple. La apuesta salió.',
              'You broke out in two years and renegotiated for triple. The bet paid.',
              'good',
              { money: 400_000, hidden: { hype: 10, morale: 8 } },
            ),
            outcome(
              'Te estancaste justo cuando había que rendir. Firmaste el siguiente por menos.',
              'You stalled at exactly the wrong moment. You signed the next one for less.',
              'bad',
              { hidden: { morale: -12, hype: -6 } },
            ),
          ),
      },
      {
        label: loc('El largo. Quiero tranquilidad', 'The long one. I want security'),
        resolve: () =>
          outcome(
            'Plata asegurada y cabeza tranquila. Jugás suelto, aunque el club se quedó con la mejor parte.',
            'Guaranteed money and a clear head. You play free, though the club got the better end of it.',
            'neutral',
            { money: 250_000, hidden: { morale: 10, hype: -3 } },
          ),
      },
    ],
  }),

  event({
    id: 'pro_coach_conflict',
    weight: 32,
    stages: ['development', 'prime', 'veteran'],
    once: false,
    requires: gate.all(gate.isPro, (ctx) => ctx.player.hidden.coachTrust < 55),
    category: 'coach',
    title: loc('Choque con el entrenador', 'Clash With the Coach'),
    body: (ctx) =>
      loc(
        `El entrenador de ${ctx.team.name.es} te sacó a los seis minutos del primer cuarto y no te miró en todo el partido. En el vestuario hay silencio.`,
        `The coach at ${ctx.team.name.en} pulled you six minutes into the first quarter and never looked your way again. The locker room is silent.`,
      ),
    choices: [
      {
        label: loc('Encararlo de frente', 'Confront them directly'),
        resolve: (ctx) =>
          gamble(
            ctx,
            ctx.player.attributes.leadership > 60 ? 0.62 : 0.34,
            outcome(
              'Hablaron cuarenta minutos a puertas cerradas. Salieron entendiéndose.',
              'You talked for forty minutes behind closed doors. You came out understanding each other.',
              'good',
              { hidden: { coachTrust: 20, morale: 8, hype: -2 } },
            ),
            outcome(
              'Se filtró la discusión a la prensa. Ahora sos "el problema del vestuario".',
              'The argument leaked to the press. Now you are "the locker room problem".',
              'bad',
              { hidden: { coachTrust: -18, morale: -10, hype: 4 } },
            ),
          ),
      },
      {
        label: loc('Tragarme el enojo y entrenar más', 'Swallow it and outwork everyone'),
        resolve: () =>
          outcome(
            'Fuiste el primero en llegar durante tres meses. El entrenador no lo dijo, pero volvió a ponerte.',
            'You were first in the gym for three months. The coach never said anything, but you started again.',
            'good',
            { attributes: { shooting: 3, defense: 2 }, hidden: { coachTrust: 12, morale: -4 } },
          ),
      },
      {
        label: loc('Pedir salir del club', 'Ask to leave the club'),
        available: (ctx) => ctx.player.hidden.hype > 35,
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Te dejaron ir a un lugar donde te querían. A veces la solución es la puerta.',
              'They let you go somewhere you were wanted. Sometimes the answer is the door.',
              'good',
              { hidden: { morale: 14, coachTrust: 10 } },
            ),
            outcome(
              'Te negaron la salida y te congelaron. Una temporada entera mirando desde el banco.',
              'They refused and froze you out. A whole season watching from the bench.',
              'bad',
              { hidden: { coachTrust: -22, morale: -18, hype: -8 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'pro_big_money_abroad',
    weight: 26,
    stages: ['prime', 'veteran'],
    category: 'transfer',
    requires: gate.all(gate.isPro, gate.minAge(24), gate.minHype(40)),
    title: loc('La oferta imposible de rechazar', 'The Offer You Cannot Refuse'),
    body: () =>
      loc(
        `Un club de una liga menor te ofrece ${money(9_000_000).es} por temporada. Es cuatro veces lo que ganás. Nadie que juegue ahí vuelve a una liga grande.`,
        `A club in a lesser league offers you ${money(9_000_000).en} per season. Four times what you earn. Nobody who goes there comes back to a big league.`,
      ),
    choices: [
      {
        label: loc('Tomar la plata', 'Take the money'),
        resolve: () =>
          outcome(
            'Te aseguraste la vida de tu familia por dos generaciones. También desapareciste del mapa competitivo.',
            'You secured your family for two generations. You also vanished from the competitive map.',
            'neutral',
            {
              money: 9_000_000,
              hidden: { hype: -26, morale: 10 },
              transferTo: { tier: 3 },
            },
          ),
      },
      {
        label: loc('Rechazarla. Quiero competir', 'Turn it down. I want to compete'),
        resolve: () =>
          outcome(
            'Dijiste que no a una fortuna. Tu agente no te habló por un mes; el vestuario te respetó para siempre.',
            'You said no to a fortune. Your agent did not speak to you for a month; the locker room respected you forever.',
            'good',
            { attributes: { leadership: 5 }, hidden: { morale: 6, hype: 6, coachTrust: 8 } },
          ),
      },
    ],
  }),

  event({
    id: 'pro_locker_room_leader',
    weight: 24,
    stages: ['prime', 'veteran'],
    category: 'locker_room',
    requires: gate.all(gate.isPro, gate.hasPlayed(3)),
    title: loc('La cinta de capitán', 'The Captaincy'),
    body: (ctx) =>
      loc(
        `El capitán de ${ctx.team.name.es} se fue. El vestuario está dividido entre los jóvenes y los veteranos, y todos te miran a vos.`,
        `The captain at ${ctx.team.name.en} left. The locker room is split between the young players and the veterans, and everyone is looking at you.`,
      ),
    choices: [
      {
        label: loc('Aceptar y poner orden', 'Take it and impose order'),
        resolve: (ctx) =>
          gamble(
            ctx,
            ctx.player.attributes.leadership > 62 ? 0.75 : 0.42,
            outcome(
              'Uniste el vestuario. El equipo pasó de pelear el descenso a pelear el título.',
              'You united the room. The team went from fighting relegation to fighting for the title.',
              'epic',
              { attributes: { leadership: 8, iq: 3 }, hidden: { coachTrust: 16, morale: 12, hype: 8 } },
            ),
            outcome(
              'Te quedó grande. Los veteranos te pasaron por encima y el grupo se rompió del todo.',
              'It was too big for you. The veterans steamrolled you and the group broke apart.',
              'bad',
              { hidden: { coachTrust: -12, morale: -14 } },
            ),
          ),
      },
      {
        label: loc('Rechazarla y concentrarme en jugar', 'Decline and focus on playing'),
        resolve: () =>
          outcome(
            'Sin la carga del vestuario, tu juego dio un salto. El equipo, no tanto.',
            'Without the locker room on your shoulders, your game jumped. The team, less so.',
            'neutral',
            { attributes: { shooting: 4, athleticism: 2 }, hidden: { morale: 4 } },
          ),
      },
    ],
  }),

  event({
    id: 'pro_trade_deadline',
    weight: 26,
    stages: ['prime', 'veteran'],
    once: false,
    category: 'transfer',
    requires: gate.all(gate.isPro, gate.hasPlayed(2)),
    title: loc('Fecha límite de traspasos', 'Trade Deadline'),
    body: (ctx) =>
      loc(
        `Tu nombre está en todas las versiones. ${ctx.team.name.es} escucha ofertas y tu agente te pregunta qué querés hacer.`,
        `Your name is in every rumour. ${ctx.team.name.en} is listening to offers, and your agent asks what you want to do.`,
      ),
    choices: [
      {
        label: loc('Pedir que me manden a un candidato al título', 'Ask to be sent to a contender'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.48,
            outcome(
              'Terminaste en un equipo que pelea arriba, con un rol más chico pero un anillo posible.',
              'You landed on a team fighting at the top, with a smaller role but a ring in reach.',
              'good',
              { hidden: { morale: 10, coachTrust: -6 }, transferTo: { tier: 1 } },
            ),
            outcome(
              'No se cerró nada y el club se enteró de que querías irte. Ambiente irrespirable.',
              'Nothing closed, and the club found out you wanted out. The air turned poisonous.',
              'bad',
              { hidden: { coachTrust: -14, morale: -12 } },
            ),
          ),
      },
      {
        label: loc('Decir públicamente que me quiero quedar', 'Say publicly that I want to stay'),
        resolve: () =>
          outcome(
            'La hinchada te adoptó como propio. El club te renovó sin que lo pidieras.',
            'The fans adopted you as one of their own. The club renewed you without being asked.',
            'good',
            { money: 600_000, hidden: { morale: 12, coachTrust: 10, hype: 4 } },
          ),
      },
      {
        label: loc('No decir nada y dejar que pase', 'Say nothing and let it play out'),
        resolve: () =>
          outcome(
            'Pasó la fecha y seguís donde estabas. Nadie ganó, nadie perdió.',
            'The deadline passed and you are where you were. Nobody won, nobody lost.',
            'neutral',
            { hidden: { morale: -2 } },
          ),
      },
    ],
  }),

  event({
    id: 'pro_sponsor_deal',
    weight: 22,
    stages: ['prime', 'veteran'],
    category: 'business',
    requires: gate.minHype(45),
    title: loc('Contrato con una marca', 'Sponsorship Deal'),
    body: () =>
      loc(
        'Una marca deportiva global te ofrece una campaña. Buena plata, pero exige veinte días de rodaje en plena pretemporada.',
        'A global sports brand offers you a campaign. Good money, but it demands twenty shooting days in the middle of preseason.',
      ),
    choices: [
      {
        label: loc('Firmar. Esto también es la carrera', 'Sign. This is part of the career too'),
        resolve: () =>
          outcome(
            'Tu cara quedó en carteles de medio mundo. Llegaste a la temporada sin pretemporada.',
            'Your face went up on billboards half the world over. You arrived at the season with no preseason.',
            'neutral',
            { money: 1_800_000, hidden: { hype: 18, coachTrust: -8, wear: 4 } },
          ),
      },
      {
        label: loc('Pedir que lo muevan a después de la temporada', 'Ask them to move it to the off-season'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Aceptaron. Ganaste la plata y no perdiste un solo entrenamiento.',
              'They agreed. You got the money and did not miss a single practice.',
              'good',
              { money: 1_500_000, hidden: { hype: 14 } },
            ),
            outcome(
              'Se lo dieron a otro jugador. La marca no volvió a llamar.',
              'They gave it to another player. The brand never called again.',
              'bad',
              { hidden: { hype: -4, morale: -4 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'pro_bad_interview',
    weight: 22,
    stages: ['development', 'prime', 'veteran'],
    once: false,
    category: 'media',
    title: loc('La entrevista que se fue de las manos', 'The Interview That Got Away From You'),
    body: () =>
      loc(
        'Después de una derrota dura, un periodista te preguntó por el planteo del entrenador. Contestaste sin pensar y quedó grabado.',
        'After a brutal loss, a reporter asked about the coach’s game plan. You answered without thinking, and it is on tape.',
      ),
    choices: [
      {
        label: loc('Sostener lo que dije', 'Stand by what I said'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.4,
            outcome(
              'La mitad del país te dio la razón. Te convertiste en una voz que pesa.',
              'Half the country agreed with you. You became a voice that carries weight.',
              'good',
              { attributes: { leadership: 4 }, hidden: { hype: 14, coachTrust: -10 } },
            ),
            outcome(
              'El club te multó y el entrenador dejó de contar con vos.',
              'The club fined you and the coach stopped counting on you.',
              'bad',
              { money: -120_000, hidden: { coachTrust: -20, morale: -8 } },
            ),
          ),
      },
      {
        label: loc('Pedir disculpas públicas', 'Apologise publicly'),
        resolve: () =>
          outcome(
            'Diste marcha atrás en conferencia de prensa. Se apagó rápido, aunque quedó la sensación de que te bajaste los pantalones.',
            'You walked it back at a press conference. It died down fast, though it looked like you folded.',
            'neutral',
            { hidden: { coachTrust: 8, hype: -6, morale: -4 } },
          ),
      },
    ],
  }),

  event({
    id: 'pro_homecoming',
    weight: 20,
    stages: ['veteran', 'twilight'],
    category: 'transfer',
    requires: gate.all(gate.minAge(31), (ctx) => ctx.country.domesticLeagueIds.length > 0),
    title: loc('La vuelta a casa', 'The Homecoming'),
    body: (ctx) =>
      loc(
        `El club que te formó en ${ctx.country.name.es} te quiere de vuelta. Pagan una fracción de lo que ganás, pero te ofrecen retirarte como ídolo.`,
        `The club that made you back in ${ctx.country.name.en} wants you back. They pay a fraction of what you earn, but they offer you the chance to retire as an idol.`,
      ),
    choices: [
      {
        label: loc('Volver. Quiero cerrar el círculo', 'Go back. I want to close the circle'),
        resolve: (ctx) => {
          const homeClubs = teamsInLeague(ctx.country.domesticLeagueIds[0])
          const club = ctx.rng.pick(homeClubs)
          return outcome(
            `Estadio lleno para tu presentación en ${club.name.es}. Los que te vieron con quince años lloraron.`,
            `A full arena for your unveiling at ${club.name.en}. The people who watched you at fifteen cried.`,
            'epic',
            {
              hidden: { morale: 22, coachTrust: 14, hype: 6 },
              transferTo: { teamId: club.id },
            },
          )
        },
      },
      {
        label: loc('Todavía no. Me queda básquet arriba', 'Not yet. I still have top-level basketball in me'),
        resolve: () =>
          outcome(
            'Rechazaste el homenaje anticipado. Te quedaste peleando donde la exigencia es real.',
            'You turned down the early tribute. You stayed where the demand is real.',
            'neutral',
            { hidden: { morale: -4, hype: 4 } },
          ),
      },
    ],
  }),

  event({
    id: 'pro_teammate_feud',
    weight: 22,
    stages: ['prime', 'veteran'],
    once: false,
    category: 'locker_room',
    requires: gate.isPro,
    title: loc('Pelea con un compañero', 'Falling Out With a Teammate'),
    body: (ctx) =>
      loc(
        `La estrella de ${ctx.team.name.es} te acusó delante de todos de jugar para vos mismo. Casi terminan a las manos en el vestuario.`,
        `The star at ${ctx.team.name.en} accused you in front of everyone of playing for yourself. It nearly came to blows in the locker room.`,
      ),
    choices: [
      {
        label: loc('Bancar la postura', 'Hold my ground'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.45,
            outcome(
              'Se respetaron después de eso. La química mejoró justamente porque se dijeron la verdad.',
              'You respected each other afterwards. The chemistry improved precisely because the truth got said.',
              'good',
              { attributes: { leadership: 4 }, hidden: { morale: 6 } },
            ),
            outcome(
              'El vestuario eligió bando y no fue el tuyo. Temporada larga.',
              'The locker room picked a side, and it was not yours.',
              'bad',
              { hidden: { morale: -16, coachTrust: -10 } },
            ),
          ),
      },
      {
        label: loc('Buscarlo en privado y arreglarlo', 'Find them in private and fix it'),
        resolve: () =>
          outcome(
            'Comieron juntos, hablaron dos horas y salieron siendo un equipo de verdad.',
            'You ate together, talked for two hours, and came out an actual team.',
            'good',
            { attributes: { leadership: 3, iq: 2 }, hidden: { morale: 10, coachTrust: 6 } },
          ),
      },
    ],
  }),

  event({
    id: 'pro_ring_chase',
    weight: 24,
    stages: ['veteran', 'twilight'],
    category: 'transfer',
    requires: gate.all(gate.minAge(32), gate.hasPlayed(8)),
    title: loc('Cazar el anillo', 'Chasing the Ring'),
    body: (ctx) =>
      loc(
        `Un candidato serio al título te ofrece el mínimo y quince minutos por partido. En ${ctx.team.name.es} sos titular indiscutido en un equipo que no gana nada.`,
        `A genuine title contender offers you the minimum and fifteen minutes a game. At ${ctx.team.name.en} you are an untouchable starter on a team that wins nothing.`,
      ),
    choices: [
      {
        label: loc('Ir por el anillo, aunque sea de suplente', 'Go for the ring, even off the bench'),
        resolve: () =>
          outcome(
            'Aceptaste un rol chico por primera vez en tu vida. Estás donde se juegan las cosas importantes.',
            'You accepted a small role for the first time in your life. You are where the important games happen.',
            'neutral',
            { money: -400_000, hidden: { morale: 6, coachTrust: -4 }, transferTo: { tier: 1 } },
          ),
      },
      {
        label: loc('Quedarme donde soy importante', 'Stay where I matter'),
        resolve: () =>
          outcome(
            'Preferiste seguir siendo el que decide los partidos, aunque los partidos no decidan nada.',
            'You chose to keep being the one who decides games, even if the games decide nothing.',
            'neutral',
            { hidden: { morale: 8, coachTrust: 8 } },
          ),
      },
    ],
  }),

  event({
    id: 'pro_business_venture',
    weight: 18,
    stages: ['prime', 'veteran'],
    category: 'business',
    requires: (ctx) => ctx.player.earnings > 2_000_000,
    title: loc('La inversión', 'The Investment'),
    body: () =>
      loc(
        'Un excompañero te propone meter una parte importante de tus ahorros en su negocio. Promete el doble en tres años.',
        'A former teammate proposes putting a serious chunk of your savings into their business. They promise double in three years.',
      ),
    choices: [
      {
        label: loc('Invertir', 'Invest'),
        resolve: (ctx) =>
          gamble(
            ctx,
            ctx.player.attributes.iq > 65 ? 0.6 : 0.38,
            outcome(
              'Salió. Tenés ingresos que no dependen de que tus rodillas aguanten.',
              'It worked. You have income that does not depend on your knees holding up.',
              'good',
              { money: 2_400_000, hidden: { morale: 8 } },
            ),
            outcome(
              'Perdiste casi todo. Aprendiste tarde que un amigo no es un asesor financiero.',
              'You lost almost all of it. You learned late that a friend is not a financial adviser.',
              'bad',
              { money: -1_600_000, hidden: { morale: -14 } },
            ),
          ),
      },
      {
        label: loc('Poner la plata en algo aburrido y seguro', 'Put it somewhere boring and safe'),
        resolve: () =>
          outcome(
            'Índices, plazos fijos, cero adrenalina. En diez años vas a agradecerlo.',
            'Index funds, fixed terms, zero adrenaline. In ten years you will be grateful.',
            'good',
            { money: 700_000, attributes: { iq: 2 } },
          ),
      },
    ],
  }),
]
