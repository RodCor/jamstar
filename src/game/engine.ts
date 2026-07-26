/**
 * The season loop.
 *
 * preseason → (maybe an event) → simulate the season → show the result → repeat
 * until retirement. Every random draw comes from an RNG forked deterministically
 * off the run seed and the current year, so replaying a seed replays the career
 * exactly, and resolving an event never shifts the stream for anything else.
 */

import type {
  Attributes,
  EventContext,
  EventOutcome,
  GameState,
  League,
  LocalizedHeadline,
  PendingEvent,
  Season,
  Team,
} from './types'
import { ATTRIBUTE_KEYS } from './types'
import { Rng, clamp, round } from './rng'
import { getCountry } from '@/data/countries'
import { getLeague } from '@/data/leagues'
import { getTeam, teamsInLeague } from '@/data/teams'
import { ageOneYear, autoSpendGrowth, overallRating, retirementPressure } from './progression'
import { placeForSeason, stageForAge } from './ladder'
import { buildChallenge, isWin, resultHeadline } from './minigame'
import {
  computeSalary,
  determineRole,
  generateStats,
  rollFinal,
  simulateAvailability,
  simulatePlayoffRun,
  simulateTeamRecord,
  wearFromSeason,
} from './stats'
import { determineAwards, determineInternationalAwards } from './awards'
import { advanceRival } from './rival'
import { drawEvent, findEvent } from './events'

/** Ages at which the career can end. Nobody plays past 43 here. */
const HARD_RETIREMENT_AGE = 43

/** A per-year, per-purpose RNG so subsystems never perturb each other. */
function yearRng(state: GameState, purpose: string): Rng {
  return new Rng(`${state.seed}::${state.year}::${purpose}`)
}

/**
 * Open the preseason: age the player, hand out growth points, and settle where
 * they are playing this year.
 *
 * This deliberately stops before simulating anything. The player's growth
 * points are their main lever, and they need a window in which to spend them —
 * so the preseason is its own phase, not a step inside `beginSeason`.
 */
export function startPreseason(state: GameState): GameState {
  const next = structuredClone(state)
  const player = next.player

  if (player.retired) {
    next.phase = 'retirement'
    return next
  }

  // Age, natural growth/decline, and this year's growth points.
  ageOneYear(player, yearRng(next, 'ageing'))
  player.stage = stageForAge(player.age, player.currentLeagueId !== 'youth')

  // Where are we playing this year?
  const placement = placeForSeason(player, yearRng(next, 'placement'), next.seasons.length)
  const moved = placement.teamId !== player.currentTeamId
  player.currentTeamId = placement.teamId
  player.currentLeagueId = placement.leagueId
  if (moved) player.teamHistory.push(placement.teamId)

  // Stash the move note so the season screen can show it.
  next.pendingPlacementNote = placement.note ?? null
  next.pendingEvent = null
  next.pendingMinigame = null
  next.draftSeason = null
  next.phase = 'preseason'
  return next
}

/**
 * Leave the preseason: draw a decision if one qualifies, otherwise play the
 * season straight through.
 */
export function beginSeason(state: GameState): GameState {
  const next = structuredClone(state)
  const player = next.player

  if (player.retired) {
    next.phase = 'retirement'
    return next
  }

  // Draw an event for this season, if one qualifies.
  const event = drawEvent(buildContext(next, yearRng(next, 'event-draw')))
  if (event) {
    const ctx = buildContext(next, yearRng(next, `event-body-${event.id}`))
    const pending: PendingEvent = {
      eventId: event.id,
      title: event.title,
      body: event.body(ctx),
      choices: event.choices
        .map((choice, index) => ({ choice, index }))
        .filter(({ choice }) => !choice.available || choice.available(ctx))
        .map(({ choice, index }) => ({ index, label: choice.label })),
      outcome: null,
    }
    // A card with no available choices is not a card.
    if (pending.choices.length > 0) {
      next.pendingEvent = pending
      next.phase = 'event'
      player.firedEventIds.push(event.id)
      return next
    }
  }

  next.phase = 'season_result'
  return simulateSeason(next)
}

