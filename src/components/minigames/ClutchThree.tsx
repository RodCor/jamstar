'use client'

import { useEffect, useRef, useState } from 'react'
import type { MinigameTuning } from '@/game/minigame'

/**
 * A ring collapses toward the rim; release when it lines up.
 *
 * One continuous shrink rather than a loop, so you get a single window per
 * attempt, which is what makes it feel like a shot rather than a slot machine.
 */
export function ClutchThree({
  tuning,
  onResult,
  round,
}: {
  tuning: MinigameTuning
  onResult: (success: boolean) => void
  round: number
}) {
  const [progress, setProgress] = useState(0)
  const [locked, setLocked] = useState<number | null>(null)
  const frame = useRef<number>(0)
  const start = useRef<number>(0)
  const settled = useRef(false)

  useEffect(() => {
    setProgress(0)
    setLocked(null)
    settled.current = false
    start.current = 0

    const step = (now: number) => {
      if (start.current === 0) start.current = now
      const t = (now - start.current) / 1000 / tuning.clutchDuration
      if (t >= 1) {
        // Never released. The shot clock beat you.
        setProgress(1)
        if (!settled.current) {
          settled.current = true
          window.setTimeout(() => onResult(false), 420)
        }
        return
      }
      setProgress(t)
      frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
    // Intentionally not depending on onResult: it is stable per attempt, and
    // re-running this effect would restart the shot mid-flight.
  }, [round, tuning.clutchDuration])

  function handleTap() {
    if (locked !== null || settled.current) return
    cancelAnimationFrame(frame.current)
    settled.current = true
    setLocked(progress)
    // The window sits at the target, three quarters of the way through.
    const success = Math.abs(progress - 0.75) <= tuning.clutchWindow
    window.setTimeout(() => onResult(success), 520)
  }

  const shown = locked ?? progress
  // Ring shrinks from 100% to 30% of the frame.
  const ringSize = 100 - shown * 70
  const targetSize = 100 - 0.75 * 70
  const made = locked !== null && Math.abs(locked - 0.75) <= tuning.clutchWindow

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={locked !== null}
      className="w-full select-none rounded-2xl border border-white/10 bg-court-800/60 p-5
                 transition active:scale-[0.99] disabled:cursor-default"
    >
      <div className="relative mx-auto aspect-square w-40">
        {/* Target ring */}
        <div
          className="absolute rounded-full border-2 border-dashed border-emerald-400/60"
          style={{
            width: `${targetSize}%`,
            height: `${targetSize}%`,
            left: `${(100 - targetSize) / 2}%`,
            top: `${(100 - targetSize) / 2}%`,
          }}
        />
        {/* Collapsing ring */}
        <div
          className={`absolute rounded-full border-4 ${
            locked === null ? 'border-flame-400' : made ? 'border-emerald-300' : 'border-rose-400'
          }`}
          style={{
            width: `${ringSize}%`,
            height: `${ringSize}%`,
            left: `${(100 - ringSize) / 2}%`,
            top: `${(100 - ringSize) / 2}%`,
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-2xl">
          {locked === null ? '🏀' : made ? '✓' : '✗'}
        </span>
      </div>
    </button>
  )
}
