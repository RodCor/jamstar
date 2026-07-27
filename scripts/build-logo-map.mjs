#!/usr/bin/env node
/**
 * Regenerate `src/data/logos.ts` from whatever is sitting in `public/logos/`.
 *
 * Run after dropping real logo files in, so the app picks them up:
 *   npm run logos
 *
 * A file must be named after the id it belongs to — a club (`lal.svg`,
 * `el_rma.png`), a league (`nba.svg`) or a cup (`copa_rey.png`). Ids that match
 * none of those are reported and skipped, which catches typos before they turn
 * into a silently missing badge.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, extname, basename } from 'node:path'

const LOGO_DIR = join(process.cwd(), 'public', 'logos')
const DATA_DIR = join(process.cwd(), 'src', 'data')
const OUT_FILE = join(DATA_DIR, 'logos.ts')
const ALLOWED = new Set(['.svg', '.png', '.webp', '.jpg', '.jpeg', '.avif'])

const read = (name) => readFileSync(join(DATA_DIR, name), 'utf8')

// Clubs come from the `t(...)` helper; leagues and cups are object literals
// opening with `id`. Both quote styles, since a name with an apostrophe is
// written with double quotes.
const knownIds = new Set([
  ...[...read('teams.ts').matchAll(/^\s*t\('([^']+)'/gm)].map((m) => m[1]),
  ...[...read('leagues.ts').matchAll(/^\s*id:\s*['"]([^'"]+)['"]/gm)].map((m) => m[1]),
  ...[...read('cups.ts').matchAll(/^\s*id:\s*['"]([^'"]+)['"]/gm)].map((m) => m[1]),
])

const entries = []
const unknown = []

if (existsSync(LOGO_DIR)) {
  for (const file of readdirSync(LOGO_DIR).sort()) {
    const ext = extname(file).toLowerCase()
    if (!ALLOWED.has(ext)) continue
    const id = basename(file, ext)
    if (!knownIds.has(id)) {
      unknown.push(file)
      continue
    }
    entries.push([id, `/logos/${file}`])
  }
}

// Keep the hand-written doc comment at the top, replace everything from the
// first export down. Splitting on a prose comment (as this used to) breaks
// silently the moment that comment is reworded: the split finds nothing, the
// whole file comes back as the "header", and the generated body is appended to
// it — producing a second LOGO_OVERRIDES that will not compile.
const MARKER = 'export const LOGO_OVERRIDES'
const current = readFileSync(OUT_FILE, 'utf8')
const markerAt = current.indexOf(MARKER)
if (markerAt === -1) {
  console.error(`Could not find "${MARKER}" in ${OUT_FILE} — refusing to overwrite it.`)
  process.exit(1)
}
// Drop the one-line doc comment that immediately precedes the export, since the
// generated block writes its own.
const header = current.slice(0, markerAt).replace(/\/\*\*[^*]*\*\/\s*$/, '')
const body =
  entries.length === 0
    ? 'export const LOGO_OVERRIDES: Record<string, string> = {}\n'
    : `export const LOGO_OVERRIDES: Record<string, string> = {\n${entries
        .map(([id, path]) => `  ${/^[a-z_][\w]*$/i.test(id) ? id : `'${id}'`}: '${path}',`)
        .join('\n')}\n}\n`

writeFileSync(
  OUT_FILE,
  `${header}/** Club, league or cup id → path under \`public/\`. Regenerate with \`npm run logos\`. */\n${body}
export function logoPathFor(id: string): string | null {
  return LOGO_OVERRIDES[id] ?? null
}
`,
)

console.log(`Mapped ${entries.length} logo${entries.length === 1 ? '' : 's'}.`)
if (unknown.length > 0) {
  console.warn(
    `Skipped ${unknown.length} file(s) matching no club, league or cup id: ${unknown.join(', ')}`,
  )
}
console.log(
  `${knownIds.size - entries.length} id(s) without a logo — clubs fall back to a ` +
    'generated crest, leagues and cups simply show no badge.',
)
