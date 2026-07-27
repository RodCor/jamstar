#!/usr/bin/env node
/**
 * Fetch club, league and cup logos into `public/logos/`.
 *
 * Run it, then run `npm run logos` to regenerate the override map. Anything
 * that fails to download simply has no badge, so a partial run is fine.
 *
 *   npm run logos:fetch                    # everything missing
 *   npm run logos:fetch -- --list          # what would be fetched; no network
 *   npm run logos:fetch -- --dry-run       # resolve URLs, download nothing
 *   npm run logos:fetch -- --kind=cup      # one kind at a time
 *   npm run logos:fetch -- --league=nba
 *   npm run logos:fetch -- --only=lal,copa_rey
 *   npm run logos:fetch -- --force         # re-download even if present
 *   npm run logos:fetch -- --retry-failed  # only the ids in _report.json
 *   npm run logos:fetch -- --include-youth
 *
 * No dependencies — Node 22's built-in fetch is all it uses.
 *
 * Resolution order per entity:
 *   1. `scripts/logo-sources.json`, if it maps this id to a URL. This is the
 *      escape hatch: drop a URL in there for anything the automation gets
 *      wrong, and it wins over everything else.
 *   2. The NBA's own CDN, which serves clean SVGs keyed by franchise id.
 *      Clubs only.
 *   3. The logo named in the article's infobox.
 *   4. Wikidata's structured "logo image" (P154).
 *   5. The article's lead image — but only if it looks like a badge.
 *
 * Steps 3-5 are all Wikipedia, in decreasing order of "is this actually the
 * badge". The order matters: relying on the lead image alone (which is all this
 * script used to do) fails on most club crests and quietly succeeds with an
 * arena photograph on the rest, because that API only returns *freely licensed*
 * images and a club crest is almost always non-free.
 *
 * The other risk is the search itself. An ambiguous name does not fail, it
 * succeeds with the wrong badge: "Real Madrid" and "Flamengo" land on the
 * football side, and "Copa del Rey", "Coppa Italia" and "Coupe de France" are
 * all football tournaments first. SEARCH_HINTS pins every one of those to the
 * basketball article — which is why `--dry-run` prints where each entity
 * resolved, and why it is worth reading before a real run.
 *
 * Every download is recorded in `public/logos/_sources.json`, so a badge that
 * turns out to be wrong can be traced back to where it came from.
 */

import {
  readFileSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
const LOGO_DIR = join(ROOT, 'public', 'logos')
const TEAMS_FILE = join(ROOT, 'src', 'data', 'teams.ts')
const LEAGUES_FILE = join(ROOT, 'src', 'data', 'leagues.ts')
const CUPS_FILE = join(ROOT, 'src', 'data', 'cups.ts')
const SOURCES_FILE = join(ROOT, 'scripts', 'logo-sources.json')
const REPORT_FILE = join(LOGO_DIR, '_report.json')
const SOURCES_MANIFEST = join(LOGO_DIR, '_sources.json')

// Wikimedia asks for a descriptive User-Agent and throttles anonymous bursts.
const USER_AGENT =
  'HoopGloryLogoFetcher/1.0 (https://github.com/RodCor/jamstar; hobby project) Node/22'

const args = process.argv.slice(2)
const has = (flag) => args.includes(flag)
const value = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}

