/**
 * Career totals and the final verdict.
 *
 * The legacy score is the number people will screenshot, so it has to reward the
 * things that actually make a basketball legend — rings and MVPs above all, then
 * longevity and volume, then international medals — while still giving a good
 * player who never won anything a respectable, non-insulting result.
 */

import type { AwardId, CareerTotals, Legacy, LegacyTier, Localized, Rival, Season } from './types'
import { round } from './rng'
import { getLeague } from '@/data/leagues'

export function computeTotals(seasons: Season[]): CareerTotals {
  const played = seasons.filter((season) => season.gamesPlayed > 0)
  const counted = played.length || 1

  const countAward = (id: AwardId) =>
    seasons.reduce((sum, season) => sum + season.awards.filter((a) => a === id).length, 0)

  const totalGames = seasons.reduce((sum, s) => sum + s.gamesPlayed, 0)

  return {
    seasons: seasons.length,
    gamesPlayed: totalGames,
    // Career totals are per-game averages summed across seasons — the same way
    // a career line is normally quoted, weighted by games actually played.
    points: round(seasons.reduce((sum, s) => sum + s.points * s.gamesPlayed, 0), 0),
    rebounds: round(seasons.reduce((sum, s) => sum + s.rebounds * s.gamesPlayed, 0), 0),
    assists: round(seasons.reduce((sum, s) => sum + s.assists * s.gamesPlayed, 0), 0),
    steals: round(seasons.reduce((sum, s) => sum + s.steals * s.gamesPlayed, 0), 0),
    blocks: round(seasons.reduce((sum, s) => sum + s.blocks * s.gamesPlayed, 0), 0),
    ppg: round(played.reduce((sum, s) => sum + s.points, 0) / counted, 1),
    rpg: round(played.reduce((sum, s) => sum + s.rebounds, 0) / counted, 1),
    apg: round(played.reduce((sum, s) => sum + s.assists, 0) / counted, 1),
    rings: countAward('league_champion'),
    mvps: countAward('mvp'),
    finalsMvps: countAward('finals_mvp'),
    allStars: countAward('all_star'),
    allLeague: countAward('all_league_first') + countAward('all_league_second'),
    dpoys: countAward('dpoy'),
    scoringTitles: countAward('scoring_title'),
    internationalGolds:
      countAward('olympic_gold') + countAward('world_cup_gold') + countAward('continental_gold'),
    internationalMedals:
      countAward('olympic_medal') + countAward('world_cup_medal') + countAward('continental_medal'),
    earnings: seasons.reduce((sum, s) => sum + s.salary, 0),
    peakRating: seasons.reduce((max, s) => Math.max(max, s.rating), 0),
    teamsPlayedFor: new Set(seasons.map((s) => s.teamId)).size,
    seasonsMissedToInjury: seasons.filter((s) => s.gamesMissed > s.gamesPlayed).length,
  }
}

/**
 * How much the level you played at is worth. A title in the LEB Oro is a real
 * achievement, but it is not an NBA ring, and the final score has to say so —
 * otherwise a journeyman who collected trophies in a fourth-tier league outranks
 * a genuine star. Weighted by minutes-ish (games) so a one-game cameo in the NBA
 * does not launder a whole career.
 */
function careerLevel(seasons: Season[]): number {
  const played = seasons.filter((s) => s.gamesPlayed > 0 && s.leagueId !== 'youth')
  if (played.length === 0) return 0.3
  const tierValue: Record<number, number> = { 1: 1.0, 2: 0.72, 3: 0.48, 4: 0.26, 5: 0.12 }
  const totalGames = played.reduce((sum, s) => sum + s.gamesPlayed, 0)
  const weighted = played.reduce(
    (sum, s) => sum + (tierValue[getLeague(s.leagueId).tier] ?? 0.2) * s.gamesPlayed,
    0,
  )
  return weighted / Math.max(1, totalGames)
}

export function computeLegacy(totals: CareerTotals, seasons: Season[], rival: Rival): Legacy {
  // Everything earned on the floor is scaled by the level it was earned at, so
  // that hardware from a lower tier counts without dominating.
  const level = careerLevel(seasons)
  const levelWeight = 0.28 + level * 0.72

  // Weighted so that hardware dominates but a long, productive career still
  // scores well. Roughly calibrated so an all-time great lands near 1000.
  const onCourt =
    totals.rings * 95 +
    totals.mvps * 130 +
    totals.finalsMvps * 70 +
    totals.dpoys * 45 +
    totals.allLeague * 26 +
    totals.allStars * 18 +
    totals.scoringTitles * 22 +
    totals.points * 0.012 +
    totals.assists * 0.014 +
    totals.rebounds * 0.008 +
    totals.peakRating * 1.6

  const score = Math.round(
    onCourt * levelWeight +
      // International honours are played at one level for everyone, so they are
      // not scaled down by where you spent your club career.
      totals.internationalGolds * 55 +
      totals.internationalMedals * 22 +
      totals.seasons * 7 * levelWeight +
      // Playing your whole career at one club is remembered; bouncing is not.
      (totals.teamsPlayedFor <= 2 && totals.seasons >= 10 ? 45 : 0) -
      totals.seasonsMissedToInjury * 12,
  )

  const tier = tierFor(score, totals)
  // Derived from the tier rather than its own threshold, so the card can never
  // say "Star" and "Hall of Fame" at the same time.
  const hallOfFame = tier === 'hall_of_famer' || tier === 'legend' || tier === 'goat'
  const jerseyRetired =
    hallOfFame || (totals.seasons >= 8 && totals.teamsPlayedFor <= 2 && score >= 300)

  // Beat the rival on the things that actually get argued about.
  const myPoints = totals.rings * 3 + totals.mvps * 4 + totals.allStars
  const theirPoints = rival.totals.rings * 3 + rival.totals.mvps * 4 + rival.totals.allStars
  const beatRival = myPoints > theirPoints

  return {
    score,
    tier,
    title: TIER_TITLES[tier],
    blurb: TIER_BLURBS[tier],
    hallOfFame,
    jerseyRetired,
    beatRival,
    highlights: buildHighlights(totals, seasons, rival, beatRival),
  }
}

