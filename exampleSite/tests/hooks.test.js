/**
 * Een site vervangt een hook door een partial met hetzelfde pad in haar eigen
 * layouts. De voorbeeldsite gebruikt de hooks van het theme; deze test bouwt
 * daarom een proefsite in tmp/hooks met eigen versies van content-extra.html,
 * toc-extra.html, lastmod-text.html, table-extra.html en markdown-extra.html,
 * en kijkt of elk ervan in de uitvoer staat. De homepage van de proefsite
 * heeft search_index: false, zodat te toetsen is dat ze dan uit de zoekindex
 * blijft. Daar is hugo voor nodig.
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { EXAMPLE_DIR, THEME_DIR } from "./lib/site.js";
import { elementen, tags, tekstVan } from "./lib/html.js";

const HUGO_YAML = `baseURL: https://proef.example/
title: Proefsite
defaultContentLanguage: nl
disableKinds: [taxonomy, term]
outputs:
  home: [HTML, JSON]
  page: [HTML, markdown, export]
outputFormats:
  export:
    baseName: export
    mediaType: text/markdown
    isPlainText: true
    notAlternative: true
markup:
  goldmark:
    parser:
      attribute:
        block: true
`;

const HOOKS = `---
title: Hooks
---

## Inleiding

Een zin met een voetnoot.[^1]

| Kolom | Waarde |
|---|---|
| a | b |
{print-widths="30% -"}

{{< table-without-header >}}
| Telefoon | 0800 |
{{< /table-without-header >}}

{{< table-without-header print-widths="20%" >}}
| Adres | Postbus 1 |
{{< /table-without-header >}}

{{< modus >}}

[^1]: De voetnoot.
`;

const BESTANDEN = {
  "hugo.yaml": HUGO_YAML,
  "content/_index.md": "---\ntitle: Proefsite\nsearch_index: false\n---\n\nTekst op de homepage.\n",
  "content/hooks.md": HOOKS,
  "content/losse-bundel/index.md": "---\ntitle: Losse bundel\n---\n\nTekst in een bundel.\n",
  "layouts/_shortcodes/modus.html": "",
  "layouts/page.export.md": '{{ partial "markdown-body" (dict "page" . "html" true "tables" true) }}\n',
  "layouts/_partials/content-extra.html":
    '{{- return replaceRE `(?s)<div class="footnotes" role="doc-endnotes">.*?</div>` `<section id="referenties"><h2>Referenties</h2></section>` . -}}\n',
  "layouts/_partials/toc-extra.html":
    '{{- if strings.Contains .Content "footnote-ref" -}}\n<li><a href="#referenties">Referenties</a></li>\n<li><a href="#referenties">Prijs: $10</a></li>\n{{- end -}}\n',
  "layouts/_partials/lastmod-text.html": "Versie 1.2 van <strong>{{ .Title }}</strong>.\n",
  "layouts/_partials/table-extra.html": [
    '{{- $attributes := dict "data-page" .page.Title "data-title" `Een "tabel" & <meer>` -}}',
    '{{- with index .attributes "print-widths" }}{{ $attributes = merge $attributes (dict "data-print-widths" .) }}{{ end -}}',
    "{{- return $attributes -}}",
    "",
  ].join("\n"),
  "layouts/_partials/markdown-extra.html":
    '{{- return replaceRE `\\{\\{<\\s*modus\\s*>\\}\\}` (printf "html=%v tables=%v" .html .tables) .text -}}\n',
};

describe("hooks in een eigen site", () => {
  const map = join(EXAMPLE_DIR, "tmp", "hooks");
  const uit = (pad) => readFileSync(join(map, "public", pad), "utf8");
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
    pagina = uit("hooks/index.html");
  });

  test("content-extra.html krijgt de HTML vóór content.html, en content.html werkt verder met wat de hook teruggeeft", () => {
    const sectie = elementen(pagina, "section", (a) => a.get("id") === "referenties")[0];
    assert.ok(sectie, "geen <section id=referenties>: de hook draaide niet, of pas nadat content.html het voetnotenblok had veranderd");
    assert.ok(!/id="?voetnoten/.test(pagina), "content.html zette toch een kop Voetnoten");
    const kop = tags(sectie.binnen).find((t) => t.naam === "h2");
    assert.ok(kop?.attrs.get("id"), "de kop uit de hook heeft geen id: content.html werkte niet verder met de uitvoer van de hook");
  });

  test("toc-extra.html zet zijn items achteraan de inhoudsopgave, in plaats van Voetnoten", () => {
    const toc = elementen(pagina, "nav", (a) => a.get("id") === "toc")[0];
    assert.ok(toc, "geen inhoudsopgave");
    const items = elementen(toc.binnen, "li").map((li) => tekstVan(li.binnen));
    assert.deepEqual(items, ["Inleiding", "Referenties", "Prijs: $10"]);
  });

  test("lastmod-text.html geeft de zin in de voet, ook op een lijstpagina", () => {
    for (const [pad, titel] of [["index.html", "Proefsite"], ["hooks/index.html", "Hooks"]]) {
      const zin = elementen(uit(pad), "p", (a) => a.get("class") === "lastmod")[0];
      assert.ok(zin, `geen <p class="lastmod"> op ${pad}`);
      assert.equal(zin.binnen, `Versie 1.2 van <strong>${titel}</strong>.`);
    }
  });

  describe("table-extra.html", () => {
    const tabellen = () => tags(pagina).filter((t) => t.naam === "table" && !t.sluit).map((t) => t.attrs);

    test("zet de attributen op elke tabel, met de waarde ge-escapet", () => {
      const lijst = tabellen();
      assert.equal(lijst.length, 3, "verwacht een Markdown-tabel en twee keer table-without-header");
      for (const attrs of lijst) {
        assert.equal(attrs.get("data-page"), "Hooks");
        assert.equal(attrs.get("data-title"), "Een &#34;tabel&#34; &amp; &lt;meer&gt;");
      }
    });

    test("krijgt de attributen onder een Markdown-tabel en de parameters van de shortcode, ook als die er niet zijn", () => {
      assert.deepEqual(
        tabellen().map((attrs) => attrs.get("data-print-widths") ?? null),
        ["30% -", null, "20%"],
      );
    });
  });

  test("markdown-extra.html krijgt html en tables van markdown-body.html", () => {
    assert.match(uit("hooks/index.md"), /^html=false tables=false$/m);
    assert.match(uit("hooks/export.md"), /^html=true tables=true$/m);
  });

  describe("zoekindex", () => {
    const sectie = (url) => JSON.parse(uit("index.json")).find((i) => i.url === url)?.section;

    test("de homepage met search_index: false staat er niet in, ook niet met haar koppen", () => {
      const urls = JSON.parse(uit("index.json")).map((i) => i.url);
      assert.deepEqual(urls.filter((u) => u === "/" || u.startsWith("/#")), []);
    });

    test("een pagina buiten een sectie heet naar haar bestand, een bundel naar haar map", () => {
      assert.equal(sectie("/hooks/"), "hooks");
      assert.equal(sectie("/losse-bundel/"), "losse-bundel");
    });
  });
});