const FORCE = has('--force')
const DRY_RUN = has('--dry-run')
const LIST = has('--list')
const INCLUDE_YOUTH = has('--include-youth')
const ONLY = value('only')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null
const LEAGUE = value('league')
const KIND = value('kind')
const RETRY_FAILED = has('--retry-failed')
// Two at a time, not three. Each entity costs several API calls now, and
// Wikimedia throttles the client as a whole — going wider just triggers the
// backoff sooner and finishes no faster.
const CONCURRENCY = Math.max(1, Math.min(6, Number(value('concurrency') ?? 2)))

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
const SEARCH_HINTS = {
  el_rma: 'Real Madrid Baloncesto',
  acb_rma: 'Real Madrid Baloncesto',
  el_fcb: 'FC Barcelona Bàsquet',
  acb_fcb: 'FC Barcelona Bàsquet',
  el_pan: 'Panathinaikos B.C.',
  gbl_pan: 'Panathinaikos B.C.',
  el_oly: 'Olympiacos B.C.',
  gbl_oly: 'Olympiacos B.C.',
  el_fen: 'Fenerbahçe Men’s Basketball',
  bsl_fen: 'Fenerbahçe Men’s Basketball',
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
  acb_uni: 'Unicaja Málaga',
  acb_gcn: 'CB Gran Canaria',
  acb_ten: 'CB Canarias',
  acb_bre: 'Río Breogán',
  acb_zar: 'Basket Zaragoza',
  bsl_gal: 'Galatasaray S.K. (men’s basketball)',
  bsl_bes: 'Beşiktaş men’s basketball',
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
  leb_alm: 'CB Cartagena',
  // Italian cities with a famous football club and a basketball one.
  lega_ven: 'Reyer Venezia Mestre',
  lega_bre: 'Pallacanestro Brescia',
  lega_tra: 'Aquila Basket Trento',
  lega_tor: 'Pallacanestro Reggiana',
  lega_tri: 'Pallacanestro Trieste',
  lega_sas: 'Dinamo Sassari',
  lkl_lie: 'BC Lietkabelis',
  lkl_nep: 'BC Neptūnas',
  lkl_sir: 'BC Šiauliai',
  el_par: 'Paris Basketball',
  fra_par: 'Paris Basketball',
  el_alb: 'ALBA Berlin',
  acb_val: 'Valencia Basket',
  acb_jov: 'Joventut Badalona',
  acb_man: 'Bàsquet Manresa',
  nbb_pat: 'Pato Basquete',
  prob_evr: 'ADA Blois Basket 41',
  prob_ort: 'Orléans Loiret Basket',
  gl_ign: 'NBA G League Ignite',
  // College articles are per-sport, and the plain program name is the athletics
  // or football one — every NCAA entry needs the suffix.
  ncaa_uconn: 'UConn Huskies men’s basketball',
  ncaa_mich: 'Michigan State Spartans men’s basketball',
  ncaa_duk: 'Duke Blue Devils men’s basketball',
  ncaa_kan: 'Kansas Jayhawks men’s basketball',
  ncaa_ken: 'Kentucky Wildcats men’s basketball',
  ncaa_unc: 'North Carolina Tar Heels men’s basketball',
  ncaa_gon: 'Gonzaga Bulldogs men’s basketball',
  ncaa_ucla: 'UCLA Bruins men’s basketball',
  ncaa_ariz: 'Arizona Wildcats men’s basketball',
  ncaa_bay: 'Baylor Bears men’s basketball',
  ncaa_hou: 'Houston Cougars men’s basketball',
  ncaa_ala: 'Alabama Crimson Tide men’s basketball',

  // Leagues. Most are unambiguous, but the acronyms are not: "ACB", "LKL" and
  // "BSL" all resolve to something else entirely without a full name.
  nba: 'National Basketball Association',
  euroleague: 'EuroLeague',
  acb: 'Liga ACB',
  lega_a: 'Lega Basket Serie A',
  betclic: 'LNB Élite',
  aba: 'ABA League',
  lkl: 'Lietuvos krepšinio lyga',
  gbl: 'Greek Basket League',
  bsl: 'Basketbol Süper Ligi',
  lnb_ar: 'Liga Nacional de Básquet',
  nbb: 'Novo Basquete Brasil',
  cba: 'Chinese Basketball Association',
  nbl: 'National Basketball League (Australia)',
  ncaa: 'NCAA Division I men’s basketball',
  g_league: 'NBA G League',
  leb_oro: 'LEB Oro',
  pro_b: 'LNB Pro B',

  // Cups. These are the dangerous ones: the three biggest names in here are all
  // football tournaments first, and a plain search returns the wrong badge
  // without erroring.
  nba_cup: 'NBA Cup',
  copa_rey: 'Copa del Rey de Baloncesto',
  coppa_italia: 'Coppa Italia (basketball)',
  coupe_france: 'Coupe de France (basketball)',
  aba_supercup: 'ABA League Supercup',
  kmt: 'King Mindaugas Cup',
  greek_cup: 'Greek Basketball Cup',
  turkish_cup: 'Turkish Basketball Cup',
  copa_argentina: 'Copa Argentina de Básquet',
  copa_super8: 'Copa Super 8',
  copa_princesa: 'Copa Princesa de Asturias',
  winter_showcase: 'NBA G League Winter Showcase',
  nbl_blitz: 'NBL Blitz',
}

/**
 * Entities with no single real badge to fetch. Skipped rather than guessed —
 * a wrong logo is worse than none, because nothing downstream flags it.
 */
