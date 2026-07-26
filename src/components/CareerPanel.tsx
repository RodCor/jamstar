'use client'

import { useState } from 'react'
import { useT } from '@/i18n/LocaleProvider'
import type { GameState } from '@/game/types'
import { getTeam } from '@/data/teams'
import { flagFor } from '@/data/countries'
import { computeTotals } from '@/game/legacy'
import { rivalAverages } from '@/game/rival'
import { AWARD_INFO } from '@/game/awards'
import { PLAYOFF_KEY, formatMoney } from './display'
import { TeamCrest } from './TeamCrest'

/** Collapsible career/rival record, shown alongside the active season. */
export function CareerPanel({ state }: { state: GameState }) {
  const { t, locale } = useT()
  const [tab, setTab] = useState<'career' | 'rival'>('career')

  const totals = computeTotals(state.seasons)
  if (state.seasons.length === 0) return null

  return (
    <div className="panel overflow-hidden">
      <div className="flex border-b border-white/10">
        {(['career', 'rival'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTab(option)}
            aria-pressed={tab === option}
            className={`flex-1 px-3 py-2.5 text-sm font-bold transition ${
              tab === option
                ? 'border-b-2 border-flame-500 text-flame-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {option === 'career' ? t('careerTab') : t('rivalTab')}
          </button>
        ))}
      </div>

      {tab === 'career' ? (
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Mini label={t('statPts')} value={totals.ppg.toFixed(1)} />
            <Mini label={t('statReb')} value={totals.rpg.toFixed(1)} />
            <Mini label={t('statAst')} value={totals.apg.toFixed(1)} />
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Mini label={t('seasonsPlayed')} value={String(totals.seasons)} />
            <Mini label={t('rings')} value={String(totals.rings)} />
            <Mini label={t('mvps')} value={String(totals.mvps)} />
            <Mini label={t('allStars')} value={String(totals.allStars)} />
          </div>
          <p className="text-center text-xs text-slate-400">
            {t('earnings')}:{' '}
            <span className="tnum font-bold text-slate-200">
              {formatMoney(totals.earnings, locale)}
            </span>
          </p>

          <div>
            <span className="label">{t('timeline')}</span>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">
              {[...state.seasons].reverse().map((season) => {
                const team = getTeam(season.teamId)
                return (
                  <li
                    key={`${season.year}-${season.teamId}`}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs"
                  >
                    <span className="tnum w-9 shrink-0 text-slate-500">{season.year}</span>
                    <TeamCrest teamId={team.id} size={22} />
                    <span className="tnum shrink-0 font-semibold text-slate-200">
                      {season.points.toFixed(1)}/{season.rebounds.toFixed(1)}/{season.assists.toFixed(1)}
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
        </div>
      ) : (
        <RivalTab state={state} />
      )}
    </div>
  )
}

function RivalTab({ state }: { state: GameState }) {
  const { t, L } = useT()
  const { rival } = state
  const totals = computeTotals(state.seasons)
  const rivalAvg = rivalAverages(rival)

  return (
    <div className="space-y-4 p-4">
      <div className="text-center">
        <span className="label">{t('rivalTitle')}</span>
        <p className="mt-1 text-lg font-black text-slate-50">
          {flagFor(rival.countryCode)} {rival.name}
        </p>
        <p className="mt-1 text-xs leading-snug text-slate-400">{L(rival.origin)}</p>
        {rival.retired && rival.retirementYear && (
          <p className="mt-1 text-xs text-slate-500">
            {t('rivalRetired', { year: rival.retirementYear })}
          </p>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-slate-500">
            <th className="py-1 text-left font-semibold">—</th>
            <th className="py-1 text-center font-semibold text-flame-400">
              {state.player.name || '—'}
            </th>
            <th className="py-1 text-center font-semibold">{rival.name.split(' ').pop()}</th>
          </tr>
        </thead>
        <tbody className="tnum">
          <ComparisonRow label={t('statPts')} mine={totals.ppg.toFixed(1)} theirs={rivalAvg.ppg.toFixed(1)} mineWins={totals.ppg >= rivalAvg.ppg} />
          <ComparisonRow label={t('statReb')} mine={totals.rpg.toFixed(1)} theirs={rivalAvg.rpg.toFixed(1)} mineWins={totals.rpg >= rivalAvg.rpg} />
          <ComparisonRow label={t('statAst')} mine={totals.apg.toFixed(1)} theirs={rivalAvg.apg.toFixed(1)} mineWins={totals.apg >= rivalAvg.apg} />
          <ComparisonRow label={t('rings')} mine={String(totals.rings)} theirs={String(rival.totals.rings)} mineWins={totals.rings >= rival.totals.rings} />
          <ComparisonRow label={t('mvps')} mine={String(totals.mvps)} theirs={String(rival.totals.mvps)} mineWins={totals.mvps >= rival.totals.mvps} />
          <ComparisonRow label={t('allStars')} mine={String(totals.allStars)} theirs={String(rival.totals.allStars)} mineWins={totals.allStars >= rival.totals.allStars} />
        </tbody>
      </table>
    </div>
  )
}

function ComparisonRow({
  label,
  mine,
  theirs,
  mineWins,
}: {
  label: string
  mine: string
  theirs: string
  mineWins: boolean
}) {
  return (
    <tr className="border-t border-white/5">
      <td className="py-1.5 text-xs text-slate-400">{label}</td>
      <td className={`py-1.5 text-center font-bold ${mineWins ? 'text-flame-400' : 'text-slate-400'}`}>
        {mine}
      </td>
      <td className={`py-1.5 text-center font-bold ${!mineWins ? 'text-slate-100' : 'text-slate-400'}`}>
        {theirs}
      </td>
    </tr>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-2">
      <p className="tnum text-base font-black text-slate-100">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}
