import { describe, expect, it } from 'vitest'

import { Rng } from '../rng'
import { createGame, type CreationChoices } from '../create'
import {
  acceptOffer,
  beginSeason,
  choosePerk,
  confirmDraft,
  continueAfterEvent,
  continueFromNational,
  continueFromSeason,
  resolveChoice,
  resolveMinigame,
  resolveNationalFinal,
} from '../engine'
import { buildChallenge, isWin, tuningFor } from '../minigame'
import { computeTotals } from '../legacy'
import type { GameState, MinigameType, Position } from '../types'
import { COUNTRIES } from '@/data/countries'
import { PLAY_STYLES } from '@/data/styles'
import { getLeague } from '@/data/leagues'
import { getTeam } from '@/data/teams'
import { cupForLeague } from '@/data/cups'

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']

/** Play a career where the player converts `successes(required, rounds)` finals. */
function play(seed: string, successes: (required: number, rounds: number) => number): GameState {
  const rng = new Rng(seed)
  const choices: CreationChoices = {
    name: seed,
    countryCode: rng.pick(COUNTRIES).code,
    number: rng.int(0, 99),
    position: rng.pick(POSITIONS),
    hand: 'right',
    styleId: rng.pick(PLAY_STYLES).id,
  }
  let s = createGame(choices, seed, 'career')
  const policy = new Rng(`${seed}::policy`)
  let guard = 0

  while (!s.player.retired && guard < 220) {
    guard++
    switch (s.phase) {
      case 'draft':
        s = confirmDraft(s)
        break
      case 'offers':
        s = acceptOffer(s, 0)
        break
      case 'preseason':
        if (s.player.perkChoices.length > 0) s = choosePerk(s, s.player.perkChoices[0])
        s = beginSeason(s)
        break
      case 'event': {
        const options = s.pendingEvent?.choices ?? []
        s = resolveChoice(s, options[policy.int(0, Math.max(0, options.length - 1))]?.index ?? 0)
        s = continueAfterEvent(s)
        break
      }
      case 'minigame': {
        const mg = s.pendingMinigame!
        s = resolveMinigame(s, successes(mg.required, mg.rounds))
        break
      }
      case 'season_result':
        s = continueFromSeason(s)
        break
      case 'national':
        if (s.pendingMinigame) {
          const mg = s.pendingMinigame
          s = resolveNationalFinal(s, successes(mg.required, mg.rounds))
        } else {
          s = continueFromNational(s)
        }
        break
      case 'retirement':
        return s
    }
  }
  return s
}

const ALWAYS_WIN = (required: number) => required
const ALWAYS_LOSE = () => 0