const SKIP = new Set([
  // Generic by design.
  'youth',
  // Every NCAA conference runs its own; there is no one tournament logo.
  'conference_tournament',
  // Invented for the game — the CBA has no equivalent domestic cup.
  'cba_allstar_cup',
])

/** Ids that share one real trophy: fetch the source, copy to the alias. */
const ALIASES = {
  // Both French tiers enter the same Coupe de France.
  coupe_france_b: 'coupe_france',
}

/** High school basketball is generic by design — no real badge to fetch. */
const PLACEHOLDER_YOUTH = new Set(['youth_hs'])

function parseTeams() {
  const source = readFileSync(TEAMS_FILE, 'utf8')
  // Matches: t('id', 'Name', 'ABBR', 'leagueId', ...)
  const re = /^\s*t\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'/gm
  return [...source.matchAll(re)].map(([, id, name, abbr, leagueId]) => ({
    kind: 'team',
    id,
    name,
    abbr,
    leagueId,
  }))
}

/**
 * Leagues and cups share a shape: an object literal opening with `id`, with an
 * `{ es, en }` name a few lines down. The English name is the one used for the
 * search, since Wikipedia is searched in English.
 *
 * Both quote styles have to be accepted. A name containing an apostrophe is
 * written with double quotes ("Turkish President's Cup"), and a single-quote
 * regex does not merely miss it — it runs on to the *next* entry's name, so one
 * cup is mislabelled and the one after it disappears entirely.
 */