/** Apply the player's choice and reveal the outcome. Does not advance the year. */
export function resolveChoice(state: GameState, choiceIndex: number): GameState {
  const next = structuredClone(state)
  if (!next.pendingEvent) return next

  const event = findEvent(next.pendingEvent.eventId)
  if (!event) {
    next.pendingEvent = null
    next.phase = 'season_result'
    return simulateSeason(next)
  }

  const choice = event.choices[choiceIndex]
  if (!choice) return next

  const ctx = buildContext(next, yearRng(next, `event-resolve-${event.id}-${choiceIndex}`))
  const outcome = choice.resolve(ctx)
  applyOutcome(next, outcome)

  next.pendingEvent = { ...next.pendingEvent, outcome }
  return next
}

/** Move on from a resolved event into the simulated season. */
export function continueAfterEvent(state: GameState): GameState {
  const next = structuredClone(state)
  next.pendingEvent = null

  if (next.player.retired) {
    next.phase = 'retirement'
    next.player.retirementYear = next.year
    return next
  }

  next.phase = 'season_result'
  return simulateSeason(next)
}

/**
 * Run the season.
 *
 * If the player reaches a final they can actually contest, the season is parked
 * as a draft and the phase hands over to the minigame; otherwise it is finalised
 * straight away.
 */
function simulateSeason(state: GameState): GameState {
  const player = state.player
  // Anything the player did not allocate on the preseason screen still gets
  // developed, just without the benefit of a deliberate specialisation.
  autoSpendGrowth(player, yearRng(state, 'auto-growth'))

  const team = getTeam(player.currentTeamId)
  const league = getLeague(player.currentLeagueId)
  const rng = yearRng(state, 'season')

  const { gamesPlayed, gamesMissed } = simulateAvailability(player, league, rng)
  const role = gamesPlayed === 0 ? 'injured' : determineRole(player, team, league, rng)
  const stats = generateStats({ player, team, league, role, gamesPlayed, rng })
  const { wins, losses } = simulateTeamRecord(team, league, stats.rating, role, rng)
  const { result, reachedFinal } = simulatePlayoffRun(wins, league.gamesPerSeason, team, league, rng)

  const draft: Season = {
    year: state.year,
    age: player.age,
    stage: player.stage,
    teamId: team.id,
    leagueId: league.id,
    role,
    gamesPlayed,
    gamesMissed,
    ...stats,
    teamWins: wins,
    teamLosses: losses,
    playoffResult: result,
    awards: [],
    salary: 0,
    injuries: [],
    headlines: [],
  }

  // You only get to play for it if you were actually on the floor.
  const canContest = reachedFinal && role !== 'injured' && gamesPlayed > 0 && league.tier <= 3

  if (canContest) {
    const opponent = pickFinalOpponent(team, league, yearRng(state, 'final-opponent'))
    state.draftSeason = draft
    state.pendingMinigame = buildChallenge({
      player,
      team,
      league,
      opponent,
      rng: yearRng(state, 'final-challenge'),
      stake: {
        es: `Final de ${league.name.es}`,
        en: `${league.name.en} final`,
      },
    })
    state.phase = 'minigame'
    return state
  }

  if (reachedFinal) {
    draft.playoffResult = rollFinal(team, yearRng(state, 'final-roll'))
  }

  return finalizeSeason(state, draft, null)
}

/** An opponent for the final: a strong side from the same league. */
function pickFinalOpponent(team: Team, league: League, rng: Rng): Team {
  const others = teamsInLeague(league.id).filter((t) => t.id !== team.id)
  if (others.length === 0) return team
  return rng.weighted(others, (t) => Math.max(1, t.strength - 40))
}

/** Apply the result of a played final and finish the season. */
export function resolveMinigame(state: GameState, successes: number): GameState {
  const next = structuredClone(state)
  const challenge = next.pendingMinigame
  const draft = next.draftSeason
  if (!challenge || !draft) return next

  const won = isWin(challenge, successes)
  draft.playoffResult = won ? 'champion' : 'finals'

  const opponent = getTeam(challenge.opponentTeamId)
  const headline: LocalizedHeadline = {
    text: resultHeadline(challenge, won, opponent.name),
    tone: won ? 'epic' : 'bad',
  }

  next.pendingMinigame = null
  next.draftSeason = null
  return finalizeSeason(next, draft, headline)
}

