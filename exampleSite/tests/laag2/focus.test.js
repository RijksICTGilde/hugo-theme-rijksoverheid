/**
 * Elk element dat focus krijgt, verandert ook zichtbaar (WCAG 2.4.7). axe en
 * HTML_CodeSniffer kijken niet naar de focusstijl, dus een `outline: none` die
 * terugsluipt gaat door elke andere toets heen. Deze toets tabt echt door elke
 * pagina, in licht en donker: `:focus-visible` matcht niet betrouwbaar bij
 * focus vanuit een script. Naar het voorbeeld van moza-site
 * (scripts/a11y/focus.js).
 *
 * Zichtbaar telt een verandering in omlijning, schaduw, kleuren, rand,
 * onderstreping of een pseudo-element, op het element zelf of op zijn ouder
 * (een wrapper kan de ring dragen). Een eigenschap die niets toont telt niet:
 * `outline-offset` zonder omlijning verschuift niets.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";
import { PUPPETEER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds, collectRoutes } from "../lib/site.js";

const SITE = builds()[0];
const SCHEMAS = ["", "?scheme=dark"];

/** Genoeg voor de langste pagina; daarboven is de tabreeks zelf de bevinding. */
const MAX_TABS = 150;
const MAX_VOORBEELDEN = 5;

let browser;
let server;
let baseUrl;
let page;

before(async () => {
  assert.ok(existsSync(SITE.dir), `${SITE.dir} bestaat niet; draai eerst npm run build`);
  server = await startServer(SITE.dir);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
});

after(async () => {
  await browser?.close();
  server?.close();
});

/** Legt de rusttoestand van elk focusbaar element vast. Draait in de pagina: alleen DOM-API's. */
function legRustVast() {
  // Een overgang maakt de meting afhankelijk van het moment van kijken.
  const stijl = document.createElement("style");
  stijl.textContent = "*, *::before, *::after { transition: none !important; animation: none !important }";
  document.head.append(stijl);

  const lees = (el, pseudo) => {
    const s = getComputedStyle(el, pseudo);
    const breed = (...maten) => maten.some((m) => parseFloat(m) > 0);
    const omlijning =
      s.outlineStyle !== "none" && breed(s.outlineWidth)
        ? `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}`
        : "geen";
    const rand = breed(s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth)
      ? `${s.borderWidth} ${s.borderColor} ${s.borderStyle}`
      : "geen";
    const streep =
      s.textDecorationLine !== "none" ? `${s.textDecorationLine} ${s.textDecorationColor} ${s.textDecorationThickness}` : "geen";
    const pseudoVlak = pseudo && s.content !== "none" ? `${s.width} ${s.height}` : "";
    return [omlijning, rand, streep, s.boxShadow, s.backgroundColor, s.color, s.filter, s.opacity, s.content, pseudoVlak].join("|");
  };

  const afdruk = (el) =>
    [
      lees(el, null),
      lees(el, "::before"),
      lees(el, "::after"),
      el.parentElement ? lees(el.parentElement, null) : "",
    ].join("#");

  const zichtbaar = (el) => {
    const vak = el.getBoundingClientRect();
    if (vak.width === 0 || vak.height === 0) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none";
  };

  const elementen = [...document.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]")].filter(
    (el) => !el.disabled && el.tabIndex >= 0 && zichtbaar(el),
  );
  elementen.forEach((el, i) => el.setAttribute("data-focustoets", String(i)));

  window.__focus = { afdruk, rust: elementen.map(afdruk) };
  return elementen.length;
}

/** Leest het element dat nu focus heeft en vergelijkt het met zijn rusttoestand. */
function meetActief() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { buiten: true };
  const nummer = el.getAttribute("data-focustoets");
  const naam =
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : "") +
    (typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : "");
  // Een element dat tijdens het tabben verschijnt (een skiplink, een menu) heeft geen rusttoestand.
  if (nummer === null) return { naam, onbekend: true };
  const nu = window.__focus.afdruk(el);
  return { naam, nummer: Number(nummer), zichtbaar: nu !== window.__focus.rust[Number(nummer)] };
}

/** Tabt door de geladen pagina en geeft de elementen terug die bij focus niet zichtbaar veranderen. */
async function toetsPagina() {
  const aantal = await page.evaluate(legRustVast);
  const stil = [];
  const gezien = new Set();
  let rondgelopen = aantal === 0;

  for (let i = 0; i < MAX_TABS && aantal > 0; i++) {
    await page.keyboard.press("Tab");
    const uitslag = await page.evaluate(meetActief);
    if (uitslag.buiten || uitslag.onbekend) continue;
    if (gezien.has(uitslag.nummer)) {
      rondgelopen = true;
      break;
    }
    gezien.add(uitslag.nummer);
    if (!uitslag.zichtbaar && !stil.includes(uitslag.naam)) stil.push(uitslag.naam);
  }

  return { aantal, stil, rondgelopen, bezocht: gezien.size };
}

const routes = existsSync(SITE.dir) ? collectRoutes(SITE.dir) : [];

describe(`zichtbare focus op ${routes.length} pagina's`, () => {
  for (const schema of SCHEMAS) {
    test(`elk element met focus verandert zichtbaar${schema ? ", donker via data-scheme" : ", licht"}`, { timeout: 600000 }, async () => {
      assert.ok(routes.length > 0, `geen routes in ${SITE.dir}`);
      const bevindingen = [];
      let bezocht = 0;

      for (const route of routes) {
        await page.goto(baseUrl + route + schema, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const { stil, rondgelopen, bezocht: n } = await toetsPagina();
        bezocht += n;
        for (const naam of stil.slice(0, MAX_VOORBEELDEN)) bevindingen.push(`${route}  geen zichtbare focus: ${naam}`);
        if (!rondgelopen) bevindingen.push(`${route}  de focus loopt niet rond binnen ${MAX_TABS} tabs`);
      }

      // Zonder deze controle slaagt de toets ook als hij niets heeft aangeraakt.
      assert.ok(bezocht > routes.length, `maar ${bezocht} elementen met focus bezocht op ${routes.length} pagina's`);
      assert.deepEqual(bevindingen, []);
    });
  }
});
