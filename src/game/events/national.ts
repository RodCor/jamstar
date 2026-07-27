/** National team: call-ups, snubs, and the tournaments that define a generation. */

import type { GameEvent } from '../types'
import { continentalCup } from '@/data/countries'
import { event, gamble, gate, loc, outcome } from './helpers'

export const NATIONAL_EVENTS: GameEvent[] = [
  event({
    id: 'nat_first_callup',
    weight: 30,
    stages: ['development', 'prime'],
    category: 'national',
    requires: gate.all(gate.isPro, gate.minAge(19), gate.minHype(30)),
    title: loc('Primera convocatoria', 'First Call-Up'),
    body: (ctx) =>
      loc(
        `Te llamaron de la ${ctx.country.nationalTeam.es}. Es la ventana de verano y venís de una temporada larguísima. Tu club te sugiere que la saltees.`,
        `${ctx.country.nationalTeam.en} called you up. It is the summer window and you are coming off a very long season. Your club suggests you skip it.`,
      ),
    choices: [
      {
        label: loc('Ir. Se juega una sola vez la primera', 'Go. You only get one first time'),
        resolve: (ctx) =>
          outcome(
            `Cantaste el himno con la camiseta de ${ctx.country.name.es} puesta. Tu viejo lloró en la tribuna.`,
            `You sang the anthem wearing the ${ctx.country.name.en} shirt. Your dad cried in the stands.`,
            'epic',
            { attributes: { mental: 6 }, hidden: { hype: 14, morale: 18, wear: 6 } },
          ),
      },
      {
        label: loc('Quedarme a descansar', 'Stay and rest'),
        resolve: () =>
          outcome(
            'Llegaste entero a la pretemporada. El seleccionador tomó nota de tu ausencia.',
            'You arrived at preseason fresh. The national coach took note of your absence.',
            'neutral',
            { hidden: { wear: -8, hype: -6, morale: -4 } },
          ),
      },
    ],
  }),

  event({
    id: 'nat_tournament_final',
    weight: 24,
    stages: ['prime', 'veteran'],
    once: false,
    category: 'national',
    requires: gate.all(gate.minAge(22), gate.minHype(45), (ctx) => ctx.league.tier <= 2),
    title: loc('La final', 'The Final'),
    body: (ctx) => {
      const cup = continentalCup(ctx.country)
      return loc(
        `Final del ${cup.es}. Quedan doce segundos, van uno abajo y el entrenador dibuja la última jugada para vos.`,
        `${cup.en} final. Twelve seconds left, one point down, and the coach draws the last play for you.`,
      )
    },
    choices: [
      {
        label: loc('Tirar yo', 'Take the shot myself'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.42 + ctx.player.attributes.scoring / 400,
            outcome(
              'Entró. Sobre la chicharra. Ese video se va a reproducir mientras exista el básquet en tu país.',
              'It went in. At the buzzer. That clip will play for as long as basketball exists in your country.',
              'epic',
              { attributes: { mental: 5 }, hidden: { hype: 26, morale: 24 } },
            ),
            outcome(
              'Se fue larga. En tu país todavía discuten esa jugada.',
              'It rimmed out. They still argue about that possession back home.',
              'bad',
              { hidden: { hype: 6, morale: -20 } },
            ),
          ),
      },
      {
        label: loc('Buscar al que está libre', 'Find the open teammate'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.52,
            outcome(
              'La metió tu compañero. Ganaron y vos hiciste la jugada correcta, aunque la foto sea de otro.',
              'Your teammate made it. You won, and you made the right play, even if the photo belongs to someone else.',
              'good',
              { attributes: { mental: 9 }, hidden: { morale: 16, hype: 8 } },
            ),
            outcome(
              'Falló. Todos dijeron que tendrías que haber tirado vos.',
              'They missed. Everyone said you should have taken it.',
              'bad',
              { attributes: { mental: 2 }, hidden: { morale: -14, hype: -4 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'nat_snub',
    weight: 22,
    stages: ['prime', 'veteran'],
    once: false,
    category: 'national',
    requires: gate.all(gate.minAge(24), gate.isPro),
    title: loc('Te dejaron afuera', 'Left Off the Roster'),
    body: (ctx) =>
      loc(
        `Salió la lista de la ${ctx.country.nationalTeam.es} para el torneo y tu nombre no está. Nadie te avisó antes.`,
        `The ${ctx.country.nationalTeam.en} roster for the tournament came out and your name is not on it. Nobody called you first.`,
      ),
    choices: [
      {
        label: loc('Salir a decir lo que pienso', 'Say exactly what I think'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.4,
            outcome(
              'La presión pública funcionó. Te sumaron a la lista final y jugaste el torneo.',
              'The public pressure worked. They added you to the final roster and you played the tournament.',
              'good',
              { hidden: { hype: 12, morale: 8 } },
            ),
            outcome(
              'Quedaste marcado. No te volvieron a llamar en tres años.',
              'You were marked. They did not call you again for three years.',
              'bad',
              { hidden: { hype: -8, morale: -16 } },
            ),
          ),
      },
      {
        label: loc('Callarme y usarlo de combustible', 'Say nothing and use it as fuel'),
        resolve: () =>
          outcome(
            'Volviste al club con una furia distinta. Fue tu mejor pretemporada en años.',
            'You went back to your club with a different kind of anger. It was your best preseason in years.',
            'good',
            { attributes: { scoring: 3, defense: 3, physical: 2 }, hidden: { morale: -6, coachTrust: 8 } },
          ),
      },
    ],
  }),

  event({
    id: 'nat_naturalization',
    weight: 14,
    stages: ['prime', 'veteran'],
    category: 'national',
    requires: gate.all(gate.minAge(26), gate.minHype(50), (ctx) => ctx.country.strength < 75),
    title: loc('La otra bandera', 'The Other Flag'),
    body: (ctx) =>
      loc(
        `Una federación europea te ofrece la nacionalidad. Con ellos jugarías Juegos Olímpicos; con ${ctx.country.name.es}, probablemente nunca.`,
        `A European federation offers you citizenship. With them you would play Olympic Games; with ${ctx.country.name.en}, probably never.`,
      ),
    choices: [
      {
        label: loc('Aceptar. Quiero jugar en el escenario grande', 'Accept. I want the big stage'),
        resolve: () =>
          outcome(
            'Jugaste unos Juegos Olímpicos. En tu país de origen hay gente que todavía no te lo perdona.',
            'You played an Olympic Games. Back home, there are people who still have not forgiven you.',
            'neutral',
            { hidden: { hype: 18, morale: -12 } },
          ),
      },
      {
        label: loc('Rechazar. Yo represento a mi país', 'Refuse. I represent my country'),
        resolve: (ctx) =>
          outcome(
            `Te convertiste en un símbolo en ${ctx.country.name.es}. Nunca jugaste unos Juegos.`,
            `You became a symbol in ${ctx.country.name.en}. You never played an Olympics.`,
            'good',
            { attributes: { mental: 6 }, hidden: { morale: 16, hype: 4 } },
          ),
      },
    ],
  }),

  event({
    id: 'nat_generation',
    weight: 18,
    stages: ['veteran', 'twilight'],
    category: 'national',
    requires: gate.all(gate.minAge(32), gate.hasPlayed(8)),
    title: loc('El recambio', 'The Handover'),
    body: (ctx) =>
      loc(
        `Sos el más veterano de la ${ctx.country.nationalTeam.es}. Hay un chico de veinte años que juega en tu puesto y es mejor que vos ahora mismo.`,
        `You are the oldest player in the ${ctx.country.nationalTeam.en} squad. There is a twenty-year-old in your position who is better than you right now.`,
      ),
    choices: [
      {
        label: loc('Cederle el lugar y enseñarle todo', 'Give them the spot and teach them everything'),
        resolve: () =>
          outcome(
            'Diez años después, ese chico dijo en su discurso de retiro que vos le enseñaste a ser profesional.',
            'Ten years later, that kid said in their retirement speech that you taught them how to be a professional.',
            'epic',
            { attributes: { mental: 11 }, hidden: { morale: 14 } },
          ),
      },
      {
        label: loc('Pelearle el puesto hasta el final', 'Fight them for the spot to the end'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.4,
            outcome(
              'Le ganaste el puesto un torneo más. El último baile salió bien.',
              'You won the spot for one more tournament. The last dance went well.',
              'good',
              { hidden: { morale: 12, hype: 8, wear: 6 } },
            ),
            outcome(
              'Perdiste la pulseada y encima quedaste como el veterano que no sabe irse.',
              'You lost the fight, and came off as the veteran who does not know when to leave.',
              'bad',
              { hidden: { morale: -14, hype: -8, wear: 6 } },
            ),
          ),
      },
    ],
  }),
]