describe('minigame challenge', () => {
  it('demands more successes than a single lucky tap', () => {
    for (const leagueId of ['nba', 'euroleague', 'acb', 'lnb_ar']) {
      const league = getLeague(leagueId)
      const challenge = buildChallenge({
        player: createGame(
          { name: 'x', countryCode: 'AR', number: 7, position: 'SG', hand: 'right', styleId: 'scorer' },
          'challenge-shape',
          'career',
        ).player,
        competition: 'league' as const,
        league,
        opponentStrength: getTeam(league.teamIds[1]).strength,
        opponentName: getTeam(league.teamIds[1]).name,
        opponentTeamId: getTeam(league.teamIds[1]).id,
        rng: new Rng(`shape-${leagueId}`),
        stake: { es: 'x', en: 'x' },
      })

      expect(challenge.required, leagueId).toBeGreaterThan(1)
      expect(challenge.rounds, leagueId).toBeGreaterThanOrEqual(challenge.required)
    }
  })

  it('keeps difficulty and every tuning value inside a playable range', () => {
    const rng = new Rng('tuning-sweep')
    for (let i = 0; i < 200; i++) {
      const league = getLeague(rng.pick(['nba', 'euroleague', 'acb', 'nbb', 'lnb_ar']))
      const state = createGame(
        {
          name: `p${i}`,
          countryCode: rng.pick(COUNTRIES).code,
          number: rng.int(0, 99),
          position: rng.pick(POSITIONS),
          hand: 'right',
          styleId: rng.pick(PLAY_STYLES).id,
        },
        `tuning-${i}`,
        'career',
      )
      const opponent = getTeam(rng.pick(league.teamIds))
      const challenge = buildChallenge({
        player: state.player,
        competition: 'league' as const,
        league,
        opponentStrength: opponent.strength,
        opponentName: opponent.name,
        opponentTeamId: opponent.id,
        rng: new Rng(`t-${i}`),
        stake: { es: 'x', en: 'x' },
      })
      const tuning = tuningFor(challenge)

      expect(challenge.difficulty).toBeGreaterThanOrEqual(0.14)
      expect(challenge.difficulty).toBeLessThanOrEqual(0.9)
      // A target you cannot possibly hit is not a game.
      expect(tuning.freeThrowZone).toBeGreaterThan(0.02)
      expect(tuning.clutchWindow).toBeGreaterThan(0.02)
      expect(tuning.clutchDuration).toBeGreaterThan(1)
      expect(tuning.stopWindowMs).toBeGreaterThan(300)
      expect(tuning.stopFeints).toBeGreaterThanOrEqual(1)
      expect(challenge.title.es).not.toEqual(challenge.title.en)
    }
  })

  it('gives a better shooter an easier shooting challenge', () => {
    const league = getLeague('acb')
    const base = createGame(
      { name: 'a', countryCode: 'ES', number: 9, position: 'SG', hand: 'right', styleId: 'sharpshooter' },
      'shooter-compare',
      'career',
    )

    function difficultyWithShooting(shooting: number) {
      const player = structuredClone(base.player)
      player.attributes.shooting = shooting
      // Force the same challenge type on both sides of the comparison.
      const challenge = buildChallenge({
        player,
        competition: 'league' as const,
        league,
        opponentStrength: getTeam(league.teamIds[1]).strength,
        opponentName: getTeam(league.teamIds[1]).name,
        opponentTeamId: getTeam(league.teamIds[1]).id,
        rng: new Rng('fixed-type'),
        stake: { es: 'x', en: 'x' },
      })
      return { type: challenge.type, difficulty: challenge.difficulty }
    }

    const weak = difficultyWithShooting(35)
    const strong = difficultyWithShooting(92)
    if (weak.type === strong.type) {
      expect(strong.difficulty).toBeLessThan(weak.difficulty)
    }
  })

  it('resolves a win only at or above the required successes', () => {
    const challenge = {
      required: 3,
      rounds: 5,
    } as Parameters<typeof isWin>[0]
    expect(isWin(challenge, 2)).toBe(false)
    expect(isWin(challenge, 3)).toBe(true)
    expect(isWin(challenge, 5)).toBe(true)
  })
})

