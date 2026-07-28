'use client'

import { useEffect, useRef, useState } from 'react'
import type { MinigameTuning } from '@/game/minigame'

/**
 * Read the pass: lanes light up as fakes, then the real one goes live. Tap it
 * before the window closes.
 *
 * Difficulty adds fakes and shortens the window, so a high-IQ defender gets time
 * to read it and everyone else is guessing.
 */
type Stage = 'watching' | 'live' | 'done'

export function DefensiveStop({
  tuning,
  onResult,
  round,
  seed,
}: {
  tuning: MinigameTuning
  onResult: (success: boolean) => void
  round: number
  /** Varies which lane is live per attempt without importing the game RNG. */
  seed: number
}) {
  const [stage, setStage] = useState<Stage>('watching')
  const [highlight, setHighlight] = useState<number | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const liveLane = useRef(0)
  const settled = useRef(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    setStage('watching')
    setHighlight(null)
    setPicked(null)
    settled.current = false
    liveLane.current = (seed + round * 2) % 3

    const schedule: number[] = []
    let at = 350

    // Fakes first: a lane flashes and goes dark.
    for (let i = 0; i < tuning.stopFeints; i++) {
      const lane = (liveLane.current + i + 1) % 3
      schedule.push(
        window.setTimeout(() => setHighlight(lane), at),
        window.setTimeout(() => setHighlight(null), at + 240),
      )
      at += 460
    }

    // Then the real pass.
    schedule.push(
      window.setTimeout(() => {
        setHighlight(liveLane.current)
        setStage('live')
      }, at),
    )
    // Miss the window and the possession is gone.
    schedule.push(
      window.setTimeout(() => {
        if (settled.current) return
        settled.current = true
        setStage('done')
        window.setTimeout(() => onResult(false), 420)
      }, at + tuning.stopWindowMs),
    )

    timers.current = schedule
    return () => timers.current.forEach((id) => window.clearTimeout(id))
    // Intentionally not depending on onResult: it is stable per attempt, and
    // re-running this effect would restart the possession mid-play.
  }, [round, seed, tuning.stopFeints, tuning.stopWindowMs])

  function pick(lane: number) {
    if (settled.current) return
    settled.current = true
    timers.current.forEach((id) => window.clearTimeout(id))
    setPicked(lane)
    setStage('done')
    const success = stage === 'live' && lane === liveLane.current
    window.setTimeout(() => onResult(success), 520)
  }

  const correct = picked !== null && picked === liveLane.current && stage === 'done'

  return (
    <div className="rounded-2xl border border-white/10 bg-court-800/60 p-5">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((lane) => {
          const lit = highlight === lane
          const isPick = picked === lane
          return (
            <button
              key={lane}
              type="button"
              onClick={() => pick(lane)}
              disabled={stage === 'done'}
              className={`aspect-[3/4] select-none rounded-xl border-2 text-2xl transition active:scale-[0.97]
                ${
                  isPick
                    ? correct
                      ? 'border-emerald-300 bg-emerald-400/25'
                      : 'border-rose-400 bg-rose-400/20'
                    : lit && stage === 'live'
                      ? 'border-flame-400 bg-flame-400/25'
                      : lit
                        ? 'border-white/30 bg-white/10'
                        : 'border-white/10 bg-court-950'
                }`}
            >
              {isPick ? (correct ? '✓' : '✗') : lit ? '🏀' : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
