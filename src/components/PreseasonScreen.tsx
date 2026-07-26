'use client'

import { useT } from '@/i18n/LocaleProvider'
import { ATTRIBUTE_KEYS, type GameState } from '@/game/types'
import { getTeam } from '@/data/teams'
import { getLeague } from '@/data/leagues'
import { getPerk } from '@/data/perks'
import { ATTRIBUTE_KEY } from './display'
import { TeamCrest } from './TeamCrest'

interface Props {
  state: GameState
  onChoosePerk: (perkId: string) => void
  onPlay: () => void
}

export function PreseasonScreen({ state, onChoosePerk, onPlay }: Props) {
  const { t, L } = useT()
  const { player } = state
  const team = getTeam(player.currentTeamId)
  const league = getLeague(player.currentLeagueId)
  const choices = player.perkChoices

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
          <TeamCrest teamId={team.id} size={46} />
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-100">{L(team.name)}</p>
            <p className="truncate text-xs text-slate-400">{L(league.name)}</p>
          </div>
          <span className="tnum ml-auto shrink-0 text-2xl font-black text-slate-600">
            {player.number}
          </span>
        </div>

        {state.pendingPlacementNote && (
          <p className="mt-3 rounded-xl border border-flame-400/25 bg-flame-400/10 px-3 py-2 text-sm text-flame-400">
            {L(state.pendingPlacementNote)}
          </p>
        )}
      </div>

      {choices.length > 0 && (
        <div className="panel p-4">
          <h3 className="font-bold text-slate-100">{t('perkTitle')}</h3>
          <p className="mt-1 text-xs text-slate-500">{t('perkHelp')}</p>

          <div className="mt-3 space-y-2">
            {choices.map((perkId) => {
              const perk = getPerk(perkId)
              return (
                <button
                  key={perkId}
                  type="button"
                  onClick={() => onChoosePerk(perkId)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-3.5 text-left
                             transition hover:border-flame-500 hover:bg-flame-500/10 active:scale-[0.99]"
                >
                  <span className="block text-sm font-bold text-slate-100">{L(perk.name)}</span>
                  <span className="mt-1 block text-xs leading-snug text-slate-400">
                    {L(perk.description)}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(perk.bonus).map(([key, points]) => (
                      <span
                        key={key}
                        className="rounded bg-flame-500/15 px-1.5 py-0.5 text-[10px] font-bold text-flame-400"
                      >
                        +{points} {t(ATTRIBUTE_KEY[key as keyof typeof ATTRIBUTE_KEY])}
                      </span>
                    ))}
                    {perk.effects &&
                      Object.keys(perk.effects).length > 0 &&
                      EFFECT_LABELS(perk.effects).map((label) => (
                        <span
                          key={label.key}
                          className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300"
                        >
                          {t(label.key)}
                        </span>
                      ))}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <AttributePanel state={state} />

      {player.perks.length > 0 && (
        <div className="panel p-4">
          <span className="label">{t('perksOwned')}</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {player.perks.map((id) => (
              <span
                key={id}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px]
                           font-semibold text-slate-300"
              >
                {L(getPerk(id).name)}
              </span>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={onPlay} className="btn-primary w-full py-3.5 text-base">
        {t('playSeason')}
      </button>
    </div>
  )
}

/** Passive effects worth surfacing on the card, as short badges. */
function EFFECT_LABELS(effects: NonNullable<ReturnType<typeof getPerk>['effects']>) {
  const out: { key: Parameters<ReturnType<typeof useT>['t']>[0] }[] = []
  if (effects.injuryFactor && effects.injuryFactor < 1) out.push({ key: 'perkFxInjury' })
  if (effects.wearFactor && effects.wearFactor < 1) out.push({ key: 'perkFxLongevity' })
  if (effects.clutch) out.push({ key: 'perkFxClutch' })
  if (effects.contractPull && effects.contractPull > 1) out.push({ key: 'perkFxContracts' })
  if (effects.hype) out.push({ key: 'perkFxFame' })
  if (effects.scoring && effects.scoring > 1) out.push({ key: 'perkFxScoring' })
  if (effects.playmaking && effects.playmaking > 1) out.push({ key: 'perkFxPlaymaking' })
  if (effects.defense && effects.defense > 1) out.push({ key: 'perkFxDefense' })
  if (effects.rebounding && effects.rebounding > 1) out.push({ key: 'perkFxRebounding' })
  if (effects.awardPull) out.push({ key: 'perkFxAwards' })
  return out
}

function AttributePanel({ state }: { state: GameState }) {
  const { t } = useT()
  const { attributes } = state.player

  return (
    <div className="panel p-4">
      <span className="label">{t('attributes')}</span>
      <ul className="mt-2 space-y-1.5">
        {ATTRIBUTE_KEYS.map((key) => {
          const value = Math.round(attributes[key])
          return (
            <li key={key}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  {t(ATTRIBUTE_KEY[key])}
                </span>
                <span className="tnum text-xs font-bold text-slate-300">{value}</span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-flame-600 to-flame-400
                             transition-[width] duration-500"
                  style={{ width: `${Math.min(100, value)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
