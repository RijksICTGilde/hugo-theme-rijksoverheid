/**
 * Regels op de bron van het theme (templates, CSS en JavaScript), zonder build.
 * Het theme staat in de map boven exampleSite; zet THEME_DIR om een andere
 * kopie te toetsen.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { THEME_DIR, lees } from "./lib/site.js";
import {
  checkLayouts,
  checkTokens,
  checkDataScheme,
  checkCssTemplate,
  checkReducedMotion,
  checkJsBron,
} from "./regels/bron.js";

const css = lees(join(THEME_DIR, "assets", "css"), /\.css$/);
const js = lees(join(THEME_DIR, "assets", "js"), /\.js$/);
const PRIMITIVES = join(THEME_DIR, "assets", "css", "nldd-primitives.css");

describe("layouts van het theme", () => {
  test(".Content gaat overal via de partial inhoud.html", () => {
    assert.deepEqual(checkLayouts(join(THEME_DIR, "layouts")), []);
  });
});

describe("checkLayouts op fixtures", () => {
  function metLayout(bestanden, uitzonderingen) {
    // De tijdelijke map blijft staan voor het besturingssysteem: geen rm, en op CI is er geen prullenbak.
    const root = mkdtempSync(join(tmpdir(), "theme-layouts-"));
    for (const [naam, inhoud] of Object.entries(bestanden)) {
      const pad = join(root, naam);
      mkdirSync(join(pad, ".."), { recursive: true });
      writeFileSync(pad, inhoud);
    }
    return uitzonderingen ? checkLayouts(root, uitzonderingen) : checkLayouts(root);
  }

  test("een template die .Content rechtstreeks uitvoert wordt gemeld", () => {
    const findings = metLayout({ "list.html": '{{ define "main" }}{{ .Content }}{{ end }}' });
    assert.equal(findings.length, 1);
    assert.match(findings[0], /list\.html:1/);
    assert.match(findings[0], /inhoud\.html/);
  });

  test("ook $.Content en .Page.Content worden gemeld", () => {
    assert.equal(metLayout({ "a.html": "{{ $.Content }}", "b.html": "{{ .Page.Content }}" }).length, 2);
  });

  test("een template in een submap wordt gemeld met zijn pad", () => {
    const findings = metLayout({ "_partials/article.html": "<div>{{ .Content }}</div>" });
    assert.match(findings[0], /^_partials\/article\.html:1/);
  });

  test("een template die de partial gebruikt levert geen bevinding", () => {
    assert.deepEqual(metLayout({ "list.html": '{{ partial "inhoud.html" .Content }}' }), []);
  });

  test(".Content in een voorwaarde of toewijzing wordt gelezen, niet uitgevoerd", () => {
    assert.deepEqual(metLayout({ "a.html": '{{ if strings.Contains $p.Content `class="footnotes"` }}{{ end }}' }), []);
    assert.deepEqual(metLayout({ "b.html": "{{ $tekst := .Content }}" }), []);
  });

  test(".Content in een shortcode of render hook telt niet als paginainhoud", () => {
    assert.deepEqual(metLayout({ "_shortcodes/label.html": "{{ $svg.Content }}", "_markup/render-x.html": "{{ .Content }}" }), []);
  });

  test("een uitzondering uit de standaardlijst wordt overgeslagen", () => {
    assert.deepEqual(metLayout({ "rss.xml": "{{ .Content }}", "index.json": "{{ .Content }}" }), []);
  });

  test("een eigen uitzonderingenlijst vervangt de standaardlijst", () => {
    assert.equal(metLayout({ "rss.xml": "{{ .Content }}" }, {}).length, 1);
    assert.deepEqual(metLayout({ "eigen.html": "{{ .Content }}" }, { "eigen.html": "reden" }), []);
  });
});

describe("tokens van het theme", () => {
  test("er is CSS om te toetsen", () => {
    assert.ok(Object.keys(css).length >= 5, `te weinig CSS-bestanden in ${THEME_DIR}/assets/css`);
  });

  test("nldd-primitives.css bestaat en bevat de NLDD-primitives", () => {
    assert.ok(existsSync(PRIMITIVES), "assets/css/nldd-primitives.css ontbreekt");
    const namen = readFileSync(PRIMITIVES, "utf8").match(/--primitives-[\w-]+(?=\s*:)/g) ?? [];
    assert.ok(namen.length >= 100, `alleen ${namen.length} --primitives-* gevonden`);
  });

  test("elke var(--x) is gedefinieerd of heeft een terugval, en elke --primitives-* bestaat", () => {
    const primitives = existsSync(PRIMITIVES) ? readFileSync(PRIMITIVES, "utf8") : null;
    assert.deepEqual(checkTokens({ css, primitives, js: Object.values(js).join("\n") }), []);
  });

  test("de CSS selecteert op data-scheme, niet op data-theme", () => {
    assert.deepEqual(checkDataScheme(css), []);
  });

  test("de CSS gebruikt {{ }} alleen voor relURL", () => {
    assert.deepEqual(checkCssTemplate(css), []);
  });

  test("het theme respecteert prefers-reduced-motion", () => {
    assert.deepEqual(checkReducedMotion(css), []);
  });
});

describe("JavaScript van het theme", () => {
  test("er is JavaScript om te toetsen", () => {
    assert.ok(Object.keys(js).length >= 3, `te weinig JS-bestanden in ${THEME_DIR}/assets/js`);
  });

  for (const [naam, tekst] of Object.entries(js)) {
    test(`${naam}: geen eval, geen inline style en alleen toegestane opslag in try/catch`, () => {
      assert.deepEqual(checkJsBron(naam, tekst), []);
    });
  }
});
