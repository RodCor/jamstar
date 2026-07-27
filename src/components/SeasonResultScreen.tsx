'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { GameState, Season } from '@/game/types'
import { getTeam } from '@/data/teams'
import { getLeague } from '@/data/leagues'
import { PLAYOFF_KEY, ROLE_KEY, TONE_CLASS, formatMoney, formatPct } from './display'
import { AwardReveal } from './AwardReveal'
import { TeamCrest } from './TeamCrest'
import { LogoBadge } from './LogoBadge'

interface Props {
  state: GameState
  onContinue: () => void
}

export function SeasonResultScreen({ state, onContinue }: Props) {
  const { t } = useT()
  const season = state.seasons[state.seasons.length - 1]
  if (!season) return null

  return (
    <div className="space-y-3 animate-fade-up">
      <AwardReveal awards={season.awards} cupId={state.cupRun?.won ? state.cupRun.cupId : null} />
      <SeasonCard season={season} />
      <button type="button" onClick={onContinue} className="btn-primary w-full py-3.5 text-base">
        {t('continue')}
      </button>
    </div>
  )
}

export function SeasonCard({ season }: { season: Season }) {
  const { t, L, locale } = useT()
  const team = getTeam(season.teamId)
  const league = getLeague(season.leagueId)
  const isYouth = league.id === 'youth'

  return (
    <div className="panel overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: `linear-gradient(100deg, ${team.colors[0]}33, transparent)` }}
      >
        <TeamCrest teamId={team.id} size={46} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-100">{L(team.name)}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-slate-400">
            <LogoBadge id={league.id} label={L(league.name)} size={14} />
            {L(league.name)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="tnum text-sm font-bold text-slate-200">{season.year}</p>
          <p className="tnum text-xs text-slate-400">
            {t('age')} {season.age}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-white/10 sm:grid-cols-6">
        <Stat label={t('statPts')} value={season.points.toFixed(1)} highlight />
        <Stat label={t('statReb')} value={season.rebounds.toFixed(1)} />
        <Stat label={t('statAst')} value={season.assists.toFixed(1)} />
        <Stat label={t('statStl')} value={season.steals.toFixed(1)} />
        <Stat label={t('statBlk')} value={season.blocks.toFixed(1)} />
        <Stat label={t('statMin')} value={season.minutesPerGame.toFixed(0)} />
      </div>

      <div className="grid grid-cols-4 gap-px bg-white/10">
        <Stat label={t('statGames')} value={String(season.gamesPlayed)} small />
        <Stat label={t('statFg')} value={formatPct(season.fgPct)} small />
        <Stat label={t('statThree')} value={formatPct(season.threePct)} small />
        <Stat label={t('statTs')} value={formatPct(season.tsPct)} small />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="chip">
            {t('role')}: <span className="font-bold text-slate-100">{t(ROLE_KEY[season.role])}</span>
          </span>
          {!isYouth && (
            <span className="chip tnum">
              {t('record')}:{' '}
              <span className="font-bold text-slate-100">
                {season.teamWins}-{season.teamLosses}
              </span>
            </span>
          )}
          {season.playoffResult !== 'none' && (
            <span
              className={`chip ${
                season.playoffResult === 'champion' ? 'border-flame-400/40 bg-flame-400/15 text-flame-400' : ''
              }`}
            >
              {t(PLAYOFF_KEY[season.playoffResult])}
            </span>
          )}
          {season.salary > 0 && (
            <span className="chip tnum">
              {t('salary')}:{' '}
              <span className="font-bold text-slate-100">{formatMoney(season.salary, locale)}</span>
            </span>
          )}
          {season.gamesMissed > 0 && (
            <span className="chip border-rose-400/25 text-rose-300">
              {t('injuryOut', { n: season.gamesMissed })}
            </span>
          )}
        </div>

        {season.headlines.length > 0 && (
          <ul className="space-y-1.5">
            {season.headlines.map((headline, i) => (
              <li
                key={i}
                className={`rounded-xl border px-3 py-2 text-sm leading-snug ${
                  TONE_CLASS[headline.tone] ?? TONE_CLASS.neutral
                }`}
              >
                {L(headline.text)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
  small,
}: {
  label: string
  value: string
  highlight?: boolean
  small?: boolean
}) {
  return (
    <div className="bg-court-900 px-2 py-2.5 text-center">
      <p
        className={`tnum font-black ${small ? 'text-sm' : 'text-lg'} ${
          highlight ? 'text-flame-400' : 'text-slate-100'
        }`}
      >
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}
