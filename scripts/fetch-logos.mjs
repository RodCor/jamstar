#!/usr/bin/env node
/**
 * Fetch club, league and cup logos into `public/logos/`.
 *
 * Run it, then run `npm run logos` to regenerate the override map. Anything
 * that fails to download keeps its generated crest, so a partial run is fine.
 *
 *   npm run logos:fetch                       # everything missing
 *   npm run logos:fetch -- --force            # re-download even if present
 *   npm run logos:fetch -- --only=lal,el_rma
 *   npm run logos:fetch -- --kind=leagues     # teams | leagues | cups
 *   npm run logos:fetch -- --league=nba
 *   npm run logos:fetch -- --list             # what would be fetched; no network
 *   npm run logos:fetch -- --dry-run          # resolve URLs, download nothing
 *   npm run logos:fetch -- --retry-failed     # only the ids _report.json missed
 *   npm run logos:fetch -- --include-youth
 *
 * No dependencies — Node 22's built-in fetch is all it uses.
 *
 * Resolution order per badge:
 *   1. `scripts/logo-sources.json`, if it maps this id to a URL. This is the
 *      escape hatch: drop a URL in there for anything the automation gets
 *      wrong, and it wins over everything else.
 *   2. The NBA's own CDN, which serves clean SVGs keyed by franchise id.
 *   3. Wikipedia, in four passes over the club's article:
 *        a. the infobox's own `logo=`/`image=` parameter,
 *        b. the linked Wikidata item's P154 (logo image),
 *        c. any file on the page whose name looks like a badge,
 *        d. the article's page image.
 *
 * (a) is first because it is the mark the article actually displays, and
 * because it is the only pass that survives a non-free logo: English
 * Wikipedia's PageImages deliberately excludes fair-use uploads, which is
 * exactly the set every European club badge falls into — the article has the
 * crest, but `prop=pageimages` swears blind that it does not. That single
 * exclusion is what used to make this script fail on half the game.
 *
 * Wikipedia is the only source with coverage across every league in the game,
 * but plain names are ambiguous for multi-sport clubs — searching "Real Madrid"
 * or "Flamengo" lands on the football side, and "Coupe de France" lands on the
 * football cup. The HINTS maps below pin those to the basketball article. Use
 * ASCII apostrophes in them: an exact title lookup does not fold U+2019.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
const LOGO_DIR = join(ROOT, 'public', 'logos')
const TEAMS_FILE = join(ROOT, 'src', 'data', 'teams.ts')
const LEAGUES_FILE = join(ROOT, 'src', 'data', 'leagues.ts')
const CUPS_FILE = join(ROOT, 'src', 'data', 'cups.ts')
const SOURCES_FILE = join(ROOT, 'scripts', 'logo-sources.json')
const REPORT_FILE = join(LOGO_DIR, '_report.json')

/** Where each kind of badge lands, relative to `public/logos/`. */
const SUBDIR = { team: '.', league: 'leagues', cup: 'cups' }

// Wikimedia asks for a descriptive User-Agent and throttles anonymous bursts.
const USER_AGENT =
  'HoopGloryLogoFetcher/1.0 (https://github.com/RodCor/jamstar; hobby project) Node/22'

const WIKI_API = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*'

const args = process.argv.slice(2)
const has = (flag) => args.includes(flag)
const value = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}
const list = (name) => value(name)?.split(',').map((s) => s.trim()).filter(Boolean) ?? null

const FORCE = has('--force')
const DRY_RUN = has('--dry-run')
const LIST = has('--list')
const RETRY_FAILED = has('--retry-failed')
const INCLUDE_YOUTH = has('--include-youth')
const ONLY = list('only')
const KINDS = new Set(list('kind') ?? ['teams', 'leagues', 'cups'])
const LEAGUE = value('league')
const CONCURRENCY = Math.max(1, Math.min(6, Number(value('concurrency') ?? 3)))

/** NBA franchise ids — their CDN serves crisp SVGs keyed by these. */
const NBA_CDN_IDS = {
  atl: '1610612737', bos: '1610612738', cle: '1610612739', nop: '1610612740',
  chi: '1610612741', dal: '1610612742', den: '1610612743', gsw: '1610612744',
  hou: '1610612745', lac: '1610612746', lal: '1610612747', mia: '1610612748',
  mil: '1610612749', min: '1610612750', bkn: '1610612751', nyk: '1610612752',
  orl: '1610612753', ind: '1610612754', phi: '1610612755', phx: '1610612756',
  por: '1610612757', sac: '1610612758', sas: '1610612759', okc: '1610612760',
  tor: '1610612761', uta: '1610612762', mem: '1610612763', was: '1610612764',
  det: '1610612765', cha: '1610612766',
}

