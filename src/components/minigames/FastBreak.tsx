'use client'

import { useEffect, useRef, useState } from 'react'
import type { MinigameTuning } from '@/game/minigame'

/**
 * Outrun the recovering defence: tap to fill the drive before the clock empties.
 *
 * The only challenge that rewards raw urgency rather than timing, which is what
 * makes it feel like the athlete's ending rather than the shooter's.
 */
export function FastBreak({
  tuning,
  onResult,
  round,
}: {
  tuning: MinigameTuning
  onResult: (success: boolean) => void
  round: number
}) {
  const [taps, setTaps] = useState(0)
  const [remaining, setRemaining] = useState(tuning.breakSeconds)
  const [done, setDone] = useState<'made' | 'missed' | null>(null)
  const frame = useRef<number>(0)
  const start = useRef<number>(0)
  const settled = useRef(false)
  const tapsRef = useRef(0)

  useEffect(() => {
    setTaps(0)
    tapsRef.current = 0
    setDone(null)
    setRemaining(tuning.breakSeconds)
    settled.current = false
    start.current = 0

    const step = (now: number) => {
      if (start.current === 0) start.current = now
      const elapsed = (now - start.current) / 1000
      const left = tuning.breakSeconds - elapsed

      if (left <= 0) {
        setRemaining(0)
        if (!settled.current) {
          settled.current = true
          setDone('missed')
          window.setTimeout(() => onResult(false), 520)
        }
        return
      }
      setRemaining(left)
      frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
    // Intentionally not depending on onResult: it is stable per attempt, and
    // re-running this effect would restart the break mid-drive.
  }, [round, tuning.breakSeconds])

  function tap() {
    if (settled.current) return
    const next = tapsRef.current + 1
    tapsRef.current = next
    setTaps(next)
    if (next >= tuning.breakTaps) {
      settled.current = true
      cancelAnimationFrame(frame.current)
      setDone('made')
      window.setTimeout(() => onResult(true), 520)
    }
  }

  const progress = Math.min(100, (taps / tuning.breakTaps) * 100)
  const timeLeft = Math.max(0, remaining / tuning.breakSeconds)

  return (
    <button
      type="button"
      onClick={tap}
      disabled={done !== null}
      className="w-full select-none rounded-2xl border border-white/10 bg-court-800/60 p-5 text-center
                 transition active:scale-[0.98] disabled:cursor-default"
    >
      {/* Time remaining */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-court-950">
        <div
          className="h-full rounded-full bg-rose-400/70"
          style={{ width: `${timeLeft * 100}%` }}
        />
      </div>

      {/* Drive progress */}
      <div className="relative mt-4 h-12 w-full overflow-hidden rounded-xl bg-court-950">
        <div
          className={`h-full transition-[width] duration-75 ${
            done === 'made'
              ? 'bg-emerald-400/40'
              : done === 'missed'
                ? 'bg-rose-400/30'
                : 'bg-gradient-to-r from-flame-600 to-flame-400'
          }`}
          style={{ width: `${progress}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-slate-100">
          {done === 'made' ? '✓' : done === 'missed' ? '✗' : `${taps}/${tuning.breakTaps}`}
        </span>
      </div>

      <p className="mt-3 text-2xl">🏃</p>
    </button>
  )
}
