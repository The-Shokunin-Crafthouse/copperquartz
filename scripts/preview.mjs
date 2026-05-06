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

    for (const width of BREAKPOINTS) {
      const height = HEIGHTS[width] ?? HEIGHT_DEFAULT;
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 2,
        reducedMotion: 'reduce',     /* freezes entrance animations for stable snapshots */
      });
      const page = await context.newPage();
      const file = join(outDir, `${width}.png`);

      const consoleErrors = [];
      page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
      });

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
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
      await page.screenshot({ path: file, fullPage: !!config.fullPage });

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