/**
 * Clubs whose plain name resolves to the wrong article — almost all of them
 * multi-sport clubs where football dominates the search ranking.
 */
const TEAM_HINTS = {
  el_rma: 'Real Madrid Baloncesto',
  acb_rma: 'Real Madrid Baloncesto',
  el_fcb: 'FC Barcelona Bàsquet',
  acb_fcb: 'FC Barcelona Bàsquet',
  el_pan: 'Panathinaikos B.C.',
  gbl_pan: 'Panathinaikos B.C.',
  el_oly: 'Olympiacos B.C.',
  gbl_oly: 'Olympiacos B.C.',
  el_fen: "Fenerbahçe Men's Basketball",
  bsl_fen: "Fenerbahçe Men's Basketball",
  el_efs: 'Anadolu Efes S.K.',
  bsl_efs: 'Anadolu Efes S.K.',
  el_ptz: 'KK Partizan',
  aba_par: 'KK Partizan',
  el_czv: 'KK Crvena zvezda',
  aba_czv: 'KK Crvena zvezda',
  el_bay: 'FC Bayern Munich (basketball)',
  el_mon: 'AS Monaco Basket',
  fra_mon: 'AS Monaco Basket',
  el_zal: 'BC Žalgiris',
  lkl_zal: 'BC Žalgiris',
  el_mac: 'Maccabi Tel Aviv B.C.',
  el_bas: 'Saski Baskonia',
  acb_bas: 'Saski Baskonia',
  el_asv: 'ASVEL Basket',
  fra_asv: 'ASVEL Basket',
  el_mil: 'Olimpia Milano',
  lega_mil: 'Olimpia Milano',
  el_vir: 'Virtus Bologna',
  lega_vir: 'Virtus Bologna',
  // Plain "Unicaja" is the bank that sponsors the club, badge and all.
  acb_uni: 'Baloncesto Málaga',
  acb_gcn: 'CB Gran Canaria',
  acb_ten: 'CB Canarias',
  acb_bre: 'Río Breogán',
  acb_zar: 'Basket Zaragoza',
  bsl_gal: 'Galatasaray B.K.',
  bsl_bes: 'Beşiktaş B.K.',
  gbl_ath: 'AEK B.C.',
  gbl_par: 'PAOK BC',
  lkl_ryt: 'BC Rytas',
  aba_bud: 'KK Budućnost',
  aba_ceo: 'KK Cedevita Olimpija',
  aba_meg: 'KK Mega Basket',
  aba_spl: 'KK Split',
  aba_zad: 'KK Zadar',
  aba_iga: 'KK Igokea',
  lnb_bbc: 'Boca Juniors (basketball)',
  lnb_sma: 'San Lorenzo de Almagro (basketball)',
  lnb_ins: 'Instituto Atlético Central Córdoba (basketball)',
  lnb_ate: 'Atenas de Córdoba',
  lnb_pen: 'Peñarol de Mar del Plata',
  lnb_fer: 'Ferro Carril Oeste (basketball)',
  lnb_pla: 'Club Atlético Platense (basketball)',
  lnb_obr: 'Obras Sanitarias (basketball)',
  lnb_qui: 'Quimsa',
  lnb_reg: 'Regatas Corrientes',
  lnb_gim: 'Gimnasia y Esgrima (Comodoro Rivadavia)',
  lnb_ola: 'Olímpico de La Banda',
  nbb_fla: 'Flamengo Basketball',
  nbb_cor: 'Sport Club Corinthians Paulista (basketball)',
  nbb_sao: 'São Paulo FC (basketball)',
  nbb_min: 'Minas Tênis Clube',
  nbb_fra: 'Franca Basquetebol Clube',
  nbb_pau: 'Club Athletico Paulistano',
  nbb_bau: 'Bauru Basket',
  fra_lem: 'Le Mans Sarthe Basket',
  fra_str: 'SIG Strasbourg',
  fra_cho: 'Cholet Basket',
  fra_nan: 'Nanterre 92',
  fra_stb: 'JL Bourg-en-Bresse',
  cba_gua: 'Guangdong Southern Tigers',
  cba_lia: 'Liaoning Flying Leopards',
  gl_ral: 'Raptors 905',
  gl_scw: 'Santa Cruz Warriors',
  leb_bur: 'San Pablo Burgos',
  leb_ovi: 'Oviedo Club Baloncesto',
  // "<school> basketball" lands on the season article, which carries a
  // wordmark rather than the athletics logo.
  ncaa_uconn: 'UConn Huskies',
  ncaa_hou: 'Houston Cougars',
}

