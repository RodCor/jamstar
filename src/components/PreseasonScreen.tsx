'use client'

import { useT } from '@/i18n/LocaleProvider'
import type { Dictionary } from '@/i18n/dictionary'
import type { AttributeKey, GameState, Position } from '@/game/types'
import { getPerk, type PerkRarity } from '@/data/perks'
import { ATTRIBUTE_KEY } from './display'
import { DraftOutlookPanel } from './DraftOutlook'

/** Most effect chips a card should ever show before the rest fold into "+N". */
const MAX_EFFECT_CHIPS = 3

/**
 * Tier chrome for the rarity badge and the card itself. Visual weight climbs
 * with the tier — gold/legend tint the whole card, and Top 1% borrows the
 * flame-gradient idiom `AwardReveal` uses for its headline award, so the
 * rarest perk in the pool reads as an event rather than a label swap.
 */
const RARITY_STYLE: Record<PerkRarity, { labelKey: keyof Dictionary; badge: string; card: string }> = {
  basic: {
    labelKey: 'perkRarityBasic',
    badge: 'border-slate-400/30 bg-slate-400/10 text-slate-400',
    card: 'border-white/15 bg-white/5',
  },
  silver: {
    labelKey: 'perkRaritySilver',
    badge: 'border-zinc-300/30 bg-zinc-300/10 text-zinc-300',
    card: 'border-white/15 bg-white/5',
  },
  gold: {
    labelKey: 'perkRarityGold',
    badge: 'border-amber-400/40 bg-amber-400/15 text-amber-400',
    card: 'border-amber-400/30 bg-amber-400/5',
  },
  legend: {
    labelKey: 'perkRarityLegend',
    badge: 'border-violet-400/40 bg-violet-400/15 text-violet-400',
    card: 'border-violet-400/40 bg-violet-400/5',
  },
  top1: {
    labelKey: 'perkRarityTop1',
    badge: 'border-transparent bg-gradient-to-r from-flame-600 to-flame-400 text-white shadow shadow-flame-500/40',
    card: 'border-flame-400/50 bg-gradient-to-b from-flame-500/25 to-flame-500/5',
  },
}

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
              const style = RARITY_STYLE[perk.rarity]
              const effectLabels = perk.effects ? EFFECT_LABELS(perk.effects) : []
              const visibleEffects = effectLabels.slice(0, MAX_EFFECT_CHIPS)
              const hiddenEffectCount = effectLabels.length - visibleEffects.length

              return (
                <button
                  key={perkId}
                  type="button"
                  onClick={() => onChoosePerk(perkId)}
                  className={`w-full rounded-xl border p-3.5 text-left transition
                              hover:border-flame-500 hover:bg-flame-500/10 hover:from-flame-500/40
                              hover:to-flame-500/10 active:scale-[0.99] ${style.card}`}
                >
                  <span
                    className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-black
                                uppercase tracking-wider ${style.badge}`}
                  >
                    {t(style.labelKey)}
                  </span>
                  <span className="mt-1.5 block text-sm font-bold text-slate-100">{L(perk.name)}</span>
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
                    {visibleEffects.map((label) => (
                      <span
                        key={label.key}
                        className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300"
                      >
                        {t(label.key)}
                      </span>
                    ))}
                    {hiddenEffectCount > 0 && (
                      <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        +{hiddenEffectCount}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <DraftOutlookPanel state={state} />

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