/**
 * Awards, money and the knock-on effects of a season, then commit it to the
 * career log. Shared by both the played-final and rolled-final paths so the two
 * can never drift apart.
 */
function finalizeSeason(
  state: GameState,
  season: Season,
  finalHeadline: LocalizedHeadline | null,
): GameState {
  const player = state.player
  const league = getLeague(season.leagueId)
  const country = getCountry(player.countryCode)
  const rng = yearRng(state, 'awards')

  season.awards = determineAwards({
    player,
    league,
    role: season.role,
    stats: { ...season, gamesPlayed: season.gamesPlayed },
    playoffResult: season.playoffResult,
    teamWins: season.teamWins,
    seasonsPlayed: state.seasons.length,
    rng,
  })

  // National team, for anyone good enough to be called up.
  if (league.tier <= 3) {
    season.awards.push(
      ...determineInternationalAwards(state.year, player, country.strength, season.rating, rng),
    )
  }

  season.salary = computeSalary(league, season.role, player.hidden.hype, rng)
  season.headlines = buildHeadlines(state, season, finalHeadline)

  // Consequences of the season feed back into the player.
  player.earnings += season.salary
  player.hidden.wear = clamp(player.hidden.wear + wearFromSeason(season, player), 0, 100)
  player.hidden.hype = clamp(
    player.hidden.hype +
      (season.rating - 55) * 0.28 +
      season.awards.length * 4 -
      (season.gamesMissed > season.gamesPlayed ? 8 : 0),
    0,
    100,
  )
  player.hidden.coachTrust = clamp(
    player.hidden.coachTrust +
      (season.rating - 58) * 0.2 +
      (season.playoffResult === 'champion' ? 6 : 0),
    0,
    100,
  )
  player.hidden.morale = clamp(
    player.hidden.morale +
      (season.rating - 55) * 0.16 +
      season.awards.length * 3 +
      (season.teamWins > season.teamLosses ? 3 : -3),
    0,
    100,
  )

  state.seasons.push(season)

  // Rival moves in parallel on their own stream.
  advanceRival(state.rival, state.year, player.age, yearRng(state, 'rival'))

  state.phase = 'season_result'
  return state
}

function buildHeadlines(
  state: GameState,
  season: Season,
  finalHeadline: LocalizedHeadline | null,
): LocalizedHeadline[] {
  const out: LocalizedHeadline[] = []
  const note = state.pendingPlacementNote
  if (note) out.push({ text: note, tone: 'neutral' })

  // A played final tells its own story; only narrate generically otherwise.
  if (finalHeadline) {
    out.push(finalHeadline)
  } else if (season.playoffResult === 'champion') {
    out.push({
      text: {
        es: '¡Campeones! Vuelta olímpica y la ciudad en la calle.',
        en: 'Champions! The city pours into the streets.',
      },
      tone: 'epic',
    })
  } else if (season.playoffResult === 'finals') {
    out.push({
      text: {
        es: 'Llegaron a la final y se quedaron en la puerta.',
        en: 'You reached the final and fell at the last step.',
      },
      tone: 'bad',
    })
  }

  if (season.gamesMissed > (season.gamesPlayed + season.gamesMissed) * 0.5) {
    out.push({
      text: {
        es: 'Una lesión te robó la mayor parte de la temporada.',
        en: 'An injury stole most of the season from you.',
      },
      tone: 'bad',
    })
  }

  if (season.rating > 85) {
    out.push({
      text: {
        es: 'Temporada monstruosa. Todo el mundo habla de vos.',
        en: 'A monster season. Everyone is talking about you.',
      },
      tone: 'epic',
    })
  }

  return out
}

