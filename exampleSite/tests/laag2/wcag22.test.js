/**
 * WCAG 2.2 AA, voor zover axe het automatisch kan: de regels met de tag
 * `wcag22aa`, vooral `target-size` (2.5.8, doelgebied van minstens 24 bij 24
 * pixels). pa11y kent alleen WCAG 2.1: zijn axe-runner draait alleen de tags
 * wcag2a, wcag21a, wcag2aa en wcag21aa en negeert een regel die je met `rules`
 * aanzet. Daarom draait axe hier rechtstreeks, op alle routes bij 320 en 1280
 * pixels breed (het kleinste doelgebied staat op een smal scherm), in licht en donker.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import puppeteer from "puppeteer";
import { PUPPETEER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds, collectRoutes } from "../lib/site.js";

const SITE = builds()[0];
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const BREEDTES = [320, 1280];
const SCHEMAS = ["", "?scheme=dark"];

let browser;
let server;
let baseUrl;

before(async () => {
  browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
  if (existsSync(SITE.dir)) {
    server = await startServer(SITE.dir);
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  }
});

after(async () => {
  await browser?.close();
  server?.close();
});

/** Draait de wcag22aa-regels van axe op de huidige pagina en geeft de overtredingen. */
async function wcag22(page) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    // Op regel-id, niet op tag: target-size staat in axe standaard uit en een tag-selectie slaat hem over.
    const regels = axe.getRules(["wcag22aa"]).map((r) => r.ruleId);
    const uitslag = await axe.run(document, { runOnly: { type: "rule", values: regels }, resultTypes: ["violations"] });
    return uitslag.violations.map((v) => ({ regel: v.id, doelen: v.nodes.map((n) => n.target.join(" ")).slice(0, 5) }));
  });
}

describe("de meting zelf", () => {
  test("een knop van 12 bij 12 pixels is een overtreding van target-size", async () => {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 320, height: 640 });
      await page.setContent(
        '<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>t</title></head><body><main><h1>T</h1>' +
          '<button style="width:12px;height:12px;padding:0">x</button>' +
          '<button style="width:12px;height:12px;padding:0">y</button></main></body></html>',
      );
      const overtredingen = await wcag22(page);
      assert.ok(overtredingen.some((o) => o.regel === "target-size"), "target-size vindt een te kleine knop niet");
    } finally {
      await page.close();
    }
  });

  test("een kleine knop met genoeg ruimte eromheen is geen overtreding (uitzondering van 2.5.8)", async () => {
    const page = await browser.newPage();
    try {
      await page.setContent(
        '<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>t</title></head><body><main><h1>T</h1>' +
          '<button style="width:12px;height:12px;padding:0;display:block;margin:40px">x</button></main></body></html>',
      );
      assert.deepEqual(await wcag22(page), []);
    } finally {
      await page.close();
    }
  });

  test("een knop van 44 bij 44 pixels is geen overtreding", async () => {
    const page = await browser.newPage();
    try {
      await page.setContent(
        '<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>t</title></head><body><main><h1>T</h1>' +
          '<button style="width:44px;height:44px">x</button></main></body></html>',
      );
      assert.deepEqual(await wcag22(page), []);
    } finally {
      await page.close();
    }
  });
});

describe(`WCAG 2.2 AA op de site (${SITE.naam})`, () => {
  test("is gebouwd", () => {
    assert.ok(existsSync(SITE.dir), `${SITE.dir} bestaat niet; draai eerst npm run build`);
  });
  if (!existsSync(SITE.dir)) return;

  const routes = collectRoutes(SITE.dir);

  for (const breedte of BREEDTES) {
    for (const schema of SCHEMAS) {
      test(`${breedte}px breed${schema ? ", donker via data-scheme" : ", licht"}`, async () => {
        const page = await browser.newPage();
        const bevindingen = [];
        try {
          await page.setViewport({ width: breedte, height: 800 });
          for (const route of routes) {
            await page.goto(`${baseUrl}${route}${schema}`, { waitUntil: "load" });
            await page.evaluate(() => document.fonts.ready);
            for (const o of await wcag22(page)) bevindingen.push(`${route}  ${o.regel}: ${o.doelen.join(" | ")}`);
          }
        } finally {
          await page.close();
        }
        assert.deepEqual(bevindingen, []);
      });
    }
  }
});
