'use client'

import { useState } from 'react'
import { useT } from '@/i18n/LocaleProvider'
import type { GameState, Position, Season } from '@/game/types'
import { getTeam } from '@/data/teams'
import { getLeague } from '@/data/leagues'
import { PLAYOFF_KEY, ROLE_KEY, TONE_CLASS, formatMoney, formatPct } from './display'
import { AwardReveal } from './AwardReveal'
import { TeamCrest } from './TeamCrest'
import { LeagueCrest } from './CompetitionCrest'
import { trophiesFor } from '@/game/trophies'

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
      <AwardReveal awards={season.awards} trophies={trophiesFor(season)} />
      <SeasonCard season={season} position={state.player.position} />
      <button type="button" onClick={onContinue} className="btn-primary w-full py-3.5 text-base">
        {t('continue')}
      </button>
    </div>
  )
}

type CountingStat = 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks'

/** The three numbers that define each position, plus the two that define a season. */
const BOX_LEAD: Record<Position, CountingStat[]> = {
  PG: ['points', 'assists', 'steals'],
  SG: ['points', 'assists', 'steals'],
  SF: ['points', 'rebounds', 'steals'],
  PF: ['points', 'rebounds', 'blocks'],
  C: ['points', 'rebounds', 'blocks'],
}

const ALL_COUNTING_STATS: CountingStat[] = ['points', 'rebounds', 'assists', 'steals', 'blocks']

const COUNTING_STAT_LABEL: Record<CountingStat, 'statPts' | 'statReb' | 'statAst' | 'statStl' | 'statBlk'> = {
  points: 'statPts',
  rebounds: 'statReb',
  assists: 'statAst',
  steals: 'statStl',
  blocks: 'statBlk',
}

export function SeasonCard({ season, position }: { season: Season; position: Position }) {
  const { t, L, locale } = useT()
  const [expanded, setExpanded] = useState(false)
  const team = getTeam(season.teamId)
  const league = getLeague(season.leagueId)
  const isYouth = league.id === 'youth'

  const leadStats = BOX_LEAD[position]
  const restStats = ALL_COUNTING_STATS.filter((stat) => !leadStats.includes(stat))

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
            <LeagueCrest leagueId={league.id} size={16} />
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

      <div className="grid grid-cols-5 gap-px bg-white/10">
        {leadStats.map((stat, i) => (
          <Stat key={stat} label={t(COUNTING_STAT_LABEL[stat])} value={season[stat].toFixed(1)} highlight={i === 0} />
        ))}
        <Stat label={t('statGames')} value={String(season.gamesPlayed)} />
        <Stat label={t('statTs')} value={formatPct(season.tsPct)} />
      </div>

      {expanded && (
        <div className="grid grid-cols-5 gap-px bg-white/10">
          {restStats.map((stat) => (
            <Stat key={stat} label={t(COUNTING_STAT_LABEL[stat])} value={season[stat].toFixed(1)} small />
          ))}
          <Stat label={t('statMin')} value={season.minutesPerGame.toFixed(0)} small />
          <Stat label={t('statFg')} value={formatPct(season.fgPct)} small />
          <Stat label={t('statThree')} value={formatPct(season.threePct)} small />
        </div>
      )}

      <div className="space-y-3 p-4">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs font-semibold text-flame-400 hover:text-flame-300"
        >
          {expanded ? t('seasonLessStats') : t('seasonMoreStats')}
        </button>

        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs">
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
