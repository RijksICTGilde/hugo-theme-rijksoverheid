#!/usr/bin/env node

/**
 * Controleert of de gevendorde Fuse.js in assets/lib/fuse/ gelijk is aan wat
 * vendor.js uit het geïnstalleerde fuse.js haalt. Schrijft naar een
 * tijdelijke map en vergelijkt byte voor byte; exit 1 bij een verschil of een
 * ontbrekend bestand.
 *
 * Gebruik: npm ci --prefix tools/fuse && node tools/fuse/check.js
 */

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { generate, ROOT } from "./vendor.js";

const tmp = mkdtempSync(join(tmpdir(), "fuse-check-"));
let verschillen = 0;

const gegenereerd = generate();
for (const [pad, inhoud] of Object.entries(gegenereerd)) {
  const uit = join(tmp, pad);
  mkdirSync(dirname(uit), { recursive: true });
  writeFileSync(uit, inhoud);
}
for (const pad of Object.keys(gegenereerd)) {
  let inRepo = null;
  try {
    inRepo = readFileSync(join(ROOT, pad));
  } catch {}
  if (inRepo === null || !inRepo.equals(readFileSync(join(tmp, pad)))) {
    verschillen++;
    console.error(`${pad}: ${inRepo === null ? "ontbreekt" : "verschilt van het npm-pakket"}`);
  }
}

if (verschillen) {
  console.error(`${verschillen} bestand(en) verouderd. Draai \`node tools/fuse/vendor.js\` en commit het resultaat.`);
  process.exit(1);
}
console.log("Fuse.js is bijgewerkt.");