function parseRecords(file, kind) {
  const source = readFileSync(file, 'utf8')
  const re =
    /\bid:\s*['"]([^'"]+)['"][\s\S]{0,240}?\bname:\s*\{[^}]*?\ben:\s*(['"])((?:(?!\2).)*)\2/g
  return [...source.matchAll(re)].map(([, id, , name]) => ({ kind, id, name, leagueId: null }))
}

/** Everything the scraper knows how to fetch, as one uniform list. */
function collectEntities() {
  return [
    ...parseTeams(),
    ...parseRecords(LEAGUES_FILE, 'league'),
    ...parseRecords(CUPS_FILE, 'cup'),
  ]
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Shared backoff. Wikimedia throttles the whole client, not one connection, so
 * when a 429 arrives every worker has to back off together — otherwise the
 * others keep hammering and the cooldown never takes effect. Without this a
 * single 429 cascaded through the rest of the run and every remaining entity
 * failed permanently, because nothing retried.
 */
let cooldownUntil = 0
async function respectCooldown() {
  const wait = cooldownUntil - Date.now()
  if (wait > 0) await sleep(wait)
}

async function getJson(url, attempt = 0) {
  await respectCooldown()
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })

  if (res.status === 429 || res.status === 503) {
    if (attempt >= 4) throw new Error(`HTTP ${res.status} after ${attempt} retries`)
    const header = Number(res.headers.get('retry-after'))
    const wait = Number.isFinite(header) && header > 0 ? header * 1000 : 2000 * 2 ** attempt
    cooldownUntil = Math.max(cooldownUntil, Date.now() + wait)
    return getJson(url, attempt + 1)
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const WIKI_API = 'https://en.wikipedia.org/w/api.php'

/** Best-matching article title for an entity. */
async function searchTitle(entity) {
  const query = SEARCH_HINTS[entity.id] ?? `${entity.name} basketball`
  const data = await getJson(
    `${WIKI_API}?action=query&format=json&formatversion=2&list=search` +
      `&srlimit=1&srnamespace=0&srsearch=${encodeURIComponent(query)}`,
  )
  return data?.query?.search?.[0]?.title ?? null
}

/** Turn a `File:` name into a download URL. */
async function fileUrl(fileName) {
  const data = await getJson(
    `${WIKI_API}?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url` +
      `&titles=${encodeURIComponent(`File:${fileName}`)}`,
  )
  return data?.query?.pages?.[0]?.imageinfo?.[0]?.url ?? null
}

/**
 * The logo named in the article's infobox.
 *
 * This is the resolver that actually works for club crests. `pageimages` — what
 * this script used to rely on — returns only *freely licensed* images, and a
 * club crest is almost always non-free, uploaded locally to Wikipedia under
 * fair use. So `pageimages` hid precisely the logos we wanted, and where it did
 * return something it was the article's lead photo: an arena, a squad shot. The
 * infobox parameter names the real crest either way.
 */
async function infoboxLogo(title) {
  const data = await getJson(
    `${WIKI_API}?action=parse&format=json&formatversion=2&prop=wikitext` +
      `&page=${encodeURIComponent(title)}`,
  )
  const wikitext = data?.parse?.wikitext ?? ''
  const match = wikitext.match(
    /\|\s*(?:logo|logo_image|image|crest|badge)\s*=\s*(?:\[\[)?\s*(?:File:|Image:)?\s*([^|\]\n<]+?\.(?:svg|png|gif|jpe?g|webp))/i,
  )
  if (!match) return null
  const url = await fileUrl(match[1].trim())
  return url ? { url, via: `infobox:${title}` } : null
}

/** Wikidata's structured "logo image" (P154), when the infobox has no usable one. */
async function wikidataLogo(title) {
  const props = await getJson(
    `${WIKI_API}?action=query&format=json&formatversion=2&prop=pageprops` +
      `&titles=${encodeURIComponent(title)}`,
  )
  const qid = props?.query?.pages?.[0]?.pageprops?.wikibase_item
  if (!qid) return null

  const claims = await getJson(
    `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=P154&entity=${qid}`,
  )
  const file = claims?.claims?.P154?.[0]?.mainsnak?.datavalue?.value
  if (!file) return null

  // P154 files live on Commons, which mirrors the same imageinfo API.
  const data = await getJson(
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2' +
      `&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(`File:${file}`)}`,
  )
  const url = data?.query?.pages?.[0]?.imageinfo?.[0]?.url
  return url ? { url, via: `wikidata:${qid}` } : null
}

/**
 * Is this file plausibly a badge rather than a photograph?
 *
 * Only applied to the `pageimages` fallback, which is the one resolver that
 * hands back whatever image happens to lead the article. A JPEG is the giveaway
 * — crests are published as SVG or PNG, photographs as JPEG — and the rest is
 * the vocabulary of the pictures that actually turned up: arenas and squads.
 */
function looksLikeBadge(url) {
  const name = decodeURIComponent(url).toLowerCase()
  if (/\.jpe?g($|\?)/.test(name)) return false
  return !/(arena|stadium|pavilion|pabell|palacio|hala|court|photo|fans|building|exterior|interior|roster|squad|celebrat)/.test(
    name,
  )
}

/** Last resort: the article's lead image, if it looks like a badge at all. */
async function pageImageLogo(title) {
  const data = await getJson(
    `${WIKI_API}?action=query&format=json&formatversion=2&prop=pageimages&piprop=original` +
      `&titles=${encodeURIComponent(title)}`,
  )
  const src = data?.query?.pages?.[0]?.original?.source
  if (!src) return null
  if (!looksLikeBadge(src)) return null
  return { url: src, via: `pageimage:${title}` }
}

/**
 * Wikipedia, in decreasing order of "is this actually the badge".
 *
 * The title lookup is shared, so a miss costs one call rather than three.
 */
async function wikipediaLogo(entity) {
  const title = await searchTitle(entity)
  if (!title) return null

  for (const resolve of [infoboxLogo, wikidataLogo, pageImageLogo]) {
    try {
      const found = await resolve(title)
      if (found) return found
    } catch {
      // Try the next source rather than losing the entity to one bad call.
    }
  }
  return null
}

function nbaCdnLogo(entity) {
  if (entity.kind !== 'team' || entity.leagueId !== 'nba') return null
  const franchise = NBA_CDN_IDS[entity.id]
  if (!franchise) return null
  return {
    url: `https://cdn.nba.com/logos/nba/${franchise}/global/L/logo.svg`,
    via: 'cdn.nba.com',
  }
}

function extensionFor(url, contentType) {
  const fromUrl = extname(new URL(url).pathname).toLowerCase()
  if (['.svg', '.png', '.webp', '.jpg', '.jpeg', '.avif'].includes(fromUrl)) {
    return fromUrl === '.jpeg' ? '.jpg' : fromUrl
  }
  if (contentType?.includes('svg')) return '.svg'
  if (contentType?.includes('webp')) return '.webp'
  if (contentType?.includes('jpeg')) return '.jpg'
  return '.png'
}

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.startsWith('text/html')) {
    throw new Error('got HTML, not an image')
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length < 200) throw new Error(`suspiciously small (${buffer.length} bytes)`)
  return { buffer, ext: extensionFor(url, contentType) }
}

function existingFileFor(id) {
  if (!existsSync(LOGO_DIR)) return null
  return (
    readdirSync(LOGO_DIR).find(
      (f) => f.slice(0, f.lastIndexOf('.')) === id && f !== '_report.json',
    ) ?? null
  )
}

async function resolveAndFetch(entity, manual) {
  const existing = existingFileFor(entity.id)
  if (existing && !FORCE) {
    return { id: entity.id, status: 'skipped', detail: `already have ${existing}` }
  }

  const candidates = []
  if (manual[entity.id]) candidates.push({ url: manual[entity.id], via: 'logo-sources.json' })
  const nba = nbaCdnLogo(entity)
  if (nba) candidates.push(nba)

  // Wikipedia is the fallback for everything, so it is resolved lazily —
  // no point spending two API calls on a club the NBA CDN already covered.
  const resolvers = [
    ...candidates.map((c) => async () => c),
    async () => wikipediaLogo(entity),
  ]

  const problems = []
  for (const resolve of resolvers) {
    let candidate
    try {
      candidate = await resolve()
    } catch (error) {
      problems.push(`resolve: ${error.message}`)
      continue
    }
    if (!candidate) continue

    if (DRY_RUN) {
      return { id: entity.id, status: 'resolved', detail: `${candidate.via} -> ${candidate.url}` }
    }

    try {
      const { buffer, ext } = await download(candidate.url)
      writeFileSync(join(LOGO_DIR, `${entity.id}${ext}`), buffer)
      return {
        id: entity.id,
        status: 'ok',
        detail: `${entity.id}${ext} (${Math.round(buffer.length / 1024)} kB) via ${candidate.via}`,
        // Provenance, so a badge that turns out to be an arena photograph can
        // be traced to the resolver that produced it instead of guessed at.
        source: { file: `${entity.id}${ext}`, via: candidate.via, url: candidate.url },
      }
    } catch (error) {
      problems.push(`${candidate.via}: ${error.message}`)
    }
  }

  return {
    id: entity.id,
    status: 'failed',
    detail: problems.join('; ') || 'no candidate URL found',
    name: entity.name,
    kind: entity.kind,
  }
}

/** Copy each alias's source file into place, once the real fetches are done. */
function applyAliases(selected) {
  const wanted = new Set(selected.map((e) => e.id))
  const copied = []
  for (const [alias, source] of Object.entries(ALIASES)) {
    if (!wanted.has(alias)) continue
    if (existingFileFor(alias) && !FORCE) continue
    const file = existingFileFor(source)
    if (!file) continue
    const ext = extname(file)
    copyFileSync(join(LOGO_DIR, file), join(LOGO_DIR, `${alias}${ext}`))
    copied.push(`${alias}${ext} (copied from ${source})`)
  }
  return copied
}

/** Simple worker pool — Wikimedia does not want a 160-way burst. */
async function pool(items, worker, size) {
  const results = []
  let cursor = 0
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index], index)
      // Be a good citizen between requests. Slower than it used to be, because
      // each entity now costs several API calls instead of two.
      await sleep(400)
    }
  })
  await Promise.all(runners)
  return results
}

