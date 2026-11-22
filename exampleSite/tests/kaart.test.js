/**
 * Een kaart met card_date van een pagina zonder datum (bijvoorbeeld via
 * cascade op een sectie) toont geen datum. Deze test bouwt een proefsite in
 * tmp/kaart met een pagina met en een pagina zonder datum.
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { EXAMPLE_DIR, THEME_DIR } from "./lib/site.js";
import { elementen, klassen, tekstVan } from "./lib/html.js";

const BESTANDEN = {
  "hugo.yaml": "baseURL: https://proef.example/\ntitle: Proefsite\ndefaultContentLanguage: nl\ndisableKinds: [taxonomy, term]\n",
  "content/_index.md": "---\ntitle: Proefsite\n---\n\n{{< card-grid section=\"nieuws\" >}}\n",
  "content/nieuws/_index.md": "---\ntitle: Nieuws\ncascade:\n  card_date: true\n---\n",
  "content/nieuws/met-datum.md": "---\ntitle: Met datum\ndate: 2026-03-04\n---\n\nTekst.\n",
  "content/nieuws/zonder-datum.md": "---\ntitle: Zonder datum\n---\n\nTekst.\n",
};

describe("kaart in een eigen site", () => {
  const map = join(EXAMPLE_DIR, "tmp", "kaart");
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
    pagina = readFileSync(join(map, "public", "index.html"), "utf8");
  });

  test("een kaart toont de datum van een pagina met datum, en niets bij een pagina zonder datum", () => {
    const kaarten = elementen(pagina, "article", (a) => klassen(a).includes("card"));
    const datums = Object.fromEntries(
      kaarten.map((k) => [
        tekstVan(elementen(k.binnen, "a")[0].binnen),
        elementen(k.binnen, "p", (a) => klassen(a).includes("card-date")).map((p) => tekstVan(p.binnen)),
      ]),
    );
    assert.deepEqual([datums["Met datum"], datums["Zonder datum"]], [["4 maart 2026"], []]);
  });
});
