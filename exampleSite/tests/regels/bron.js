/**
 * Regels op de broncode van het theme: templates, CSS en JavaScript. Ze lezen
 * bestanden van schijf of tekst uit een fixture, nooit de gebouwde site.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

// Plekken waar `.Content` bewust niet door de partial gaat, met de reden.
// Een uitzondering voor een bestand dat niet bestaat doet niets.
const UITZONDERINGEN = {
  "rss.xml": "feed, geen toegankelijkheidsboom",
  "index.json": "zoekindex, geen HTML-uitvoer",
  "_partials/meta.html": "leest tekst voor de description",
  "_partials/search-index-extra.html": "hook voor de zoekindex, geen HTML-uitvoer",
};

const PAGINA_INHOUD = /(?<!"inhoud\.html" )\.Content\b/;

// `.Content` in een voorwaarde of een toewijzing wordt gelezen, niet uitgevoerd.
const GELEZEN = /\bif\b|\bwith\b|:?=[^=]/;

// In shortcodes en render hooks is `.Content` de inhoud van een resource of een
// fragment, niet die van de pagina.
const GEEN_PAGINATEMPLATE = /^_(shortcodes|markup)\//;

function bestanden(map, extensie) {
  const gevonden = [];
  for (const item of readdirSync(map, { withFileTypes: true })) {
    const pad = join(map, item.name);
    if (item.isDirectory()) gevonden.push(...bestanden(pad, extensie));
    else if (extensie.test(item.name)) gevonden.push(pad);
  }
  return gevonden;
}

/**
 * `.Content` gaat via de partial inhoud.html. Die partial repareert opmaak
 * waar Goldmark geen render hook voor biedt, zoals de rol op het voetnotenblok.
 * Een layout die `.Content` rechtstreeks uitvoert, slaat die reparatie over.
 */
function checkLayouts(layoutsDir, uitzonderingen = UITZONDERINGEN) {
  const findings = [];

  for (const pad of bestanden(layoutsDir, /\.(html|xml|json)$/)) {
    const naam = relative(layoutsDir, pad).split(sep).join("/");
    if (naam in uitzonderingen) continue;
    if (GEEN_PAGINATEMPLATE.test(naam)) continue;

    readFileSync(pad, "utf8")
      .split("\n")
      .forEach((regel, i) => {
        if (!PAGINA_INHOUD.test(regel)) return;
        if (GELEZEN.test(regel)) return;
        findings.push(`${naam}:${i + 1} voert .Content rechtstreeks uit; stuur hem door de partial inhoud.html`);
      });
  }

  return findings;
}

