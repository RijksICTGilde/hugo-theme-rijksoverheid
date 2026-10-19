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

/**
 * Contrastverhouding (WCAG) van twee CSS-kleuren. De browser zet ze zelf om
 * naar sRGB, dus ook oklch en light-dark() uit de tokens.
 */
function contrast(page, voor, achter) {
  return page.evaluate(
    (a, b) => {
      const canvas = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
      const luminantie = (kleur) => {
        canvas.clearRect(0, 0, 1, 1);
        canvas.fillStyle = kleur;
        canvas.fillRect(0, 0, 1, 1);
        const [r, g, b] = Array.from(canvas.getImageData(0, 0, 1, 1).data.slice(0, 3), (n) => {
          const c = n / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const [licht, donker] = [luminantie(a), luminantie(b)].sort((x, y) => y - x);
      return (licht + 0.05) / (donker + 0.05);
    },
    voor,
    achter,
  );
}

describe("zoekfilters (1.4.11)", () => {
  for (const schema of ["light", "dark"]) {
    test(`de rand van een filterknop haalt 3:1 tegen het zoekvenster (${schema})`, async () => {
      const page = await open(`/?scheme=${schema}`);
      try {
        const kleuren = await page.evaluate(() => {
          const filter = document.querySelector(".search-filter:not(.active)");
          const stijl = getComputedStyle(filter);
          return {
            rand: stijl.borderTopColor,
            randBreedte: stijl.borderTopWidth,
            venster: getComputedStyle(document.querySelector(".search-modal-content")).backgroundColor,
          };
        });
        assert.notEqual(kleuren.randBreedte, "0px", "de filterknop heeft geen rand");
        const verhouding = await contrast(page, kleuren.rand, kleuren.venster);
        assert.ok(verhouding >= 3, `rand ${kleuren.rand} tegen ${kleuren.venster}: ${verhouding.toFixed(2)}:1`);
      } finally {
        await page.close();
      }
    });
  }
});

describe("zoekmarkering (1.3.1, 4.1.2)", () => {
  test("gegenereerde tekst komt niet in de naam van een kop of link", async () => {
    const page = await open("/onderdelen/links/?q=pagina");
    try {
      await page.waitForSelector("mark[data-search-highlight]");
      const cdp = await page.createCDPSession();
      const { nodes } = await cdp.send("Accessibility.getFullAXTree");
      const namen = nodes
        .filter((node) => !node.ignored && ["heading", "link"].includes(node.role?.value))
        .map((node) => node.name?.value ?? "");
      assert.ok(
        namen.some((naam) => /pagina/i.test(naam)),
        "geen kop of link met de zoekterm: de controle ziet de markering niet",
      );
      assert.deepEqual(namen.filter((naam) => /gemarkeerd/i.test(naam)), []);
    } finally {
      await page.close();
    }
  });
});

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
