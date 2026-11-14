/**
 * Reflow (WCAG 1.4.10) en tekstvergroting (WCAG 1.4.4) op elke pagina, plus
 * de fixtures van de meting zelf (moza-site, #295) en de ondertitel: de kop
 * verbergt die onder 600px, dus de voet moet hem op elke breedte tonen (F102).
 *
 * Bouw eerst de site (`npm run build`). Chrome: puppeteer downloadt het zelf,
 * of zet PUPPETEER_EXECUTABLE_PATH naar een geïnstalleerde Chrome.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer";
import { meetInPagina, COMBINATIES, MARGE, MAX_VOORBEELDEN } from "./reflow.js";
import { PUPPETEER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds, collectRoutes, EXAMPLE_DIR } from "../lib/site.js";

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

/** Vanaf deze breedte toont de kop de ondertitel zelf (header.css). */
const KOP_VANAF = 600;

// 599 en 600 liggen om het breekpunt van de kop; 320 met 32px basistekst is 200%.
const ONDERTITEL_COMBINATIES = [
  ...[320, 480, 599, 600, 768, 1280].map((breedte) => ({ breedte, wortel: 16 })),
  { breedte: 320, wortel: 32 },
];

/** params.tagline uit de referentieconfiguratie: de zin die de pagina moet tonen. */
function leesOndertitel() {
  const config = readFileSync(join(EXAMPLE_DIR, "hugo.yaml"), "utf8");
  const gevonden = config.match(/^params:\n(?:[ \t].*\n|\n)*?  tagline:[ \t]*(.+?)[ \t]*$/m);
  assert.ok(gevonden, "geen params.tagline in exampleSite/hugo.yaml");
  return gevonden[1].replace(/^(["'])(.*)\1$/, "$2").trim();
}

/**
 * Staat `tekst` als eigen tekst van een element binnen `selector` en ligt dat
 * in beeld? Draait in de pagina, dus zonder import. In beeld is: een box van
 * meer dan 1px (.visually-hidden is 1px), niet verborgen en horizontaal binnen
 * het venster, ook voor elke regel van een afgebroken tekst.
 */
function ondertitelInBeeld(tekst, selector) {
  const venster = document.documentElement.clientWidth;
  const marge = 0.5;

  const waaromNiet = (el) => {
    if (el.getClientRects().length === 0) return "geen box";
    if (getComputedStyle(el).visibility !== "visible") return "visibility is niet visible";
    for (let ouder = el; ouder; ouder = ouder.parentElement) {
      if (getComputedStyle(ouder).opacity === "0") return "opacity is 0";
    }
    const vak = el.getBoundingClientRect();
    if (vak.width <= 1 || vak.height <= 1) return `box van ${Math.round(vak.width)} bij ${Math.round(vak.height)}px`;
    const bereik = document.createRange();
    bereik.selectNodeContents(el);
    const vakken = [vak, ...bereik.getClientRects()];
    const links = Math.min(...vakken.map((v) => v.left));
    const rechts = Math.max(...vakken.map((v) => v.right));
    if (links < -marge || rechts > venster + marge) {
      return `van ${Math.round(links)} tot ${Math.round(rechts)}px in een venster van ${venster}px`;
    }
    return "";
  };

  const redenen = [];
  let gevonden = 0;
  let inBeeld = false;
  for (const begin of document.querySelectorAll(selector)) {
    const knopen = document.createTreeWalker(begin, NodeFilter.SHOW_TEXT);
    for (let knoop = knopen.nextNode(); knoop; knoop = knopen.nextNode()) {
      if (knoop.nodeValue.trim() !== tekst) continue;
      gevonden++;
      const reden = waaromNiet(knoop.parentElement);
      if (reden) redenen.push(reden);
      else inBeeld = true;
    }
  }
  return { gevonden, inBeeld, redenen };
}

describe(`ondertitel op de site (${SITE.naam})`, () => {
  if (!existsSync(SITE.dir)) return;

  const routes = collectRoutes(SITE.dir);
  let ondertitel;
  before(() => {
    ondertitel = leesOndertitel();
  });

  for (const { breedte, wortel } of ONDERTITEL_COMBINATIES) {
    test(`de ondertitel staat in beeld bij ${breedte}px breed en ${wortel}px basistekst`, async () => {
      const baseUrl = `http://127.0.0.1:${server.address().port}`;
      const page = await browser.newPage();
      const bevindingen = [];
      // Ergens op de pagina is het criterium (F102); de voet toont de ondertitel
      // op elke breedte, de kop vanaf KOP_VANAF.
      const plekken = [
        ["de pagina", "body"],
        ["de voet", "body > footer"],
        ...(breedte >= KOP_VANAF ? [["de kop", "body > header"]] : []),
      ];
      try {
        const cdp = await page.createCDPSession();
        await cdp.send("Page.setFontSizes", { fontSizes: { standard: wortel, fixed: wortel } });
        await page.setViewport({ width: breedte, height: 900 });

        for (const route of routes) {
          try {
            await page.goto(baseUrl + route, { waitUntil: "load" });
            await page.evaluate(() => document.fonts.ready);
            for (const [plek, selector] of plekken) {
              const uitslag = await page.evaluate(ondertitelInBeeld, ondertitel, selector);
              if (uitslag.inBeeld) continue;
              const waarom = uitslag.gevonden ? uitslag.redenen.join("; ") : "de tekst staat er niet";
              bevindingen.push(`${route}: de ondertitel staat niet in beeld in ${plek} (${waarom})`);
            }
          } catch (err) {
            bevindingen.push(`${route}: niet te meten: ${err.message.split("\n")[0]}`);
          }
        }
      } finally {
        await page.close();
      }
      assert.deepEqual(bevindingen, []);
    });
  }

  // De ondertitel is vrije tekst van de site: een lang woord mag de voet niet breder maken dan het venster.
  for (const wortel of [16, 32]) {
    test(`een lang woord in de ondertitel breekt af bij ${VENSTER}px breed en ${wortel}px basistekst`, async () => {
      const baseUrl = `http://127.0.0.1:${server.address().port}`;
      const page = await browser.newPage();
      try {
        const cdp = await page.createCDPSession();
        await cdp.send("Page.setFontSizes", { fontSizes: { standard: wortel, fixed: wortel } });
        await page.setViewport({ width: VENSTER, height: 900 });
        await page.goto(`${baseUrl}/`, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => {
          document.querySelector("body > footer .tagline").textContent =
            "Aansprakelijkheidsverzekeringspremieberekeningsmodellen voor iedereen";
        });
        const uitslag = await page.evaluate(meetInPagina, MARGE, MAX_VOORBEELDEN);
        assert.deepEqual(uitslag, { overloop: 0, voorbeelden: [] });
      } finally {
        await page.close();
      }
    });
  }
});
