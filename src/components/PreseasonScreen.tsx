'use client'

import { useT } from '@/i18n/LocaleProvider'
import { ATTRIBUTE_KEYS, type AttributeKey, type GameState } from '@/game/types'
import { getTeam } from '@/data/teams'
import { getLeague } from '@/data/leagues'
import { ATTRIBUTE_HELP_KEY, ATTRIBUTE_KEY } from './display'

interface Props {
  state: GameState
  onSpend: (key: AttributeKey) => void
  onPlay: () => void
}

export function PreseasonScreen({ state, onSpend, onPlay }: Props) {
  const { t, L } = useT()
  const { player } = state
  const team = getTeam(player.currentTeamId)
  const league = getLeague(player.currentLeagueId)
  const remaining = player.growthPoints

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="panel p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-50">{t('preseasonTitle')}</h2>
          <span className="tnum text-sm text-slate-400">
            {t('season')} {state.year} · {t('age')} {player.age}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black"
            style={{ background: team.colors[0], color: team.colors[1] }}
          >
            {player.number}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-100">{L(team.name)}</p>
            <p className="truncate text-xs text-slate-400">{L(league.name)}</p>
          </div>
        </div>

        {state.pendingPlacementNote && (
          <p className="mt-3 rounded-xl border border-flame-400/25 bg-flame-400/10 px-3 py-2 text-sm text-flame-400">
            {L(state.pendingPlacementNote)}
          </p>
        )}
      </div>

      <div className="panel p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-bold text-slate-100">{t('preseasonPoints')}</h3>
          <span
            className={`tnum rounded-lg px-2 py-0.5 text-sm font-bold ${
              remaining > 0 ? 'bg-flame-500 text-court-950' : 'bg-white/10 text-slate-400'
            }`}
          >
            {t('preseasonPointsLeft', { n: remaining })}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {remaining > 0 ? t('preseasonSpend') : t('preseasonAuto')}
        </p>

        <ul className="mt-3 space-y-2">
          {ATTRIBUTE_KEYS.map((key) => (
            <AttributeRow
              key={key}
              attrKey={key}
              value={player.attributes[key]}
              canSpend={remaining > 0 && player.attributes[key] < 96}
              onSpend={() => onSpend(key)}
            />
          ))}
        </ul>
      </div>

      <button type="button" onClick={onPlay} className="btn-primary w-full py-3.5 text-base">
        {t('playSeason')}
      </button>
    </div>
  )
}

function AttributeRow({
  attrKey,
  value,
  canSpend,
  onSpend,
}: {
  attrKey: AttributeKey
  value: number
  canSpend: boolean
  onSpend: () => void
}) {
  const { t } = useT()
  const rounded = Math.round(value)

  return (
    <li className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-slate-200">{t(ATTRIBUTE_KEY[attrKey])}</span>
          <span className="tnum text-sm font-bold text-slate-300">{rounded}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-flame-600 to-flame-400 transition-[width] duration-300"
            style={{ width: `${Math.min(100, rounded)}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] leading-tight text-slate-500">
          {t(ATTRIBUTE_HELP_KEY[attrKey])}
        </p>
      </div>
      <button
        type="button"
        onClick={onSpend}
        disabled={!canSpend}
        aria-label={`+1 ${t(ATTRIBUTE_KEY[attrKey])}`}
        className="btn-ghost h-9 w-9 shrink-0 rounded-lg p-0 text-lg font-black leading-none"
      >
        +
      </button>
    </li>
  )
}
