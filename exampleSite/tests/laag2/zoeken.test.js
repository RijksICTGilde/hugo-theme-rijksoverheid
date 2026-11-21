/**
 * Zoeken in een echte browser, met de index van de voorbeeldsite. Een woord uit
 * synonyms in de front matter vindt de pagina, ook als het woord nergens op de
 * pagina staat. Staat het woord ook letterlijk op een andere pagina, dan blijft
 * de pagina met het synoniem bij de resultaten: search.js houdt alleen exacte
 * treffers over zodra er een is, en een synoniem telt daarbij mee.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";
import { PUPPETEER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds } from "../lib/site.js";

const SITE = builds()[0];
const BREED = { width: 1280, height: 900 };

let browser;
let server;
let baseUrl;

before(async () => {
  assert.ok(existsSync(SITE.dir), `${SITE.dir} bestaat niet; draai eerst npm run build`);
  server = await startServer(SITE.dir);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
});

after(async () => {
  await browser?.close();
  server?.close();
});

async function zichtbaar(page, selector) {
  for (const handle of await page.$$(selector)) {
    const ja = await handle.evaluate((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden");
    if (ja) return handle;
  }
  return null;
}

/** Zoekt vanaf de startpagina en geeft de paden van de resultaten terug, in volgorde. */
async function zoek(woord) {
  const page = await browser.newPage();
  try {
    await page.setViewport(BREED);
    await page.goto(`${baseUrl}/`, { waitUntil: "load" });
    const knop = await zichtbaar(page, ".search-trigger");
    assert.ok(knop, "geen zichtbare .search-trigger");
    await knop.focus();
    await page.keyboard.press("Enter");
    await page.type("#search-input", woord);
    // Wacht op de resultaten van precies dit woord, niet van een deel ervan.
    await page.waitForFunction(
      (w) => {
        const lijst = document.getElementById("search-results");
        const link = lijst.querySelector("a.search-result-item");
        return link ? new URL(link.href).searchParams.get("q") === w : lijst.textContent.includes(`"${w}"`);
      },
      { timeout: 5000 },
      woord,
    );
    return await page.$$eval("#search-results a.search-result-item", (links) => links.map((a) => new URL(a.href).pathname));
  } finally {
    await page.close();
  }
}

describe("synoniemen (synonyms in de front matter)", () => {
  test("een woord dat alleen in synonyms staat, vindt de pagina", async () => {
    assert.deepEqual(await zoek("impressum"), ["/colofon/"]);
  });

  test("staat het woord ook op een andere pagina, dan blijft de pagina met het synoniem erbij", async () => {
    const paden = await zoek("hugo");
    assert.ok(paden.some((pad) => pad !== "/colofon/"), `het woord staat ook op een andere pagina, maar die is niet gevonden: ${paden.join(", ")}`);
    assert.ok(paden.includes("/colofon/"), `/colofon/ ontbreekt: ${paden.join(", ")}`);
  });
});
