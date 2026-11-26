/**
 * params.version zet het versienummer van de site in de voet, op elke pagina
 * en standaard uit. Deze test bouwt een proefsite in tmp/versie: zonder
 * versie, met HUGO_PARAMS_VERSION zoals een CI-build, en met een eigen
 * version-text.html. Daar is hugo voor nodig.
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { EXAMPLE_DIR, THEME_DIR } from "./lib/site.js";
import { elementen } from "./lib/html.js";

const BESTANDEN = {
  "hugo.yaml": `baseURL: https://proef.example/
title: Proefsite
defaultContentLanguage: nl
disableKinds: [taxonomy, term]
params:
  version_url: https://example.org/releases
`,
  "content/_index.md": "---\ntitle: Proefsite\n---\n\nTekst op de homepage.\n",
  "content/nieuws/_index.md": "---\ntitle: Nieuws\n---\n",
  "content/nieuws/bericht.md": "---\ntitle: Bericht\nshow_lastmod: true\nlastmod: 2026-11-01\n---\n\nTekst van het bericht.\n",
};

const EIGEN_ZIN = "<strong>Versie {{ site.Params.version }}</strong> van de proefsite.\n";

const PAGINAS = ["index.html", "nieuws/index.html", "nieuws/bericht/index.html"];

function bouw(naam, versie, extra = {}) {
  const map = join(EXAMPLE_DIR, "tmp", "versie", naam);
  const site = join(map, "site");
  for (const [pad, inhoud] of Object.entries({ ...BESTANDEN, ...extra })) {
    mkdirSync(dirname(join(site, pad)), { recursive: true });
    writeFileSync(join(site, pad), inhoud);
  }
  const env = { ...process.env };
  delete env.HUGO_PARAMS_VERSION;
  if (versie) env.HUGO_PARAMS_VERSION = versie;
  const hugo = spawnSync(
    "hugo",
    ["--cleanDestinationDir", "--source", site, "--themesDir", dirname(THEME_DIR), "--theme", basename(THEME_DIR), "--destination", join(map, "public")],
    { encoding: "utf8", env },
  );
  assert.equal(hugo.status, 0, `de proefsite bouwt niet (is hugo geïnstalleerd?): ${hugo.error?.message ?? hugo.stderr}`);
  return (pad) => {
    const html = readFileSync(join(map, "public", pad), "utf8");
    return elementen(html, "p", (a) => a.get("class") === "lastmod")[0]?.binnen ?? "";
  };
}

describe("versienummer in de voet", () => {
  let zonder;
  let met;
  let eigen;

  before(() => {
    zonder = bouw("zonder", "");
    met = bouw("met", "v1.2.3");
    eigen = bouw("eigen", "v1.2.3", { "layouts/_partials/version-text.html": EIGEN_ZIN });
  });

  test("zonder params.version toont de voet geen versie, wel de datum", () => {
    for (const pad of PAGINAS) assert.doesNotMatch(zonder(pad), /Versie/, pad);
    assert.match(zonder("nieuws/bericht/index.html"), /voor het laatst bijgewerkt/);
  });

  test("HUGO_PARAMS_VERSION zet de versie op elke pagina, als link naar version_url", () => {
    for (const pad of PAGINAS) {
      assert.match(met(pad), /^<a [^>]*href="?https:\/\/example\.org\/releases"?[^>]*>Versie v1\.2\.3<\/a>\./, pad);
    }
  });

  test("de versie staat vóór de zin laatst bijgewerkt", () => {
    assert.match(met("nieuws/bericht/index.html"), /Versie v1\.2\.3<\/a>\. Deze pagina is voor het laatst bijgewerkt/);
  });

  test("een eigen version-text.html vervangt de zin", () => {
    assert.match(eigen("index.html"), /^<strong>Versie v1\.2\.3<\/strong> van de proefsite\.$/);
  });
});
