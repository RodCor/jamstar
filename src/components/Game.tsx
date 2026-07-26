'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ArchivedCareer, AttributeKey, GameMode, GameState } from '@/game/types'
import { createGame, dailyChoices, type CreationChoices } from '@/game/create'
import {
  advanceYear,
  beginSeason,
  continueAfterEvent,
  resolveChoice,
  resolveMinigame,
} from '@/game/engine'
import { spendGrowthPoint } from '@/game/progression'
import { computeLegacy, computeTotals } from '@/game/legacy'
import { dailySeedKey, randomSeed } from '@/game/rng'
import {
  archiveCareer,
  clearArchive,
  clearRun,
  loadArchive,
  loadDailyPlayed,
  loadRun,
  markDailyPlayed,
  saveRun,
} from '@/game/save'
import { useT } from '@/i18n/LocaleProvider'
import { Shell } from './Shell'
import { ModeSelect } from './ModeSelect'
import { CreationScreen } from './CreationScreen'
import { PreseasonScreen } from './PreseasonScreen'
import { EventScreen } from './EventScreen'
import { SeasonResultScreen } from './SeasonResultScreen'
import { MinigameScreen } from './MinigameScreen'
import { CareerPanel } from './CareerPanel'
import { RetirementScreen } from './RetirementScreen'

type Screen = 'menu' | 'create' | 'play'

export function Game() {
  const { t } = useT()
  const [screen, setScreen] = useState<Screen>('menu')
  const [state, setState] = useState<GameState | null>(null)
  const [mode, setMode] = useState<GameMode>('career')
  const [archive, setArchive] = useState<ArchivedCareer[]>([])
  const [dailyPlayed, setDailyPlayed] = useState(false)
  const [savedRun, setSavedRun] = useState<GameState | null>(null)
  const [ready, setReady] = useState(false)

  // Hydrate from localStorage after mount, so server and client markup agree.
  useEffect(() => {
    setArchive(loadArchive())
    setSavedRun(loadRun())
    setDailyPlayed(loadDailyPlayed() === dailySeedKey())
    setReady(true)
  }, [])

  // Persist the run on every change, so a refresh mid-career loses nothing.
  useEffect(() => {
    if (state && !state.player.retired) saveRun(state)
  }, [state])

  // Archive the career exactly once, when it ends.
  useEffect(() => {
    if (!state?.player.retired) return
    const totals = computeTotals(state.seasons)
    const entry: ArchivedCareer = {
      seed: state.seed,
      mode: state.mode,
      playerName: state.player.name,
      countryCode: state.player.countryCode,
      number: state.player.number,
      position: state.player.position,
      totals,
      legacy: computeLegacy(totals, state.seasons, state.rival),
      completedAt: Date.now(),
    }
    archiveCareer(entry)
    setArchive(loadArchive())
    clearRun()
    setSavedRun(null)
    if (state.mode === 'daily') {
      markDailyPlayed(dailySeedKey())
      setDailyPlayed(true)
    }
  }, [state?.player.retired, state])

  const handlePickMode = useCallback((picked: GameMode) => {
    setMode(picked)
    setScreen('create')
  }, [])

  const handleStart = useCallback(
    (choices: CreationChoices) => {
      const seed = mode === 'daily' ? `daily::${dailySeedKey()}` : randomSeed()
      setState(createGame(choices, seed, mode))
      setScreen('play')
    },
    [mode],
  )

  const handleResume = useCallback(() => {
    if (!savedRun) return
    setState(savedRun)
    setMode(savedRun.mode)
    setScreen('play')
  }, [savedRun])

  const handleSpend = useCallback((key: AttributeKey) => {
    setState((current) => {
      if (!current) return current
      const next = structuredClone(current)
      if (!spendGrowthPoint(next.player, key)) return current
      return next
    })
  }, [])

  const handlePlaySeason = useCallback(() => {
    setState((current) => (current ? beginSeason(current) : current))
  }, [])

  const handleChoose = useCallback((index: number) => {
    setState((current) => (current ? resolveChoice(current, index) : current))
  }, [])

  const handleAfterEvent = useCallback(() => {
    setState((current) => (current ? continueAfterEvent(current) : current))
  }, [])

  const handleMinigameFinish = useCallback((successes: number) => {
    setState((current) => (current ? resolveMinigame(current, successes) : current))
  }, [])

  const handleNextYear = useCallback(() => {
    setState((current) => (current ? advanceYear(current) : current))
  }, [])

  const handlePlayAgain = useCallback(() => {
    setState(null)
    setScreen('menu')
  }, [])

  const handleClearArchive = useCallback(() => {
    clearArchive()
    setArchive([])
  }, [])

  if (!ready) {
    return (
      <Shell>
        <p className="py-12 text-center text-sm text-slate-500">{t('loading')}</p>
      </Shell>
    )
  }

  if (screen === 'create') {
    return (
      <Shell>
        <CreationScreen
          onStart={handleStart}
          locked={mode === 'daily' ? dailyChoices(dailySeedKey(), '') : undefined}
        />
      </Shell>
    )
  }

  // The menu is also the fallback whenever there is no run to render.
  if (screen === 'menu' || !state) {
    return (
      <Shell>
        <ModeSelect
          onPick={handlePickMode}
          onResume={savedRun ? handleResume : null}
          dailyPlayed={dailyPlayed}
          archive={archive}
          onClearArchive={handleClearArchive}
        />
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-4">
        {state.phase === 'preseason' && (
          <PreseasonScreen state={state} onSpend={handleSpend} onPlay={handlePlaySeason} />
        )}
        {state.phase === 'event' && (
          <EventScreen state={state} onChoose={handleChoose} onContinue={handleAfterEvent} />
        )}
        {state.phase === 'minigame' && (
          <MinigameScreen state={state} onFinish={handleMinigameFinish} />
        )}
        {state.phase === 'season_result' && (
          <SeasonResultScreen state={state} onContinue={handleNextYear} />
        )}
        {state.phase === 'retirement' && (
          <RetirementScreen state={state} onPlayAgain={handlePlayAgain} />
        )}

        {state.phase !== 'retirement' && <CareerPanel state={state} />}
      </div>
    </Shell>
  )
}