/**
 * Cutoffs are set so the distribution across many careers looks like real
 * basketball: most players are solid pros or journeymen, stars are uncommon,
 * and a Hall of Fame career is genuinely rare.
 */
function tierFor(score: number, totals: CareerTotals): LegacyTier {
  if (score >= 1300 && totals.rings >= 2 && totals.mvps >= 2) return 'goat'
  if (score >= 980) return 'legend'
  if (score >= 720) return 'hall_of_famer'
  if (score >= 460) return 'star'
  if (score >= 210) return 'solid_pro'
  if (totals.seasons >= 4) return 'journeyman'
  return 'cautionary_tale'
}

const TIER_TITLES: Record<LegacyTier, Localized> = {
  goat: { es: 'El más grande de todos los tiempos', en: 'The Greatest of All Time' },
  legend: { es: 'Leyenda', en: 'Legend' },
  hall_of_famer: { es: 'Salón de la Fama', en: 'Hall of Famer' },
  star: { es: 'Estrella', en: 'Star' },
  solid_pro: { es: 'Profesional sólido', en: 'Solid Pro' },
  journeyman: { es: 'Trotamundos', en: 'Journeyman' },
  cautionary_tale: { es: 'La promesa que no fue', en: 'The One Who Never Made It' },
}

const TIER_BLURBS: Record<LegacyTier, Localized> = {
  goat: {
    es: 'Cuando alguien discuta quién fue el mejor, tu nombre va a estar en la conversación. Cambiaste el deporte.',
    en: 'Whenever anyone argues about the greatest ever, your name is in the conversation. You changed the sport.',
  },
  legend: {
    es: 'Ganaste todo lo que había para ganar y una generación entera creció imitando tu juego.',
    en: 'You won everything there was to win, and a whole generation grew up copying your game.',
  },
  hall_of_famer: {
    es: 'Tu carrera tiene un lugar asegurado en el Salón de la Fama. Pocos llegan tan lejos.',
    en: 'Your career has a guaranteed place in the Hall of Fame. Very few get this far.',
  },
  star: {
    es: 'Fuiste titular indiscutido y la cara de tu club durante años. Una gran carrera, sin asteriscos.',
    en: 'You were an undisputed starter and the face of your club for years. A great career, no asterisks.',
  },
  solid_pro: {
    es: 'Viviste del básquet, jugaste en buenos equipos y te ganaste el respeto del vestuario. No es poco.',
    en: 'You made a living from basketball, played for good teams and earned the locker room’s respect. That is no small thing.',
  },
  journeyman: {
    es: 'Diste vueltas por muchas camisetas y siempre encontraste equipo. Un sobreviviente.',
    en: 'You bounced between a lot of shirts and always found a team. A survivor.',
  },
  cautionary_tale: {
    es: 'El talento estaba. El tiempo, las lesiones o las decisiones no acompañaron.',
    en: 'The talent was there. Time, injuries or decisions were not.',
  },
}

function buildHighlights(
  totals: CareerTotals,
  seasons: Season[],
  rival: Rival,
  beatRival: boolean,
): Localized[] {
  const out: Localized[] = []

  if (totals.rings > 0) {
    out.push({
      es: `${totals.rings} ${totals.rings === 1 ? 'título' : 'títulos'} de liga.`,
      en: `${totals.rings} league ${totals.rings === 1 ? 'title' : 'titles'}.`,
    })
  }
  if (totals.mvps > 0) {
    out.push({
      es: `${totals.mvps} ${totals.mvps === 1 ? 'MVP' : 'MVPs'} de la temporada regular.`,
      en: `${totals.mvps} regular season ${totals.mvps === 1 ? 'MVP' : 'MVPs'}.`,
    })
  }
  if (totals.internationalGolds > 0) {
    out.push({
      es: `${totals.internationalGolds} ${totals.internationalGolds === 1 ? 'oro' : 'oros'} con la selección.`,
      en: `${totals.internationalGolds} international ${totals.internationalGolds === 1 ? 'gold' : 'golds'}.`,
    })
  }

  const bestSeason = seasons.reduce<Season | null>(
    (best, season) => (!best || season.rating > best.rating ? season : best),
    null,
  )
  if (bestSeason) {
    out.push({
      es: `Tu mejor año: ${bestSeason.year}, con ${bestSeason.points} puntos, ${bestSeason.rebounds} rebotes y ${bestSeason.assists} asistencias por partido.`,
      en: `Your best year: ${bestSeason.year}, at ${bestSeason.points} points, ${bestSeason.rebounds} rebounds and ${bestSeason.assists} assists per game.`,
    })
  }

  if (totals.teamsPlayedFor === 1 && totals.seasons >= 8) {
    out.push({
      es: 'Un solo club, toda la carrera. Eso ya casi no existe.',
      en: 'One club, your entire career. That barely happens any more.',
    })
  }

  out.push(
    beatRival
      ? {
          es: `Terminaste por encima de ${rival.name} en la comparación que te persiguió toda la carrera.`,
          en: `You finished ahead of ${rival.name} in the comparison that followed you your whole career.`,
        }
      : {
          es: `${rival.name} terminó por delante. Esa discusión no la vas a ganar nunca.`,
          en: `${rival.name} finished ahead of you. That argument is one you will never win.`,
        },
  )

  return out
}