async function main() {
  let entities = collectEntities()
  const counts = (list) => ({
    team: list.filter((e) => e.kind === 'team').length,
    league: list.filter((e) => e.kind === 'league').length,
    cup: list.filter((e) => e.kind === 'cup').length,
  })

  if (counts(entities).team === 0) {
    console.error('Could not parse any teams from src/data/teams.ts — has its shape changed?')
    process.exit(1)
  }
  if (counts(entities).league === 0 || counts(entities).cup === 0) {
    console.error('Could not parse leagues or cups — has the shape of those files changed?')
    process.exit(1)
  }

  // Aliases are fetched through their source, then copied.
  entities = entities.filter((e) => !ALIASES[e.id])
  entities = entities.filter((e) => !SKIP.has(e.id))
  if (!INCLUDE_YOUTH) {
    entities = entities.filter((e) => e.leagueId !== 'youth' || !PLACEHOLDER_YOUTH.has(e.id))
  }
  if (KIND) entities = entities.filter((e) => e.kind === KIND)
  if (LEAGUE) entities = entities.filter((e) => e.leagueId === LEAGUE)
  if (ONLY) entities = entities.filter((e) => ONLY.includes(e.id))

  // Pick up exactly where the last run gave up — the usual case being a batch
  // lost to rate limiting rather than to anything actually missing.
  if (RETRY_FAILED) {
    if (!existsSync(REPORT_FILE)) {
      console.error(`No ${REPORT_FILE} to retry from.`)
      process.exit(1)
    }
    const ids = new Set(JSON.parse(readFileSync(REPORT_FILE, 'utf8')).map((r) => r.id))
    entities = entities.filter((e) => ids.has(e.id))
  }

  if (entities.length === 0) {
    console.error('Nothing matched those filters.')
    process.exit(1)
  }

  const tally = counts(entities)
  const summary = `${tally.team} club(s), ${tally.league} league(s), ${tally.cup} cup(s)`

  // --list touches no network at all, so the parsers can be checked anywhere.
  if (LIST) {
    for (const e of entities) {
      const hint = SEARCH_HINTS[e.id]
      console.log(
        `${e.kind.padEnd(7)} ${e.id.padEnd(22)} ${e.name.padEnd(32).slice(0, 32)}` +
          `${hint ? ` → "${hint}"` : ''}`,
      )
    }
    console.log(`\n${entities.length} total: ${summary}.`)
    console.log(`Skipped by design: ${[...SKIP].join(', ')}.`)
    console.log(`Aliased: ${Object.entries(ALIASES).map(([a, s]) => `${a}←${s}`).join(', ')}.`)

    // A hint keyed to an id that does not exist does nothing and says nothing,
    // so it stays wrong until someone notices the badge never arrived.
    const known = new Set(collectEntities().map((e) => e.id))
    const orphans = Object.keys(SEARCH_HINTS).filter((id) => !known.has(id))
    if (orphans.length > 0) {
      console.warn(`\nSEARCH_HINTS entries matching no id (typo?): ${orphans.join(', ')}`)
    }
    return
  }

  mkdirSync(LOGO_DIR, { recursive: true })
  const manual = existsSync(SOURCES_FILE)
    ? JSON.parse(readFileSync(SOURCES_FILE, 'utf8'))
    : {}

  console.log(
    `Fetching logos for ${summary}` +
      `${DRY_RUN ? ' (dry run)' : ''} with concurrency ${CONCURRENCY}.\n`,
  )

  const results = await pool(entities, async (entity) => {
    const result = await resolveAndFetch(entity, manual)
    const mark = { ok: '✓', skipped: '·', resolved: '?', failed: '✗' }[result.status]
    console.log(
      `${mark} ${entity.kind.padEnd(7)} ${entity.name.padEnd(30).slice(0, 30)} ${result.detail}`,
    )
    return result
  }, CONCURRENCY)

  const by = (status) => results.filter((r) => r.status === status)
  const failed = by('failed')

  if (!DRY_RUN) {
    for (const line of applyAliases(collectEntities())) console.log(`✓ alias   ${line}`)
  }

  console.log(
    `\nDone. ${by('ok').length} downloaded, ${by('skipped').length} already present, ` +
      `${by('resolved').length} resolved, ${failed.length} failed.`,
  )

  // Provenance for everything downloaded this run, merged over previous runs.
  if (!DRY_RUN) {
    const manifest = existsSync(SOURCES_MANIFEST)
      ? JSON.parse(readFileSync(SOURCES_MANIFEST, 'utf8'))
      : {}
    for (const r of by('ok')) if (r.source) manifest[r.id] = r.source
    writeFileSync(SOURCES_MANIFEST, JSON.stringify(manifest, null, 2))

    // The lead-image resolver is the one that can hand back a photograph, so
    // say which badges came from it rather than leaving them to be spotted by
    // eye across 180 files.
    const weak = by('ok').filter((r) => r.source?.via?.startsWith('pageimage:'))
    if (weak.length > 0) {
      console.log(
        `\n${weak.length} came from the article's lead image rather than a named logo,` +
          '\nso they are the ones worth a look:',
      )
      for (const w of weak) console.log(`  ${w.id.padEnd(14)} ${w.source.url}`)
    }
  }

  if (failed.length > 0) {
    writeFileSync(REPORT_FILE, JSON.stringify(failed, null, 2))
    console.log(`\nCouldn't resolve ${failed.length}:`)
    for (const f of failed) console.log(`  ${f.id.padEnd(12)} ${f.name}`)
    console.log(
      `\nWritten to ${REPORT_FILE}. Retry just these with --retry-failed, or fix one\n` +
        `by adding a direct URL to scripts/logo-sources.json, e.g.\n` +
        `  { "${failed[0].id}": "https://…/logo.svg" }\n` +
        'then re-run. Anything still missing falls back gracefully.',
    )
  }

  if (!DRY_RUN) console.log('\nNext: npm run logos')
}

main().catch((error) => {
  console.error('\nFetch failed:', error.message)
  process.exit(1)
})
