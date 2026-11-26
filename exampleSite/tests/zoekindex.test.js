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

    test("het zoekvenster krijgt params.search.synonym_weight mee", () => {
      const dialoog = tags(readFileSync(join(build.dir, "index.html"), "utf8")).find((t) => t.naam === "dialog" && t.attrs.get("id") === "search-modal");
      assert.equal(dialoog?.attrs.get("data-search-synonym-weight"), "3");
    });

    test("de inhoud bevat geen HTML-entiteiten", () => {
      const bevindingen = index.filter((i) => ENTITEIT.test(i.content)).map((i) => `${i.url}  ${i.content.match(ENTITEIT)[0]}`);
      assert.deepEqual(bevindingen, []);
    });

    test("de homepage staat erin, met de sectie home", () => {
      assert.equal(item("/")?.section, "home");
    });

    test("een kaartengrid staat er niet in, eigen inhoud van de homepage wel", () => {
      assert.deepEqual(index.filter((i) => i.url.startsWith("/#")).map((i) => i.url), ["/#waarom-deze-site"]);
      assert.ok(!item("/").content.includes("·"), "de lijst met kaarten staat in de tekst van de homepage");
    });

    test("tegels zijn inhoud en staan er wel in", () => {
      assert.ok(item("/over/#privacy"), "de tegel Privacy op /over/ ontbreekt");
    });

    test("een pagina met search_index: false staat er niet in, ook niet met haar koppen", () => {
      assert.ok(existsSync(join(build.dir, "onderdelen/buiten-de-zoekindex/index.html")), "de proefpagina is niet gebouwd");
      assert.deepEqual(index.filter((i) => i.url.startsWith("/onderdelen/buiten-de-zoekindex/")).map((i) => i.url), []);
    });

    test("de inhoud bevat geen terugverwijzing van een voetnoot", () => {
      const bevindingen = index.filter((i) => i.content.includes("↩")).map((i) => i.url);
      assert.deepEqual(bevindingen, []);
    });

    describe("koppen zonder eigen tekst", () => {
      test("een h2 direct voor een h3 staat in de index met de koptitel als inhoud", () => {
        for (const [anker, kop] of [["tabellen", "Tabellen"], ["code-in-meerdere-talen", "Code in meerdere talen"]]) {
          const kopItem = item(`/onderdelen/lange-pagina/#${anker}`);
          assert.ok(kopItem, `geen item voor #${anker}`);
          assert.equal(kopItem.content, kop);
          assert.ok(kopItem.title.endsWith(`: ${kop}`), `de titel noemt de kop niet: ${kopItem.title}`);
        }
      });

      test("een kop met eigen tekst houdt die tekst als inhoud", () => {
        const kopItem = item("/onderdelen/lange-pagina/#tekst-en-lijsten");
        assert.ok(kopItem, "geen item voor #tekst-en-lijsten");
        assert.match(kopItem.content, /^Een alinea bestaat uit zinnen/);
      });

      test("geen enkel item met een anker heeft lege inhoud", () => {
        assert.deepEqual(index.filter((i) => i.url.includes("#") && !i.content).map((i) => i.url), []);
      });
    });

    describe("synoniemen, extra velden en secties (params.search)", () => {
      const colofon = item("/colofon/");

      test("een pagina buiten een sectie heeft de naam van haar bestand als sectie, ook bij haar koppen", () => {
        assert.ok(colofon, "geen item voor /colofon/");
        const secties = index.filter((i) => i.url.startsWith("/colofon/")).map((i) => `${i.url} ${i.section}`);
        assert.deepEqual(secties, ["/colofon/ colofon", "/colofon/#zoeken colofon"]);
      });

      test("synonyms staan als platte tekst bij de pagina, niet in de tekst", () => {
        assert.equal(colofon?.synonyms, "impressum verantwoording Hugo");
        assert.doesNotMatch(colofon.content, /impressum/i);
      });

      test("alleen het item van een pagina met synonyms heeft dat veld, haar koppen niet", () => {
        assert.deepEqual(index.filter((i) => "synonyms" in i).map((i) => i.url), ["/colofon/"]);
      });

      test("een veld uit extra_fields staat als platte tekst achter de tekst van de pagina, zonder verborgen meldingen", () => {
        assert.match(
          colofon?.content ?? "",
          / werkt\. Een voorbeeldsite van het Ministerie van Voorbeeldzaken\. De broncode van het theme staat op GitHub\.$/,
        );
      });
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
