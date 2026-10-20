#!/usr/bin/env node

/**
 * Schrijft de iconen van het theme als SVG-bestanden uit de icoonregistry van
 * het NLDD Designsysteem naar static/images/icons/. De partial icon.html en
 * de CSS werken op de bestandsnamen.
 *
 * Bestanden die niet in ICONS staan blijven ongemoeid.
 *
 * Het pakketpad is te overschrijven met NLDD_DIR.
 *
 * Gebruik: node iconen.js
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = import.meta.dirname;
const ROOT = resolve(HERE, "..", "..");
const NLDD_DIR = resolve(process.env.NLDD_DIR || join(HERE, "node_modules", "@nldd", "design-system"));
const OUTPUT_DIR = "static/images/icons";

// bestandsnaam -> NLDD-icoon (canonieke naam), plus de klasse die CSS of JS verwacht
const ICONS = {
  menu: { name: "list", class: "menu-icon" },
  x: { name: "dismiss", class: "x-icon" },
  search: { name: "magnifier", class: "search-icon" },
  "chevron-down": { name: "chevron-down", class: "icon-expand" },
  "arrow-up": { name: "arrow-up", class: "icon-arrow-up" },
  info: { name: "info-circle" },
  lock: { name: "lock-closed" },
  download: { name: "arrow-down-in-bucket" },
  "externe-link": { name: "square-arrow-right-top" },
};

async function loadRegistry() {
  const pad = join(NLDD_DIR, "dist", "components", "content", "icon", "icon-registry.js");
  const { iconRegistry } = await import(pathToFileURL(pad).href);
  return iconRegistry;
}

// De registry levert de iconen zonder eigen afmeting; zonder width en height
// klapt een SVG in een flexbox dicht.
function toFile(svg, cls) {
  const attrs = `${cls ? `class="${cls}" ` : ""}width="24" height="24" `;
  return svg.replace(/^<svg /, `<svg ${attrs}`).replace(/>\n?/, ` aria-hidden="true" focusable="false">\n`).replace(/\n?<\/svg>\s*$/, "\n</svg>\n");
}

// Pad (relatief aan de root van het theme) -> inhoud
async function generate() {
  const registry = await loadRegistry();
  const files = {};
  for (const [file, { name, class: cls }] of Object.entries(ICONS)) {
    const svg = registry.get(name);
    if (!svg) throw new Error(`NLDD-icoon "${name}" niet gevonden (voor ${file}.svg)`);
    files[`${OUTPUT_DIR}/${file}.svg`] = toFile(svg, cls);
  }
  return files;
}

export { ICONS, toFile, generate, ROOT };

const isCLI = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCLI) {
  for (const [pad, inhoud] of Object.entries(await generate())) {
    const doel = join(ROOT, pad);
    mkdirSync(dirname(doel), { recursive: true });
    writeFileSync(doel, inhoud);
    console.log(`Geschreven: ${pad}`);
  }
}
