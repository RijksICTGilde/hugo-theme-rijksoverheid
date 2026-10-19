/**
 * Bevindingen uit de toegankelijkheidsreview (R1), getoetst in een echte
 * browser en in de toegankelijkheidsboom van Chromium:
 *   - woordmerk (1.3.1, 2.5.3): de naam naast het lint staat in de boom.
 *     Zonder params.logo.url is het logo geen link; met url is het een
 *     gewone link waarvan de naam de zichtbare tekst bevat.
 *
 * Een logo zonder url staat niet in de voorbeeldsite. Daarvoor bouwt deze
 * test een kleine proefsite met het theme in tmp/a11y-review; daar is hugo
 * voor nodig.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import puppeteer from "puppeteer";
import { PUPPETEER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds, EXAMPLE_DIR, THEME_DIR } from "../lib/site.js";

const SITE = builds()[0];
const PROEF = join(EXAMPLE_DIR, "tmp", "a11y-review");
const BREED = { width: 1280, height: 900 };
const SMAL = { width: 320, height: 800 };

const PROEFSITE = {
  "hugo.yaml": `baseURL: https://proef.example/
title: Proefsite
defaultContentLanguage: nl
disableKinds: [taxonomy, term]
params:
  logo:
    woordmerk:
      - Ministerie van Proefzaken
      - Directie Proeven
`,
  "content/_index.md": "---\ntitle: Proefsite\n---\n\nDe homepage.\n",
};

let browser;
let site;
let proef;

/** Schrijft de proefsite naar tmp/ en bouwt hem met het theme uit THEME_DIR. */
function bouwProefsite() {
  for (const [naam, inhoud] of Object.entries(PROEFSITE)) {
    const pad = join(PROEF, "site", naam);
    mkdirSync(dirname(pad), { recursive: true });
    writeFileSync(pad, inhoud);
  }
  try {
    execFileSync(
      "hugo",
      ["--quiet", "--panicOnWarning", "--cleanDestinationDir", "--source", join(PROEF, "site"), "--themesDir", dirname(THEME_DIR), "--theme", basename(THEME_DIR), "--destination", join(PROEF, "public")],
      { stdio: "pipe" },
    );
  } catch (err) {
    assert.fail(`de proefsite bouwt niet (is hugo geïnstalleerd?): ${err.stderr?.toString() || err.message}`);
  }
}

before(async () => {
  assert.ok(existsSync(SITE.dir), `${SITE.dir} bestaat niet; draai eerst npm run build`);
  bouwProefsite();
  const server = await startServer(SITE.dir);
  site = { server, url: `http://127.0.0.1:${server.address().port}` };
  const proefServer = await startServer(join(PROEF, "public"));
  proef = { server: proefServer, url: `http://127.0.0.1:${proefServer.address().port}` };
  browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
});

after(async () => {
  await browser?.close();
  site?.server.close();
  proef?.server.close();
});

/** Opent een pagina in een nieuw tabblad en geeft die terug; sluit zelf af. */
async function open(basis, route, viewport = BREED, { javascript = true } = {}) {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(javascript);
  await page.setViewport(viewport);
  await page.goto(basis.url + route, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/** Alle knopen van de toegankelijkheidsboom onder een element, plat. */
async function knopen(page, selector, interestingOnly = false) {
  const wortel = await page.$(selector);
  assert.ok(wortel, `geen ${selector}`);
  const uit = [];
  (function loop(knoop) {
    if (!knoop) return;
    uit.push(knoop);
    for (const kind of knoop.children ?? []) loop(kind);
  })(await page.accessibility.snapshot({ root: wortel, interestingOnly }));
  return uit;
}

const normaal = (tekst) => tekst.replace(/\s+/g, " ").trim();

describe("woordmerk naast het lint (1.3.1, 2.5.3)", () => {
  for (const [naam, viewport] of [["breed scherm", BREED], ["smal scherm", SMAL]]) {
    test(`zonder params.logo.url is het logo geen link en staat de naam in de boom (${naam})`, async () => {
      const page = await open(proef, "/", viewport);
      try {
        const logo = await page.$eval(".site-logo", (el) => ({
          bedienbaar: el.querySelectorAll("a, button, [tabindex]").length,
          verborgen: el.querySelectorAll("[aria-hidden]").length,
          alt: el.querySelector("img")?.getAttribute("alt"),
        }));
        assert.deepEqual(logo, { bedienbaar: 0, verborgen: 0, alt: "" });
        const boom = await knopen(page, ".site-logo");
        assert.ok(!boom.some((k) => k.role === "link"), "een link in het logo");
        const teksten = boom.filter((k) => k.role === "StaticText").map((k) => k.name);
        assert.ok(teksten.includes("Ministerie van Proefzaken"), `"Ministerie van Proefzaken" niet in de boom: ${JSON.stringify(teksten)}`);
        assert.ok(teksten.includes("Directie Proeven"), `"Directie Proeven" niet in de boom: ${JSON.stringify(teksten)}`);
      } finally {
        await page.close();
      }
    });
  }

  test("met params.logo.url is het logo een link in de tabvolgorde, met de zichtbare tekst in de naam", async () => {
    const page = await open(site, "/");
    try {
      const link = await page.$(".site-logo a");
      assert.ok(link, "geen link in .site-logo");
      const attrs = await link.evaluate((a) => ({ tabindex: a.getAttribute("tabindex"), verborgen: a.getAttribute("aria-hidden") }));
      assert.deepEqual(attrs, { tabindex: null, verborgen: null });
      let bereikt = false;
      for (let i = 0; i < 5 && !bereikt; i++) {
        await page.keyboard.press("Tab");
        bereikt = await page.evaluate((a) => document.activeElement === a, link);
      }
      assert.ok(bereikt, "de logolink is niet met Tab te bereiken");
      const zichtbaar = normaal(await page.$eval(".site-logo-woordmerk", (el) => el.innerText));
      const [knoop] = await knopen(page, ".site-logo a");
      assert.equal(knoop.role, "link");
      assert.ok(normaal(knoop.name).startsWith(zichtbaar), `naam "${knoop.name}" begint niet met de zichtbare tekst "${zichtbaar}"`);
    } finally {
      await page.close();
    }
  });
});
