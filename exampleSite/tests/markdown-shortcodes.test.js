/**
 * Shortcodes in de Markdown-versie van een pagina (index.md, uit
 * markdown-body.html). Een echte shortcode valt weg, een emoji wordt de kale
 * emoji. Een shortcode die met commentaartekens binnen de haken is ge-escapet,
 * toont Hugo op de HTML-pagina letterlijk zonder die tekens, in een codeblok,
 * in code in de tekst en daarbuiten; index.md moet dan hetzelfde tonen. De
 * voorbeeldsite documenteert geen shortcodes, daarom bouwt deze test een
 * proefsite in tmp/markdown-shortcodes. Daar is hugo voor nodig.
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { EXAMPLE_DIR, THEME_DIR } from "./lib/site.js";

const HUGO_YAML = `baseURL: https://proef.example/
title: Proefsite
defaultContentLanguage: nl
disableKinds: [taxonomy, term]
outputs:
  page: [HTML, markdown]
`;

const PAGINA = [
  "---",
  "title: Shortcodes",
  "---",
  "",
  "Zo schrijf je een callout:",
  "",
  "```markdown",
  '{{</* callout title="X" */>}}inhoud{{</* /callout */>}}',
  "```",
  "",
  "~~~",
  "{{%/* callout */%}}",
  "Met **opmaak**.",
  "{{%/* /callout */%}}",
  "~~~",
  "",
  'Een emoji schrijf je als `{{</* emoji symbol="💡" aria-hidden=true */>}}` in de tekst.',
  "",
  "Ook buiten code: {{</* tree */>}}, en zonder spaties: `{{</*tree*/>}}`.",
  "",
  '{{< callout title="Echt" >}}Echte inhoud.{{< /callout >}}',
  "",
  'Kan beter {{< emoji symbol="🚫" aria-label="Kan beter" >}} hier.',
  "",
].join("\n");

const BESTANDEN = {
  "hugo.yaml": HUGO_YAML,
  "content/_index.md": "---\ntitle: Proefsite\n---\n",
  "content/shortcodes.md": PAGINA,
};

describe("shortcodes in de Markdown-versie", () => {
  const map = join(EXAMPLE_DIR, "tmp", "markdown-shortcodes");
  let md = "";
  let html = "";

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
    md = readFileSync(join(map, "public", "shortcodes", "index.md"), "utf8");
    let vorige;
    html = readFileSync(join(map, "public", "shortcodes", "index.html"), "utf8");
    do {
      vorige = html;
      html = html.replace(/<[^>]*>/g, "");
    } while (html !== vorige);
    html = html
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#34;|&quot;/g, '"')
      .replace(/&amp;/g, "&");
  });

  const letterlijk = [
    ["in een codeblok met backticks", '```markdown\n{{< callout title="X" >}}inhoud{{< /callout >}}\n```'],
    ["met procenttekens in een codeblok met tildes", "~~~\n{{% callout %}}\nMet **opmaak**.\n{{% /callout %}}\n~~~"],
    ["in code in de tekst", '`{{< emoji symbol="💡" aria-hidden=true >}}`'],
    ["buiten code", "Ook buiten code: {{< tree >}}"],
    ["zonder spaties", "`{{<tree>}}`"],
  ];
  for (const [waar, verwacht] of letterlijk) {
    test(`een ge-escapete shortcode ${waar} staat er letterlijk, zoals op de HTML-pagina`, () => {
      assert.ok(md.includes(verwacht), `index.md mist:\n${verwacht}\n\nindex.md:\n${md}`);
      const zonderOpmaak = verwacht.replace(/^(```|~~~)\w*\n|\n(```|~~~)$|`/g, "");
      for (const regel of zonderOpmaak.split("\n")) {
        assert.ok(html.includes(regel), `de HTML-pagina toont niet ${regel}; dan klopt de verwachting van deze test niet`);
      }
    });
  }

  test("een echte shortcode buiten een codeblok valt weg, de inhoud blijft", () => {
    assert.ok(md.includes("Echte inhoud."), "de inhoud van de callout ontbreekt");
    assert.ok(!/\{\{<\s*\/?\s*callout\b[^>]*>\}\}\s*Echte|Echte inhoud\.\{\{/.test(md), `de tags van de echte callout staan er nog:\n${md}`);
  });

  test("een emoji-shortcode wordt de kale emoji", () => {
    assert.ok(md.includes("Kan beter 🚫 hier."), `geen kale emoji:\n${md}`);
  });
});
