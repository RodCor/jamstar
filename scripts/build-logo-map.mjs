#!/usr/bin/env node
/**
 * Regenerate `src/data/logos.ts` from whatever is sitting in `public/logos/`.
 *
 * Run after dropping real logo files in, so the app picks them up:
 *   npm run logos
 *
 * A file must be named after the id it belongs to, in the folder for its kind:
 *
 *   public/logos/lal.svg            team id      (teams.ts)
 *   public/logos/leagues/acb.svg    league id    (leagues.ts)
 *   public/logos/cups/copa_rey.png  cup id       (cups.ts)
 *
 * Ids that do not match anything known are reported and skipped, which catches
 * typos before they turn into a silently missing badge.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, extname, basename } from 'node:path'

const ROOT = process.cwd()
const LOGO_DIR = join(ROOT, 'public', 'logos')
const OUT_FILE = join(ROOT, 'src', 'data', 'logos.ts')
const ALLOWED = new Set(['.svg', '.png', '.webp', '.jpg', '.jpeg', '.avif'])

/** Ids declared by a data file, so a stray filename cannot slip into the map. */
function idsIn(file, pattern) {
  return new Set([...readFileSync(join(ROOT, 'src', 'data', file), 'utf8').matchAll(pattern)].map((m) => m[1]))
}

const KINDS = [
  {
    dir: LOGO_DIR,
    urlBase: '/logos',
    constant: 'LOGO_OVERRIDES',
    accessor: 'logoPathFor',
    param: 'teamId',
    label: 'Team',
    ids: idsIn('teams.ts', /^\s*t\('([^']+)'/gm),
  },
  {
    dir: join(LOGO_DIR, 'leagues'),
    urlBase: '/logos/leagues',
    constant: 'LEAGUE_LOGOS',
    accessor: 'leagueLogoPathFor',
    param: 'leagueId',
    label: 'League',
    ids: idsIn('leagues.ts', /^\s{4}id: '([^']+)',/gm),
  },
  {
    dir: join(LOGO_DIR, 'cups'),
    urlBase: '/logos/cups',
    constant: 'CUP_LOGOS',
    accessor: 'cupLogoPathFor',
    param: 'cupId',
    label: 'Cup',
    ids: idsIn('cups.ts', /^\s{4}id: '([^']+)',/gm),
  },
]

const unknown = []
const collisions = []

for (const kind of KINDS) {
  kind.entries = []
  if (!existsSync(kind.dir)) continue
  for (const file of readdirSync(kind.dir, { withFileTypes: true })) {
    if (!file.isFile()) continue
    const ext = extname(file.name).toLowerCase()
    if (!ALLOWED.has(ext)) continue
    const id = basename(file.name, ext)
    if (!kind.ids.has(id)) {
      unknown.push(`${kind.urlBase}/${file.name}`)
      continue
    }
    // Two files for one id (`lal.svg` and `lal.png`) would emit the key twice
    // and let whichever sorted last win, silently.
    const clash = kind.entries.find(([existing]) => existing === id)
    if (clash) {
      collisions.push(`${kind.urlBase}/${file.name} vs ${clash[1]}`)
      continue
    }
    kind.entries.push([id, `${kind.urlBase}/${file.name}`])
  }
  kind.entries.sort(([a], [b]) => a.localeCompare(b))
}

const quote = (id) => (/^[a-z_][\w]*$/i.test(id) ? id : `'${id}'`)

function block(kind) {
  const body =
    kind.entries.length === 0
      ? '{}'
      : `{\n${kind.entries.map(([id, path]) => `  ${quote(id)}: '${path}',`).join('\n')}\n}`
  return (
    `/** ${kind.label} id → path under \`public/\`. Regenerate with \`npm run logos\`. */\n` +
    `export const ${kind.constant}: Record<string, string> = ${body}\n\n` +
    `export function ${kind.accessor}(${kind.param}: string): string | null {\n` +
    `  return ${kind.constant}[${kind.param}] ?? null\n` +
    `}\n`
  )
}

// Everything above the first generated block is hand-written prose — keep it.
const header = readFileSync(OUT_FILE, 'utf8').split('/** Team id → path')[0]
writeFileSync(OUT_FILE, header + KINDS.map(block).join('\n'))

for (const kind of KINDS) {
  const missing = kind.ids.size - kind.entries.length
  console.log(
    `${kind.label.padEnd(7)} ${String(kind.entries.length).padStart(3)} mapped, ` +
      `${missing} using generated crests.`,
  )
}
if (unknown.length > 0) {
  console.warn(`\nSkipped ${unknown.length} file(s) with no matching id:\n  ${unknown.join('\n  ')}`)
}
if (collisions.length > 0) {
  console.warn(
    `\nIgnored ${collisions.length} duplicate(s) — one id, two files. Delete the one` +
      ` you do not want:\n  ${collisions.join('\n  ')}`,
  )
}
