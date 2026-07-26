import type { NextConfig } from 'next'

/**
 * The static export is opt-in rather than permanent.
 *
 * `output: 'export'` disables `next start`, SSR and API routes for good, and the
 * daily mode is an obvious candidate for a real leaderboard later — which would
 * need a backend. Gating on env vars means the same tree builds both ways:
 * plain `npm run build` stays a normal Next app (so Vercel remains one command),
 * while `npm run export` produces the static bundle GitHub Pages serves.
 *
 *   STATIC_EXPORT=true            emit a fully static site into out/
 *   NEXT_PUBLIC_BASE_PATH=/repo   serve from a subpath (GitHub project pages)
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.STATIC_EXPORT === 'true' ? { output: 'export' as const } : {}),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  // No next/image in the app, but a static export refuses to build without this
  // if one ever gets added.
  images: { unoptimized: true },
}

export default nextConfig