const zonderCommentaar = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Namen die een custom property definiëren: `--x:` in CSS en `setProperty('--x'` in JS. */
function gedefinieerd(css, js = "") {
  const namen = new Set();
  for (const m of zonderCommentaar(css).matchAll(/(--[\w-]+)\s*:/g)) namen.add(m[1]);
  for (const m of js.matchAll(/setProperty\(\s*["'](--[\w-]+)["']/g)) namen.add(m[1]);
  return namen;
}

/**
 * Elke `var(--x)` zonder terugval is gedefinieerd, en elke `--primitives-*`
 * bestaat in het primitives-bestand. Een hernoemde primitive (bijvoorbeeld na
 * een upgrade van @nldd/design-system) valt anders stil terug op niets: de
 * browser negeert de declaratie en de kleur verdwijnt.
 *
 * `css` is een object { bestandsnaam: tekst }, `primitives` de tekst van
 * nldd-primitives.css (of null als het bestand ontbreekt), `js` alle JS-tekst.
 */
function checkTokens({ css, primitives, js = "" }) {
  const findings = [];
  const alleCss = Object.values(css).join("\n");
  const namen = gedefinieerd(alleCss, js);
  const primitiveNamen = primitives === null ? new Set() : gedefinieerd(primitives);

  const heeftPrimitiveVerwijzing = /var\(\s*--primitives-/.test(zonderCommentaar(alleCss));
  if (heeftPrimitiveVerwijzing && primitives === null) {
    findings.push("verwijzingen naar --primitives-*, maar assets/css/nldd-primitives.css ontbreekt");
  }

  for (const [bestand, tekst] of Object.entries(css)) {
    for (const m of zonderCommentaar(tekst).matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)) {
      const [, naam, terugval] = m;
      if (naam.startsWith("--primitives-")) {
        if (primitives !== null && !primitiveNamen.has(naam)) findings.push(`${bestand}: onbekende primitive ${naam}`);
      } else if (!terugval && !namen.has(naam)) {
        findings.push(`${bestand}: var(${naam}) zonder definitie en zonder terugval`);
      }
    }
  }

  return [...new Set(findings)];
}

/** CSS selecteert op data-scheme, niet op data-theme (contract 7.1). */
function checkDataScheme(css) {
  return Object.entries(css)
    .filter(([, tekst]) => /\[\s*data-theme\b/.test(zonderCommentaar(tekst)))
    .map(([bestand]) => `${bestand}: selecteert op [data-theme]; gebruik [data-scheme]`);
}

/** CSS gaat door ExecuteAsTemplate; `{{` mag alleen voor relURL (contract 7.5). */
function checkCssTemplate(css) {
  const findings = [];
  for (const [bestand, tekst] of Object.entries(css)) {
    for (const m of zonderCommentaar(tekst).matchAll(/\{\{[\s\S]*?\}\}/g)) {
      if (!/^\{\{-?\s*(?:relURL\s+"[^"]*"|"[^"]*"\s*\|\s*relURL)\s*-?\}\}$/.test(m[0])) {
        findings.push(`${bestand}: ${m[0]} in CSS; alleen relURL is toegestaan`);
      }
    }
  }
  return findings;
}

/** Het theme respecteert prefers-reduced-motion (WCAG 2.3.3, contract 2.1). */
function checkReducedMotion(css) {
  const alle = Object.values(css).map(zonderCommentaar).join("\n");
  return /@media[^{]*prefers-reduced-motion/.test(alle) ? [] : ["geen @media (prefers-reduced-motion) in de CSS"];
}

const TOEGESTANE_SLEUTELS = ["theme"];

/** Staat positie `index` binnen de accolades van een `try {`-blok? */
function inTry(code, index) {
  for (const m of code.slice(0, index).matchAll(/\btry\s*\{/g)) {
    let diepte = 1;
    for (let i = m.index + m[0].length; i < index && diepte > 0; i++) {
      if (code[i] === "{") diepte++;
      else if (code[i] === "}") diepte--;
    }
    if (diepte > 0) return true;
  }
  return false;
}

/**
 * JavaScript voor een strikte CSP en zonder opslag buiten de themakeuze:
 * geen eval of new Function, geen setAttribute('style') en geen style="" in
 * een tekenreeks (de CSP blokkeert die), en in de opslag alleen de toegestane
 * sleutels, binnen try/catch. `naam` is de bestandsnaam; referenties.js mag
 * zijn eigen sleutel houden (contract 2.2).
 */
function checkJsBron(naam, tekst, toegestaneSleutels = TOEGESTANE_SLEUTELS) {
  const findings = [];
  const code = tekst.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  if (/\beval\s*\(/.test(code)) findings.push(`${naam}: eval()`);
  if (/\bnew\s+Function\s*\(/.test(code)) findings.push(`${naam}: new Function()`);
  if (/\bsetAttribute\(\s*["']style["']/.test(code)) findings.push(`${naam}: setAttribute('style'); gebruik el.style.setProperty`);
  if (/\bstyle\s*=\s*\\?["']/.test(code.replace(/\.style\s*=\s*["']/g, ""))) {
    findings.push(`${naam}: style="..." in een tekenreeks; de CSP blokkeert dat`);
  }
  if (/\bdocument\.write\s*\(/.test(code)) findings.push(`${naam}: document.write()`);

  if (naam.endsWith("referenties.js")) return findings;

  const constanten = new Map(
    [...code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(["'])([^"']*)\2/g)].map((m) => [m[1], m[3]]),
  );
  for (const m of code.matchAll(/\b(?:local|session)Storage\s*\.\s*(?:getItem|setItem|removeItem)\(\s*([^,)]+)/g)) {
    const arg = m[1].trim();
    const letterlijk = arg.match(/^(["'])(.*)\1$/);
    const sleutel = letterlijk ? letterlijk[2] : constanten.get(arg);
    if (sleutel === undefined) {
      findings.push(`${naam}: opslagsleutel ${arg} is niet vast te stellen`);
    } else if (!toegestaneSleutels.includes(sleutel)) {
      findings.push(`${naam}: opslagsleutel "${sleutel}"; toegestaan: ${toegestaneSleutels.join(", ")}`);
    }
    if (!inTry(code, m.index)) findings.push(`${naam}: opslag (${arg}) staat niet in try/catch`);
  }

  return findings;
}

export {
  UITZONDERINGEN,
  TOEGESTANE_SLEUTELS,
  checkLayouts,
  checkTokens,
  checkDataScheme,
  checkCssTemplate,
  checkReducedMotion,
  checkJsBron,
};
