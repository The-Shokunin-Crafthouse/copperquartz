#!/usr/bin/env node
/*
 * Preview snapshot harness.
 *
 *   npm run preview <section>
 *
 * Spins up `next dev`, drives Playwright/Chromium across four breakpoints
 * (360, 768, 1024, 1440), and writes PNGs to previews/<section>/<width>.png.
 * Verifies each snapshot is non-blank by file-size threshold and aborts
 * if any breakpoint fails.
 *
 * Add a section by extending SECTIONS with { route, fullPage?, waitFor? }.
 */
import { spawn } from 'node:child_process';
import { mkdir, stat, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const SECTIONS = {
  'homepage-shell': {
    route: '/',
    fullPage: true,
    description: 'Global chrome + Home',
  },
  savethedate: {
    route: '/savethedate',
    fullPage: true,
    description: 'Save the Date one-pager',
  },
  travel: {
    route: '/travel',
    fullPage: true,
    description: 'Travel — flights, hotel, things to do',
  },
  'our-story': {
    route: '/our-story',
    fullPage: true,
    /* 170-photo gallery makes the document tens of thousands of px tall.
       At PNG + 2x DPR a fullPage capture lands north of 100 MB and won't
       fit in a GitHub PR comment. JPEG q80 + 1x DPR brings it back into
       the same ballpark as the other sections (~5–15 MB). */
    format: 'jpeg',
    quality: 80,
    deviceScaleFactor: 1,
    description: 'Our Story — story, video, song, photo gallery',
  },
  venue: {
    route: '/venue',
    fullPage: true,
    description: 'Venue — Sunken Garden ceremony + Cabrillo Pavilion reception',
    /* sunken-garden.mp4 is large; networkidle never fires while it streams.
       Abort .mp4 so the page settles — the VideoFrame box has a sand-linen
       background and reserves its 2.76:1 aspect via CSS, so the snapshot
       verifies layout even with media aborted. */
    abortMedia: true,
  },
};

const BREAKPOINTS = [360, 768, 1024, 1440];
const HEIGHT_DEFAULT = 1080;
const HEIGHTS = { 360: 800, 768: 1024, 1024: 768, 1440: 900 };
const MIN_BYTES = 8000;          /* fails the run if any PNG is below this */
const PORT = 4317;
const HOST = '127.0.0.1';
const READY_TIMEOUT_MS = 60_000;

const section = process.argv[2];
if (!section) {
  console.error('usage: npm run preview <section>');
  console.error(`sections: ${Object.keys(SECTIONS).join(', ')}`);
  process.exit(1);
}
const config = SECTIONS[section];
if (!config) {
  console.error(`unknown section "${section}"`);
  console.error(`sections: ${Object.keys(SECTIONS).join(', ')}`);
  process.exit(1);
}

const outDir = join(process.cwd(), 'previews', section);
if (existsSync(outDir)) await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

console.log(`[preview] section=${section} route=${config.route}`);
console.log(`[preview] starting next dev on ${HOST}:${PORT}…`);

const dev = spawn(
  'npx',
  ['next', 'dev', '--port', String(PORT), '--hostname', HOST],
  {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NEXT_PUBLIC_BASE_PATH: '' },
    detached: true,                    /* own process group so we can kill the subtree */
  },
);

let exitCode = 0;
const cleanup = async () => {
  if (!dev.pid || dev.killed) return;
  try {
    process.kill(-dev.pid, 'SIGTERM');
  } catch (err) {
    if (err.code !== 'ESRCH') throw err;
  }
};
process.on('SIGINT', () => cleanup().then(() => process.exit(130)));
process.on('SIGTERM', () => cleanup().then(() => process.exit(143)));

try {
  await waitForReady(dev, READY_TIMEOUT_MS);

  const browser = await chromium.launch();
  try {
    const url = `http://${HOST}:${PORT}${config.route}`;
    console.log(`[preview] target=${url}`);

    const format = config.format ?? 'png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const dpr = config.deviceScaleFactor ?? 2;

    for (const width of BREAKPOINTS) {
      const height = HEIGHTS[width] ?? HEIGHT_DEFAULT;
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: dpr,
        reducedMotion: 'reduce',     /* freezes entrance animations for stable snapshots */
      });
      const page = await context.newPage();
      const file = join(outDir, `${width}.${ext}`);

      if (config.abortMedia) {
        await page.route('**/*.{mp4,webm,mov}', (route) => route.abort());
      }

      const consoleErrors = [];
      page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
      });

      await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForLoadState('domcontentloaded');
      await page.evaluate(() => document.fonts?.ready);
      /* Strip the Next.js dev indicator overlay so it doesn't bleed into snapshots. */
      await page.addStyleTag({
        content: `
          nextjs-portal,
          [data-next-mark],
          [data-nextjs-toast],
          [data-nextjs-dev-tools-button] { display: none !important; }
        `,
      });
      /* Materialize every lazy image: scroll the entire page once so the
         IntersectionObserver fires for every off-screen <img>, then wait
         until they're all decoded, then scroll back to the top so the
         fullPage capture starts at y=0. Setting loading=eager alone
         doesn't re-trigger a fetch on already-rendered lazy images. */
      await page.evaluate(async () => {
        const docHeight = () =>
          Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
          );
        const step = window.innerHeight * 0.85;
        let y = 0;
        const max = docHeight();
        while (y < max) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 80));
          y += step;
        }
        window.scrollTo(0, max);
        await new Promise((r) => setTimeout(r, 200));
        const imgs = Array.from(document.images);
        await Promise.all(
          imgs.map((img) =>
            img.complete && img.naturalWidth > 0
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.addEventListener('load', resolve, { once: true });
                  img.addEventListener('error', resolve, { once: true });
                }),
          ),
        );
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 200));
      });
      await page.waitForLoadState('networkidle', { timeout: 60_000 });
      await page.screenshot({
        path: file,
        fullPage: !!config.fullPage,
        type: format,
        ...(format === 'jpeg' ? { quality: config.quality ?? 80 } : {}),
      });

      const size = (await stat(file)).size;
      if (size < MIN_BYTES) {
        throw new Error(`snapshot too small (${size}B < ${MIN_BYTES}B): ${file}`);
      }
      if (consoleErrors.length) {
        console.warn(`[preview] ${width}px — runtime warnings:`);
        for (const e of consoleErrors) console.warn(`           ${e}`);
      }
      console.log(`[preview] ${width}px → ${file} (${(size / 1024).toFixed(1)} KB)`);

      await context.close();
    }
  } finally {
    await browser.close();
  }
} catch (err) {
  console.error(`[preview] ${err.message}`);
  exitCode = 1;
} finally {
  await cleanup();
}

process.exit(exitCode);

/* ---------- helpers ---------- */
function waitForReady(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('next dev did not become ready in time')), timeoutMs);
    const onData = (buf) => {
      const out = buf.toString();
      process.stdout.write(`  [next] ${out}`);
      if (out.includes('Ready in') || out.includes('ready in') || out.match(/local:\s+http/i)) {
        clearTimeout(timer);
        child.stdout.off('data', onData);
        child.stderr.off('data', onErr);
        setTimeout(resolve, 800);   /* small grace so the route compiles on first request */
      }
    };
    const onErr = (buf) => process.stderr.write(`  [next!] ${buf.toString()}`);
    child.stdout.on('data', onData);
    child.stderr.on('data', onErr);
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`next dev exited early with code ${code}`));
    });
  });
}
