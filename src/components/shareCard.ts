/**
 * The end-of-career share card.
 *
 * Drawn by hand onto a canvas rather than rasterising DOM: no dependency, no
 * external font fetch (which the CSP would block anyway), and full control over
 * the layout at a fixed export size.
 */

import type { CareerTotals, Legacy, Locale, Player, Rival, Team } from '@/game/types'
import { flagFor } from '@/data/countries'
import { logoPathFor } from '@/data/logos'
import { withBasePath } from '@/lib/basePath'
import { formatMoney } from './display'
import { drawCrest } from './TeamCrest'

const WIDTH = 1080
const HEIGHT = 1350

export interface ShareData {
  player: Player
  totals: CareerTotals
  legacy: Legacy
  rival: Rival
  seed: string
  locale: Locale
  /** The club they retired at, drawn as a crest. Null for a career that never began. */
  lastTeam: Team | null
}

const COPY = {
  es: {
    tagline: 'De las inferiores al Salón de la Fama',
    career: 'CARRERA',
    seasons: 'TEMP.',
    titles: 'TÍTULOS',
    cups: 'COPAS',
    mvps: 'MVP',
    allStar: 'ALL-STAR',
    earnings: 'GANANCIAS',
    legacyScore: 'PUNTAJE DE LEGADO',
    hof: 'SALÓN DE LA FAMA',
    vs: 'vs',
    beat: 'Le ganaste la pulseada',
    lost: 'Terminó por delante tuyo',
    seed: 'Semilla',
  },
  en: {
    tagline: 'From the academy to the Hall of Fame',
    career: 'CAREER',
    seasons: 'SEASONS',
    titles: 'TITLES',
    cups: 'CUPS',
    mvps: 'MVP',
    allStar: 'ALL-STAR',
    earnings: 'EARNINGS',
    legacyScore: 'LEGACY SCORE',
    hof: 'HALL OF FAME',
    vs: 'vs',
    beat: 'You came out on top',
    lost: 'They finished ahead of you',
    seed: 'Seed',
  },
} as const

/**
 * Async because of one pixel of the card: the club badge.
 *
 * A real logo is a file that has to decode before `drawImage` will put anything
 * on the canvas, and drawing it synchronously leaves a hole where the crest was.
 * Everything else here is still drawn in one pass; only the badge waits.
 */
export async function drawShareCard(
  canvas: HTMLCanvasElement,
  data: ShareData,
): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Resolved before any drawing so a slow decode cannot land on top of text.
  const logo = data.lastTeam ? logoPathFor(data.lastTeam.id) : null
  const badge = logo ? await loadImage(withBasePath(logo)) : null

  canvas.width = WIDTH
  canvas.height = HEIGHT
  const c = COPY[data.locale]
  const { player, totals, legacy } = data

  // Background
  ctx.fillStyle = '#0a0a0f'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const glow = ctx.createRadialGradient(WIDTH / 2, 0, 0, WIDTH / 2, 0, WIDTH)
  glow.addColorStop(0, 'rgba(249, 115, 22, 0.28)')
  glow.addColorStop(1, 'rgba(249, 115, 22, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const sans = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  const center = WIDTH / 2

  // Header
  ctx.textAlign = 'center'
  ctx.fillStyle = '#f97316'
  ctx.font = `900 40px ${sans}`
  ctx.fillText('🏀 LA NARANJA', center, 92)
  ctx.fillStyle = '#64748b'
  ctx.font = `500 26px ${sans}`
  ctx.fillText(c.tagline, center, 134)

  // Final club badge, with the jersey number beside it. The generated crest is
  // the fallback for a club with no logo file, and for one whose file fails to
  // decode, because a share card with a hole in it would be worse than a plain
  // crest.
  if (badge) {
    drawContained(ctx, badge, center - 96, 276, 152)
  } else if (data.lastTeam) {
    drawCrest(ctx, data.lastTeam, center - 96, 276, 152)
  }
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, center + 12, 206, 152, 140, 26)
  ctx.fill()
  ctx.fillStyle = '#f97316'
  ctx.font = `900 96px ${sans}`
  ctx.textBaseline = 'middle'
  ctx.fillText(String(player.number), center + 88, 278)
  ctx.textBaseline = 'alphabetic'

  // Name and identity
  ctx.fillStyle = '#f8fafc'
  ctx.font = `900 ${player.name.length > 16 ? 54 : 68}px ${sans}`
  ctx.fillText(player.name || '—', center, 442)

  ctx.fillStyle = '#94a3b8'
  ctx.font = `600 30px ${sans}`
  ctx.fillText(
    `${flagFor(player.countryCode)}  ${player.position}  ·  ${player.heightCm} cm`,
    center,
    488,
  )

  // Legacy tier banner
  ctx.fillStyle = 'rgba(249, 115, 22, 0.14)'
  roundRect(ctx, 90, 528, WIDTH - 180, 96, 22)
  ctx.fill()
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)'
  ctx.lineWidth = 2
  roundRect(ctx, 90, 528, WIDTH - 180, 96, 22)
  ctx.stroke()

  ctx.fillStyle = '#ff9a4d'
  ctx.font = `900 ${legacy.title[data.locale].length > 24 ? 38 : 46}px ${sans}`
  ctx.fillText(legacy.title[data.locale].toUpperCase(), center, 592)

  // Career line
  ctx.fillStyle = '#64748b'
  ctx.font = `700 24px ${sans}`
  ctx.fillText(c.career, center, 682)

  ctx.fillStyle = '#f8fafc'
  ctx.font = `900 82px ${sans}`
  ctx.fillText(
    `${totals.ppg.toFixed(1)} / ${totals.rpg.toFixed(1)} / ${totals.apg.toFixed(1)}`,
    center,
    762,
  )
  ctx.fillStyle = '#64748b'
  ctx.font = `600 24px ${sans}`
  ctx.fillText('PTS · REB · AST', center, 800)

  // Stat row
  const stats: [string, string][] = [
    [c.seasons, String(totals.seasons)],
    [c.titles, String(totals.rings)],
    [c.cups, String(totals.cups)],
    [c.mvps, String(totals.mvps)],
    [c.allStar, String(totals.allStars)],
  ]
  const gap = 14
  const boxWidth = (WIDTH - 180 - (stats.length - 1) * gap) / stats.length
  stats.forEach(([label, value], i) => {
    const x = 90 + i * (boxWidth + gap)
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    roundRect(ctx, x, 846, boxWidth, 128, 20)
    ctx.fill()

    ctx.fillStyle = '#f8fafc'
    ctx.font = `900 54px ${sans}`
    ctx.fillText(value, x + boxWidth / 2, 916)
    ctx.fillStyle = '#64748b'
    ctx.font = `700 19px ${sans}`
    ctx.fillText(label, x + boxWidth / 2, 950)
  })

  // Rival verdict
  ctx.fillStyle = legacy.beatRival ? 'rgba(52, 211, 153, 0.12)' : 'rgba(244, 63, 94, 0.12)'
  roundRect(ctx, 90, 1000, WIDTH - 180, 92, 20)
  ctx.fill()
  ctx.fillStyle = legacy.beatRival ? '#6ee7b7' : '#fda4af'
  ctx.font = `700 28px ${sans}`
  ctx.fillText(
    `${legacy.beatRival ? c.beat : c.lost}: ${data.rival.name}`,
    center,
    1038,
  )
  ctx.fillStyle = '#94a3b8'
  ctx.font = `600 22px ${sans}`
  ctx.fillText(
    `${totals.rings}-${data.rival.totals.rings} ${c.titles.toLowerCase()}  ·  ${totals.mvps}-${data.rival.totals.mvps} MVP`,
    center,
    1072,
  )

  // Legacy score
  ctx.fillStyle = '#64748b'
  ctx.font = `700 22px ${sans}`
  ctx.fillText(c.legacyScore, center, 1146)
  ctx.fillStyle = '#f97316'
  ctx.font = `900 92px ${sans}`
  ctx.fillText(String(legacy.score), center, 1232)

  if (legacy.hallOfFame) {
    ctx.fillStyle = '#ff9a4d'
    ctx.font = `800 26px ${sans}`
    ctx.fillText(`🏛 ${c.hof}`, center, 1274)
  } else {
    ctx.fillStyle = '#475569'
    ctx.font = `600 24px ${sans}`
    ctx.fillText(formatMoney(totals.earnings, data.locale), center, 1274)
  }

  ctx.fillStyle = '#334155'
  ctx.font = `600 20px ${sans}`
  ctx.fillText(`${c.seed}: ${data.seed}`, center, 1318)
}

