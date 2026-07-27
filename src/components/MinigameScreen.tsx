'use client'

import { useCallback, useMemo, useState } from 'react'
import { useT } from '@/i18n/LocaleProvider'
import type { GameState, MinigameType } from '@/game/types'
import { hashSeed } from '@/game/rng'
import { tuningFor, type MinigameTuning } from '@/game/minigame'
import { getTeam } from '@/data/teams'
import { TeamCrest } from './TeamCrest'
import { LeagueCrest, CupCrest } from './CompetitionCrest'
import { FreeThrow } from './minigames/FreeThrow'
import { ClutchThree } from './minigames/ClutchThree'
import { DefensiveStop } from './minigames/DefensiveStop'
import { FastBreak } from './minigames/FastBreak'
import { PlayRecall } from './minigames/PlayRecall'

interface Props {
  state: GameState
  /** Called with how many attempts were converted. */
  onFinish: (successes: number) => void
}

export function MinigameScreen({ state, onFinish }: Props) {
  const { t, L } = useT()
  const challenge = state.pendingMinigame
  const [results, setResults] = useState<boolean[]>([])
  const [started, setStarted] = useState(false)

  const tuning = useMemo(() => (challenge ? tuningFor(challenge) : null), [challenge])

  const handleResult = useCallback(
    (success: boolean) => {
      setResults((current) => {
        const next = [...current, success]
        if (!challenge) return next

        const successes = next.filter(Boolean).length
        const canStillWin = successes + (challenge.rounds - next.length) >= challenge.required
        const alreadyWon = successes >= challenge.required

        // Stop as soon as the series is decided — no dead attempts.
        if (alreadyWon || !canStillWin || next.length >= challenge.rounds) {
          window.setTimeout(() => onFinish(successes), 700)
        }
        return next
      })
    },
    [challenge, onFinish],
  )

  if (!challenge || !tuning) return null

  const opponentTeam = challenge.opponentTeamId ? getTeam(challenge.opponentTeamId) : null
  const playerTeam = getTeam(state.player.currentTeamId)
  const successes = results.filter(Boolean).length
  const decided =
    successes >= challenge.required ||
    successes + (challenge.rounds - results.length) < challenge.required

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 bg-flame-500/10 px-4 py-2">
          {/* The trophy that is actually on the line, when it has a badge. */}
          {challenge.competition === 'cup' && state.cupRun && (
            <CupCrest cupId={state.cupRun.cupId} size={18} />
          )}
          {challenge.competition === 'league' && (
            <LeagueCrest leagueId={state.player.currentLeagueId} size={18} />
          )}
          <span className="label text-flame-400">{L(challenge.stake)}</span>
        </div>

        {opponentTeam && (
          <div className="flex items-center justify-center gap-4 px-4 py-4">
            <div className="flex flex-col items-center gap-1.5">
              <TeamCrest teamId={playerTeam.id} size={52} />
              <span className="max-w-20 truncate text-[11px] font-semibold text-slate-300">
                {playerTeam.abbr}
              </span>
            </div>
            <span className="text-sm font-black text-slate-500">VS</span>
            <div className="flex flex-col items-center gap-1.5">
              <TeamCrest teamId={opponentTeam.id} size={52} />
              <span className="max-w-20 truncate text-[11px] font-semibold text-slate-300">
                {opponentTeam.abbr}
              </span>
            </div>
          </div>
        )}
        {!opponentTeam && (
          <p className="px-4 pt-4 text-center text-sm font-bold text-slate-300">
            vs {L(challenge.opponentName)}
          </p>
        )}

        <div className="px-4 pb-4 text-center">
          <h2 className="text-lg font-bold text-slate-50">{L(challenge.title)}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{L(challenge.intro)}</p>
          <p className="mt-2 text-xs font-semibold text-flame-400">
            {t('minigameGoal', { required: challenge.required, rounds: challenge.rounds })}
          </p>
        </div>
      </div>

      {/* Attempt tracker */}
      <div className="flex justify-center gap-1.5">
        {Array.from({ length: challenge.rounds }, (_, i) => {
          const outcome = results[i]
          return (
            <span
              key={i}
              className={`h-2.5 w-8 rounded-full ${
                outcome === undefined
                  ? 'bg-white/10'
                  : outcome
                    ? 'bg-emerald-400'
                    : 'bg-rose-400/70'
              }`}
            />
          )
        })}
      </div>

      {!started ? (
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="btn-primary w-full py-3.5 text-base"
        >
          {t('minigameStart')}
        </button>
      ) : (
        <>
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t(INSTRUCTION_KEY[challenge.type])}
          </p>
          {!decided && results.length < challenge.rounds && (
            <MinigameBody
              type={challenge.type}
              tuning={tuning}
              round={results.length}
              seed={hashSeed(`${state.seed}:${state.year}`) % 3}
              onResult={handleResult}
            />
          )}
        </>
      )}
    </div>
  )
}

const INSTRUCTION_KEY = {
  free_throw: 'minigameFreeThrowHelp',
  clutch_three: 'minigameClutchHelp',
  defensive_stop: 'minigameStopHelp',
  fast_break: 'minigameBreakHelp',
  play_recall: 'minigameRecallHelp',
} as const

function MinigameBody({
  type,
  tuning,
  round,
  seed,
  onResult,
}: {
  type: MinigameType
  tuning: MinigameTuning
  round: number
  seed: number
  onResult: (success: boolean) => void
}) {
  switch (type) {
    case 'free_throw':
      return <FreeThrow tuning={tuning} round={round} onResult={onResult} />
    case 'clutch_three':
      return <ClutchThree tuning={tuning} round={round} onResult={onResult} />
    case 'defensive_stop':
      return <DefensiveStop tuning={tuning} round={round} seed={seed} onResult={onResult} />
    case 'fast_break':
      return <FastBreak tuning={tuning} round={round} onResult={onResult} />
    case 'play_recall':
      return <PlayRecall tuning={tuning} round={round} seed={seed} onResult={onResult} />
  }
}
