#!/usr/bin/env node

/**
 * Controleert of de gegenereerde NLDD-bestanden in de repo gelijk zijn aan wat
 * de generatoren uit het geïnstalleerde @nldd/design-system maken. Genereert
 * naar een tijdelijke map en vergelijkt byte voor byte; exit 1 bij een
 * verschil of een ontbrekend bestand.
 *
 * Gebruik: npm ci --prefix tools/nldd && node tools/nldd/check.js
 */

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { generate as tokens } from "./tokens.js";
import { generate as iconen } from "./iconen.js";

const ROOT = resolve(import.meta.dirname, "..", "..");
const tmp = mkdtempSync(join(tmpdir(), "nldd-check-"));
let verschillen = 0;

const gegenereerd = { ...tokens(), ...(await iconen()) };
for (const [pad, inhoud] of Object.entries(gegenereerd)) {
  const uit = join(tmp, pad);
  mkdirSync(dirname(uit), { recursive: true });
  writeFileSync(uit, inhoud);
}
for (const pad of Object.keys(gegenereerd)) {
  let inRepo = null;
  try {
    inRepo = readFileSync(join(ROOT, pad), "utf-8");
  } catch {}
  const verwacht = readFileSync(join(tmp, pad), "utf-8");
  if (inRepo !== verwacht) {
    verschillen++;
    console.error(`${pad}: ${inRepo === null ? "ontbreekt" : "verschilt van de generator"}`);
  }
}

if (verschillen) {
  console.error(`${verschillen} bestand(en) verouderd. Draai \`node tools/nldd/tokens.js && node tools/nldd/iconen.js\` en commit het resultaat.`);
  process.exit(1);
}
console.log("NLDD-bestanden zijn bijgewerkt.");
