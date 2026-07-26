/**
 * Awards. Deliberately stingy — an MVP should be rare enough that winning one is
 * the thing you tell people about.
 */

import type { AwardId, League, PlayerRole, PlayoffResult, Player, Season } from './types'
import { Rng, clamp } from './rng'
import { getStyle } from '@/data/styles'

interface AwardInput {
  player: Player
  league: League
  role: PlayerRole
  stats: Pick<Season, 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks' | 'rating' | 'gamesPlayed'>
  playoffResult: PlayoffResult
  teamWins: number
  seasonsPlayed: number
  rng: Rng
}

export function determineAwards(input: AwardInput): AwardId[] {
  const { player, league, role, stats, playoffResult, teamWins, seasonsPlayed, rng } = input
  const awards: AwardId[] = []
  if (league.id === 'youth') return awards

  // Missing most of the season disqualifies you from individual honours, the
  // same way it does in real life.
  const eligible = stats.gamesPlayed >= league.gamesPerSeason * 0.6
  const style = getStyle(player.styleId)
  const winPct = teamWins / Math.max(1, league.gamesPerSeason)

  // Hype is real: voters reward players they already believe in.
  const narrative = (player.hidden.hype - 50) / 260

  if (eligible && league.hasAllStar && rng.chance(clamp((stats.rating - 62) / 34 + narrative, 0, 0.9))) {
    awards.push('all_star')
  }

  if (eligible) {
    // All-League: a real cut above All-Star.
    const allLeagueOdds = clamp((stats.rating - 72) / 30 + narrative * 0.8, 0, 0.6)
    if (rng.chance(allLeagueOdds)) {
      awards.push(rng.chance(0.34) ? 'all_league_first' : 'all_league_second')
    }

    // Defensive honours run off defence, not scoring.
    const defScore = stats.steals * 9 + stats.blocks * 9 + player.attributes.defense * 0.35
    const defOdds = clamp((defScore - 42) / 55, 0, 0.5) * style.defenseBias * (winPct > 0.55 ? 1.25 : 0.7)
    if (rng.chance(defOdds)) {
      awards.push('all_defensive')
      if (rng.chance(clamp(defOdds * 0.42, 0, 0.3))) awards.push('dpoy')
    }

    // MVP: elite production on a winning team, and even then it's a long shot.
    if (league.hasMvp && stats.rating > 84 && winPct > 0.6) {
      const mvpOdds = clamp((stats.rating - 84) / 22 + narrative, 0, 0.42)
      if (rng.chance(mvpOdds)) awards.push('mvp')
    }

    // Statistical titles.
    if (stats.points > 26 && rng.chance(clamp((stats.points - 26) / 12, 0, 0.5))) {
      awards.push('scoring_title')
    }
    if (stats.assists > 8.5 && rng.chance(clamp((stats.assists - 8.5) / 4, 0, 0.5))) {
      awards.push('assists_title')
    }
    if (stats.rebounds > 11.5 && rng.chance(clamp((stats.rebounds - 11.5) / 4, 0, 0.5))) {
      awards.push('rebounding_title')
    }

    // Rookie of the Year — first pro season only.
    if (seasonsPlayed === 0 && stats.rating > 58 && rng.chance(clamp((stats.rating - 58) / 26, 0, 0.55))) {
      awards.push('roy')
    }

    if ((role === 'bench' || role === 'rotation') && stats.rating > 62 && rng.chance(0.2)) {
      awards.push('sixth_man')
    }
  }

  if (playoffResult === 'champion') {
    awards.push('league_champion')
    // Finals MVP goes to the best player on the winning team, usually.
    if (role === 'star' && rng.chance(clamp((stats.rating - 68) / 26, 0.05, 0.72))) {
      awards.push('finals_mvp')
    }
  }

  return awards
}

/**
 * National-team tournaments. World Cup and Olympics alternate on the real
 * cadence; continental championships fill the gaps.
 */
