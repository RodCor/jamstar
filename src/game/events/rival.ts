/**
 * Rival beats. These are the cards that make the head-to-head panel mean
 * something — the rivalry has to actually happen, not just be tallied.
 */

import type { GameEvent } from '../types'
import { event, gamble, gate, loc, outcome } from './helpers'

export const RIVAL_EVENTS: GameEvent[] = [
  event({
    id: 'riv_first_meeting',
    weight: 30,
    stages: ['development', 'prime'],
    category: 'rival',
    requires: gate.all(gate.isPro, gate.hasPlayed(1)),
    title: loc('El primer cruce', 'The First Meeting'),
    body: (ctx) =>
      loc(
        `${ctx.rival.name} está del otro lado. ${ctx.rival.origin.es} Los dos saben que este partido lo van a recordar.`,
        `${ctx.rival.name} is on the other side. ${ctx.rival.origin.en} You both know this is a game you will remember.`,
      ),
    choices: [
      {
        label: loc('Pedir la marca personal', 'Ask to guard them myself'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.4 + ctx.player.attributes.defense / 320,
            outcome(
              `Lo dejaste en ocho puntos con catorce tiros. La prensa habló de vos toda la semana.`,
              `You held them to eight points on fourteen shots. The press talked about you all week.`,
              'epic',
              { attributes: { defense: 4 }, hidden: { hype: 18, coachTrust: 12, morale: 12 } },
            ),
            outcome(
              `Te pasó por arriba: treinta y ocho puntos. Ese video lo van a usar en tu contra durante años.`,
              `They went straight through you: thirty-eight points. They will use that tape against you for years.`,
              'bad',
              { hidden: { hype: -6, morale: -14, coachTrust: -8 } },
            ),
          ),
      },
      {
        label: loc('Concentrarme en mi juego', 'Focus on my own game'),
        resolve: () =>
          outcome(
            'Ignoraste el circo y jugaste tu partido. Ganaron, que era lo único que importaba.',
            'You ignored the circus and played your game. You won, which was the only thing that mattered.',
            'good',
            { attributes: { iq: 3 }, hidden: { coachTrust: 8, morale: 6 } },
          ),
      },
    ],
  }),

  event({
    id: 'riv_playoff_series',
    weight: 26,
    stages: ['prime', 'veteran'],
    once: false,
    category: 'rival',
    requires: gate.all((ctx) => ctx.league.tier <= 2, gate.hasPlayed(4)),
    title: loc('Serie de playoffs contra él', 'A Playoff Series Against Him'),
    body: (ctx) =>
      loc(
        `Séptimo partido contra el equipo de ${ctx.rival.name}. El que gana pasa; el que pierde escucha durante todo el verano.`,
        `Game seven against ${ctx.rival.name}’s team. The winner moves on; the loser hears about it all summer.`,
      ),
    choices: [
      {
        label: loc('Cargarme el equipo al hombro', 'Put the team on my back'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.38 + ctx.player.attributes.shooting / 380,
            outcome(
              'Cuarenta y un puntos en el séptimo. Le ganaste el mano a mano cuando más pesaba.',
              'Forty-one points in game seven. You beat them head to head when it counted most.',
              'epic',
              { attributes: { leadership: 5 }, hidden: { hype: 24, morale: 20, coachTrust: 14 } },
            ),
            outcome(
              'Tiraste treinta veces y metiste nueve. Perdieron y todos señalaron al mismo lugar.',
              'You took thirty shots and made nine. You lost, and everyone pointed at the same place.',
              'bad',
              { hidden: { hype: -10, morale: -22, coachTrust: -12 } },
            ),
          ),
      },
      {
        label: loc('Confiar en el sistema del equipo', 'Trust the team system'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.5,
            outcome(
              'Ganaron por equipo. Él metió más puntos y volvió a casa de vacaciones.',
              'You won as a team. They scored more and went home on holiday.',
              'good',
              { attributes: { iq: 4, leadership: 3 }, hidden: { morale: 16, coachTrust: 12 } },
            ),
            outcome(
              'Perdieron ajustado. Nadie te culpa, pero él pasó de ronda y vos no.',
              'You lost narrowly. Nobody blames you, but they advanced and you did not.',
              'neutral',
              { hidden: { morale: -10 } },
            ),
          ),
      },
    ],
  }),

  event({
    id: 'riv_trash_talk',
    weight: 22,
    stages: ['prime', 'veteran'],
    once: false,
    category: 'rival',
    requires: gate.hasPlayed(3),
    title: loc('Lo que dijo de vos', 'What They Said About You'),
    body: (ctx) =>
      loc(
        `${ctx.rival.name} dio una entrevista larga. Le preguntaron por vos y contestó que "nunca lo consideré una competencia real".`,
        `${ctx.rival.name} gave a long interview. They asked about you, and said they "never considered this one real competition".`,
      ),
    choices: [
      {
        label: loc('Contestarle públicamente', 'Answer them publicly'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.45,
            outcome(
              'Tu respuesta fue mejor que su ataque. Le diste vuelta la narrativa en una frase.',
              'Your answer was better than their attack. You flipped the narrative in one sentence.',
              'good',
              { hidden: { hype: 16, morale: 10 } },
            ),
            outcome(
              'Sonaste dolido. Le diste exactamente lo que estaba buscando.',
              'You sounded hurt. You gave them exactly what they were fishing for.',
              'bad',
              { hidden: { hype: 4, morale: -14 } },
            ),
          ),
      },
      {
        label: loc('No contestar y esperar al próximo cruce', 'Say nothing and wait for the next meeting'),
        resolve: () =>
          outcome(
            'Guardaste la frase. La usaste de combustible durante toda la temporada.',
            'You filed the quote away. You ran on it all season.',
            'good',
            { attributes: { defense: 3, athleticism: 2, leadership: 2 }, hidden: { morale: 4 } },
          ),
      },
    ],
  }),

  event({
    id: 'riv_teammates',
    weight: 18,
    stages: ['veteran'],
    category: 'rival',
    requires: gate.all(gate.minAge(30), gate.hasPlayed(8), (ctx) => !ctx.rival.retired),
    title: loc('Compañeros, al fin', 'Teammates, At Last'),
    body: (ctx) =>
      loc(
        `Después de una década de enfrentarse, el club quiere ficharlo a él y te pide opinión. ${ctx.rival.name} en tu vestuario.`,
        `After a decade of facing each other, the club wants to sign them and asks your opinion. ${ctx.rival.name} in your locker room.`,
      ),
    choices: [
      {
        label: loc('Que venga. Quiero ganar', 'Bring them in. I want to win'),
        resolve: (ctx) =>
          gamble(
            ctx,
            0.6,
            outcome(
              'Funcionó de una manera que ninguno de los dos esperaba. Se hicieron amigos a los treinta y cuatro.',
              'It worked in a way neither of you expected. You became friends at thirty-four.',
              'epic',
              { attributes: { iq: 4, leadership: 4 }, hidden: { morale: 18, coachTrust: 10 } },
            ),
            outcome(
              'Diez años de rivalidad no se borran con un apretón de manos. El vestuario se partió al medio.',
              'Ten years of rivalry do not vanish with a handshake. The locker room split down the middle.',
              'bad',
              { hidden: { morale: -16, coachTrust: -10 } },
            ),
          ),
      },
      {
        label: loc('Vetarlo. Es él o yo', 'Veto it. Them or me'),
        resolve: () =>
          outcome(
            'El club te eligió a vos. Seguís siendo el dueño del vestuario, y también el que cargó con la culpa.',
            'The club chose you. You are still the owner of that locker room, and also the one who wore the blame.',
            'neutral',
            { hidden: { morale: 4, hype: -6, coachTrust: 4 } },
          ),
      },
    ],
  }),

  event({
    id: 'riv_retirement_tribute',
    weight: 24,
    stages: ['veteran', 'twilight'],
    category: 'rival',
    requires: (ctx) => ctx.rival.retired,
    title: loc('Él se retiró primero', 'They Retired First'),
    body: (ctx) =>
      loc(
        `${ctx.rival.name} anunció el retiro. Te llaman de todos lados para que digas algo sobre el tipo que te persiguió toda la carrera.`,
        `${ctx.rival.name} announced his retirement. Everyone is calling, asking you to say something about the player who shadowed your entire career.`,
      ),
    choices: [
      {
        label: loc('Reconocer que me hizo mejor', 'Admit they made me better'),
        resolve: () =>
          outcome(
            'Fue el mejor discurso que diste en tu vida. Él lo compartió sin decir nada.',
            'It was the best thing you ever said publicly. They shared it without adding a word.',
            'good',
            { attributes: { leadership: 5, iq: 3 }, hidden: { morale: 16, hype: 10 } },
          ),
      },
      {
        label: loc('Decir que todavía me queda cuerda', 'Point out that I am still going'),
        resolve: () =>
          outcome(
            'Sobrevivirlo también es un título. Lo dijiste y sonó a lo que era: verdad.',
            'Outlasting them is its own trophy. You said it, and it landed as what it was: true.',
            'neutral',
            { hidden: { morale: 10, hype: 8 } },
          ),
      },
    ],
  }),
]
