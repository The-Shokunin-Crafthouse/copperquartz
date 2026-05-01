/*
 * Resolves a public-asset path against NEXT_PUBLIC_BASE_PATH so the same
 * <img src> works at the production root and at PR-preview subpaths.
 *
 * Production deploy: NEXT_PUBLIC_BASE_PATH unset → withBase('/x') === '/x'
 * Preview deploy:    NEXT_PUBLIC_BASE_PATH=/_previews/123 → '/_previews/123/x'
 *
 * Next rewrites framework-managed URLs via assetPrefix; hand-written
 * <img src="/foo"> is not rewritten, which is why this helper exists.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function withBase(path: string): string {
  if (!path.startsWith('/')) return `${BASE_PATH}/${path}`;
  return `${BASE_PATH}${path}`;
}
