/**
 * Markdown in een shortcode hoort bij de pagina waar de shortcode op staat:
 * een anker gaat naar die pagina en een relatieve link wordt opgezocht vanaf
 * die pagina. Deze test bouwt twee proefsites in tmp/paginacontext, elk met
 * een pagina buiten de homepage: een met links in de cellen van
 * table-without-header, in het bijschrift van tree, in een callout en in de
 * partial reftext.html (via een shortcode van de proefsite), en een met een
 * mermaid-blok in een callout. Een mermaid-blok dat zijn SVG's niet vindt
 * laat de bouw stoppen; apart houdt dat de linktests leesbaar. Daar is hugo
 * voor nodig.
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { EXAMPLE_DIR, THEME_DIR } from "./lib/site.js";
import { elementen, klassen, tags } from "./lib/html.js";

const LINKS = "[kop](#gewone-kop) en [pagina b](b.md)";

const PAGINA = `---
title: Pagina a
---

## Gewone kop

{{< table-without-header >}}
| ${LINKS} | ${LINKS} |
{{< /table-without-header >}}

{{< tree caption="${LINKS}" >}}
- Wortel
  - Tak
{{< /tree >}}

{{< callout title="Links" >}}
${LINKS}
{{< /callout >}}

{{< reftekst >}}
`;

const DIAGRAM = `---
title: Pagina a
---

{{< callout title="Diagram" >}}
\`\`\`mermaid
flowchart LR
  accTitle: Stroom
  a --> b
\`\`\`
{{< /callout >}}
`;

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>\n';

const BASIS = {
  "hugo.yaml": "baseURL: https://proef.example/\ntitle: Proefsite\ndefaultContentLanguage: nl\ndisableKinds: [taxonomy, term]\n",
  "content/_index.md": "---\ntitle: Proefsite\n---\n\nTekst op de homepage.\n",
  "content/docs/_index.md": "---\ntitle: Docs\n---\n",
  "content/docs/b.md": "---\ntitle: Pagina b\n---\n\nTekst.\n",
};

/** Bouwt een proefsite in tmp/paginacontext/<naam> en geeft de HTML van /docs/a/. */
function bouw(naam, bestanden) {
  const map = join(EXAMPLE_DIR, "tmp", "paginacontext", naam);
  const site = join(map, "site");
  for (const [pad, inhoud] of Object.entries({ ...BASIS, ...bestanden })) {
    mkdirSync(dirname(join(site, pad)), { recursive: true });
    writeFileSync(join(site, pad), inhoud);
  }
  const hugo = spawnSync(
    "hugo",
    ["--cleanDestinationDir", "--source", site, "--themesDir", dirname(THEME_DIR), "--theme", basename(THEME_DIR), "--destination", join(map, "public")],
    { encoding: "utf8" },
  );
  assert.equal(hugo.status, 0, `de proefsite bouwt niet (is hugo geïnstalleerd?): ${hugo.error?.message ?? hugo.stderr}`);
  return readFileSync(join(map, "public", "docs", "a", "index.html"), "utf8");
}

describe("Markdown in shortcodes in de context van de pagina", () => {
  let pagina = "";

  before(() => {
    pagina = bouw("links", {
      "content/docs/a.md": PAGINA,
      "layouts/_shortcodes/reftekst.html": `<p class="reftekst">{{ partial "reftext.html" (dict "text" "${LINKS}" "page" .Page) }}</p>\n`,
    });
  });

  const hrefs = (html) => tags(html).filter((t) => t.naam === "a" && !t.sluit).map((t) => t.attrs.get("href"));
  const VERWACHT = ["/docs/a/#gewone-kop", "/docs/b/"];

  test("de cellen van table-without-header linken vanaf de pagina", () => {
    const tabel = elementen(pagina, "table")[0];
    for (const cel of [...elementen(tabel.binnen, "th"), ...elementen(tabel.binnen, "td")]) {
      assert.deepEqual(hrefs(cel.binnen), VERWACHT);
    }
  });

  test("het bijschrift van tree linkt vanaf de pagina", () => {
    const boom = elementen(pagina, "figure", (a) => klassen(a).includes("tree"))[0];
    assert.deepEqual(hrefs(elementen(boom.binnen, "figcaption")[0].binnen), VERWACHT);
  });

  test("de inhoud van callout linkt vanaf de pagina", () => {
    const callout = elementen(pagina, "div", (a) => klassen(a).includes("callout"))[0];
    assert.deepEqual(hrefs(elementen(callout.binnen, "div", (a) => klassen(a).includes("content"))[0].binnen), VERWACHT);
  });

  test("de tekst van reftext.html linkt vanaf de pagina", () => {
    assert.deepEqual(hrefs(elementen(pagina, "p", (a) => klassen(a).includes("reftekst"))[0].binnen), VERWACHT);
  });
});

test("een mermaid-blok in een callout zoekt zijn SVG's bij de pagina", () => {
  const pagina = bouw("mermaid", {
    "content/docs/a.md": DIAGRAM,
    "static/images/render/docs/a/stroom-light.svg": SVG,
    "static/images/render/docs/a/stroom-dark.svg": SVG,
  });
  const callout = elementen(pagina, "div", (a) => klassen(a).includes("callout"))[0];
  const bronnen = tags(callout.binnen).filter((t) => t.naam === "img").map((t) => t.attrs.get("src").replace(/\?.*/, ""));
  assert.deepEqual(bronnen, ["/images/render/docs/a/stroom-light.svg", "/images/render/docs/a/stroom-dark.svg"]);
});