/**
 * Leagues are named for their sponsor as often as for themselves, and several
 * share a name with a competition in another sport or another country — so
 * every one of them is pinned by hand rather than derived from `name.en`.
 */
const LEAGUE_HINTS = {
  nba: 'National Basketball Association',
  euroleague: 'EuroLeague',
  acb: 'Liga ACB',
  lega_a: 'Lega Basket Serie A',
  betclic: 'LNB Élite',
  aba: 'ABA League',
  lkl: 'Lietuvos krepšinio lyga',
  gbl: 'Greek Basketball League',
  bsl: 'Basketbol Süper Ligi',
  lnb_ar: 'Liga Nacional de Básquetbol',
  nbb: 'Novo Basquete Brasil',
  cba: 'Chinese Basketball Association',
  nbl: 'National Basketball League (Australia)',
  // The division has no mark of its own; the governing body's is what appears
  // on a college jersey patch anyway.
  ncaa: 'National Collegiate Athletic Association',
  g_league: 'NBA G League',
  leb_oro: 'Primera FEB',
  pro_b: 'LNB Pro B',
}

/** Same story for cups, where "Coupe de France" is a football trophy first. */
const CUP_HINTS = {
  nba_cup: 'NBA Cup',
  copa_rey: 'Copa del Rey de Baloncesto',
  coppa_italia: 'Italian Basketball Cup',
  coupe_france: 'French Basketball Cup',
  coupe_france_b: 'French Basketball Cup',
  aba_supercup: 'ABA League Supercup',
  kmt: 'King Mindaugas Cup',
  greek_cup: 'Greek Basketball Cup',
  turkish_cup: 'Turkish Basketball Presidential Cup',
  copa_argentina: 'Copa Argentina de Básquet',
  copa_princesa: 'Copa Princesa de Asturias',
}

/**
 * Competitions with no badge of their own to fetch: an NCAA "conference
 * tournament" is thirty different trophies, and the rest are in-season events
 * that wear nothing but their league's mark — fetching that would put the same
 * logo on the league and on its cup. They keep their generated crest, which is
 * the more honest result.
 */
const NO_REAL_BADGE = new Set([
  'conference_tournament',
  'nbl_blitz',
  'cba_allstar_cup',
  'copa_super8',
  'winter_showcase',
  // The only ABA Supercup artwork anywhere is the one-off "Zagreb 2019" event
  // lockup; a dated poster on a trophy the player wins in 2034 reads worse
  // than no badge at all.
  'aba_supercup',
])

/** High school basketball is generic by design — no real badge to fetch. */
const YOUTH_IDS = new Set(['youth', 'youth_hs'])

/**
 * Language editions to try when English Wikipedia has the article but not the
 * badge — which happens for competitions the English wiki covers as a stub.
 * Ordered so a club's own country's wiki is reached early.
 */
const FALLBACK_WIKIS = [
  'es', 'it', 'fr', 'de', 'el', 'tr', 'sr', 'hr', 'sl', 'lt', 'pt', 'ca', 'ru',
]

/**
 * Files that show up on almost every Wikipedia article and are never the badge.
 * Without this the `prop=images` pass happily returns a flag of Angola.
 */
const JUNK_FILE = new RegExp(
  [
    'commons-logo', 'wiki(pedia|media|source|quote|news|versity|books)', 'pictogram',
    '^flag[ _]of', '^flag[ _]', 'disambig', 'current[ _]event', 'red[ _]pog',
    'ambox', 'question[ _]book', 'padlock', 'edit-icon', 'magnify', 'loudspeaker',
    'symbol[ _]', 'folder', 'increase2?\\.svg', 'decrease2?\\.svg', 'steady2?\\.svg',
    'blue[ _]pog', 'green[ _]pog', 'yellow[ _]pog', 'star[ _]full', 'nuvola',
    'p[ _]vip', 'portal', 'searchtool', 'text[ _]document', 'office-book',
    'sports[ _]and[ _]games', 'basketball[ _]pictogram', 'soccer[ _]ball',
    '^gnome-', '^crystal', 'location[ _]dot', 'stub', '\\bcup\\.svg$',
  ].join('|'),
  'i',
)

