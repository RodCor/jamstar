'use client'

import { getLeague } from '@/data/leagues'
import { getCup } from '@/data/cups'
import { leagueLogoPathFor, cupLogoPathFor } from '@/data/logos'
import { hashSeed } from '@/game/rng'
import { withBasePath } from '@/lib/basePath'

/**
 * The mark of a competition — a league or a domestic cup.
 *
 * Same contract as `TeamCrest`: a real logo file when one has been supplied
 * (see `src/data/logos.ts`), otherwise a generated plate built from the
 * competition's abbreviation. Several cups have no artwork anywhere — an NCAA
 * "conference tournament" is thirty different trophies — so the fallback is not
 * a rare path, and it has to look deliberate rather than broken.
 *
 * Clubs get shields and roundels; competitions get a flat plate, so the two
 * never read as the same kind of badge sitting next to each other.
 */
export function LeagueCrest({ leagueId, size = 24, className = '' }: CrestProps & { leagueId: string }) {
  const league = getLeague(leagueId)
  return (
    <Crest
      logo={leagueLogoPathFor(leagueId)}
      seed={leagueId}
      label={league.abbr}
      name={league.name.en}
      size={size}
      className={className}
    />
  )
}

export function CupCrest({ cupId, size = 24, className = '' }: CrestProps & { cupId: string }) {
  const cup = getCup(cupId)
  return (
    <Crest
      logo={cupLogoPathFor(cupId)}
      seed={cupId}
      label={cup.abbr}
      name={cup.name.en}
      size={size}
      className={className}
    />
  )
}

interface CrestProps {
  size?: number
  className?: string
}

/**
 * Plate colours, picked from the id so a competition always wears the same one.
 * Muted on purpose: these sit beside club crests in their real colours and must
 * not compete with them.
 */
const PLATE: [string, string][] = [
  ['#1E3A5F', '#7DD3FC'],
  ['#3B1F4E', '#D8B4FE'],
  ['#14342B', '#6EE7B7'],
  ['#4A2418', '#FCA5A5'],
  ['#2D2A18', '#FDE68A'],
  ['#1B2A4A', '#A5B4FC'],
]

function Crest({
  logo,
  seed,
  label,
  name,
  size,
  className,
}: {
  logo: string | null
  seed: string
  label: string
  name: string
  size: number
  className: string
}) {
  if (logo) {
    // A plain <img>, not next/image: these are local, already-sized assets and
    // the optimiser would only add a server dependency to a static build.
    return (
      <img
        src={withBasePath(logo)}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  const [background, ink] = PLATE[hashSeed(seed) % PLATE.length]
  const text = label.slice(0, 4)
  // Long abbreviations have to shrink or they run off the plate.
  const fontSize = text.length >= 4 ? 30 : text.length === 3 ? 36 : 44

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label={name}
    >
      <rect x="6" y="18" width="88" height="64" rx="14" fill={background} stroke={ink} strokeWidth="4" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="900"
        fill={ink}
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-1"
      >
        {text}
      </text>
    </svg>
  )
}