/** Resolves to null rather than rejecting, because a missing badge must not kill the card. */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

/**
 * Draw an image centred on (cx, cy), scaled to fit a `size` square without
 * distorting it. Badges are every shape from a circle to a wide wordmark, so
 * stretching them to a square would be immediately obvious.
 */
function drawContained(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cx: number,
  cy: number,
  size: number,
): void {
  const width = image.naturalWidth || size
  const height = image.naturalHeight || size
  const scale = Math.min(size / width, size / height)
  const drawWidth = width * scale
  const drawHeight = height * scale
  ctx.drawImage(image, cx - drawWidth / 2, cy - drawHeight / 2, drawWidth, drawHeight)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

/** Plain-text version, sized for pasting straight into a post. */
export function buildShareText(data: ShareData): string {
  const { player, totals, legacy, rival, seed, locale } = data
  const flag = flagFor(player.countryCode)

  if (locale === 'es') {
    return [
      `🏀 LA NARANJA — ${player.name || 'Anónimo'} ${flag} #${player.number} (${player.position})`,
      `${legacy.title.es.toUpperCase()} · ${legacy.score} pts de legado`,
      `${totals.ppg} PTS / ${totals.rpg} REB / ${totals.apg} AST en ${totals.seasons} temporadas`,
      `🏆 ${totals.rings} títulos · 🥇 ${totals.cups} copas · 👑 ${totals.mvps} MVP · ⭐ ${totals.allStars} All-Star`,
      legacy.beatRival
        ? `Le gané la pulseada a ${rival.name}.`
        : `${rival.name} terminó por delante mío.`,
      `Semilla: ${seed}`,
    ].join('\n')
  }

  return [
    `🏀 LA NARANJA — ${player.name || 'Anonymous'} ${flag} #${player.number} (${player.position})`,
    `${legacy.title.en.toUpperCase()} · ${legacy.score} legacy points`,
    `${totals.ppg} PTS / ${totals.rpg} REB / ${totals.apg} AST across ${totals.seasons} seasons`,
    `🏆 ${totals.rings} titles · 🥇 ${totals.cups} cups · 👑 ${totals.mvps} MVP · ⭐ ${totals.allStars} All-Star`,
    legacy.beatRival
      ? `I finished ahead of ${rival.name}.`
      : `${rival.name} finished ahead of me.`,
    `Seed: ${seed}`,
  ].join('\n')
}