/** Names that read like a badge rather than a photo. */
const BADGE_WORD = /logo|crest|badge|emblem|escudo|shield|seal|wordmark|scudetto|stemma/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- data files

/** Every `t('id', 'Name', 'ABBR', 'leagueId', …)` call in teams.ts. */
function parseTeams() {
  const source = readFileSync(TEAMS_FILE, 'utf8')
  const re = /^\s*t\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'/gm
  return [...source.matchAll(re)].map(([, id, name, abbr, leagueId]) => ({
    kind: 'team',
    id,
    name,
    abbr,
    leagueId,
    hint: TEAM_HINTS[id] ?? `${name} basketball`,
  }))
}

/**
 * Leagues and cups are object literals rather than calls, so they are read as
 * `id` + the English half of the `name` pair that follows it.
 */
function parseNamed(file, kind, hints) {
  const source = readFileSync(file, 'utf8')
  const re = /id:\s*'([^']+)',[\s\S]{0,200}?name:\s*\{[^}]*en:\s*(?:'([^']*)'|"([^"]*)")/g
  return [...source.matchAll(re)].map(([, id, single, double]) => {
    const name = single ?? double
    return { kind, id, name, hint: hints[id] ?? `${name} basketball` }
  })
}

// ------------------------------------------------------------------ fetching

/**
 * Every request in the script goes through here.
 *
 * Wikimedia rate-limits anonymous clients hard, and the cross-wiki pass turns
 * one club into a dozen requests — a naive run gets a wall of 429s a third of
 * the way in and reports them as missing logos. So: one global gate spacing
 * requests out no matter how many workers are running, plus a backoff that
 * honours `Retry-After`. Slower than hammering it, and it actually finishes.
 */
const MIN_GAP_MS = 120
let nextSlot = 0

async function gate() {
  const now = Date.now()
  const slot = Math.max(now, nextSlot)
  nextSlot = slot + MIN_GAP_MS
  if (slot > now) await sleep(slot - now)
}

const RETRY_STATUS = new Set([429, 500, 502, 503, 504])

