/**
 * Waar de gebouwde sites en de bronnen van het theme staan, en hoe je de
 * routes van een build verzamelt.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep, basename } from "node:path";

const EXAMPLE_DIR = resolve(import.meta.dirname, "..", "..");
const THEME_DIR = resolve(process.env.THEME_DIR ?? join(EXAMPLE_DIR, ".."));

const BASIS_HOST = "voorbeeld.example";
const SITE_TITEL = "Voorbeeldsite";

/**
 * De builds die de site-tests controleren. Standaard allebei: `public` en
 * `public-nieuw-venster` (bouw met `--environment nieuw-venster`). Zet
 * SITE_DIRS (lijst met komma's) om andere mappen te toetsen.
 */
function builds() {
  const dirs = process.env.SITE_DIRS
    ? process.env.SITE_DIRS.split(",").map((d) => resolve(d))
    : [join(EXAMPLE_DIR, "public"), join(EXAMPLE_DIR, "public-nieuw-venster")];
  return dirs.map((dir) => ({ naam: basename(dir), dir, nieuwVenster: basename(dir).includes("nieuw-venster") }));
}

/** Hugo-aliassen zijn doorverwijzingen zonder inhoud; die toetsen we niet. */
function isAlias(file) {
  return /http-equiv=["']?refresh/i.test(readFileSync(file, "utf-8"));
}

/** Gesorteerde routes ("/", "/over/", "/404.html"): elke map met index.html, plus losse HTML in de root. */
function collectRoutes(root) {
  const routes = [];

  function walk(dir) {
    const index = join(dir, "index.html");
    if (existsSync(index) && !isAlias(index)) {
      const rel = relative(root, dir).split(sep).join("/");
      routes.push(rel ? `/${rel}/` : "/");
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name));
    }
  }

  walk(root);

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".html") && entry.name !== "index.html" && !isAlias(join(root, entry.name))) {
      routes.push(`/${entry.name}`);
    }
  }

  return routes.sort();
}

/** Het bestand bij een route in een outputmap. */
function paginaBestand(root, route) {
  return route.endsWith("/") ? join(root, route, "index.html") : join(root, route);
}

/** Alle bestanden met een extensie onder een map, als { relatief pad: tekst }. */
function lees(map, extensie) {
  const uit = {};
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const pad = join(dir, entry.name);
      if (entry.isDirectory()) walk(pad);
      else if (extensie.test(entry.name)) uit[relative(map, pad).split(sep).join("/")] = readFileSync(pad, "utf8");
    }
  }
  if (existsSync(map)) walk(map);
  return uit;
}

export { EXAMPLE_DIR, THEME_DIR, BASIS_HOST, SITE_TITEL, builds, collectRoutes, paginaBestand, lees };
