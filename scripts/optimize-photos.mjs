#!/usr/bin/env node
/*
 * One-shot optimizer for the wedding-photo gallery.
 *
 *   node scripts/optimize-photos.mjs
 *
 * Reads from public/images/wedding photos/ (the raw camera-roll dump,
 * gitignored) and writes to public/images/wedding-photos/ (kebab-case,
 * tracked). Each photo:
 *   - resized to max 1600px on the long edge (never upscales)
 *   - re-encoded as JPEG q80 (PNG/HEIC outliers normalized to JPEG too)
 *   - filename lowercased, extension forced to .jpg
 *   - rotation applied from EXIF
 * Idempotent — skips outputs that already exist with mtime newer than source.
 */
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

/* Source defaults to the project's public/images/wedding photos/ folder.
   Override with $PHOTOS_SRC for cases where the raw camera-roll dump
   lives outside the working tree (e.g. running from a git worktree). */
const SOURCE = process.env.PHOTOS_SRC || 'public/images/wedding photos';
const OUTPUT = 'public/images/wedding-photos';
const MAX_EDGE = 1600;
const QUALITY = 80;
const ALLOWED = new Set(['.jpg', '.jpeg', '.png']);

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`source not found: ${SOURCE}`);
    process.exit(1);
  }
  await mkdir(OUTPUT, { recursive: true });

  const entries = await readdir(SOURCE);
  const sources = entries
    .filter((name) => !name.startsWith('.'))
    .filter((name) => ALLOWED.has(parse(name).ext.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  console.log(`[optimize] ${sources.length} source files`);
  let processed = 0;
  let skipped = 0;
  let totalIn = 0;
  let totalOut = 0;

  /* Manifest of {file, width, height} entries — feeds the gallery's
     aspect-ratio reservations so images don't cause CLS while loading. */
  const manifest = [];

  for (const name of sources) {
    const srcPath = join(SOURCE, name);
    const baseName = parse(name).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const outName = `${baseName}.jpg`;
    const outPath = join(OUTPUT, outName);

    const srcStat = await stat(srcPath);
    totalIn += srcStat.size;

    let needsEncode = true;
    if (existsSync(outPath)) {
      const outStat = await stat(outPath);
      if (outStat.mtimeMs >= srcStat.mtimeMs) {
        totalOut += outStat.size;
        skipped += 1;
        needsEncode = false;
      }
    }

    if (needsEncode) {
      await sharp(srcPath)
        .rotate()                                  /* honor EXIF orientation */
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toFile(outPath);
      const outStat = await stat(outPath);
      totalOut += outStat.size;
      processed += 1;
      if (processed % 20 === 0) console.log(`[optimize] ${processed}/${sources.length}…`);
    }

    const meta = await sharp(outPath).metadata();
    manifest.push({ file: outName, width: meta.width, height: meta.height });
  }

  /* Two source filenames can slug to the same output (eg IMG_7902.JPG +
     IMG_7902.JPEG → img-7902.jpg). Dedupe by output filename before
     writing the manifest so the gallery never renders the same photo
     twice. */
  const seen = new Set();
  const uniqueManifest = manifest.filter((entry) => {
    if (seen.has(entry.file)) return false;
    seen.add(entry.file);
    return true;
  });
  uniqueManifest.sort((a, b) => a.file.localeCompare(b.file, 'en', { numeric: true }));
  await writeFile(join(OUTPUT, 'manifest.json'), JSON.stringify(uniqueManifest, null, 2));

  const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
  console.log(`[optimize] done: ${processed} new, ${skipped} skipped`);
  console.log(`[optimize] in=${mb(totalIn)} → out=${mb(totalOut)} (${((1 - totalOut / totalIn) * 100).toFixed(0)}% smaller)`);
  console.log(`[optimize] manifest: ${uniqueManifest.length} unique entries → ${join(OUTPUT, 'manifest.json')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