async function request(url, attempt = 0) {
  await gate()
  let res
  try {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  } catch (error) {
    if (attempt >= 4) throw error
    await sleep(1000 * 2 ** attempt)
    return request(url, attempt + 1)
  }

  if (RETRY_STATUS.has(res.status) && attempt < 4) {
    const retryAfter = Number(res.headers.get('retry-after'))
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 1000 * 2 ** attempt
    // Push every other worker back too — a 429 means the whole client is
    // over the line, not just this one request.
    nextSlot = Math.max(nextSlot, Date.now() + wait)
    await sleep(wait)
    return request(url, attempt + 1)
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res
}

async function getJson(url) {
  return (await request(url)).json()
}

/** The single page for a hint: exact title first, search only if that misses. */
async function resolveArticle(entity) {
  const exact = await getJson(
    `${WIKI_API}&prop=revisions|pageprops|pageimages&rvprop=content&rvslots=main&rvsection=0` +
      `&piprop=original&redirects=1&titles=${encodeURIComponent(entity.hint)}`,
  )
  const page = Object.values(exact?.query?.pages ?? {})[0]
  if (page && page.missing === undefined && page.invalid === undefined) {
    return { page, via: 'title' }
  }

  const search = await getJson(
    `${WIKI_API}&list=search&srlimit=5&srnamespace=0&srsearch=${encodeURIComponent(entity.hint)}`,
  )
  const title = (search?.query?.search ?? [])
    .map((hit) => hit.title)
    .find((t) => !/\(disambiguation\)|^List of/i.test(t))
  if (!title) return null

  const found = await getJson(
    `${WIKI_API}&prop=revisions|pageprops|pageimages&rvprop=content&rvslots=main&rvsection=0` +
      `&piprop=original&redirects=1&titles=${encodeURIComponent(title)}`,
  )
  const hit = Object.values(found?.query?.pages ?? {})[0]
  return hit && hit.missing === undefined ? { page: hit, via: 'search' } : null
}

/**
 * The `logo=`/`image=` parameter of the article's infobox.
 *
 * Wikitext, not the rendered page, because the rendered thumbnail is a scaled
 * PNG even when the source is an SVG, and we want the vector.
 */
function infoboxFile(wikitext) {
  const keys = [
    'logo', 'image', 'crest', 'badge', 'logo_image', 'team_logo',
    'current_logo', 'logo1', 'image1',
  ]
  for (const key of keys) {
    const match = wikitext.match(new RegExp(`\\|\\s*${key}\\s*=\\s*([^\\n|}]+)`, 'i'))
    if (!match) continue
    const file = match[1]
      .trim()
      .replace(/^\[\[\s*(?:File|Image):/i, '')
      .replace(/\|.*$/, '')
      .replace(/\]\]$/, '')
      .replace(/^(?:File|Image):/i, '')
      .trim()
    if (/\.(svg|png|jpe?g|webp|gif)$/i.test(file) && !JUNK_FILE.test(file)) return file
  }
  return null
}

/** The linked Wikidata item's P154 "logo image", which points at Commons. */
async function wikidataFile(qid) {
  if (!qid) return null
  const claims = await getJson(
    `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&origin=*` +
      `&entity=${encodeURIComponent(qid)}&property=P154`,
  )
  const file = claims?.claims?.P154?.[0]?.mainsnak?.datavalue?.value
  return typeof file === 'string' && !JUNK_FILE.test(file) ? file : null
}

/** Any file on the page whose name looks like this club's badge. */
async function pageImageFile(title, entity) {
  const data = await getJson(
    `${WIKI_API}&prop=images&imlimit=500&titles=${encodeURIComponent(title)}`,
  )
  const page = Object.values(data?.query?.pages ?? {})[0]
  const files = (page?.images ?? [])
    .map((image) => image.title.replace(/^File:/, ''))
    .filter((file) => !JUNK_FILE.test(file))

  // Tokens from the club's own name, so "Zadar logo.svg" beats "NBA logo.svg".
  const tokens = entity.name
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 4)

  const score = (file) => {
    const lower = file.toLowerCase()
    let points = 0
    if (BADGE_WORD.test(lower)) points += 3
    if (tokens.some((token) => lower.includes(token))) points += 3
    if (lower.endsWith('.svg')) points += 1
    if (/\.jpe?g$/.test(lower)) points -= 1
    return points
  }

  const best = files.map((f) => [f, score(f)]).sort((a, b) => b[1] - a[1])[0]
  // A badge word or a name match on its own is thin; require both signals.
  return best && best[1] >= 4 ? best[0] : null
}

