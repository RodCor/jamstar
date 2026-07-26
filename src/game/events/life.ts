/** Media, personal life, and the long goodbye. */

import type { GameEvent } from '../types'
import { event, gamble, gate, loc, outcome } from './helpers'

export const LIFE_EVENTS: GameEvent[] = [
  event({
    id: 'life_viral_moment',
    weight: 24,
    stages: ['development', 'prime'],
    once: false,
    category: 'media',
    requires: gate.isPro,
    title: loc('Momento viral', 'Viral Moment'),
    body: () =>
      loc(
        'Una jugada tuya explotó en redes: ocho millones de reproducciones en dos días. De repente hay micrófonos donde nunca los hubo.',
        'One of your plays exploded online: eight million views in two days. Suddenly there are microphones where there never were any.',
      ),
    choices: [
      {
        label: loc('Aprovechar el momento y exponerme', 'Ride the wave and put myself out there'),
        resolve: () =>
          outcome(
            'Entrevistas, podcasts, campañas. Ganaste visibilidad y perdiste horas de gimnasio.',
            'Interviews, podcasts, campaigns. You gained visibility and lost gym hours.',
            'neutral',
            { money: 250_000, hidden: { hype: 20, coachTrust: -6 } },
          ),
      },
      {
        label: loc('Bajar el perfil y volver al trabajo', 'Keep my head down and get back to work'),
        resolve: () =>
          outcome(
            'Rechazaste todo. El entrenador lo mencionó en la charla de equipo como ejemplo.',
            'You turned it all down. The coach mentioned it in a team meeting as an example.',
            'good',
            { attributes: { shooting: 3, defense: 2 }, hidden: { coachTrust: 12, hype: 4 } },
          ),
      },
    ],
  }),

  event({
    id: 'life_family',
    weight: 22,
    stages: ['prime', 'veteran'],
    category: 'personal',
    requires: gate.minAge(26),
    title: loc('Nació tu primer hijo', 'Your First Child Is Born'),
    body: () =>
      loc(
        'Nació en plena temporada, a seis mil kilómetros de donde estabas jugando. El club te da tres días.',
        'Born mid-season, four thousand miles from where you were playing. The club gives you three days.',
      ),
    choices: [
      {
        label: loc('Perderme partidos y quedarme', 'Miss games and stay'),
        resolve: () =>
          outcome(
            'Te perdiste seis partidos y ninguna primera vez. Volviste con otra cabeza.',
            'You missed six games and no first moments. You came back a different person.',
            'good',
            { attributes: { iq: 3, leadership: 3 }, hidden: { morale: 20, coachTrust: -8 } },
          ),
      },
      {
        label: loc('Volver enseguida. Es mi trabajo', 'Go straight back. It is my job'),
        resolve: () =>
          outcome(
            'Volviste a los tres días y metiste treinta puntos. Es un recuerdo que te sigue incomodando.',
            'You were back in three days and scored thirty. It is a memory that still sits badly.',
            'neutral',
            { hidden: { coachTrust: 10, morale: -8, hype: 4 } },
          ),
      },
    ],
  }),

  event({
    id: 'life_hometown_program',
    weight: 18,
    stages: ['veteran', 'twilight'],
    category: 'personal',
    requires: gate.all(gate.minAge(30), (ctx) => ctx.player.earnings > 3_000_000),
    title: loc('La cancha del barrio, otra vez', 'The Neighbourhood Court, Again'),
    body: (ctx) =>
      loc(
        `Volviste a ${ctx.country.name.es} de visita y encontraste la cancha donde te criaste destruida. Reconstruirla te costaría medio millón.`,
        `You went back to ${ctx.country.name.en} to visit and found the court you grew up on in ruins. Rebuilding it would cost half a million.`,
      ),
    choices: [
      {
        label: loc('Pagarla entera y poner mi nombre', 'Pay for it all and put my name on it'),
        resolve: () =>
          outcome(
            'Cuatrocientos chicos juegan ahí todas las semanas. Es lo mejor que hiciste con la plata del básquet.',
            'Four hundred kids play there every week. It is the best thing you ever did with basketball money.',
            'epic',
            { money: -500_000, attributes: { leadership: 6 }, hidden: { morale: 20, hype: 10 } },
          ),
      },
      {
        label: loc('Pagarla sin que se entere nadie', 'Pay for it and tell nobody'),
        resolve: () =>
          outcome(
            'Se enteraron igual, tres años después, por un vecino. Pesó más así.',
            'They found out anyway, three years later, from a neighbour. It landed harder that way.',
            'good',
            { money: -500_000, attributes: { leadership: 5 }, hidden: { morale: 22, hype: 4 } },
          ),
      },
      {
        label: loc('No es mi responsabilidad', 'It is not my responsibility'),
        resolve: () =>
          outcome(
            'Tenés razón, no lo era. Igual seguís pensando en eso.',
            'You are right, it was not. You still think about it.',
            'neutral',
            { hidden: { morale: -8 } },
          ),
      },
    ],
  }),

  event({
    id: 'life_last_dance',
    weight: 30,
    stages: ['twilight'],
    category: 'milestone',
    requires: gate.minAge(36),
    title: loc('El último baile', 'The Last Dance'),
    body: (ctx) =>
      loc(
        `Tenés ${ctx.player.age} años. El cuerpo avisa todos los días. Podés anunciar que esta es tu última temporada, o seguir mientras aguante.`,
        `You are ${ctx.player.age}. The body sends a message every morning. You can announce this as your final season, or keep going while it holds.`,
      ),
    choices: [
      {
        label: loc('Anunciar la última temporada', 'Announce the final season'),
        resolve: () =>
          outcome(
            'Cada cancha te despidió con una ovación. Jugaste el año más disfrutado de tu carrera.',
            'Every arena sent you off with an ovation. You played the most enjoyable year of your career.',
            'good',
            { hidden: { morale: 24, hype: 14 } },
          ),
      },
      {
        label: loc('Seguir sin fecha de vencimiento', 'Keep going with no end date'),
        resolve: () =>
          outcome(
            'Nada de homenajes. Vas a jugar hasta que nadie te ofrezca contrato.',
            'No tributes. You will play until nobody offers you a contract.',
            'neutral',
            { hidden: { morale: -4, coachTrust: 4 } },
          ),
      },
      {
        label: loc('Retirarme ahora mismo', 'Retire right now'),
        resolve: () =>
          outcome(
            'Lo decidiste en el vestuario después de un partido cualquiera. Te fuiste sin ruido.',
            'You decided it in the locker room after an ordinary game. You left without a sound.',
            'neutral',
            { retire: true },
          ),
      },
    ],
  }),

  event({
    id: 'life_coaching_offer',
    weight: 16,
    stages: ['twilight'],
    category: 'business',
    requires: gate.all(gate.minAge(35), (ctx) => ctx.player.attributes.iq > 62),
    title: loc('La oferta del banco', 'The Offer From the Bench'),
    body: (ctx) =>
      loc(
        `${ctx.team.name.es} te ofrece un puesto de asistente técnico para el año que viene. Significa colgar las zapatillas ahora.`,
        `${ctx.team.name.en} offers you an assistant coaching job for next season. It means hanging up the shoes now.`,
      ),
    choices: [
      {
        label: loc('Aceptar y empezar la segunda carrera', 'Accept and start the second career'),
        resolve: () =>
          outcome(
            'Pasaste del vestuario a la pizarra sin escala. Resultó que siempre habías sido entrenador.',
            'You went from the locker room to the whiteboard with no layover. It turned out you had always been a coach.',
            'good',
            { retire: true },
          ),
      },
      {
        label: loc('Todavía soy jugador', 'I am still a player'),
        resolve: () =>
          outcome(
            'Les dijiste que preguntaran de nuevo el año que viene. Y el siguiente.',
            'You told them to ask again next year. And the year after.',
            'neutral',
            { hidden: { morale: 6 } },
          ),
      },
    ],
  }),

  event({
    id: 'life_milestone_points',
    weight: 20,
    stages: ['veteran', 'twilight'],
    category: 'milestone',
    requires: gate.hasPlayed(10),
    title: loc('Un número redondo', 'A Round Number'),
    body: () =>
      loc(
        'Estás a doce puntos de un récord histórico del club. El partido está definido y quedan cuatro minutos.',
        'You are twelve points from a club record. The game is decided and there are four minutes left.',
      ),
    choices: [
      {
        label: loc('Pedir seguir en cancha', 'Ask to stay on the floor'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Lo conseguiste. Tu nombre queda arriba de todos en la historia del club.',
              'You got it. Your name sits above everyone else in club history.',
              'epic',
              { hidden: { hype: 14, morale: 14 } },
            ),
            outcome(
              'Te quedaste corto por dos puntos y quedó la sensación de haber jugado para vos.',
              'You came up two short, and it looked like you were playing for yourself.',
              'bad',
              { hidden: { coachTrust: -8, morale: -8 } },
            ),
          ),
      },
      {
        label: loc('Salir y dejar jugar a los pibes', 'Come off and let the kids play'),
        resolve: () =>
          outcome(
            'Los suplentes jugaron cuatro minutos que se acuerdan toda la vida. El récord puede esperar.',
            'The bench got four minutes they will remember forever. The record can wait.',
            'good',
            { attributes: { leadership: 5 }, hidden: { coachTrust: 12, morale: 8 } },
          ),
      },
    ],
  }),

  event({
    id: 'life_gambling_scandal',
    weight: 14,
    stages: ['prime', 'veteran'],
    category: 'media',
    requires: gate.all(gate.isPro, gate.hasPlayed(4)),
    title: loc('La investigación', 'The Investigation'),
    body: () =>
      loc(
        'La liga abrió una investigación por apuestas. Vos no apostaste nunca, pero un amigo tuyo usó tu nombre para abrir una cuenta.',
        'The league opened a betting investigation. You never placed a bet, but a friend used your name to open an account.',
      ),
    choices: [
      {
        label: loc('Colaborar con todo desde el primer día', 'Cooperate fully from day one'),
        resolve: () =>
          outcome(
            'Entregaste todo y quedaste limpio en cuatro meses. Perdiste un amigo y ganaste una lección.',
            'You handed over everything and were cleared in four months. You lost a friend and gained a lesson.',
            'good',
            { attributes: { iq: 3 }, hidden: { hype: -6, morale: -6 } },
          ),
      },
      {
        label: loc('Proteger a mi amigo', 'Protect my friend'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.3,
            outcome(
              'La investigación se cerró sola. Tu amigo nunca supo lo que arriesgaste por él.',
              'The investigation closed on its own. Your friend never knew what you risked for him.',
              'neutral',
              { hidden: { morale: 6 } },
            ),
            outcome(
              'Te suspendieron veinticinco partidos por obstrucción. Salió carísimo.',
              'You were suspended twenty-five games for obstruction. It cost a fortune.',
              'bad',
              { money: -900_000, hidden: { hype: -20, coachTrust: -18, morale: -14 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'life_young_prospect',
    weight: 20,
    stages: ['veteran', 'twilight'],
    once: false,
    category: 'locker_room',
    requires: gate.all(gate.minAge(31), gate.isPro),
    title: loc('El que viene por tu puesto', 'The One Coming for Your Spot'),
    body: (ctx) =>
      loc(
        `${ctx.team.name.es} draftea a un chico de diecinueve años que juega exactamente como jugabas vos a esa edad. Todos en el club lo saben.`,
        `${ctx.team.name.en} drafts a nineteen-year-old who plays exactly like you did at that age. Everyone in the building knows it.`,
      ),
    choices: [
      {
        label: loc('Enseñarle todo lo que sé', 'Teach him everything I know'),
        resolve: () =>
          outcome(
            'Le acortaste tres años de aprendizaje. Te sacó el puesto antes, y aun así fue lo correcto.',
            'You cut three years off his learning curve. He took your spot sooner, and it was still the right thing.',
            'good',
            { attributes: { leadership: 7, iq: 3 }, hidden: { coachTrust: 14, morale: 8 } },
          ),
      },
      {
        label: loc('No regalarle nada', 'Give him nothing'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.45,
            outcome(
              'Le ganaste el puesto dos años más. La competencia te mantuvo joven.',
              'You held him off for two more years. The competition kept you young.',
              'good',
              { attributes: { athleticism: 2, defense: 3 }, hidden: { coachTrust: 6 } },
            ),
            outcome(
              'Te pasó por encima igual, y encima quedaste como el veterano amargado.',
              'He passed you anyway, and you came off as the bitter veteran.',
              'bad',
              { hidden: { coachTrust: -14, morale: -12 } },
            ),
          ),
      },
    ],
  }),
]
