/**
 * Real logo assets, when you have the rights to them.
 *
 * The game ships with generated crests (see `TeamCrest.tsx`) built from each
 * club's real colours, so it looks like a coherent badge system out of the box
 * and carries no third-party artwork.
 *
 * To use real logos:
 *   1. Drop files into `public/logos/` named after the team id — `lal.svg`,
 *      `el_rma.png`, `lnb_boc.webp`. Team ids are listed in `teams.ts`.
 *   2. Run `npm run logos` to regenerate the map below from that folder.
 *
 * Anything not listed here falls back to its generated crest, so a partial set
 * works fine — you can add the leagues you have rights to and leave the rest.
 *
 * Club logos are copyrighted artwork as well as trademarks. Shipping them is a
 * separate question from using club names; make sure you have permission before
 * publishing a build that includes them.
 */

/** Team id → path under `public/`. Regenerate with `npm run logos`. */
export const LOGO_OVERRIDES: Record<string, string> = {}

export function logoPathFor(teamId: string): string | null {
  return LOGO_OVERRIDES[teamId] ?? null
}