/** Filename on a wiki → the actual bytes URL, whether it lives there or on Commons. */
async function fileUrl(file, lang = 'en') {
  const info = await getJson(
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
      `&prop=imageinfo&iiprop=url|mime|size&titles=${encodeURIComponent(`File:${file}`)}`,
  )
  const page = Object.values(info?.query?.pages ?? {})[0]
  const url = page?.imageinfo?.[0]?.url
  if (url) return url
  // Not on that wiki — Commons serves it under the canonical redirect.
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    file.replace(/ /g, '_'),
  )}`
}

/**
 * The badge on a non-English article.
 *
 * Infobox parameters are localised — `Immagine`, `imagen`, `Logo`, `εικόνα` —
 * so this looks for any parameter holding an image filename and prefers the
 * ones whose *name* reads like a logo, rather than assuming English keys.
 */
function foreignInfoboxFile(wikitext) {
  const named = [
    ...wikitext.matchAll(/\|\s*([\p{L}_ ]{2,30})\s*=\s*([^\n|}[\]]+\.(?:svg|png|jpe?g|webp))/giu),
  ].filter(([, , file]) => !JUNK_FILE.test(file))

  const logoKey = /log|imag|immagin|escud|amblem|emblem|resim|grb|slika|bild|εικ|лого/i
  const preferred = named.find(([, key]) => logoKey.test(key))
  if (preferred) return preferred[2].trim()
  if (named[0]) return named[0][2].trim()

  // Some articles open with a bare file link instead of an infobox.
  const linked = [
    ...wikitext.matchAll(
      /\[\[\s*(?:File|Image|Immagine|Imagen|Αρχείο|Dosya|Датотека|Datoteka|Vaizdas|Ficheiro|Fichier|Datei|Bild)\s*:\s*([^|\]]+\.(?:svg|png|jpe?g|webp))/giu,
    ),
  ].find(([, file]) => !JUNK_FILE.test(file))
  return linked ? linked[1].trim() : null
}

/** Every English-Wikipedia candidate for one entity, best first. */
async function wikipediaCandidates(page, entity) {
  const wikitext = page.revisions?.[0]?.slots?.main?.['*'] ?? ''
  const candidates = []

  const infobox = infoboxFile(wikitext)
  if (infobox) candidates.push({ file: infobox, via: `infobox:${page.title}` })

  const wikidata = await wikidataFile(page.pageprops?.wikibase_item)
  if (wikidata && wikidata !== infobox) {
    candidates.push({ file: wikidata, via: `wikidata:${page.pageprops.wikibase_item}` })
  }

  const onPage = await pageImageFile(page.title, entity)
  if (onPage && !candidates.some((c) => c.file === onPage)) {
    candidates.push({ file: onPage, via: `page-images:${page.title}` })
  }

  const lead = page.original?.source
  if (lead && !JUNK_FILE.test(lead)) {
    candidates.push({ url: lead, via: `pageimage:${page.title}` })
  }

  return candidates
}

/**
 * The same article on other language Wikipedias.
 *
 * English Wikipedia covers plenty of European competitions as a two-line stub
 * with no infobox at all, while the Italian, Serbian or Greek article carries
 * the badge. The Wikidata item is the join key, so no per-language titles need
 * to be guessed.
 */
async function crossWikiCandidates(page) {
  const qid = page.pageprops?.wikibase_item
  if (!qid) return []

  const entity = await getJson(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*` +
      `&props=sitelinks&ids=${encodeURIComponent(qid)}`,
  )
  const sitelinks = entity?.entities?.[qid]?.sitelinks ?? {}

  const candidates = []
  for (const lang of FALLBACK_WIKIS) {
    const link = sitelinks[`${lang}wiki`]
    if (!link) continue
    try {
      const data = await getJson(
        `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
          `&prop=revisions&rvprop=content&rvslots=main&rvsection=0&redirects=1` +
          `&titles=${encodeURIComponent(link.title)}`,
      )
      const foreign = Object.values(data?.query?.pages ?? {})[0]
      const file = foreignInfoboxFile(foreign?.revisions?.[0]?.slots?.main?.['*'] ?? '')
      if (file && !candidates.some((c) => c.file === file)) {
        candidates.push({ file, lang, via: `${lang}.wikipedia:${link.title}` })
      }
    } catch {
      // A missing or renamed article on one wiki is not worth reporting; the
      // next language is right behind it.
    }
  }
  return candidates
}

function nbaCdnLogo(team) {
  if (team.leagueId !== 'nba') return null
  const franchise = NBA_CDN_IDS[team.id]
  if (!franchise) return null
  return {
    url: `https://cdn.nba.com/logos/nba/${franchise}/global/L/logo.svg`,
    via: 'cdn.nba.com',
  }
}

// ---------------------------------------------------------------- downloading

/**
 * What the bytes actually are, not what the URL claims.
 *
 * Wikimedia will happily serve an HTML error page with a 200, and a truncated
 * response still looks like a file on disk — so the extension comes from the
 * magic bytes and anything unrecognised is rejected rather than saved as .png.
 */
function sniff(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return '.png'
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return '.jpg'
  }
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return '.webp'
  }
  if (buffer.subarray(4, 12).toString('ascii') === 'ftypavif') return '.avif'
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF89a' || buffer.subarray(0, 6).toString('ascii') === 'GIF87a') {
    return '.gif'
  }
  // SVG is text, and may open with an XML declaration, a doctype or comments.
  const head = buffer.subarray(0, 1024).toString('utf8')
  if (/<svg[\s>]/i.test(head) || (/^\s*<\?xml/.test(head) && /<svg/i.test(buffer.toString('utf8')))) {
    return '.svg'
  }
  return null
}

/**
 * Give an SVG an intrinsic size when it only carries a viewBox.
 *
 * Harmless in an `<img>`, where CSS decides the size — but on a canvas a
 * dimensionless SVG falls back to 300×150 and the badge comes out squashed,
 * which is exactly what the share card draws. The NBA's CDN ships all thirty
 * of its logos this way.
 */
function sizeSvg(buffer) {
  const text = buffer.toString('utf8')
  const tag = text.match(/<svg[^>]*>/i)?.[0]
  if (!tag) return buffer

  const hasWidth = /\swidth\s*=/i.test(tag)
  const hasHeight = /\sheight\s*=/i.test(tag)
  if (hasWidth && hasHeight) return buffer

  const viewBox = tag.match(
    /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i,
  )
  if (!viewBox) return buffer

  const attrs =
    (hasWidth ? '' : ` width="${viewBox[1]}"`) + (hasHeight ? '' : ` height="${viewBox[2]}"`)
  return Buffer.from(text.replace(tag, tag.replace(/^<svg/i, `<svg${attrs}`)))
}

