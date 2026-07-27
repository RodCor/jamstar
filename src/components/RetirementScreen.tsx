'use client'

import { useMemo, useRef, useState } from 'react'
import { useT } from '@/i18n/LocaleProvider'
import type { GameState } from '@/game/types'
import { computeLegacy, computeTotals } from '@/game/legacy'
import { getTeam } from '@/data/teams'
import { flagFor } from '@/data/countries'
import { AWARD_INFO } from '@/game/awards'
import { formatMoney, teamTextColor } from './display'
import { buildShareText, drawShareCard } from './shareCard'
import { TeamCrest } from './TeamCrest'

interface Props {
  state: GameState
  onPlayAgain: () => void
}

export function RetirementScreen({ state, onPlayAgain }: Props) {
  const { t, L, locale } = useT()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  const totals = useMemo(() => computeTotals(state.seasons), [state.seasons])
  const legacy = useMemo(
    () => computeLegacy(totals, state.seasons, state.rival),
    [totals, state.seasons, state.rival],
  )

  const lastSeason = state.seasons[state.seasons.length - 1]
  const shareData = {
    player: state.player,
    totals,
    legacy,
    rival: state.rival,
    seed: state.seed,
    locale,
    lastTeam: lastSeason ? getTeam(lastSeason.teamId) : null,
  }

  // Every award won across the career, tallied.
  const awardCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const season of state.seasons) {
      for (const award of season.awards) {
        counts.set(award, (counts.get(award) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort(
      (a, b) => AWARD_INFO[b[0] as keyof typeof AWARD_INFO].weight - AWARD_INFO[a[0] as keyof typeof AWARD_INFO].weight,
    )
  }, [state.seasons])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    drawShareCard(canvas, shareData)
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `hoop-glory-${state.player.name.replace(/\s+/g, '-').toLowerCase() || 'career'}.png`
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildShareText(shareData))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure context or denied permission). The text is
      // still visible on screen for manual selection.
    }
  }

  const clubs = [...new Set(state.seasons.map((s) => s.teamId))]

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="panel overflow-hidden text-center">
        <div className="bg-gradient-to-b from-flame-500/20 to-transparent px-4 pb-5 pt-6">
          <span className="label text-flame-400">{t('retirementTitle')}</span>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-50">
            {flagFor(state.player.countryCode)} {state.player.name || '—'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            #{state.player.number} · {state.player.position} · {state.player.heightCm} cm
          </p>
          <p className="mt-3 text-sm text-slate-300">
            {t('retirementAt', {
              age: state.player.age,
              year: state.player.retirementYear ?? state.year,
            })}
          </p>
          {state.player.retirementReason && (
            <p className="mx-auto mt-2 max-w-md text-sm italic leading-relaxed text-slate-400">
              {L(state.player.retirementReason)}
            </p>
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-5">
          <p className="text-2xl font-black text-flame-400">{L(legacy.title)}</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-300">
            {L(legacy.blurb)}
          </p>
          <div className="mt-4">
            <span className="label">{t('legacyScore')}</span>
            <p className="tnum text-5xl font-black text-slate-50">{legacy.score}</p>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span
              className={`chip ${
                legacy.hallOfFame ? 'border-flame-400/40 bg-flame-400/15 text-flame-400' : ''
              }`}
            >
              {legacy.hallOfFame ? `🏛 ${t('hallOfFameYes')}` : t('hallOfFameNo')}
            </span>
            {legacy.jerseyRetired && <span className="chip">👕 {t('jerseyRetired')}</span>}
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Big label={t('statPts')} value={totals.ppg.toFixed(1)} />
          <Big label={t('statReb')} value={totals.rpg.toFixed(1)} />
          <Big label={t('statAst')} value={totals.apg.toFixed(1)} />
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1.5 text-center">
          <Big label={t('seasonsPlayed')} value={String(totals.seasons)} small />
          <Big label={t('rings')} value={String(totals.rings)} small />
          <Big label={t('cups')} value={String(totals.cups)} small />
          <Big label={t('mvps')} value={String(totals.mvps)} small />
          <Big label={t('allStars')} value={String(totals.allStars)} small />
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">
          {t('earnings')}:{' '}
          <span className="tnum font-bold text-slate-200">{formatMoney(totals.earnings, locale)}</span>
        </p>

        {awardCounts.length > 0 && (
          <div className="mt-4">
            <span className="label">{t('awards')}</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {awardCounts.map(([award, count]) => {
                const info = AWARD_INFO[award as keyof typeof AWARD_INFO]
                return (
                  <span
                    key={award}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300"
                  >
                    {info.icon} {info[locale]}
                    {count > 1 && <span className="tnum font-bold text-flame-400"> ×{count}</span>}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4">
          <span className="label">{t('teamHistory')}</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {clubs.map((id) => {
              const team = getTeam(id)
              return (
                <span
                  key={id}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5
                             py-1 pl-1 pr-2 text-[11px] font-bold"
                  style={{ color: teamTextColor(team.colors) }}
                >
                  <TeamCrest teamId={id} size={18} />
                  {L(team.name)}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <span className="label">{t('highlights')}</span>
        <ul className="mt-2 space-y-1.5">
          {legacy.highlights.map((highlight, i) => (
            <li key={i} className="rounded-xl bg-white/5 px-3 py-2 text-sm leading-snug text-slate-300">
              {L(highlight)}
            </li>
          ))}
        </ul>
      </div>

      <div className="panel space-y-3 p-4">
        <div className="flex gap-2">
          <button type="button" onClick={handleDownload} className="btn-ghost flex-1">
            🖼 {t('shareCard')}
          </button>
          <button type="button" onClick={handleCopy} className="btn-ghost flex-1">
            {copied ? `✓ ${t('copied')}` : `📋 ${t('copyResult')}`}
          </button>
        </div>
        <p className="text-center text-xs text-slate-500">
          {t('seed')}: <span className="tnum font-mono text-slate-400">{state.seed}</span>
          <br />
          {t('seedHelp')}
        </p>
      </div>

      <button type="button" onClick={onPlayAgain} className="btn-primary w-full py-3.5 text-base">
        {t('playAgain')}
      </button>

      {/* Offscreen render target for the PNG export. */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  )
}

function Big({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-3">
      <p className={`tnum font-black text-slate-100 ${small ? 'text-xl' : 'text-3xl'}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}