/** Apply an event outcome to the player. */
function applyOutcome(state: GameState, outcome: EventOutcome): void {
  const player = state.player

  if (outcome.attributes) {
    for (const key of ATTRIBUTE_KEYS) {
      const delta = outcome.attributes[key]
      if (delta) player.attributes[key] = clamp(player.attributes[key] + delta, 5, 99)
    }
  }

  if (outcome.hidden) {
    for (const key of ['wear', 'morale', 'hype', 'coachTrust'] as const) {
      const delta = outcome.hidden[key]
      if (delta) player.hidden[key] = clamp(player.hidden[key] + delta, 0, 100)
    }
  }

  if (outcome.money) player.earnings += outcome.money

  if (outcome.injury) {
    player.hidden.wear = clamp(player.hidden.wear + outcome.injury.wearAdded, 0, 100)
    const damage = outcome.injury.permanentDamage as Partial<Attributes>
    for (const key of ATTRIBUTE_KEYS) {
      const delta = damage[key]
      if (delta) player.attributes[key] = clamp(player.attributes[key] + delta, 5, 99)
    }
  }

  if (outcome.transferTo?.teamId) {
    const team = getTeam(outcome.transferTo.teamId)
    player.currentTeamId = team.id
    player.currentLeagueId = team.leagueId
    player.teamHistory.push(team.id)
  }

  if (outcome.retire) {
    player.retired = true
    player.retirementReason = outcome.text
  }
}

/** Move to the next preseason, or end the career. */
export function advanceYear(state: GameState): GameState {
  const next = structuredClone(state)
  next.year += 1

  if (next.player.retired) {
    next.phase = 'retirement'
    return next
  }

  // Retirement check: forced at the hard cap, otherwise a weighted roll that
  // rises steeply with age and wear.
  const rng = yearRng(next, 'retirement')
  const forced = next.player.age >= HARD_RETIREMENT_AGE
  if (forced || rng.chance(retirementPressure(next.player))) {
    next.player.retired = true
    next.player.retirementYear = next.year
    next.player.stage = 'retired'
    next.player.retirementReason = forced
      ? { es: 'El cuerpo dijo basta. Es hora.', en: 'The body said enough. It is time.' }
      : retirementReasonFor(next, rng)
    next.phase = 'retirement'
    return next
  }

  return startPreseason(next)
}

function retirementReasonFor(state: GameState, rng: Rng) {
  const player = state.player
  if (player.hidden.wear > 72) {
    return {
      es: 'Las rodillas ya no responden. Anunciaste el retiro antes de que te lo anunciaran a vos.',
      en: 'Your knees stopped answering. You announced your retirement before someone announced it for you.',
    }
  }
  if (overallRating(player) < 52) {
    return {
      es: 'Las ofertas dejaron de llegar. Preferiste irte antes de mendigar un contrato.',
      en: 'The offers dried up. You chose to walk away rather than beg for a contract.',
    }
  }
  return rng.pick([
    {
      es: 'Te retiraste en tus términos, todavía siendo útil. Pocos pueden decir lo mismo.',
      en: 'You retired on your own terms, while you could still play. Not many can say that.',
    },
    {
      es: 'Decidiste que ya era suficiente. Querías ver crecer a tus hijos.',
      en: 'You decided it was enough. You wanted to watch your kids grow up.',
    },
  ])
}

/** Build the context object events read from. */
export function buildContext(state: GameState, rng: Rng): EventContext {
  return {
    player: state.player,
    season: state.seasons[state.seasons.length - 1] ?? null,
    team: getTeam(state.player.currentTeamId),
    league: getLeague(state.player.currentLeagueId),
    country: getCountry(state.player.countryCode),
    rival: state.rival,
    rng,
    seasonsPlayed: state.seasons.length,
  }
}

/** Career averages so far, for the in-progress header. */
export function runningAverages(seasons: Season[]) {
  const played = seasons.filter((s) => s.gamesPlayed > 0)
  if (played.length === 0) return { ppg: 0, rpg: 0, apg: 0 }
  return {
    ppg: round(played.reduce((sum, s) => sum + s.points, 0) / played.length, 1),
    rpg: round(played.reduce((sum, s) => sum + s.rebounds, 0) / played.length, 1),
    apg: round(played.reduce((sum, s) => sum + s.assists, 0) / played.length, 1),
  }
}