async function download(url) {
  const res = await request(url)
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length < 200) throw new Error(`suspiciously small (${buffer.length} bytes)`)

  const ext = sniff(buffer)
  if (!ext) {
    const head = buffer.subarray(0, 200).toString('utf8').replace(/\s+/g, ' ').trim()
    throw new Error(`not an image (starts "${head.slice(0, 60)}")`)
  }
  if (ext === '.gif') throw new Error('animated/indexed GIF, not a usable badge')
  return { buffer: ext === '.svg' ? sizeSvg(buffer) : buffer, ext }
}

function dirFor(entity) {
  return join(LOGO_DIR, SUBDIR[entity.kind])
}

function existingFileFor(entity) {
  const dir = dirFor(entity)
  if (!existsSync(dir)) return null
  return (
    readdirSync(dir).find(
      (f) => f.slice(0, f.lastIndexOf('.')) === entity.id && !f.startsWith('_') && f !== 'README.md',
    ) ?? null
  )
}

async function resolveAndFetch(entity, manual) {
  const existing = existingFileFor(entity)
  if (existing && !FORCE) {
    return { ...entity, status: 'skipped', detail: `already have ${existing}` }
  }

  const problems = []
  const direct = []
  if (manual[entity.id]) direct.push({ url: manual[entity.id], via: 'logo-sources.json' })
  const nba = entity.kind === 'team' ? nbaCdnLogo(entity) : null
  if (nba) direct.push(nba)

  // Each pass is resolved lazily, and only if the one before it came up empty
  // — no point spending a dozen API calls on a club the NBA CDN already
  // covered, or walking thirteen language wikis when the infobox had it.
  let article
  const openArticle = async () => {
    if (article === undefined) article = await resolveArticle(entity)
    return article?.page ?? null
  }

  const passes = [
    async () => direct,
    async () => {
      const page = await openArticle()
      return page ? wikipediaCandidates(page, entity) : []
    },
    async () => {
      const page = await openArticle()
      return page ? crossWikiCandidates(page) : []
    },
  ]

  for (const pass of passes) {
    let candidates
    try {
      candidates = await pass()
    } catch (error) {
      problems.push(`resolve: ${error.message}`)
      continue
    }

    for (const candidate of candidates) {
      let url = candidate.url
      if (!url) {
        try {
          url = await fileUrl(candidate.file, candidate.lang ?? 'en')
        } catch (error) {
          problems.push(`${candidate.via}: ${error.message}`)
          continue
        }
      }

      if (DRY_RUN) {
        return { ...entity, status: 'resolved', detail: `${candidate.via} -> ${url}` }
      }

      try {
        const { buffer, ext } = await download(url)
        mkdirSync(dirFor(entity), { recursive: true })
        // A re-fetch can land a different format than last time. Without this,
        // `acb_uni.svg` and `acb_uni.png` both survive and the map generator
        // emits the id twice — last key silently wins.
        const stale = existingFileFor(entity)
        if (stale && stale !== `${entity.id}${ext}`) rmSync(join(dirFor(entity), stale))
        writeFileSync(join(dirFor(entity), `${entity.id}${ext}`), buffer)
        return {
          ...entity,
          status: 'ok',
          detail: `${entity.id}${ext} (${Math.round(buffer.length / 1024)} kB) via ${candidate.via}`,
        }
      } catch (error) {
        problems.push(`${candidate.via}: ${error.message}`)
      }
    }
  }

  return {
    ...entity,
    status: 'failed',
    detail: problems.join('; ') || 'no candidate URL found',
  }
}

/** Simple worker pool — Wikimedia does not want a 190-way burst. */
async function pool(items, worker, size) {
  const results = []
  let cursor = 0
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index], index)
    }
  })
  await Promise.all(runners)
  return results
}

// ---------------------------------------------------------------------- main

