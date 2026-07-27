'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { AttributeKey, GameState, Position } from '@/game/types'
import { getPerk } from '@/data/perks'
import { ATTRIBUTE_KEY } from './display'

/** Which attributes matter most where, so the two that define you read first. */
const POSITION_ORDER: Record<Position, AttributeKey[]> = {
  PG: ['playmaking', 'scoring', 'mental', 'physical', 'defense'],
  SG: ['scoring', 'playmaking', 'physical', 'defense', 'mental'],
  SF: ['physical', 'scoring', 'defense', 'playmaking', 'mental'],
  PF: ['physical', 'defense', 'scoring', 'playmaking', 'mental'],
  C: ['physical', 'defense', 'scoring', 'mental', 'playmaking'],
}

interface Props {
  state: GameState
  onChoosePerk: (perkId: string) => void
  onPlay: () => void
}

export function PreseasonScreen({ state, onChoosePerk, onPlay }: Props) {
  const { t, L } = useT()
  const { player } = state
  const choices = player.perkChoices

  return (
    <div className="space-y-4 animate-fade-up">
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
  const { player } = state
  const { attributes, attributesLastYear, position } = player
  const order = POSITION_ORDER[position]

  return (
    <div className="panel p-4">
      <span className="label">{t('attributes')}</span>
      <ul className="mt-2 space-y-1.5">
        {order.map((key, index) => {
          const value = Math.round(attributes[key])
          const delta = attributesLastYear ? value - Math.round(attributesLastYear[key]) : 0
          const emphasized = index < 2

          return (
            <li key={key} className="flex items-baseline justify-between gap-2">
              <span
                className={
                  emphasized
                    ? 'text-xs font-bold text-slate-100'
                    : 'text-xs font-semibold text-slate-400'
                }
              >
                {t(ATTRIBUTE_KEY[key])}
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="tnum text-xs font-bold text-slate-300">{value}</span>
                {attributesLastYear && delta !== 0 && (
                  <span
                    className={`tnum text-[10px] font-bold ${
                      delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
