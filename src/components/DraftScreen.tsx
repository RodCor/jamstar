'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/i18n/LocaleProvider'
import type { GameState } from '@/game/types'
import { getTeam } from '@/data/teams'
import { getLeague } from '@/data/leagues'
import { flagFor } from '@/data/countries'
import { TeamCrest } from './TeamCrest'

interface Props {
  state: GameState
  onContinue: () => void
}

/**
 * Draft night, paced out.
 *
 * The picks ahead of you reveal one at a time before your own lands. It is the
 * one evening in a basketball career that deserves to be slow.
 */
export function DraftScreen({ state, onContinue }: Props) {
  const { t, L } = useT()
  const result = state.pendingDraft
  const [revealed, setRevealed] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const preceding = result?.precedingPicks ?? []

  useEffect(() => {
    if (!result) return
    if (revealed < preceding.length) {
      const id = window.setTimeout(() => setRevealed((n) => n + 1), 550)
      return () => window.clearTimeout(id)
    }
    const id = window.setTimeout(() => setShowResult(true), 700)
    return () => window.clearTimeout(id)
  }, [revealed, preceding.length, result])

  if (!result) return null

  const drafted = result.pick !== null && result.teamId !== null
  const team = drafted ? getTeam(result.teamId!) : getTeam(result.fallbackTeamId)
  const league = getLeague(drafted ? 'nba' : result.fallbackLeagueId)

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 bg-flame-500/10 px-4 py-2 text-center">
          <span className="label text-flame-400">{t('draftNight')}</span>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-sm text-slate-400">{t('draftProjected')}</p>
          <p className="tnum mt-1 text-2xl font-black text-slate-100">
            #{result.projectedRange[0]} – #{result.projectedRange[1]}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {flagFor(state.player.countryCode)} {state.player.name || '—'} ·{' '}
            {state.player.position}
          </p>
        </div>
      </div>

      {preceding.length > 0 && (
        <div className="panel p-3">
          <span className="label">{t('draftOnTheBoard')}</span>
          <ul className="mt-2 space-y-1">
            {preceding.slice(0, revealed).map((pick) => (
              <li
                key={pick.pick}
                className="flex animate-fade-up items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs"
              >
                <span className="tnum w-6 shrink-0 font-bold text-slate-500">{pick.pick}</span>
                <span className="w-11 shrink-0 rounded bg-white/10 px-1 py-0.5 text-center text-[10px] font-black text-slate-300">
                  {pick.teamAbbr}
                </span>
                <span className="truncate text-slate-300">{pick.name}</span>
              </li>
            ))}
            {revealed < preceding.length && (
              <li className="px-2.5 py-1.5 text-xs text-slate-600">…</li>
            )}
          </ul>
        </div>
      )}

      {showResult && (
        <>
          <div
            className={`panel animate-fade-up overflow-hidden text-center ${
              drafted ? 'border-flame-500/40' : ''
            }`}
          >
            <div
              className={`px-4 py-5 ${
                drafted ? 'bg-gradient-to-b from-flame-500/25 to-transparent' : ''
              }`}
            >
              {drafted ? (
                <>
                  <p className="tnum text-5xl font-black text-flame-400">#{result.pick}</p>
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <TeamCrest teamId={team.id} size={54} />
                    <div className="text-left">
                      <p className="font-black text-slate-50">{L(team.name)}</p>
                      <p className="text-xs text-slate-400">{L(league.name)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{t('draftPicked')}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-black text-slate-300">{t('draftUndrafted')}</p>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
                    {t('draftUndraftedBody')}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <TeamCrest teamId={team.id} size={48} />
                    <div className="text-left">
                      <p className="font-bold text-slate-100">{L(team.name)}</p>
                      <p className="text-xs text-slate-400">{L(league.name)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="btn-primary w-full animate-fade-up py-3.5 text-base"
          >
            {t('continue')}
          </button>
        </>
      )}
    </div>
  )
}
