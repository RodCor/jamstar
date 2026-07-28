'use client'

import { useState } from 'react'
import { useT } from '@/i18n/LocaleProvider'
import type { GameState } from '@/game/types'
import { getTeam } from '@/data/teams'
import { getLeague } from '@/data/leagues'
import { flagFor } from '@/data/countries'
import { computeTotals } from '@/game/legacy'
import { rivalAverages } from '@/game/rival'
import { AWARD_INFO } from '@/game/awards'
import { DRAFT_LIKELIHOOD_KEY, DRAFT_TIER_KEY, PLAYOFF_KEY } from './display'
import { TeamCrest } from './TeamCrest'
import { LeagueCrest } from './CompetitionCrest'
import { getDraftOutlook } from './DraftOutlook'

/**
 * The career at a glance, pinned above whatever decision is on screen.
 *
 * It used to sit below the action, which meant the reference material pushed the
 * actual choice off the fold. Standing state belongs at the top; the thing you
 * are being asked to do belongs in the middle of the screen.
 */
export function CareerStrip({ state }: { state: GameState }) {
  const { t, L } = useT()
  const [open, setOpen] = useState(false)

  const totals = computeTotals(state.seasons)
  const team = getTeam(state.player.currentTeamId)
  const league = getLeague(state.player.currentLeagueId)
  const hasHistory = state.seasons.length > 0
  const draftOutlook = getDraftOutlook(state)

  return (
    <div className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!hasHistory}
        className="flex w-full flex-col gap-1.5 px-3 py-2.5 text-left disabled:cursor-default"
      >
        <div className="flex w-full items-center gap-2.5">
          <TeamCrest teamId={team.id} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-slate-100">
              {flagFor(state.player.countryCode)} {state.player.name || '—'}
            </p>
            <p className="flex items-center gap-1 truncate text-[11px] leading-tight text-slate-500">
              {league.id !== 'youth' && (
                <LeagueCrest leagueId={league.id} size={12} />
              )}
              {league.id === 'youth' ? L(team.name) : `${team.abbr} · ${league.abbr}`} ·{' '}
              {state.year} · {state.player.age}
            </p>
          </div>

          {hasHistory && (
            <div className="tnum flex shrink-0 items-center gap-2.5 text-right">
              <Stat label={t('statPts')} value={totals.ppg.toFixed(1)} />
              <Stat label={t('statReb')} value={totals.rpg.toFixed(1)} />
              <Stat label={t('statAst')} value={totals.apg.toFixed(1)} />
              <span className="text-xs text-slate-600">{open ? '▲' : '▼'}</span>
            </div>
          )}
        </div>

        {/* Own full-width row rather than sharing the name column — that
            column is only ~180px wide once the crest and stat block take
            their share, well under the ~320px this line can run to. */}
        {draftOutlook && !draftOutlook.detailed && (
          <p className="truncate text-[11px] font-semibold leading-tight text-flame-400">
            {t('draftStripLabel')} · {t('draftStripFarOff')}
          </p>
        )}

        {draftOutlook && draftOutlook.detailed && (
          <p className="truncate text-[11px] font-semibold leading-tight text-flame-400">
            {t('draftStripLabel')} ·{' '}
            {draftOutlook.eligibleNow || draftOutlook.seasonsUntilForced === 0
              ? t('draftStripSoon')
              : t('draftStripIn', { n: draftOutlook.seasonsUntilForced })}{' '}
            · {t(DRAFT_TIER_KEY[draftOutlook.tier])} (#{draftOutlook.projectedRange[0]}–#
            {draftOutlook.projectedRange[1]})
            {/* Same rule as the panel: only flag the odds when they are not
                already high, so this stays a compact label the rest of the time. */}
            {draftOutlook.likelihood !== 'strong' && ` · ${t(DRAFT_LIKELIHOOD_KEY[draftOutlook.likelihood])}`}
          </p>
        )}
      </button>

      {open && hasHistory && <Details state={state} />}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="block leading-none">
      <span className="block text-sm font-black text-slate-100">{value}</span>
      <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </span>
    </span>
  )
}

