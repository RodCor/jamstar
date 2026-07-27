import { describe, expect, it } from 'vitest'

import { trophiesFor, trophyForAward, trophyLabel } from '../trophies'
import type { Season } from '../types'

function season(over: Partial<Season> = {}): Season {
  return {
    year: 2035, age: 26, stage: 'prime', teamId: 'bos', leagueId: 'nba', role: 'star',
    gamesPlayed: 82, gamesMissed: 0, minutesPerGame: 34, points: 24, rebounds: 6,
    assists: 5, steals: 1.2, blocks: 0.6, turnovers: 2.4, fgPct: 0.5, threePct: 0.38,
    ftPct: 0.85, tsPct: 0.61, rating: 80, teamWins: 58, teamLosses: 24,
    playoffResult: 'none', awards: [], salary: 1, injuries: [], headlines: [],
    ...over,
  }
}

describe('trophiesFor', () => {
  it('names a league title after the league', () => {
    const [trophy] = trophiesFor(season({ playoffResult: 'champion' }))
    expect(trophy.kind).toBe('league')
    expect(trophy.result).toBe('champion')
    expect(trophyLabel(trophy).en).toBe('NBA Champion')
    expect(trophyLabel(trophy).es).toBe('Campeón NBA')
  })

  it('records a finals loss, which nothing did before', () => {
    const [trophy] = trophiesFor(season({ playoffResult: 'finals' }))
    expect(trophy.result).toBe('finalist')
    expect(trophyLabel(trophy).en).toBe('NBA finalist')
  })

  it('names a cup after the cup, not after "cup"', () => {
    const trophies = trophiesFor(
      season({ leagueId: 'acb', cupId: 'copa_rey', cupWon: true, awards: ['cup_champion'] }),
    )
    const cup = trophies.find((tr) => tr.kind === 'cup')!
    expect(cup.competitionId).toBe('copa_rey')
    expect(trophyLabel(cup).en).toBe('Copa del Rey')
  })

  it('records a lost cup final, which has no award id at all', () => {
    const trophies = trophiesFor(season({ leagueId: 'acb', cupId: 'copa_rey', cupWon: false }))
    const cup = trophies.find((tr) => tr.kind === 'cup')!
    expect(cup.result).toBe('finalist')
    expect(trophyLabel(cup).en).toBe('Copa del Rey final')
  })

  it('gives nothing to a cup run that never reached the final', () => {
    // cupWon null means they went out earlier — not a finalist.
    expect(trophiesFor(season({ leagueId: 'acb', cupId: 'copa_rey', cupWon: null }))).toEqual([])
  })

  it('gives a season that won nothing no trophies', () => {
    expect(trophiesFor(season({ playoffResult: 'semifinals' }))).toEqual([])
  })

  it('survives a season saved before cupId existed', () => {
    const old = season({ playoffResult: 'champion', awards: ['cup_champion'] })
    delete (old as { cupId?: unknown }).cupId
    delete (old as { cupWon?: unknown }).cupWon
    // The league title still lands; the unnameable cup is simply dropped.
    expect(trophiesFor(old)).toHaveLength(1)
  })

  it('does not crash on a cup id the data no longer knows', () => {
    const trophies = trophiesFor(
      season({ cupId: 'copa_that_was_removed', cupWon: true, awards: ['cup_champion'] }),
    )
    expect(trophies).toEqual([])
  })
})

describe('trophyForAward', () => {
  it('resolves league_champion to the league trophy', () => {
    const trophies = trophiesFor(season({ playoffResult: 'champion' }))
    const trophy = trophyForAward('league_champion', trophies)
    expect(trophy?.kind).toBe('league')
    expect(trophy?.result).toBe('champion')
  })

  it('resolves cup_champion to the cup trophy', () => {
    const trophies = trophiesFor(
      season({ leagueId: 'acb', cupId: 'copa_rey', cupWon: true, awards: ['cup_champion'] }),
    )
    const trophy = trophyForAward('cup_champion', trophies)
    expect(trophy?.kind).toBe('cup')
    expect(trophy?.result).toBe('champion')
  })

  it('resolves each award to its own trophy when a season wins both', () => {
    const trophies = trophiesFor(
      season({
        leagueId: 'acb',
        playoffResult: 'champion',
        cupId: 'copa_rey',
        cupWon: true,
        awards: ['league_champion', 'cup_champion'],
      }),
    )
    expect(trophyForAward('league_champion', trophies)?.kind).toBe('league')
    expect(trophyForAward('cup_champion', trophies)?.kind).toBe('cup')
  })

  it('returns null for a non-championship award', () => {
    const trophies = trophiesFor(season({ playoffResult: 'champion' }))
    expect(trophyForAward('mvp', trophies)).toBeNull()
  })

  it('returns null when no matching trophy is present', () => {
    expect(trophyForAward('cup_champion', [])).toBeNull()
  })
})
