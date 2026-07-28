/**
 * The domestic cup.
 *
 * A knockout played in the middle of the season, on a bracket short enough that
 * a mid-table club can win the whole thing. That is the point of it: the league
 * rewards being the best over eight months, and the cup rewards being the best
 * for three nights, so a career at an unfashionable club still has something
 * to chase and a great career has one more trophy it can fail to win.
 *
 * Reaching the final is simulated here; winning it is handed to the player as a
 * minigame, exactly like the league final.
 */

import type { Cup, CupRun, League, Localized, LocalizedHeadline, Player, Team } from './types'
import { Rng, clamp } from './rng'
import { cupForLeague } from '@/data/cups'
import { teamsInLeague } from '@/data/teams'
import { overallRating } from './progression'

export { cupForLeague }

/**
 * Simulate the club's cup run up to (but not including) the final.
 *
 * Deliberately more volatile than the league playoff: rounds are single games,
 * so the favourite goes out more often than they should. A strong club still
 * gets there more than a weak one, just not reliably.
 */
export function runCup(
  cup: Cup,
  team: Team,
  player: Player,
  role: string,
  rng: Rng,
): CupRun {
  // Your own quality tilts the bracket, but the club carries most of it.
  const contribution = role === 'star' || role === 'starter' ? (overallRating(player) - 62) / 200 : 0
  const edge = (team.strength - cup.fieldStrength) / 90 + contribution

  // Three single-game rounds to reach the final, each better than a coin flip
  // for a decent club. A cup final should be a more familiar sight than a league
  // final, since being reachable is the appeal of a cup.
  const survive = () => rng.chance(clamp(0.68 + edge, 0.14, 0.88))

  if (!survive()) return base(cup, 'early')
  if (!survive()) return base(cup, 'quarterfinal')
  if (!survive()) return base(cup, 'semifinal')

  const others = teamsInLeague(team.leagueId).filter((t) => t.id !== team.id)
  const opponent = others.length > 0 ? rng.weighted(others, (t) => Math.max(1, t.strength - 45)) : null

  return { ...base(cup, 'final'), opponentTeamId: opponent?.id ?? null }
}

function base(cup: Cup, outcome: CupRun['outcome']): CupRun {
  return { cupId: cup.id, name: cup.name, outcome, opponentTeamId: null, won: null, played: false }
}

/**
 * The final, rolled rather than played, for when the player was injured or is
 * too far down the rotation to be the one deciding it.
 */
export function rollCupFinal(team: Team, cup: Cup, rng: Rng): boolean {
  return rng.chance(clamp(0.5 + (team.strength - cup.fieldStrength) / 170, 0.2, 0.8))
}

/** Whether this run is worth a line in the season summary. */
export function cupHeadline(run: CupRun, league: League): LocalizedHeadline | null {
  const name = run.name
  if (run.outcome === 'final') {
    // A final the player contested writes its own headline on the way out of the
    // minigame; only the rolled ones need narrating here.
    if (run.won === null || run.played) return null
    return run.won
      ? {
          text: {
            es: `Levantaron ${withArticle(name).es}. La primera vuelta olímpica de la temporada.`,
            en: `You lifted the ${name.en}. The season's first trophy.`,
          },
          tone: 'epic',
        }
      : {
          text: {
            es: `Perdieron la final de ${name.es}. Tan cerca del primer título del año.`,
            en: `You lost the ${name.en} final. So close to the year's first trophy.`,
          },
          tone: 'bad',
        }
  }

  // Going out early only rates a mention where the cup matters.
  if (run.outcome === 'semifinal' && league.tier <= 3) {
    return {
      text: {
        es: `Se quedaron en la semifinal de ${name.es}.`,
        en: `You went out in the ${name.en} semifinal.`,
      },
      tone: 'neutral',
    }
  }

  return null
}

/** "la Copa del Rey" reads better than "Copa del Rey" mid-sentence. */
function withArticle(name: Localized): Localized {
  return { es: `la ${name.es}`, en: name.en }
}