function Details({ state }: { state: GameState }) {
  const { t } = useT()
  const [tab, setTab] = useState<'career' | 'rival'>('career')
  const totals = computeTotals(state.seasons)
  const rivalAvg = rivalAverages(state.rival)

  return (
    <div className="border-t border-white/10">
      <div className="flex">
        {(['career', 'rival'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTab(option)}
            aria-pressed={tab === option}
            className={`flex-1 py-2 text-xs font-bold transition ${
              tab === option
                ? 'border-b-2 border-flame-500 text-flame-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {option === 'career' ? t('careerTab') : t('rivalTab')}
          </button>
        ))}
      </div>

      {tab === 'career' ? (
        <div className="space-y-2.5 p-3">
          <div className="tnum grid grid-cols-5 gap-1 text-center">
            <Mini label={t('seasonsPlayed')} value={String(totals.seasons)} />
            <Mini label={t('rings')} value={String(totals.rings)} />
            <Mini label={t('cups')} value={String(totals.cups)} />
            <Mini label={t('mvps')} value={String(totals.mvps)} />
            <Mini label={t('allStars')} value={String(totals.allStars)} />
          </div>

          <ul className="max-h-56 space-y-1 overflow-y-auto pr-0.5">
            {[...state.seasons].reverse().map((season) => {
              const team = getTeam(season.teamId)
              return (
                <li
                  key={`${season.year}-${season.teamId}`}
                  className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-[11px]"
                >
                  <span className="tnum w-8 shrink-0 text-slate-600">{season.year}</span>
                  <TeamCrest teamId={team.id} size={18} />
                  <span className="tnum shrink-0 font-semibold text-slate-200">
                    {season.points.toFixed(1)}/{season.rebounds.toFixed(1)}/
                    {season.assists.toFixed(1)}
                  </span>
                  <span className="ml-auto truncate text-right text-slate-500">
                    {season.awards.length > 0
                      ? season.awards.map((a) => AWARD_INFO[a].icon).join('')
                      : t(PLAYOFF_KEY[season.playoffResult])}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="space-y-2 p-3">
          <p className="text-center text-sm font-bold text-slate-100">
            {flagFor(state.rival.countryCode)} {state.rival.name}
          </p>
          <table className="tnum w-full text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-wide text-slate-600">
                <th className="py-1 text-left font-semibold">—</th>
                <th className="py-1 text-center font-semibold text-flame-400">
                  {t('careerTab')}
                </th>
                <th className="py-1 text-center font-semibold">
                  {state.rival.name.split(' ').pop()}
                </th>
              </tr>
            </thead>
            <tbody>
              <Row label={t('statPts')} a={totals.ppg.toFixed(1)} b={rivalAvg.ppg.toFixed(1)} win={totals.ppg >= rivalAvg.ppg} />
              <Row label={t('statReb')} a={totals.rpg.toFixed(1)} b={rivalAvg.rpg.toFixed(1)} win={totals.rpg >= rivalAvg.rpg} />
              <Row label={t('statAst')} a={totals.apg.toFixed(1)} b={rivalAvg.apg.toFixed(1)} win={totals.apg >= rivalAvg.apg} />
              <Row label={t('rings')} a={String(totals.rings)} b={String(state.rival.totals.rings)} win={totals.rings >= state.rival.totals.rings} />
              <Row label={t('mvps')} a={String(totals.mvps)} b={String(state.rival.totals.mvps)} win={totals.mvps >= state.rival.totals.mvps} />
              <Row label={t('allStars')} a={String(totals.allStars)} b={String(state.rival.totals.allStars)} win={totals.allStars >= state.rival.totals.allStars} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-1 py-1.5">
      <p className="text-sm font-black text-slate-100">{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">{label}</p>
    </div>
  )
}

function Row({ label, a, b, win }: { label: string; a: string; b: string; win: boolean }) {
  return (
    <tr className="border-t border-white/5">
      <td className="py-1 text-[11px] text-slate-500">{label}</td>
      <td className={`py-1 text-center font-bold ${win ? 'text-flame-400' : 'text-slate-500'}`}>
        {a}
      </td>
      <td className={`py-1 text-center font-bold ${!win ? 'text-slate-200' : 'text-slate-500'}`}>
        {b}
      </td>
    </tr>
  )
}