export function determineInternationalAwards(
  year: number,
  player: Player,
  countryStrength: number,
  playerRating: number,
  rng: Rng,
): AwardId[] {
  const awards: AwardId[] = []
  // Too young or too fringe to be called up at all.
  const calledUp = player.age >= 19 && rng.chance(clamp((playerRating - 45) / 45 + (countryStrength - 50) / 200, 0, 0.95))
  if (!calledUp) return awards

  const strength = clamp(countryStrength / 100 + (playerRating - 60) / 260, 0.05, 0.98)

  const isOlympics = year % 4 === 0
  const isWorldCup = year % 4 === 2
  const isContinental = year % 2 === 1

  if (isOlympics) {
    // Only 12 teams qualify; the field is brutal.
    if (rng.chance(strength * 0.55)) {
      if (rng.chance(strength * 0.3)) awards.push('olympic_gold')
      else if (rng.chance(strength * 0.55)) awards.push('olympic_medal')
    }
  } else if (isWorldCup) {
    if (rng.chance(strength * 0.62)) {
      if (rng.chance(strength * 0.3)) awards.push('world_cup_gold')
      else if (rng.chance(strength * 0.55)) awards.push('world_cup_medal')
    }
  } else if (isContinental) {
    if (rng.chance(strength * 0.75)) {
      if (rng.chance(strength * 0.4)) awards.push('continental_gold')
      else if (rng.chance(strength * 0.6)) awards.push('continental_medal')
    }
  }

  return awards
}

/** Display metadata for every award, bilingual. */
export const AWARD_INFO: Record<AwardId, { es: string; en: string; icon: string; weight: number }> = {
  mvp: { es: 'MVP de la liga', en: 'League MVP', icon: '👑', weight: 100 },
  finals_mvp: { es: 'MVP de las Finales', en: 'Finals MVP', icon: '🏆', weight: 85 },
  league_champion: { es: 'Campeón', en: 'Champion', icon: '💍', weight: 90 },
  cup_champion: { es: 'Campeón de Copa', en: 'Cup Champion', icon: '🥇', weight: 30 },
  roy: { es: 'Novato del Año', en: 'Rookie of the Year', icon: '🌟', weight: 40 },
  dpoy: { es: 'Mejor Defensor', en: 'Defensive Player of the Year', icon: '🛡️', weight: 65 },
  sixth_man: { es: 'Mejor Sexto Hombre', en: 'Sixth Man of the Year', icon: '🔥', weight: 25 },
  most_improved: { es: 'Jugador Más Mejorado', en: 'Most Improved Player', icon: '📈', weight: 20 },
  all_star: { es: 'All-Star', en: 'All-Star', icon: '⭐', weight: 22 },
  all_league_first: { es: 'Primer Quinteto', en: 'All-League First Team', icon: '🥇', weight: 45 },
  all_league_second: { es: 'Segundo Quinteto', en: 'All-League Second Team', icon: '🥈', weight: 28 },
  all_defensive: { es: 'Quinteto Defensivo', en: 'All-Defensive Team', icon: '🔒', weight: 24 },
  scoring_title: { es: 'Máximo anotador', en: 'Scoring Title', icon: '🎯', weight: 35 },
  assists_title: { es: 'Máximo asistidor', en: 'Assists Title', icon: '🎁', weight: 28 },
  rebounding_title: { es: 'Máximo reboteador', en: 'Rebounding Title', icon: '💪', weight: 28 },
  olympic_gold: { es: 'Oro olímpico', en: 'Olympic Gold', icon: '🥇', weight: 95 },
  olympic_medal: { es: 'Medalla olímpica', en: 'Olympic Medal', icon: '🏅', weight: 55 },
  world_cup_gold: { es: 'Campeón del Mundo', en: 'World Cup Champion', icon: '🌍', weight: 90 },
  world_cup_medal: { es: 'Medalla mundialista', en: 'World Cup Medal', icon: '🏅', weight: 50 },
  continental_gold: { es: 'Campeón continental', en: 'Continental Champion', icon: '🏆', weight: 45 },
  continental_medal: { es: 'Medalla continental', en: 'Continental Medal', icon: '🏅', weight: 25 },
}