async function main() {
  let entities = []
  if (KINDS.has('teams')) entities.push(...parseTeams())
  if (KINDS.has('leagues')) entities.push(...parseNamed(LEAGUES_FILE, 'league', LEAGUE_HINTS))
  if (KINDS.has('cups')) entities.push(...parseNamed(CUPS_FILE, 'cup', CUP_HINTS))

  if (entities.length === 0) {
    console.error('Parsed nothing — have the data files changed shape, or is --kind wrong?')
    process.exit(1)
  }

  entities = entities.filter((e) => !NO_REAL_BADGE.has(e.id))
  if (!INCLUDE_YOUTH) entities = entities.filter((e) => !YOUTH_IDS.has(e.id))
  if (LEAGUE) entities = entities.filter((e) => e.leagueId === LEAGUE || e.id === LEAGUE)
  if (ONLY) entities = entities.filter((e) => ONLY.includes(e.id))

  // Pick up exactly where the last run gave up — usually a batch lost to rate
  // limiting rather than to anything actually missing.
  if (RETRY_FAILED) {
    if (!existsSync(REPORT_FILE)) {
      console.error(`No ${REPORT_FILE} to retry from.`)
      process.exit(1)
    }
    const ids = new Set((JSON.parse(readFileSync(REPORT_FILE, 'utf8')).failed ?? []).map((r) => r.id))
    entities = entities.filter((e) => ids.has(e.id))
  }

  if (entities.length === 0) {
    console.error('Nothing matched those filters.')
    process.exit(1)
  }

  // --list touches no network at all, so the parsers and hint tables can be
  // checked anywhere — including the hints pinned to an id that no longer
  // exists, which otherwise fail silently and forever.
  if (LIST) {
    for (const entity of entities) {
      console.log(
        `${entity.kind.padEnd(7)} ${entity.id.padEnd(16)} ` +
          `${entity.name.padEnd(30).slice(0, 30)} → "${entity.hint}"`,
      )
    }
    console.log(`\n${entities.length} total. Skipped by design: ${[...NO_REAL_BADGE].join(', ')}.`)

    const known = new Set([
      ...parseTeams(),
      ...parseNamed(LEAGUES_FILE, 'league', LEAGUE_HINTS),
      ...parseNamed(CUPS_FILE, 'cup', CUP_HINTS),
    ].map((e) => e.id))
    const orphans = [...Object.keys(TEAM_HINTS), ...Object.keys(LEAGUE_HINTS), ...Object.keys(CUP_HINTS)]
      .filter((id) => !known.has(id))
    if (orphans.length > 0) console.warn(`\nHints for unknown ids: ${orphans.join(', ')}`)
    return
  }

  mkdirSync(LOGO_DIR, { recursive: true })
  const sources = existsSync(SOURCES_FILE) ? JSON.parse(readFileSync(SOURCES_FILE, 'utf8')) : {}
  const manual = {
    ...(sources.teams ?? {}),
    ...(sources.leagues ?? {}),
    ...(sources.cups ?? {}),
  }

  console.log(
    `Fetching ${entities.length} badge(s)${DRY_RUN ? ' (dry run)' : ''} ` +
      `with concurrency ${CONCURRENCY}.\n`,
  )

  const results = await pool(entities, async (entity) => {
    const result = await resolveAndFetch(entity, manual)
    const mark = { ok: '+', skipped: '.', resolved: '?', failed: 'x' }[result.status]
    console.log(`${mark} ${entity.id.padEnd(14)} ${entity.name.padEnd(28).slice(0, 28)} ${result.detail}`)
    return result
  }, CONCURRENCY)

  const by = (status) => results.filter((r) => r.status === status)
  const failed = by('failed')

  console.log(
    `\nDone. ${by('ok').length} downloaded, ${by('skipped').length} already present, ` +
      `${by('resolved').length} resolved, ${failed.length} failed.`,
  )

  writeFileSync(
    REPORT_FILE,
    JSON.stringify(
      { generated: new Date().toISOString(), failed, all: results.map(({ kind, id, name, status, detail }) => ({ kind, id, name, status, detail })) },
      null,
      2,
    ),
  )

  if (failed.length > 0) {
    console.log(`\nCouldn't resolve ${failed.length}:`)
    for (const f of failed) console.log(`  ${f.kind.padEnd(7)} ${f.id.padEnd(14)} ${f.name}`)
    console.log(
      `\nWritten to ${REPORT_FILE}. Fix any of them by adding a direct URL to\n` +
        `scripts/logo-sources.json under "${failed[0].kind}s", then re-run with\n` +
        `--only=${failed[0].id} --force. Anything still missing keeps its generated crest.`,
    )
  }

  if (!DRY_RUN) console.log('\nNext: npm run logos')
}

main().catch((error) => {
  console.error('\nFetch failed:', error.message)
  process.exit(1)
})
