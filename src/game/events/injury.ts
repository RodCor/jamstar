/**
 * Injuries. The one category that can end a career outright — which is what
 * makes the Highlight Athlete's bargain mean something.
 */

import type { GameEvent } from '../types'
import { event, gamble, gate, injury, loc, outcome } from './helpers'

export const INJURY_EVENTS: GameEvent[] = [
  event({
    id: 'inj_ankle',
    weight: 30,
    stages: ['development', 'prime', 'veteran', 'twilight'],
    once: false,
    category: 'injury',
    title: loc('Tobillo', 'Ankle'),
    body: () =>
      loc(
        'Caíste sobre el pie de un rival. El tobillo se hinchó al instante. El médico dice tres semanas; el club juega la serie decisiva en dos.',
        'You landed on a defender’s foot. The ankle swelled instantly. The doctor says three weeks; the club plays its decisive series in two.',
      ),
    choices: [
      {
        label: loc('Infiltrarme y jugar', 'Take the injection and play'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Jugaste con el tobillo dormido y ganaron la serie. Te trataron como a un héroe.',
              'You played on a numb ankle and won the series. They treated you like a hero.',
              'good',
              { hidden: { coachTrust: 16, hype: 10, wear: 8 } },
            ),
            outcome(
              'Compensaste con la otra pierna y te desgarraste. Perdiste el doble de tiempo.',
              'You compensated with the other leg and tore something. You lost twice as long.',
              'bad',
              {
                injury: injury('ankle_bad', 'Esguince grave', 'Severe sprain', 30, 12, { physical: -4 }),
                hidden: { morale: -10 },
              },
            ),
          ),
      },
      {
        label: loc('Respetar los plazos', 'Respect the timeline'),
        resolve: () =>
          outcome(
            'Volviste entero. El equipo perdió la serie sin vos y nadie te lo reprochó en voz alta.',
            'You came back whole. The team lost the series without you, and nobody blamed you out loud.',
            'neutral',
            { hidden: { coachTrust: -6, wear: 2 } },
          ),
      },
    ],
  }),

  event({
    id: 'inj_knee_acl',
    weight: 18,
    stages: ['prime', 'veteran'],
    category: 'injury',
    requires: (ctx) => ctx.player.hidden.wear > 25,
    title: loc('La rodilla', 'The Knee'),
    body: () =>
      loc(
        'Cambiaste de dirección sin contacto y sentiste un chasquido. Todo el estadio se quedó en silencio. Es el ligamento cruzado.',
        'You changed direction with no contact and heard a pop. The whole arena went silent. It is the cruciate ligament.',
      ),
    choices: [
      {
        label: loc('Cirugía y rehabilitación completa, sin apurar nada', 'Surgery and a full rehab, no shortcuts'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.68,
            outcome(
              'Catorce meses de trabajo silencioso. Volviste distinto, más lento pero más inteligente.',
              'Fourteen months of quiet work. You came back different — slower, but smarter.',
              'neutral',
              {
                injury: injury('acl', 'Rotura de ligamento cruzado', 'ACL tear', 70, 18, {
                  physical: -9,
                }),
                attributes: { mental: 6 },
                hidden: { morale: -8, hype: -12 },
              },
            ),
            outcome(
              'La rodilla nunca volvió a ser la misma. Perdiste el primer paso para siempre.',
              'The knee never came back. You lost your first step permanently.',
              'bad',
              {
                injury: injury('acl_bad', 'Rodilla comprometida', 'Compromised knee', 90, 26, {
                  physical: -21,
                }),
                hidden: { morale: -20, hype: -18 },
              },
            ),
          ),
      },
      {
        label: loc('Volver en seis meses. Me necesitan', 'Come back in six months. They need me'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.22,
            outcome(
              'Un regreso milagroso. Los médicos todavía no se lo explican.',
              'A miraculous return. The doctors still cannot explain it.',
              'epic',
              {
                injury: injury('acl_fast', 'Rodilla reconstruida', 'Reconstructed knee', 40, 14, {
                  physical: -4,
                }),
                hidden: { hype: 14, coachTrust: 12 },
              },
            ),
            outcome(
              'Volviste antes de tiempo y te rompiste de nuevo. Esta vez fue el final.',
              'You came back too early and broke down again. This time it was the end.',
              'bad',
              {
                retire: true,
                injury: injury('acl_career', 'Lesión de carrera', 'Career-ending injury', 120, 40, {
                  physical: -25,
                }),
              },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'inj_back',
    weight: 22,
    stages: ['veteran', 'twilight'],
    once: false,
    category: 'injury',
    requires: gate.minAge(30),
    title: loc('La espalda', 'The Back'),
    body: () =>
      loc(
        'Hace tres meses que no te podés atar los cordones sin ayuda. Los estudios muestran desgaste, no lesión. No hay cirugía que arregle los años.',
        'For three months you have not been able to tie your own shoes. The scans show wear, not damage. No surgery fixes years.',
      ),
    choices: [
      {
        label: loc('Cambiar todo: dieta, gimnasio, forma de jugar', 'Change everything: diet, gym, how I play'),
        resolve: () =>
          outcome(
            'Reinventaste tu juego alrededor de la cabeza en lugar de las piernas. Ganaste tres años de carrera.',
            'You rebuilt your game around your head instead of your legs. You bought three more years.',
            'good',
            { attributes: { mental: 7, scoring: 3, physical: -3 }, hidden: { wear: -12 } },
          ),
      },
      {
        label: loc('Aguantar con antiinflamatorios', 'Get through it on anti-inflammatories'),
        resolve: () =>
          outcome(
            'Jugaste toda la temporada dopado de ibuprofeno. Los números no bajaron; el cuerpo pagó todo junto después.',
            'You played the whole season on ibuprofen. The numbers held up; the body sent one bill at the end.',
            'bad',
            { hidden: { wear: 16, morale: -6 } },
          ),
      },
    ],
  }),

  event({
    id: 'inj_achilles',
    weight: 14,
    stages: ['veteran', 'twilight'],
    category: 'injury',
    requires: gate.all(gate.minAge(31), (ctx) => ctx.player.hidden.wear > 45),
    title: loc('El tendón de Aquiles', 'The Achilles'),
    body: () =>
      loc(
        'Te diste vuelta buscando quién te había pateado en el talón. No había nadie. Todos en el estadio entendieron antes que vos.',
        'You turned around looking for whoever kicked you in the heel. There was nobody. Everyone in the arena understood before you did.',
      ),
    choices: [
      {
        label: loc('Intentar volver', 'Try to come back'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.35,
            outcome(
              'Volviste a los quince meses. No sos el que eras, pero seguís jugando.',
              'You came back after fifteen months. You are not who you were, but you are still playing.',
              'neutral',
              {
                injury: injury('achilles', 'Tendón de Aquiles', 'Achilles tendon', 82, 30, {
                  physical: -24,
                }),
                attributes: { mental: 4 },
                hidden: { morale: -10 },
              },
            ),
            outcome(
              'El tendón no respondió. Anunciaste el retiro desde una conferencia de prensa con muletas.',
              'The tendon never answered. You announced your retirement at a press conference on crutches.',
              'bad',
              { retire: true },
            ),
          ),
      },
      {
        label: loc('Retirarme ahora, con dignidad', 'Retire now, on my own terms'),
        resolve: () =>
          outcome(
            'Elegiste el final en lugar de que te lo eligieran. Muy pocos lo consiguen.',
            'You chose the ending instead of having it chosen for you. Very few manage that.',
            'neutral',
            { retire: true },
          ),
      },
    ],
  }),

  event({
    id: 'inj_concussion',
    weight: 18,
    stages: ['development', 'prime', 'veteran'],
    once: false,
    category: 'injury',
    title: loc('Golpe en la cabeza', 'Head Knock'),
    body: () =>
      loc(
        'Un codazo involuntario te dejó en el piso treinta segundos. Te sentás en el banco y no recordás el resultado del partido.',
        'An accidental elbow left you on the floor for thirty seconds. You sit on the bench and cannot remember the score.',
      ),
    choices: [
      {
        label: loc('Decir la verdad al médico', 'Tell the doctor the truth'),
        resolve: () =>
          outcome(
            'Protocolo de conmoción, dos semanas afuera. Aburrido, responsable, correcto.',
            'Concussion protocol, two weeks out. Boring, responsible, correct.',
            'neutral',
            { hidden: { coachTrust: -3, wear: 1 } },
          ),
      },
      {
        label: loc('Decir que estoy bien', 'Say I am fine'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.55,
            outcome(
              'Terminaste el partido y no pasó nada. Esta vez.',
              'You finished the game and nothing happened. This time.',
              'neutral',
              { hidden: { coachTrust: 8, wear: 4 } },
            ),
            outcome(
              'Los mareos duraron dos meses. Perdiste medio año y algo de la vista periférica.',
              'The dizziness lasted two months. You lost half a year and some peripheral vision.',
              'bad',
              {
                injury: injury('concussion', 'Conmoción cerebral', 'Concussion', 40, 10, { mental: -3 }),
                hidden: { morale: -12 },
              },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'inj_burnout',
    weight: 18,
    stages: ['prime', 'veteran'],
    category: 'personal',
    requires: (ctx) => ctx.player.hidden.morale < 45,
    title: loc('Agotamiento', 'Burnout'),
    body: () =>
      loc(
        'Hace meses que no disfrutás nada. Llegás al gimnasio y no querés entrar. Nadie sabe, porque los números todavía están bien.',
        'You have not enjoyed anything in months. You get to the gym and cannot make yourself walk in. Nobody knows, because the numbers still look fine.',
      ),
    choices: [
      {
        label: loc('Pedir ayuda profesional', 'Ask for professional help'),
        resolve: () =>
          outcome(
            'Empezaste terapia. Tardó, pero volviste a jugar por las razones por las que empezaste.',
            'You started therapy. It took time, but you went back to playing for the reasons you started.',
            'good',
            { hidden: { morale: 28, wear: -6 }, attributes: { mental: 6 } },
          ),
      },
      {
        label: loc('Tomarme una temporada sabática', 'Take a season off'),
        resolve: () =>
          outcome(
            'Un año entero sin básquet. Volviste con la cabeza limpia y las piernas frescas, pero el mundo siguió sin vos.',
            'A full year away from basketball. You came back clear-headed and fresh-legged, but the world moved on without you.',
            'neutral',
            { hidden: { morale: 22, wear: -18, hype: -20, coachTrust: -12 } },
          ),
      },
      {
        label: loc('Aguantar. Esto se pasa', 'Push through. This passes'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.3,
            outcome(
              'Se te pasó solo. Tuviste suerte.',
              'It passed on its own. You got lucky.',
              'neutral',
              { hidden: { morale: 10 } },
            ),
            outcome(
              'No se pasó. Se hizo más grande y te costó dos temporadas de tu mejor edad.',
              'It did not pass. It grew, and it cost you two seasons of your prime.',
              'bad',
              { hidden: { morale: -22, coachTrust: -12, hype: -10 } },
            ),
          ),
      },
    ],
  }),
]
