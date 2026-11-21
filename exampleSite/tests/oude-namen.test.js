/**
 * Namen uit v0.2 werken in v0.3 niet meer; de build zegt welke nieuwe naam
 * erbij hoort. De voorbeeldsite gebruikt alleen de nieuwe namen, daarom bouwt
 * deze test een proefsite met de oude in tmp/oude-namen. Daar is hugo voor
 * nodig.
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { EXAMPLE_DIR, THEME_DIR } from "./lib/site.js";

const HUGO_YAML = `baseURL: https://proef.example/
title: Proefsite
defaultContentLanguage: nl
disableKinds: [taxonomy, term]
menus:
  footer-links:
    - name: Nieuws
      url: https://proef.example/nieuws/
  footer-rechts:
    - name: Privacy
      url: https://proef.example/privacy/
params:
  footer:
    links: Zie ook
    rechts: Over deze site
  logo:
    woordmerk:
      - Ministerie van Proefzaken
`;

const OUD = `---
title: Oude namen
show_referenties: true
referenties:
  - tekst: Een bron
    url: https://proef.example/bron
---

{{< callout titel="Let op" >}}Met de oude parameter.{{< /callout >}}

{{< bronnenlijst >}}

{{< bron >}}Een woord{ref:1}{{< /bron >}}
`;

const BRONNEN = `---
title: Bron met de oude sleutel
show_references: true
references:
  - tekst: Een bron met tekst in plaats van text
---

{{< bronnenlijst >}}
`;

const VERWACHT = [
  "de parameter titel van callout heet nu title",
  "show_referenties en referenties heten nu show_references en references",
  "een bron in references heeft tekst; die sleutel heet nu text",
  "reftext.html krijgt tekst; die sleutel heet nu text",
  "De menu's footer-links en footer-rechts heten nu footer-left en footer-right",
  "params.footer.links en params.footer.rechts heten nu footer.left en footer.right",
  "params.logo.woordmerk heet nu params.logo.wordmark",
];

describe("namen uit v0.2", () => {
  let uitvoer = "";

  before(() => {
    const map = join(EXAMPLE_DIR, "tmp", "oude-namen");
    const site = join(map, "site");
    mkdirSync(join(site, "content"), { recursive: true });
    mkdirSync(join(site, "layouts", "_shortcodes"), { recursive: true });
    writeFileSync(join(site, "hugo.yaml"), HUGO_YAML);
    writeFileSync(join(site, "content", "_index.md"), "---\ntitle: Proefsite\n---\n");
    writeFileSync(join(site, "content", "oud.md"), OUD);
    writeFileSync(join(site, "content", "bronnen.md"), BRONNEN);
    writeFileSync(join(site, "layouts", "_shortcodes", "bronnenlijst.html"), '{{- partial "references.html" .Page -}}\n');
    writeFileSync(join(site, "layouts", "_shortcodes", "bron.html"), '{{- partial "reftext.html" (dict "tekst" .Inner "page" .Page) -}}\n');
    const hugo = spawnSync(
      "hugo",
      ["--cleanDestinationDir", "--source", site, "--themesDir", dirname(THEME_DIR), "--theme", basename(THEME_DIR), "--destination", join(map, "public")],
      { encoding: "utf8" },
    );
    assert.equal(hugo.status, 0, `de proefsite bouwt niet (is hugo geïnstalleerd?): ${hugo.error?.message ?? hugo.stderr}`);
    uitvoer = hugo.stdout + hugo.stderr;
  });

  for (const melding of VERWACHT) {
    test(`de build waarschuwt: ${melding}`, () => {
      assert.ok(uitvoer.includes(melding), `geen waarschuwing "${melding}" in de uitvoer van hugo:\n${uitvoer}`);
    });
  }
});
