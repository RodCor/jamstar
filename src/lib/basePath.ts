/**
 * Prefixing for asset URLs Next does not rewrite itself.
 *
 * `basePath` in `next.config.ts` covers `_next/*`, metadata files and anything
 * routed through `next/link` or `next/image`, but a plain `<img src="/x.svg">`
 * is left exactly as written. On a GitHub project page (served from
 * `/jamstar/`) that resolves to the domain root and 404s.
 *
 * The value is inlined at build time, so this works in client components with
 * no runtime lookup.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Prefix a root-relative public asset path with the configured base path. */
export function withBasePath(path: string): string {
  if (!BASE_PATH) return path
  // Leave absolute URLs and data URIs alone.
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('data:')) return path
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`
}
