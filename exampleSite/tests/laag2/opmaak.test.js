/**
 * Opmaak in een echte browser, voor wat een regex op de CSS niet ziet: hoe de
 * regels samen uitpakken bij vergrote tekst, in de afdruk en op een smal of
 * breed scherm.
 *
 * Bouw eerst de site (`npm run build`): `public` en `public-nieuw-venster`.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";
import { PUPPETEER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds } from "../lib/site.js";

const BUILDS = builds();

let browser;
const servers = [];
const baseUrls = [];

before(async () => {
  browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
  for (const [i, build] of BUILDS.entries()) {
    assert.ok(existsSync(build.dir), `${build.dir} bestaat niet; draai eerst npm run build`);
    servers[i] = await startServer(build.dir);
    baseUrls[i] = `http://127.0.0.1:${servers[i].address().port}`;
  }
});

after(async () => {
  await browser?.close();
  for (const server of servers) server?.close();
});

/**
 * Opent een pagina in een nieuw tabblad. `wortel` is de lettergrootte-instelling
 * van de browser (niet `html { font-size }`): een mediaquery in rem rekent
 * ertegen en schaalt dus mee.
 */
async function open(route, { build = 0, breedte = 1280, hoogte = 900, wortel, afdruk = false } = {}) {
  const page = await browser.newPage();
  if (wortel) {
    const cdp = await page.createCDPSession();
    await cdp.send("Page.setFontSizes", { fontSizes: { standard: wortel, fixed: wortel } });
  }
  await page.setViewport({ width: breedte, height: hoogte });
  if (afdruk) await page.emulateMediaType("print");
  await page.goto(baseUrls[build] + route, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

describe("zoekvenster bij vergrote tekst (1.4.4)", () => {
  for (const breedte of [320, 360, 412]) {
    test(`veld en sluitknop blijven in beeld bij ${breedte}px breed met 16 tot 32px basistekst`, async () => {
      const bevindingen = [];
      for (const wortel of [16, 20, 24, 32]) {
        const page = await open("/", { breedte, wortel });
        try {
          const knop = await page.evaluateHandle(() =>
            [...document.querySelectorAll(".search-trigger")].find((el) => el.getClientRects().length > 0),
          );
          await knop.asElement().click();
          await page.waitForSelector("dialog.search-modal[open]");
          const uitslag = await page.evaluate(() => {
            const vak = (selector) => document.querySelector(selector).getBoundingClientRect();
            const venster = { breedte: document.documentElement.clientWidth, hoogte: window.innerHeight };
            const inhoud = vak(".search-modal-content");
            const buiten = [];
            // 0,5px marge voor subpixelafronding.
            if (inhoud.left < -0.5 || inhoud.right > venster.breedte + 0.5) buiten.push("het zoekvenster");
            for (const [naam, selector] of [
              ["het icoon", ".search-modal-header .search-icon"],
              ["het veld", ".search-modal .search-input"],
              ["de sluitknop", "#search-close"],
            ]) {
              const el = vak(selector);
              if (el.left < inhoud.left - 0.5 || el.right > inhoud.right + 0.5) buiten.push(`${naam} (buiten het zoekvenster)`);
              if (el.left < -0.5 || el.right > venster.breedte + 0.5 || el.top < -0.5 || el.bottom > venster.hoogte + 0.5) {
                buiten.push(`${naam} (buiten beeld)`);
              }
            }
            const overloop = document.documentElement.scrollWidth - venster.breedte;
            if (overloop > 1) buiten.push(`horizontale overloop van ${overloop}px`);
            return buiten;
          });
          for (const regel of uitslag) bevindingen.push(`${wortel}px basistekst: ${regel}`);
        } finally {
          await page.close();
        }
      }
      assert.deepEqual(bevindingen, []);
    });
  }
});
