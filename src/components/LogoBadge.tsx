'use client'

import { logoPathFor } from '@/data/logos'
import { withBasePath } from '@/lib/basePath'

/**
 * A league or cup badge, when there is a real logo file for it.
 *
 * Deliberately not part of `TeamCrest`. A club always renders something —
 * `TeamCrest` draws a generated crest from the club's colours when no file
 * exists — but `League` and `Cup` carry no colours, so there is nothing
 * honest to draw for them. Inventing a placeholder would put a fake badge
 * beside every league name for anyone who has not run the scraper, which is
 * worse than the plain text it replaced.
 *
 * So: renders the logo when present, renders nothing when not.
 */
export function LogoBadge({
  id,
  label,
  size = 18,
  className = '',
}: {
  /** League or cup id, matching a file in `public/logos/`. */
  id: string
  /** Alt text — the entity's name in the current language. */
  label: string
  size?: number
  className?: string
}) {
  const logo = logoPathFor(id)
  if (!logo) return null

  return (
    <img
      src={withBasePath(logo)}
      alt={label}
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