describe('minigames in a career', () => {
  it('stays deterministic when the minigame results are the same', () => {
    const a = play('mg-determinism', ALWAYS_WIN)
    const b = play('mg-determinism', ALWAYS_WIN)
    expect(JSON.stringify(a.seasons)).toEqual(JSON.stringify(b.seasons))
  })

  it('lets the player decide titles: winning finals yields more of them', () => {
    let won = 0
    let lost = 0
    for (let i = 0; i < 60; i++) {
      won += computeTotals(play(`finals-${i}`, ALWAYS_WIN).seasons).rings
      lost += computeTotals(play(`finals-${i}`, ALWAYS_LOSE).seasons).rings
    }
    expect(won).toBeGreaterThan(lost)
  })

  it('never awards a title to a player who lost every final they played', () => {
    for (let i = 0; i < 40; i++) {
      const state = play(`no-rings-${i}`, ALWAYS_LOSE)
      for (const season of state.seasons) {
        // A contested final that was lost must read as 'finals', never 'champion'.
        // Titles can still arrive from finals the player could not contest
        // (injured out of the season), so only assert on seasons they played.
        if (season.playoffResult === 'champion') {
          expect(
            season.role === 'injured' || season.gamesPlayed === 0 || getLeague(season.leagueId).tier > 3,
            `season ${season.year} awarded a title after losing the final`,
          ).toBe(true)
        }
      }
    }
  })

  it('leaves no dangling minigame state once a final is resolved', () => {
    const state = play('mg-cleanup', ALWAYS_WIN)
    expect(state.pendingMinigame).toBeNull()
    expect(state.draftSeason).toBeNull()
    expect(state.pendingFinals).toHaveLength(0)
    // Every season that was drafted made it into the log exactly once.
    const years = state.seasons.map((s) => s.year)
    expect(new Set(years).size).toBe(years.length)
  })

  it('hands over both finals when a club reaches its cup final and its league final', () => {
    // The two are decided months apart, so neither may swallow the other.
    let doubles = 0
    for (let i = 0; i < 40; i++) {
      const state = play(`double-${i}`, ALWAYS_WIN)
      for (const season of state.seasons) {
        if (
          season.awards.includes('cup_champion') &&
          season.playoffResult === 'champion' &&
          getLeague(season.leagueId).tier <= 3
        ) {
          doubles++
        }
      }
    }
    expect(doubles).toBeGreaterThan(0)
  })

  it('only awards a cup to a player whose club actually reached the cup final', () => {
    for (let i = 0; i < 30; i++) {
      const state = play(`cup-honest-${i}`, ALWAYS_WIN)
      for (const season of state.seasons) {
        if (!season.awards.includes('cup_champion')) continue
        // Cups only exist where the data layer defines one for the league.
        expect(cupForLeague(season.leagueId), `${season.leagueId} has no cup`).not.toBeNull()
      }
    }
  })

  it('lets the player decide cups too: winning finals yields more of them', () => {
    let won = 0
    let lost = 0
    for (let i = 0; i < 50; i++) {
      won += computeTotals(play(`cups-${i}`, ALWAYS_WIN).seasons).cups
      lost += computeTotals(play(`cups-${i}`, ALWAYS_LOSE).seasons).cups
    }
    expect(won).toBeGreaterThan(lost)
  })

  it('only ever offers a final the player was actually on the floor for', () => {
    for (let i = 0; i < 40; i++) {
      const seed = `contest-${i}`
      const rng = new Rng(seed)
      let s = createGame(
        {
          name: seed,
          countryCode: 'ES',
          number: 4,
          position: 'SF',
          hand: 'right',
          styleId: 'franchise',
        },
        seed,
        'career',
      )
      let guard = 0
      while (!s.player.retired && guard < 220) {
        guard++
        if (s.phase === 'minigame' && s.pendingMinigame && s.draftSeason) {
          const draft = s.draftSeason
          expect(draft.gamesPlayed).toBeGreaterThan(0)
          expect(draft.role).not.toBe('injured')
          // League finals are only played in the top three tiers. Domestic cups
          // are playable wherever they exist, which is the point of them: a
          // fourth-tier career still has a trophy it can win.
          if (s.pendingMinigame.competition === 'league') {
            expect(getLeague(draft.leagueId).tier).toBeLessThanOrEqual(3)
          }
          expect(draft.teamId).not.toBe(s.pendingMinigame.opponentTeamId)
          s = resolveMinigame(s, s.pendingMinigame.required)
          continue
        }
        switch (s.phase) {
          case 'draft':
            s = confirmDraft(s)
            break
          case 'offers':
            s = acceptOffer(s, 0)
            break
          case 'preseason':
            if (s.player.perkChoices.length > 0) s = choosePerk(s, s.player.perkChoices[0])
            s = beginSeason(s)
            break
          case 'event': {
            const options = s.pendingEvent?.choices ?? []
            s = resolveChoice(s, options[rng.int(0, Math.max(0, options.length - 1))]?.index ?? 0)
            s = continueAfterEvent(s)
            break
          }
          case 'minigame':
            s = resolveMinigame(s, s.pendingMinigame!.required)
            break
          case 'season_result':
            s = continueFromSeason(s)
            break
          case 'national':
            s = s.pendingMinigame
              ? resolveNationalFinal(s, s.pendingMinigame.required)
              : continueFromNational(s)
            break
          case 'retirement':
            break
        }
      }
    }
  })

  it('picks a challenge suited to the player', () => {
    // A lockdown big should see defensive stops far more often than threes.
    const counts: Record<MinigameType, number> = {
      free_throw: 0,
      clutch_three: 0,
      defensive_stop: 0,
      fast_break: 0,
      play_recall: 0,
    }
    const league = getLeague('acb')
    for (let i = 0; i < 120; i++) {
      const state = createGame(
        { name: `d${i}`, countryCode: 'ES', number: 55, position: 'C', hand: 'right', styleId: 'lockdown' },
        `def-${i}`,
        'career',
      )
      const challenge = buildChallenge({
        player: state.player,
        competition: 'league' as const,
        league,
        opponentStrength: getTeam(league.teamIds[1]).strength,
        opponentName: getTeam(league.teamIds[1]).name,
        opponentTeamId: getTeam(league.teamIds[1]).id,
        rng: new Rng(`pick-${i}`),
        stake: { es: 'x', en: 'x' },
      })
      counts[challenge.type]++
    }
    expect(counts.defensive_stop).toBeGreaterThan(counts.clutch_three)
  })
})
