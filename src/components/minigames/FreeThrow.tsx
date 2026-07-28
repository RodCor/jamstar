'use client'

import { useEffect, useRef, useState } from 'react'
import type { MinigameTuning } from '@/game/minigame'

/**
 * A marker sweeps the bar; tap to stop it inside the green zone.
 *
 * The zone shrinks and the sweep speeds up with difficulty, so a great shooter
 * facing a weak opponent gets a generous target and a role player in an NBA
 * final gets a sliver.
 */
export function FreeThrow({
  tuning,
  onResult,
  round,
}: {
  tuning: MinigameTuning
  onResult: (success: boolean) => void
  /** Changing this remounts the attempt, resetting the sweep. */
  round: number
}) {
  const [position, setPosition] = useState(0)
  const [locked, setLocked] = useState<number | null>(null)
  const frame = useRef<number>(0)
  const start = useRef<number>(0)
  const zoneCenter = useRef(0.5)

  // A fixed centre keeps the target honest; the zone never moves under you.
  useEffect(() => {
    zoneCenter.current = 0.5
    setLocked(null)
    setPosition(0)
    start.current = 0

    const step = (now: number) => {
      if (start.current === 0) start.current = now
      const elapsed = (now - start.current) / 1000
      // Triangle wave: sweeps right, then back, forever.
      const cycle = (elapsed * tuning.freeThrowSpeed) % 2
      setPosition(cycle <= 1 ? cycle : 2 - cycle)
      frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
  }, [round, tuning.freeThrowSpeed])

  function handleTap() {
    if (locked !== null) return
    cancelAnimationFrame(frame.current)
    setLocked(position)
    const success = Math.abs(position - zoneCenter.current) <= tuning.freeThrowZone
    window.setTimeout(() => onResult(success), 520)
  }

  const zonePct = tuning.freeThrowZone * 100
  const marker = (locked ?? position) * 100

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={locked !== null}
      className="w-full select-none rounded-2xl border border-white/10 bg-court-800/60 p-5 text-center
                 transition active:scale-[0.99] disabled:cursor-default"
    >
      <div className="relative h-14 w-full overflow-hidden rounded-xl bg-court-950">
        {/* Make zone */}
        <div
          className="absolute inset-y-0 bg-emerald-400/25 ring-1 ring-inset ring-emerald-400/50"
          style={{ left: `${50 - zonePct}%`, width: `${zonePct * 2}%` }}
        />
        {/* Sweeping marker */}
        <div
          className={`absolute inset-y-1 w-1.5 rounded-full transition-colors ${
            locked === null
              ? 'bg-flame-400'
              : Math.abs(locked - 0.5) <= tuning.freeThrowZone
                ? 'bg-emerald-300'
                : 'bg-rose-400'
          }`}
          style={{ left: `calc(${marker}% - 3px)` }}
        />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-200">
        {locked === null ? '⬤' : Math.abs(locked - 0.5) <= tuning.freeThrowZone ? '✓' : '✗'}
      </p>
    </button>
  )
}
