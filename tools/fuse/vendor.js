#!/usr/bin/env node

/**
 * Kopieert dist/fuse.min.mjs en de LICENSE uit het geïnstalleerde fuse.js naar
 * assets/lib/fuse/ en werkt versie en integriteit in assets/lib/fuse/README.md
 * en de versie in NOTICES.md bij. Versie en integriteit komen uit package.json
 * en package-lock.json.
 *
 * Gebruik: npm ci --prefix tools/fuse && node tools/fuse/vendor.js
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HIER = import.meta.dirname;
const ROOT = resolve(HIER, "..", "..");
const UIT = "assets/lib/fuse";
const PAKKET = join(HIER, "node_modules", "fuse.js");

function generate() {
  const pkg = JSON.parse(readFileSync(join(PAKKET, "package.json"), "utf-8"));
  const lock = JSON.parse(readFileSync(join(HIER, "package-lock.json"), "utf-8"));
  const integriteit = lock.packages?.["node_modules/fuse.js"]?.integrity;
  if (!integriteit) throw new Error("Geen integriteit voor fuse.js in package-lock.json.");

  const readme = readFileSync(join(ROOT, UIT, "README.md"), "utf-8");
  const bijgewerkt = readme
    .replace(/^(\* Versie: `)[^`]*(`)$/m, `$1${pkg.version}$2`)
    .replace(/^(\* Integriteit: `)[^`]*(`)/m, `$1${integriteit}$2`);
  if (!bijgewerkt.includes(`* Versie: \`${pkg.version}\``) || !bijgewerkt.includes(`* Integriteit: \`${integriteit}\``)) {
    throw new Error("Regel 'Versie' of 'Integriteit' niet gevonden in assets/lib/fuse/README.md.");
  }

  const notices = readFileSync(join(ROOT, "NOTICES.md"), "utf-8");
  const regel = /^(Bestand: `assets\/lib\/fuse\/fuse\.min\.mjs`, ongewijzigd uit het npm-pakket `fuse\.js` ).+\.$/m;
  if (!regel.test(notices)) throw new Error("Regel over fuse.min.mjs niet gevonden in NOTICES.md.");

  return {
    [`${UIT}/fuse.min.mjs`]: readFileSync(join(PAKKET, "dist", "fuse.min.mjs")),
    [`${UIT}/LICENSE`]: readFileSync(join(PAKKET, "LICENSE")),
    [`${UIT}/README.md`]: bijgewerkt,
    "NOTICES.md": notices.replace(regel, `$1${pkg.version}.`),
  };
}

export { generate, ROOT };

const isCLI = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCLI) {
  for (const [pad, inhoud] of Object.entries(generate())) {
    const doel = join(ROOT, pad);
    mkdirSync(dirname(doel), { recursive: true });
    writeFileSync(doel, inhoud);
    console.log(`Geschreven: ${pad}`);
  }
}
