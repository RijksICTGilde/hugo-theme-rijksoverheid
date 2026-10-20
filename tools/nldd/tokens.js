#!/usr/bin/env node

/**
 * Genereert assets/css/nldd-primitives.css uit het NLDD Designsysteem.
 *
 * Neemt alle kleurschalen, de referentiekleuren, de functionele aliassen en
 * de typografieschaal over, en voegt een eigen verzadigde neutrale schaal toe
 * (--theme-neutral-<stap>): dezelfde lichtheid en tint als NLDD's coolgray,
 * maar met meer verzadiging aan de donkere kant, zodat de donkere
 * achtergrond blauw blijft in plaats van grijs. NLDD's eigen
 * --primitives-color-neutral-* blijft ongewijzigd.
 *
 * Het pakketpad is te overschrijven met NLDD_DIR.
 *
 * Gebruik: node tokens.js
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = import.meta.dirname;
const ROOT = resolve(HERE, "..", "..");
const NLDD_DIR = resolve(process.env.NLDD_DIR || join(HERE, "node_modules", "@nldd", "design-system"));
const OUTPUT = "assets/css/nldd-primitives.css";

// Functionele aliassen, zelfde koppeling als in NLDD's variables.css
const ALIASES = {
  neutral: "coolgray",
  accent: "lintblauw",
  success: "groen",
  warning: "oranje",
  critical: "rood",
  mark: "donkergeel",
};

// Neutral van het theme: coolgray met minimaal deze chroma zodra de
// lichtheid onder de grens zit. Boven de grens blijft coolgray ongewijzigd,
// zodat papierwit en lichte tekst neutraal blijven.
const NEUTRAL_BASE = "coolgray";
const NEUTRAL_MIN_CHROMA = 0.042;
const NEUTRAL_LIGHTNESS_LIMIT = 0.56;

function lees(pad) {
  return readFileSync(join(NLDD_DIR, pad), "utf-8");
}

// Geeft { schaal: { stap: waarde } }; de volgorde van het bronbestand blijft
function parsePalettes(css) {
  const scales = {};
  const re = /--primitives-color-([a-z]+)-(\d+):\s*([^;]+);/g;
  for (const [, scale, step, value] of css.matchAll(re)) {
    (scales[scale] ??= {})[Number(step)] = value.trim();
  }
  return scales;
}

// Exacte huisstijlkleuren (niet themagevoelig), zoals NLDD ze meelevert
function parseReferences(css) {
  const refs = {};
  const re = /--primitives-color-reference-([a-z]+):\s*([^;]+);/g;
  for (const [, name, value] of css.matchAll(re)) refs[name] = value.trim();
  return refs;
}

// Typografieschaal: font-size- en line-height-stappen, niet themagevoelig
function parseTypography(css) {
  const typography = [];
  const re = /--primitives-(font-size-\d+|line-height-[a-z]+):\s*([^;]+);/g;
  for (const [, name, value] of css.matchAll(re)) typography.push([name, value.trim()]);
  return typography;
}

function boostChroma(value) {
  return value.replace(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g, (m, l, c, h) => {
    const L = Number(l);
    const C = Number(c);
    if (L > NEUTRAL_LIGHTNESS_LIMIT || C === 0 || C >= NEUTRAL_MIN_CHROMA) return m;
    return `oklch(${l} ${NEUTRAL_MIN_CHROMA.toFixed(3)} ${h})`;
  });
}

const stappen = (schaal) => Object.keys(schaal).map(Number).sort((a, b) => a - b);

function buildCSS({ scales, references, typography, version }) {
  const lines = [
    `/* Gegenereerd door tools/nldd/tokens.js uit @nldd/design-system ${version}.`,
    "   Niet handmatig bewerken: draai `node tools/nldd/tokens.js`. */",
    "",
    ":root {",
    "  /* exacte huisstijlkleuren, niet themagevoelig */",
  ];
  for (const [name, value] of Object.entries(references)) {
    lines.push(`  --primitives-color-reference-${name}: ${value};`);
  }
  lines.push("");
  for (const [scale, stepValues] of Object.entries(scales)) {
    if (scale in ALIASES || scale === "reference") continue;
    lines.push(`  /* ${scale} */`);
    for (const step of stappen(stepValues)) {
      lines.push(`  --primitives-color-${scale}-${step}: ${stepValues[step]};`);
    }
    lines.push("");
  }
  lines.push("  /* functionele aliassen zoals in NLDD */");
  for (const [alias, scale] of Object.entries(ALIASES)) {
    if (!scales[scale]) throw new Error(`Schaal "${scale}" niet gevonden voor alias "${alias}"`);
    for (const step of stappen(scales[scale])) {
      lines.push(`  --primitives-color-${alias}-${step}: var(--primitives-color-${scale}-${step});`);
    }
  }
  lines.push("");
  lines.push(`  /* neutral van het theme: ${NEUTRAL_BASE} met chroma >= ${NEUTRAL_MIN_CHROMA} onder lichtheid ${NEUTRAL_LIGHTNESS_LIMIT} */`);
  const base = scales[NEUTRAL_BASE];
  for (const step of stappen(base)) {
    lines.push(`  --theme-neutral-${step}: ${boostChroma(base[step])};`);
  }
  if (typography.length) {
    lines.push("");
    lines.push("  /* typografie */");
    for (const [name, value] of typography) lines.push(`  --primitives-${name}: ${value};`);
  }
  lines.push("}", "");
  return lines.join("\n");
}

// Pad (relatief aan de root van het theme) -> inhoud
function generate() {
  const variables = lees("dist/css/variables.css");
  const palettes = parsePalettes(lees("dist/css/colors.generated.css"));
  const { version } = JSON.parse(lees("package.json"));
  const scales = Object.fromEntries(Object.entries(palettes).filter(([naam]) => naam !== "reference"));
  return { [OUTPUT]: buildCSS({ scales, references: parseReferences(variables), typography: parseTypography(variables), version }) };
}

export { parsePalettes, parseReferences, parseTypography, boostChroma, buildCSS, generate, ROOT };

const isCLI = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCLI) {
  for (const [pad, inhoud] of Object.entries(generate())) {
    const doel = join(ROOT, pad);
    mkdirSync(dirname(doel), { recursive: true });
    writeFileSync(doel, inhoud);
    console.log(`Geschreven: ${pad}`);
  }
}
