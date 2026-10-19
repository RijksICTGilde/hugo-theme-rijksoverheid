/**
 * De zoekindex (index.json) van de gebouwde exampleSite. search.js zet de tekst
 * als tekstknoop op de pagina, dus een entiteit in de index verschijnt letterlijk
 * in een zoekresultaat. Bouw eerst, vanuit de map exampleSite:
 *
 *   hugo --minify --panicOnWarning --destination public
 *
 * Zonder build falen deze tests met de opdracht erbij; ze slagen nooit stil.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { builds } from "./lib/site.js";
import { tags } from "./lib/html.js";

const BOUW_HULP = "Bouw de site eerst: `hugo --minify --panicOnWarning --destination public`, vanuit exampleSite.";

// &amp; &rsquo; &#160; &#x21a9;
const ENTITEIT = /&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i;

for (const build of builds()) {
  describe(`zoekindex in build ${build.naam}`, () => {
    const bestand = join(build.dir, "index.json");
    const bestaat = existsSync(bestand);
    test("is gebouwd", () => {
      assert.ok(bestaat, `${bestand} bestaat niet. ${BOUW_HULP}`);
    });
    if (!bestaat) return;

    const index = JSON.parse(readFileSync(bestand, "utf8"));
    const item = (url) => index.find((i) => i.url === url);

    test("het zoekvenster wijst naar deze index", () => {
      const dialoog = tags(readFileSync(join(build.dir, "index.html"), "utf8")).find((t) => t.naam === "dialog" && t.attrs.get("id") === "search-modal");
      assert.ok(dialoog, "geen <dialog id=search-modal> op de startpagina");
      assert.equal(dialoog.attrs.get("data-search-index"), "/index.json");
    });

    test("de inhoud bevat geen HTML-entiteiten", () => {
      const bevindingen = index.filter((i) => ENTITEIT.test(i.content)).map((i) => `${i.url}  ${i.content.match(ENTITEIT)[0]}`);
      assert.deepEqual(bevindingen, []);
    });

    test("de inhoud bevat geen terugverwijzing van een voetnoot", () => {
      const bevindingen = index.filter((i) => i.content.includes("↩")).map((i) => i.url);
      assert.deepEqual(bevindingen, []);
    });

    describe("dekking: de controles zien echt materiaal", () => {
      test("de tekens zelf staan in de index: aanhalingsteken, kleiner dan en apostrof", () => {
        const html = item("/onderdelen/lange-pagina/#html");
        assert.ok(html, "geen item voor het HTML-codeblok van de lange pagina");
        assert.match(html.content, /<nav aria-label="Hoofdnavigatie">/);
        assert.ok(index.some((i) => i.content.includes("’")), "geen apostrof (’) in de index; de bron had &rsquo;");
      });

      test("de voetnoten staan in de index, zonder pijl en zonder niet-afbrekende spatie", () => {
        const voetnoten = item("/onderdelen/lange-pagina/#hoe-voetnoten-werken");
        assert.ok(voetnoten, "geen item voor de voetnoten van de lange pagina");
        assert.match(voetnoten.content, /Dit is de eerste voetnoot\./);
        assert.doesNotMatch(voetnoten.content, /\xa0/);
      });
    });
  });
}
