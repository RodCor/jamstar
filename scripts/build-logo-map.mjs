#!/usr/bin/env node
/**
 * Regenerate `src/data/logos.ts` from whatever is sitting in `public/logos/`.
 *
 * Run after dropping real logo files in, so the app picks them up:
 *   npm run logos
 *
 * A file must be named after the team id it belongs to (`lal.svg`, `el_rma.png`).
 * Ids that do not match a known team are reported and skipped, which catches
 * typos before they turn into a silently missing badge.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, extname, basename } from 'node:path'

const LOGO_DIR = join(process.cwd(), 'public', 'logos')
const TEAMS_FILE = join(process.cwd(), 'src', 'data', 'teams.ts')
const OUT_FILE = join(process.cwd(), 'src', 'data', 'logos.ts')
const ALLOWED = new Set(['.svg', '.png', '.webp', '.jpg', '.jpeg', '.avif'])

const knownIds = new Set(
  [...readFileSync(TEAMS_FILE, 'utf8').matchAll(/^\s*t\('([^']+)'/gm)].map((m) => m[1]),
)

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

const header = readFileSync(OUT_FILE, 'utf8').split('/** Team id → path')[0]
const body =
  entries.length === 0
    ? 'export const LOGO_OVERRIDES: Record<string, string> = {}\n'
    : `export const LOGO_OVERRIDES: Record<string, string> = {\n${entries
        .map(([id, path]) => `  ${/^[a-z_][\w]*$/i.test(id) ? id : `'${id}'`}: '${path}',`)
        .join('\n')}\n}\n`

writeFileSync(
  OUT_FILE,
  `${header}/** Team id → path under \`public/\`. Regenerate with \`npm run logos\`. */\n${body}
export function logoPathFor(teamId: string): string | null {
  return LOGO_OVERRIDES[teamId] ?? null
}
`,
)

console.log(`Mapped ${entries.length} logo${entries.length === 1 ? '' : 's'}.`)
if (unknown.length > 0) {
  console.warn(
    `Skipped ${unknown.length} file(s) with no matching team id: ${unknown.join(', ')}`,
  )
}
console.log(`${knownIds.size - entries.length} team(s) will use generated crests.`)
