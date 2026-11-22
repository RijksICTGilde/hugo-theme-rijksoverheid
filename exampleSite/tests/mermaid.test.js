/**
 * Een mermaid-blok in een shortcode die .Page.RenderString gebruikt (quote,
 * tiles, tree) telt zijn blokken opnieuw vanaf 0. Deze test bouwt een
 * proefsite in tmp/mermaid met neppe SVG's (het theme rendert zelf niets) en
 * kijkt of elk blok zijn eigen afbeelding en alt-tekst krijgt.
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { EXAMPLE_DIR, THEME_DIR } from "./lib/site.js";
import { elementen, klassen, tags } from "./lib/html.js";

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>\n';
const blok = (titel) => "```mermaid\nflowchart LR\n  accTitle: " + titel + "\n  A --> B\n```\n";

const BESTANDEN = {
  "hugo.yaml": "baseURL: https://proef.example/\ntitle: Proefsite\ndefaultContentLanguage: nl\ndisableKinds: [taxonomy, term]\n",
  "content/diagrammen.md":
    "---\ntitle: Diagrammen\n---\n\n" +
    blok("Eerste") +
    "\n{{< quote >}}\n" + blok("Tweede") + "{{< /quote >}}\n",
};
for (const slug of ["eerste", "tweede"]) {
  for (const thema of ["light", "dark"]) BESTANDEN[`static/images/render/diagrammen/${slug}-${thema}.svg`] = SVG;
}

describe("mermaid in een eigen site", () => {
  const map = join(EXAMPLE_DIR, "tmp", "mermaid");
  let pagina = "";

  before(() => {
    const site = join(map, "site");
    for (const [pad, inhoud] of Object.entries(BESTANDEN)) {
      mkdirSync(dirname(join(site, pad)), { recursive: true });
      writeFileSync(join(site, pad), inhoud);
    }
    const hugo = spawnSync(
      "hugo",
      ["--panicOnWarning", "--cleanDestinationDir", "--source", site, "--themesDir", dirname(THEME_DIR), "--theme", basename(THEME_DIR), "--destination", join(map, "public")],
      { encoding: "utf8" },
    );
    assert.equal(hugo.status, 0, `de proefsite bouwt niet (is hugo geïnstalleerd?): ${hugo.error?.message ?? hugo.stderr}`);
    pagina = readFileSync(join(map, "public", "diagrammen", "index.html"), "utf8");
  });

  test("een diagram in een shortcode krijgt zijn eigen afbeelding, niet die van het eerste diagram op de pagina", () => {
    const lichte = tags(pagina)
      .filter((t) => t.naam === "img" && klassen(t.attrs).includes("mermaid-img--light"))
      .map((t) => [t.attrs.get("alt"), t.attrs.get("src").replace(/\?.*$/, "")]);
    assert.deepEqual(lichte, [
      ["Eerste", "/images/render/diagrammen/eerste-light.svg"],
      ["Tweede", "/images/render/diagrammen/tweede-light.svg"],
    ]);
  });
});
