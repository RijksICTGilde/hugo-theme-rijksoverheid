/**
 * Reflow (WCAG 1.4.10) en tekstvergroting (WCAG 1.4.4) op elke pagina, plus
 * de fixtures van de meting zelf (moza-site, #295).
 *
 * Bouw eerst de site (`npm run build`). Chrome: puppeteer downloadt het zelf,
 * of zet PUPPETEER_EXECUTABLE_PATH naar een geïnstalleerde Chrome.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";
import { meetInPagina, COMBINATIES, MARGE, MAX_VOORBEELDEN } from "./reflow.js";
import { PUPPETEER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds, collectRoutes } from "../lib/site.js";

const VENSTER = 320;
const SITE = builds()[0];

let browser;
let server;

before(async () => {
  browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
  if (existsSync(SITE.dir)) server = await startServer(SITE.dir);
});

after(async () => {
  await browser?.close();
  server?.close();
});

describe("meetInPagina op fixtures", () => {
  let page;
  before(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: VENSTER, height: 600 });
  });
  after(() => page?.close());

  /** Meet een los stukje HTML zoals de controle dat op een pagina doet. */
  async function meet(body) {
    await page.setContent(
      `<!doctype html><html lang="nl"><head><meta charset="utf-8">
       <style>* { margin: 0; padding: 0; }</style></head><body>${body}</body></html>`,
    );
    return page.evaluate(meetInPagina, MARGE, MAX_VOORBEELDEN);
  }

  test("inhoud die past levert geen bevinding", async () => {
    const uitslag = await meet('<div style="width: 300px">Past</div>');
    assert.equal(uitslag.overloop, 0);
    assert.deepEqual(uitslag.voorbeelden, []);
  });

  test("een te breed element wordt gemeld, met naam", async () => {
    const uitslag = await meet('<div class="breed" style="width: 500px">Te breed</div>');
    assert.equal(uitslag.overloop, 500 - VENSTER);
    assert.deepEqual(uitslag.voorbeelden, ["div.breed"]);
  });

  test("inhoud in een schuifvlak mag breder zijn dan het venster", async () => {
    const uitslag = await meet(
      '<div style="overflow-x: auto; width: 100%"><table style="width: 900px"><tr><td>Breed</td></tr></table></div>',
    );
    assert.equal(uitslag.overloop, 0);
  });

  test("een schuifvlak dat zelf buiten het venster valt wordt gemeld", async () => {
    const uitslag = await meet('<div class="vlak" style="overflow-x: auto; width: 400px">Inhoud</div>');
    assert.equal(uitslag.overloop, 400 - VENSTER);
    assert.deepEqual(uitslag.voorbeelden, ["div.vlak"]);
  });

  test("een subpixelafronding blijft binnen de marge", async () => {
    const uitslag = await meet(`<div style="width: ${VENSTER + 0.5}px">Bijna</div>`);
    assert.equal(uitslag.overloop, 0);
  });

  test("er worden niet meer dan drie voorbeelden genoemd", async () => {
    const breed = Array.from({ length: 5 }, (_, i) => `<div class="r${i}" style="width: 500px">Breed</div>`).join("");
    const uitslag = await meet(breed);
    assert.equal(uitslag.voorbeelden.length, MAX_VOORBEELDEN);
  });

  test("een lang woord dat afbreekt levert geen bevinding", async () => {
    const uitslag = await meet(
      '<p style="overflow-wrap: anywhere">Toegankelijkheidsonderzoeken componentenoverzicht notificatiedienst</p>',
    );
    assert.equal(uitslag.overloop, 0);
  });

  test("een lang woord dat niet afbreekt wordt gemeld", async () => {
    const uitslag = await meet("<p>Aansprakelijkheidsverzekeringspremieberekeningsmodellen</p>");
    assert.ok(uitslag.overloop > 0);
  });
});

describe(`reflow op de site (${SITE.naam})`, () => {
  test("is gebouwd", () => {
    assert.ok(existsSync(SITE.dir), `${SITE.dir} bestaat niet; draai eerst npm run build`);
  });
  if (!existsSync(SITE.dir)) return;

  const routes = collectRoutes(SITE.dir);

  for (const { breedte, wortel } of COMBINATIES) {
    test(`geen horizontale overloop bij ${breedte}px breed en ${wortel}px basistekst`, async () => {
      const baseUrl = `http://127.0.0.1:${server.address().port}`;
      const page = await browser.newPage();
      const bevindingen = [];
      try {
        const cdp = await page.createCDPSession();
        // De echte lettergrootte-instelling van de browser, niet `html { font-size }`:
        // een mediaquery in rem of em rekent tegen de instelling en zou anders niet meeschalen.
        await cdp.send("Page.setFontSizes", { fontSizes: { standard: wortel, fixed: wortel } });
        await page.setViewport({ width: breedte, height: 900 });

        for (const route of routes) {
          try {
            await page.goto(baseUrl + route, { waitUntil: "load" });
            // Zonder de webfonts meet je de breedte van een vervangend lettertype.
            await page.evaluate(() => document.fonts.ready);
            const uitslag = await page.evaluate(meetInPagina, MARGE, MAX_VOORBEELDEN);
            if (uitslag.overloop > 0) {
              bevindingen.push(`${route}: ${uitslag.overloop}px overloop (${uitslag.voorbeelden.join(", ")})`);
            }
          } catch (err) {
            // Een pagina die niet te meten is, mag niet als goedgekeurd gelden.
            bevindingen.push(`${route}: niet te meten: ${err.message.split("\n")[0]}`);
          }
        }
      } finally {
        await page.close();
      }
      assert.deepEqual(bevindingen, []);
    });
  }
});
