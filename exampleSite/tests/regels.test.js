/**
 * Test de regels zelf, zonder build: elke regel vindt zijn slechte voorbeeld
 * en laat zijn goede voorbeeld met rust. Een regel die niets meer vindt,
 * slaagt anders stil.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import * as htmlRegels from "./regels/html.js";
import * as cspRegels from "./regels/csp.js";
import * as bronRegels from "./regels/bron.js";
import { HTML_REGELS, CSS_UITVOER_REGELS, BRON_REGELS } from "./regels/index.js";
import { tags, attrs, elementen, tekstVan, zonderElementen } from "./lib/html.js";

const REGISTER = [...HTML_REGELS, ...CSS_UITVOER_REGELS, ...BRON_REGELS];

for (const regel of REGISTER) {
  describe(`regel ${regel.naam}`, () => {
    regel.slecht.forEach((args, i) => {
      test(`slecht voorbeeld ${i + 1} geeft minstens een bevinding`, () => {
        const bevindingen = regel.check(...args);
        assert.ok(bevindingen.length >= 1, `geen bevinding voor ${JSON.stringify(args).slice(0, 120)}`);
      });
    });

    regel.goed.forEach((args, i) => {
      test(`goed voorbeeld ${i + 1} geeft geen bevinding`, () => {
        assert.deepEqual(regel.check(...args), []);
      });
    });

    test("heeft minstens een slecht en een goed voorbeeld", () => {
      assert.ok(regel.slecht.length >= 1, "geen slecht voorbeeld");
      assert.ok(regel.goed.length >= 1, "geen goed voorbeeld");
    });
  });
}

describe("het register", () => {
  test("elke regel heeft een unieke naam", () => {
    const namen = REGISTER.map((r) => r.naam);
    assert.deepEqual(namen.filter((n, i) => namen.indexOf(n) !== i), []);
  });

  // checkLayouts leest een map en staat daarom in bron.test.js met tijdelijke mappen;
  // checkCsp is de som van de vijf regels per soort.
  const ELDERS_GETEST = new Set(["checkLayouts", "checkCsp"]);

  test("elke exportfunctie check* uit de regelbestanden staat in het register", () => {
    const geregistreerd = new Set(REGISTER.map((r) => r.check));
    const ontbrekend = [];
    for (const module of [htmlRegels, cspRegels, bronRegels]) {
      for (const [naam, functie] of Object.entries(module)) {
        if (naam.startsWith("check") && !ELDERS_GETEST.has(naam) && !geregistreerd.has(functie)) ontbrekend.push(naam);
      }
    }
    assert.deepEqual(ontbrekend, [], "regels zonder fixtures");
  });
});

describe("de CSP-policy", () => {
  test("is de policy uit het contract", () => {
    assert.equal(
      cspRegels.POLICY,
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; " +
        "object-src 'none'; base-uri 'self'; form-action 'none'",
    );
  });

  test("blokkeert inline style en inline script", () => {
    assert.deepEqual(cspRegels.GEBLOKKEERD.sort(), ["script", "style"]);
  });

  test("parseCsp leest directives en blockedSources laat unsafe-inline met rust", () => {
    const d = cspRegels.parseCsp("style-src 'self' 'unsafe-inline'; script-src 'self'");
    assert.deepEqual(d, { "style-src": ["'self'", "'unsafe-inline'"], "script-src": ["'self'"] });
    assert.deepEqual(cspRegels.blockedSources(d), ["script"]);
  });

  test("blockedSources valt terug op default-src", () => {
    assert.deepEqual(cspRegels.blockedSources({ "default-src": ["'self'"] }).sort(), ["script", "style"]);
  });

  test("checkCsp is de som van de vijf regels per soort", () => {
    const html =
      '<p style="a:b">x</p><style>a{}</style><script>x()</script><a onclick="go()" href="javascript:go()">x</a>';
    assert.equal(cspRegels.checkCsp(html).length, 5);
  });
});

describe("de HTML-hulpjes", () => {
  test("attrs leest geciteerde, enkel geciteerde en kale waarden", () => {
    const a = attrs(' href="/a b" class=\'x y\' id=z hidden data-n="1"');
    assert.equal(a.get("href"), "/a b");
    assert.equal(a.get("class"), "x y");
    assert.equal(a.get("id"), "z");
    assert.equal(a.get("hidden"), "");
    assert.equal(a.get("data-n"), "1");
  });

  test("tags leest een > binnen een attribuutwaarde niet als einde", () => {
    const lijst = tags('<a title="a > b" href=/x>t</a>');
    assert.equal(lijst.length, 2);
    assert.equal(lijst[0].attrs.get("href"), "/x");
  });

  test("tags negeert commentaar en de inhoud van script en style", () => {
    const lijst = tags("<!-- <nav> --><script>if (a<b) { x('<h1>') }</script><style>a>b{}</style><p>");
    assert.deepEqual(lijst.map((t) => t.naam + (t.sluit ? "/" : "")), ["script", "script/", "style", "style/", "p"]);
  });

  test("elementen vindt het bijpassende sluit-element bij geneste elementen van dezelfde soort", () => {
    const [buiten] = elementen('<div id=a><div id=b>x</div>y</div><div id=c>z</div>', "div", (k) => k.get("id") === "a");
    assert.equal(buiten.binnen, "<div id=b>x</div>y");
  });

  test("zonderElementen knipt de elementen eruit", () => {
    const html = "<p>a</p><aside>b</aside><p>c</p>";
    assert.equal(zonderElementen(html, elementen(html, "aside")), "<p>a</p><p>c</p>");
  });

  test("tekstVan laat de tekst over", () => {
    assert.equal(tekstVan("<p>Over &middot;  <b>Site</b>&nbsp;&amp; meer</p>"), "Over · Site & meer");
  });
});
