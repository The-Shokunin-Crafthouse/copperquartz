# Token Map — Copper & Quartz

Source of truth for color, type, spacing, motion, radius, and breakpoints. Figma mirrors this file. Code generates from the token export of this file. Raw values in components or mocks are bugs.

This is the v1 token set. Naming is **nominal** (named by hue / size) — not semantic. A v2 may layer semantic aliases (`--color-fg-body`, `--color-bg-surface`, etc.) on top of these. See `decisions/decisions.md` (2026-04-25 entries) for context.

## Color

Nominal palette. No raw hex anywhere except here and `src/styles/tokens.css`.

| Token | Hex | Use |
| --- | --- | --- |
| `--color-bg` | `#FBF3E9` | Page background |
| `--color-sand-linen` | `#F3E6D3` | Soft surface, panel washes |
| `--color-teal` | `#2F7F7B` | Accent — link hover, key moments |
| `--color-terracotta` | `#C86A4A` | Accent — secondary highlight |
| `--color-coral-rose` | `#B5432F` | Inline link text, emphasis (4.95 : 1 on `--color-bg`, AA pass) |
| `--color-palm-leaf` | `#4F7A4A` | Accent — botanical motif |
| `--color-palm-leaf-deep` | `#468C3E` | Hover/active state for palm-leaf-filled controls (RSVP pill) |
| `--color-gold` | `#C2A98B` | Hairline borders, focus ring |
| `--color-gold-dark` | `#877660` | Footer dividers, pressed state |
| `--color-brown` | `#5D4931` | Body copy, primary border, footer fill |
| `--color-ink-deep` | `#0E2122` | Registry tile reveal-overlay panel; deep teal-ink, near-black on cream — used only as a content-on-image surface where contrast must dominate |
| `--color-teal-deep` | `#092729` | Modal backdrop wash (mixed at 70% with transparent); slightly cooler / deeper than `--color-ink-deep`, reserved for full-screen veils where the page blurs through it |

## Typography

The v1 scale ships with **mixed ratios** by deliberate decision (see `decisions/decisions.md` 2026-04-25). Body/UI sizes step at ~1.125–1.2; display sizes step at ~1.79–2.0 to match the editorial register of the Figma layouts.

- **Base size:** 16px

### Families

| Token | Family | Source |
| --- | --- | --- |
| `--font-display` | `Ngetic Modern, serif` | Self-hosted (see `public/fonts/README.md`) |
| `--font-accent` | `Hesland Regular, cursive` | Self-hosted (see `public/fonts/README.md`) |
| `--font-serif` | `Cormorant Garamond, serif` | Google Fonts |
| `--font-sans` | `Commissioner, sans-serif` | Google Fonts |

### Scale

| Token | Size | Use |
| --- | --- | --- |
| `--text-xs` | 12px | Labels, metadata, uppercase eyebrow |
| `--text-sm` | 14px | Small body |
| `--text-base` | 16px | Body, nav items, button label |
| `--text-lg` | 18px | Large body, FAQ questions |
| `--text-xl` | 24px | Quotes, Cormorant accents, FAQ icon |
| `--text-2xl` | 32px | Dates, footer values |
| `--text-3xl` | 40px | Section headings |
| `--text-4xl` | 56px | Name lockup — web (display family) |
| `--text-5xl` | 112px | Name lockup — hero (display family) |
| `--text-display` | 200px | Large display, SVG fallback preferred |

### Loading

- `font-display: swap` on all faces
- Self-hosted faces wired by filename in `public/fonts/`; SVG fallbacks in `public/images/svg/` until WOFF2/WOFF land

## Spacing

8pt scale. No 4pt increments in v1 — wedding-site density does not require them.

| Token | px |
| --- | --- |
| `--space-half` | 4 |
| `--space-1` | 8 |
| `--space-2` | 16 |
| `--space-3` | 24 |
| `--space-4` | 32 |
| `--space-5` | 40 |
| `--space-6` | 48 |
| `--space-8` | 64 |
| `--space-10` | 80 |
| `--space-12` | 96 |
| `--space-16` | 128 |

## Radius

| Token | px | Use |
| --- | --- | --- |
| `--radius-sm` | 4 | Inputs, focus rounding on small targets |
| `--radius-md` | 8 | Buttons, cards |
| `--radius-lg` | 16 | Sheets, modals |
| `--radius-full` | 9999 | Pills, avatars |

## Layout

| Token | px | Use |
| --- | --- | --- |
| `--content-max-width` | 650 | Centered reading column |
| `--page-max-width` | 1512 | Outer page max width (Figma canvas) |

## Breakpoints

Figma designs are built at **1512px**. The 2xl token equals the canvas.

| Token | px |
| --- | --- |
| `--bp-sm` | 640 |
| `--bp-md` | 768 |
| `--bp-lg` | 1024 |
| `--bp-xl` | 1280 |
| `--bp-2xl` | 1512 |

### Responsive grid

| Breakpoint | Page margin | Columns | Column gap |
| --- | --- | --- | --- |
| Default (mobile) | 16px (`--space-2`) | 4 | 16px (`--space-2`) |
| md (768px+) | 24px (`--space-3`) | 8 | 24px (`--space-3`) |
| lg (1024px+) | 32px (`--space-4`) | 12 | 24px (`--space-3`) |
| 2xl (1512px+) | auto (centered) | 12 | 24px (`--space-3`) |

Helpers: `.grid-page`, `.col-full`, `.col-content` (span 8, offset 2 at lg+), `.col-half` (span 6 at lg+, span 4 at md, full at sm).

## Motion

| Token | Definition | Use |
| --- | --- | --- |
| `--motion-fast` | `220ms` | Hover / state change on buttons, links, icons |
| `--motion-std` | `800ms` | Entrance fade-drop (body copy, nav links) |
| `--motion-orchestrated` | `1800ms` | Orchestrated zoom-in (hero lockups) |
| `--ease-out-soft` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default easing for entrances and reveals |
| `--ease-out-quint` | `cubic-bezier(0.4, 0, 1, 1)` | Exit-side easing for view transitions |

`prefers-reduced-motion: reduce` collapses transitions to none and blocks autoplay (videos default to paused, replaced by poster).

## Media

| Token | Definition | Use |
| --- | --- | --- |
| `--video-aspect` | `2.76 / 1` | Cinematic crop applied to all in-page video frames |

Frames mask the source video uniformly — source aspect is irrelevant; the box owns the ratio.

## Structural primitives

These are not in the spec but exist to keep components fully token-driven.

| Token | px | Use |
| --- | --- | --- |
| `--border-hairline` | 1 | Dividers, button border, focus outline width on dense controls |
| `--border-focus` | 2 | Focus ring width and offset |
| `--height-tap` | 44 | Minimum tap-target height (WCAG AA) |

## Export

- `src/styles/tokens.css` — runtime CSS custom properties (consumed by globals.css and component CSS Modules)
- `src/lib/tokens.ts` — JS-readable mirror with named exports: `colors`, `fontSizes`, `spacing`, `breakpoints`

Both are downstream of this file. This file is the source.
