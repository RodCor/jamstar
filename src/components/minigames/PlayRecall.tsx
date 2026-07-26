'use client'

import { useEffect, useRef, useState } from 'react'
import type { MinigameTuning } from '@/game/minigame'

/**
 * Run the set play: watch the coach draw it, then repeat it exactly.
 *
 * The thinker's ending. Nothing here rewards reflexes — it rewards paying
 * attention, which is what a high-IQ build is supposed to be good at.
 */
type Stage = 'showing' | 'input' | 'done'

const SPOTS = 4

export function PlayRecall({
  tuning,
  onResult,
  round,
  seed,
}: {
  tuning: MinigameTuning
  onResult: (success: boolean) => void
  round: number
  /** Varies the sequence per attempt without reaching into the game RNG. */
  seed: number
}) {
  const [stage, setStage] = useState<Stage>('showing')
  const [highlight, setHighlight] = useState<number | null>(null)
  const [entered, setEntered] = useState<number[]>([])
  const [wrong, setWrong] = useState(false)
  /** The spot currently flashing from a tap. */
  const [pressed, setPressed] = useState<number | null>(null)
  const sequence = useRef<number[]>([])
  const settled = useRef(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    setStage('showing')
    setHighlight(null)
    setEntered([])
    setWrong(false)
    setPressed(null)
    settled.current = false

    // Deterministic per (seed, round) so a replay of the same career shows the
    // same play — without pulling from the simulation's stream.
    const steps: number[] = []
    let cursor = seed * 7 + round * 31 + 3
    for (let i = 0; i < tuning.recallSteps; i++) {
      cursor = (cursor * 1103515245 + 12345) & 0x7fffffff
      steps.push(cursor % SPOTS)
    }
    sequence.current = steps

    const schedule: number[] = []
    let at = 400
    for (const step of steps) {
      schedule.push(window.setTimeout(() => setHighlight(step), at))
      schedule.push(window.setTimeout(() => setHighlight(null), at + tuning.recallStepMs * 0.6))
      at += tuning.recallStepMs
    }
    schedule.push(window.setTimeout(() => setStage('input'), at + 200))

    timers.current = schedule
    return () => timers.current.forEach((id) => window.clearTimeout(id))
    // Intentionally not depending on onResult: it is stable per attempt.
  }, [round, seed, tuning.recallSteps, tuning.recallStepMs])

  function press(spot: number) {
    if (stage !== 'input' || settled.current) return

    // Flash the spot that was tapped. Without it the grid gave no sign a press
    // registered, which made a correct sequence feel identical to a dead one.
    setPressed(spot)
    window.setTimeout(() => setPressed((current) => (current === spot ? null : current)), 220)

    const index = entered.length
    const next = [...entered, spot]
    setEntered(next)

    if (sequence.current[index] !== spot) {
      settled.current = true
      setWrong(true)
      setStage('done')
      window.setTimeout(() => onResult(false), 560)
      return
    }

    if (next.length === sequence.current.length) {
      settled.current = true
      setStage('done')
      window.setTimeout(() => onResult(true), 560)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-court-800/60 p-5">
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: SPOTS }, (_, spot) => {
          const lit = highlight === spot
          const tapped = pressed === spot
          const wrongTap = tapped && wrong
          return (
            <button
              key={spot}
              type="button"
              onClick={() => press(spot)}
              disabled={stage !== 'input'}
              className={`relative aspect-[4/3] select-none overflow-hidden rounded-xl border-2 text-2xl
                transition-all duration-150 active:scale-[0.94]
                ${
                  wrongTap
                    ? 'scale-[0.96] border-rose-400 bg-rose-400/30'
                    : tapped
                      ? 'scale-[0.96] border-emerald-300 bg-emerald-400/30'
                      : lit
                        ? 'border-flame-400 bg-flame-400/30'
                        : stage === 'input'
                          ? 'border-white/20 bg-court-950 hover:border-flame-500/60'
                          : 'border-white/10 bg-court-950'
                }`}
            >
              {/* Ripple from the tap, so a press is unmistakably registered. */}
              {tapped && (
                <span
                  className={`pointer-events-none absolute inset-0 animate-ripple rounded-xl ${
                    wrongTap ? 'bg-rose-300/40' : 'bg-emerald-200/40'
                  }`}
                />
              )}
              <span className="relative">{lit ? '🏀' : tapped ? (wrongTap ? '✗' : '●') : ''}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {sequence.current.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              wrong && i === entered.length - 1
                ? 'bg-rose-400'
                : i < entered.length
                  ? 'bg-emerald-400'
                  : 'bg-white/15'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
