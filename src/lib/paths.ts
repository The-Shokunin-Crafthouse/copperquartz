/*
 * Resolves a public-asset path against NEXT_PUBLIC_BASE_PATH so the same
 * <img src> works at the production root and at PR-preview subpaths.
 *
 * Production deploy: NEXT_PUBLIC_BASE_PATH unset → withBase('/x') === '/x'
 * Preview deploy:    NEXT_PUBLIC_BASE_PATH=/_previews/123 → '/_previews/123/x'
 *
 * Use ONLY for non-routed paths: hand-written <img src>, <a href> to static
 * /public assets (PDFs, images), font url() in CSS-in-JS. Routed links via
 * next/link or useRouter must pass the un-prefixed path — Next prepends
 * basePath itself, and double-wrapping yields /_previews/123/_previews/123/x.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function withBase(path: string): string {
  if (!path.startsWith('/')) return `${BASE_PATH}/${path}`;
  return `${BASE_PATH}${path}`;
}
