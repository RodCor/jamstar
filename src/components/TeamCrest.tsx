'use client'

import { getTeam } from '@/data/teams'
import { logoPathFor } from '@/data/logos'
import { hashSeed } from '@/game/rng'
import { withBasePath } from '@/lib/basePath'
import type { Team } from '@/game/types'

/**
 * A club badge.
 *
 * Uses a real logo file when one has been supplied (see `src/data/logos.ts`),
 * and otherwise draws a generated crest from the club's real colours. The
 * generated version is deterministic per team id, so a club always wears the
 * same badge, and it is inline SVG, so no network request, which matters because
 * a strict CSP would block external images anyway.
 */
export function TeamCrest({
  teamId,
  size = 40,
  className = '',
}: {
  teamId: string
  size?: number
  className?: string
}) {
  const team = getTeam(teamId)
  const logo = logoPathFor(teamId)

  if (logo) {
    // A plain <img>, not next/image: these are local, already-sized assets and
    // the optimiser would only add a server dependency to a static build.
    return (
      <img
        src={withBasePath(logo)}
        alt={team.name.en}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return <GeneratedCrest team={team} size={size} className={className} />
}

/** Six badge silhouettes, so leagues do not look like a wall of identical discs. */
type Shape = 'shield' | 'disc' | 'roundel' | 'hexagon' | 'diamond' | 'pennant'
const SHAPES: Shape[] = ['shield', 'disc', 'roundel', 'hexagon', 'diamond', 'pennant']

function shapeFor(teamId: string): Shape {
  return SHAPES[hashSeed(teamId) % SHAPES.length]
}

function GeneratedCrest({
  team,
  size,
  className,
}: {
  team: Team
  size: number
  className: string
}) {
  const [primary, secondary] = team.colors
  const shape = shapeFor(team.id)
  const id = `crest-${team.id}`
  // Short abbreviations read well at small sizes; long ones need to shrink.
  const label = team.abbr.slice(0, 4)
  const fontSize = label.length >= 4 ? 26 : label.length === 3 ? 30 : 36

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label={team.name.en}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity="1" />
          <stop offset="100%" stopColor={primary} stopOpacity="0.72" />
        </linearGradient>
      </defs>

      <Silhouette shape={shape} fill={`url(#${id}-fill)`} stroke={secondary} />

      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="900"
        fill={secondary}
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-1"
      >
        {label}
      </text>
    </svg>
  )
}

function Silhouette({ shape, fill, stroke }: { shape: Shape; fill: string; stroke: string }) {
  const common = { fill, stroke, strokeWidth: 5, strokeLinejoin: 'round' as const }

  switch (shape) {
    case 'shield':
      return <path d="M50 4 92 18v34c0 23-18 37-42 44C26 89 8 75 8 52V18z" {...common} />
    case 'disc':
      return <circle cx="50" cy="50" r="44" {...common} />
    case 'roundel':
      return (
        <>
          <circle cx="50" cy="50" r="44" {...common} />
          <circle cx="50" cy="50" r="35" fill="none" stroke={stroke} strokeWidth="2.5" opacity="0.6" />
        </>
      )
    case 'hexagon':
      return <path d="M50 5 89 27v46L50 95 11 73V27z" {...common} />
    case 'diamond':
      return <path d="M50 4 96 50 50 96 4 50z" {...common} />
    case 'pennant':
      return <path d="M10 8h80v58L50 94 10 66z" {...common} />
  }
}

/**
 * Canvas twin of the generated crest, for the share card PNG.
 *
 * Kept alongside the SVG so the two silhouettes stay in step; the card is the
 * artefact people post, and a badge that does not match the one in the app would
 * be worse than no badge at all.
 */
export function drawCrest(
  ctx: CanvasRenderingContext2D,
  team: Team,
  cx: number,
  cy: number,
  size: number,
): void {
  const [primary, secondary] = team.colors
  const shape = shapeFor(team.id)
  const s = size / 100
  const px = (x: number) => cx + (x - 50) * s
  const py = (y: number) => cy + (y - 50) * s

  ctx.save()
  ctx.beginPath()

  switch (shape) {
    case 'shield':
      ctx.moveTo(px(50), py(4))
      ctx.lineTo(px(92), py(18))
      ctx.lineTo(px(92), py(52))
      ctx.quadraticCurveTo(px(92), py(82), px(50), py(96))
      ctx.quadraticCurveTo(px(8), py(82), px(8), py(52))
      ctx.lineTo(px(8), py(18))
      ctx.closePath()
      break
    case 'disc':
    case 'roundel':
      ctx.arc(cx, cy, size * 0.44, 0, Math.PI * 2)
      break
    case 'hexagon':
      ctx.moveTo(px(50), py(5))
      ctx.lineTo(px(89), py(27))
      ctx.lineTo(px(89), py(73))
      ctx.lineTo(px(50), py(95))
      ctx.lineTo(px(11), py(73))
      ctx.lineTo(px(11), py(27))
      ctx.closePath()
      break
    case 'diamond':
      ctx.moveTo(px(50), py(4))
      ctx.lineTo(px(96), py(50))
      ctx.lineTo(px(50), py(96))
      ctx.lineTo(px(4), py(50))
      ctx.closePath()
      break
    case 'pennant':
      ctx.moveTo(px(10), py(8))
      ctx.lineTo(px(90), py(8))
      ctx.lineTo(px(90), py(66))
      ctx.lineTo(px(50), py(94))
      ctx.lineTo(px(10), py(66))
      ctx.closePath()
      break
  }

  ctx.fillStyle = primary
  ctx.fill()
  ctx.strokeStyle = secondary
  ctx.lineWidth = 5 * s
  ctx.lineJoin = 'round'
  ctx.stroke()

  if (shape === 'roundel') {
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2)
    ctx.lineWidth = 2.5 * s
    ctx.globalAlpha = 0.6
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  const label = team.abbr.slice(0, 4)
  const fontSize = (label.length >= 4 ? 26 : label.length === 3 ? 30 : 36) * s
  ctx.fillStyle = secondary
  ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, cx, cy)
  ctx.restore()
}
