/**
 * Koppen en uitklapblokken met andere attributen dan id (een Goldmark-attribuut
 * als `## Kop {.klasse}`, of ruwe HTML met een klasse vóór het id) horen een
 * eigen item in de zoekindex te krijgen, met het anker van de pagina. Deze test
 * bouwt een proefsite in tmp/zoekindex-attributen. Daar is hugo voor nodig.
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { EXAMPLE_DIR, THEME_DIR } from "./lib/site.js";
import { tags } from "./lib/html.js";

const BESTANDEN = {
  "hugo.yaml": "baseURL: https://proef.example/\ntitle: Proefsite\ndefaultContentLanguage: nl\ndisableKinds: [taxonomy, term]\noutputs:\n  home: [HTML, JSON]\nmarkup:\n  goldmark:\n    renderer:\n      unsafe: true\n",
  "content/_index.md": "---\ntitle: Proefsite\n---\n\nTekst op de homepage.\n",
  "content/koppen.md": [
    "---",
    "title: Koppen",
    "---",
    "",
    "Inleiding.",
    "",
    "## Gewone kop",
    "",
    "Tekst onder de gewone kop.",
    "",
    "## Kop met klasse {.klasse}",
    "",
    "Tekst onder de kop met klasse.",
    "",
    "### Kop met eigen id {#eigen .klasse}",
    "",
    "Tekst onder de kop met eigen id.",
    "",
    '<details class="blok" id="eigen-blok"><summary>Blok met klasse</summary>Tekst in het blok met klasse.</details>',
    "",
  ].join("\n"),
};

describe("zoekindex met attributen op koppen en uitklapblokken", () => {
  const map = join(EXAMPLE_DIR, "tmp", "zoekindex-attributen");
  let index = [];
  let pagina = "";

  before(() => {
    const site = join(map, "site");
    for (const [pad, inhoud] of Object.entries(BESTANDEN)) {
      mkdirSync(dirname(join(site, pad)), { recursive: true });
      writeFileSync(join(site, pad), inhoud);
    }
    const hugo = spawnSync(
      "hugo",
      ["--cleanDestinationDir", "--source", site, "--themesDir", dirname(THEME_DIR), "--theme", basename(THEME_DIR), "--destination", join(map, "public")],
      { encoding: "utf8" },
    );
    assert.equal(hugo.status, 0, `de proefsite bouwt niet (is hugo geïnstalleerd?): ${hugo.error?.message ?? hugo.stderr}`);
    index = JSON.parse(readFileSync(join(map, "public", "index.json"), "utf8"));
    pagina = readFileSync(join(map, "public", "koppen", "index.html"), "utf8");
  });

  test("een kop met een attribuut krijgt een eigen item met het anker van de pagina", () => {
    const ids = new Set(tags(pagina).map((t) => t.attrs.get("id")).filter(Boolean));
    const urls = index.filter((i) => i.url.startsWith("/koppen/#")).map((i) => i.url);
    assert.deepEqual(urls.sort(), ["/koppen/#eigen", "/koppen/#eigen-blok", "/koppen/#gewone-kop", "/koppen/#kop-met-klasse"]);
    for (const url of urls) assert.ok(ids.has(url.split("#")[1]), `${url} wijst naar een id dat niet op de pagina staat`);
  });

  test("de tekst van een kop met attribuut komt niet bij de sectie ervoor", () => {
    const gewone = index.find((i) => i.url === "/koppen/#gewone-kop");
    assert.ok(!gewone.content.includes("kop met klasse"), gewone.content);
    assert.equal(index.find((i) => i.url === "/koppen/#kop-met-klasse")?.content, "Tekst onder de kop met klasse.");
  });
});
