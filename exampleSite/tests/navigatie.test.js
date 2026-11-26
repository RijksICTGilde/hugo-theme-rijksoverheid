/**
 * Navigatie en datums: het blok met de pagina's van een sectie
 * (sectienavigatie), de paginanavigatie bij een sectie met één pagina, de
 * bijwerkdatum, die niet op een lijstpagina zonder eigen tekst staat, en de
 * datum op een kaart. Bouw eerst, zie site.test.js.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { builds, paginaBestand } from "./lib/site.js";
import { elementen, tekstVan } from "./lib/html.js";

const heeftKlasseAttr = (naam) => (attrs) => (attrs.get("class") ?? "").split(/\s+/).includes(naam);

for (const build of builds()) {
  describe(`build ${build.naam}`, () => {
    const pagina = (route) => {
      const bestand = paginaBestand(build.dir, route);
      assert.ok(existsSync(bestand), `${bestand} bestaat niet; bouw eerst de site (zie site.test.js)`);
      return readFileSync(bestand, "utf8");
    };
    const blok = (html) => elementen(html, "nav", heeftKlasseAttr("related-pages"))[0];
    const links = (nav) => elementen(nav.binnen, "a").map((a) => ({ attrs: a.attrs, tekst: tekstVan(a.binnen) }));

    describe("sectienavigatie", () => {
      test("de sectie toont zichzelf en zijn pagina's, met de huidige pagina gemarkeerd", () => {
        const nav = blok(pagina("/reeks/"));
        assert.ok(nav, "geen nav.related-pages");
        assert.equal(nav.attrs.get("aria-label"), "Relevante pagina's");
        assert.equal(tekstVan(elementen(nav.binnen, "h2")[0].binnen), "Relevante pagina's");
        const lijst = links(nav);
        assert.deepEqual(lijst.map((l) => l.tekst), ["Een reeks pagina's", "Eerste pagina", "Tweede pagina", "Derde pagina"]);
        assert.deepEqual(lijst.filter((l) => l.attrs.get("aria-current") === "page").map((l) => l.tekst), ["Een reeks pagina's"]);
      });

      test("een pagina in de sectie markeert alleen zichzelf", () => {
        const nav = blok(pagina("/reeks/eerste/"));
        assert.ok(nav, "geen nav.related-pages");
        const huidig = links(nav).filter((l) => l.attrs.get("aria-current") === "page");
        assert.deepEqual(huidig.map((l) => l.tekst), ["Eerste pagina"]);
      });

      test("met related_links heet het blok Relevante pagina's en links, in één nav", () => {
        const html = pagina("/reeks/tweede/");
        const navs = elementen(html, "nav", heeftKlasseAttr("related-pages"));
        assert.equal(navs.length, 1);
        assert.equal(navs[0].attrs.get("aria-label"), "Relevante pagina's en links");
        assert.equal(tekstVan(elementen(navs[0].binnen, "h2")[0].binnen), "Relevante pagina's en links");
        const lijst = links(navs[0]).map((l) => l.tekst.replace(/ \(opent in een nieuw venster\)$/, ""));
        assert.deepEqual(lijst, ["Een reeks pagina's", "Eerste pagina", "Tweede pagina", "Derde pagina", "Rijksoverheid.nl", "De eerste pagina"]);
        assert.equal(elementen(html, "nav", (a) => a.get("aria-label") === "Relevante links").length, 0);
      });

      test("zonder sectienavigatie blijft het blok Relevante links", () => {
        const html = pagina("/onderdelen/lange-pagina/");
        const nav = elementen(html, "nav", (a) => a.get("aria-label") === "Relevante links")[0];
        assert.ok(nav, "geen nav met aria-label Relevante links");
        assert.equal(tekstVan(elementen(nav.binnen, "h2")[0].binnen), "Relevante links");
        assert.equal(blok(html)?.attrs.get("aria-label"), undefined);
      });

      test("het blok staat in de rechterkolom boven de inhoudsopgave, zoals bij moza", () => {
        const aside = elementen(pagina("/onderdelen/lange-pagina/"), "aside", heeftKlasseAttr("page-aside"))[0];
        assert.ok(aside, "geen aside.page-aside");
        const labels = elementen(aside.binnen, "nav").map((n) => n.attrs.get("aria-label"));
        assert.deepEqual(labels.slice(0, 2), ["Relevante links", "Inhoudsopgave"]);
      });

      test("een sectie met eigen tekst is een artikel met de kaarten onder de tekst", () => {
        const artikel = elementen(pagina("/reeks/"), "article", (a) => !a.has("class"))[0];
        assert.ok(artikel, "geen article voor de sectie");
        const tekst = elementen(artikel.binnen, "div", heeftKlasseAttr("article-text"))[0];
        assert.ok(tekst, "geen .article-text");
        assert.equal(elementen(tekst.binnen, "ul", heeftKlasseAttr("card-grid"))[0].binnen.match(/<li>/g).length, 3);
      });
    });

    describe("paginanavigatie", () => {
      const nav = (route) => elementen(pagina(route), "nav", heeftKlasseAttr("page-nav"))[0];
      const labels = (n) => elementen(n.binnen, "span", heeftKlasseAttr("page-nav-label")).map((s) => tekstVan(s.binnen));

      test("een sectie met één pagina heeft alleen Vorige", () => {
        assert.deepEqual(labels(nav("/enkel/pagina/")), ["Vorige"]);
      });

      test("de laatste pagina van een grotere sectie heeft Vorige en Terug naar", () => {
        assert.deepEqual(labels(nav("/reeks/derde/")), ["Vorige", "Terug naar"]);
      });
    });

    describe("bijwerkdatum", () => {
      const datum = (route) => elementen(pagina(route), "p", heeftKlasseAttr("lastmod"));

      test("een lijstpagina zonder eigen tekst toont geen datum, ook niet met show_lastmod", () => {
        assert.equal(datum("/enkel/").length, 0);
      });

      test("een pagina toont de datum die hugo.yaml aanzet", () => {
        assert.equal(datum("/enkel/pagina/").length, 1);
        assert.equal(datum("/reeks/eerste/").length, 1);
      });

      test("een sectie met eigen tekst en sectienavigatie toont de datum", () => {
        assert.equal(datum("/reeks/").length, 1);
      });
    });

    describe("datum op een kaart", () => {
      const datums = (route) =>
        elementen(pagina(route), "p", heeftKlasseAttr("card-date")).map((p) => ({
          datetime: elementen(p.binnen, "time")[0]?.attrs.get("datetime"),
          tekst: tekstVan(p.binnen),
        }));

      test("card_date via cascade zet de datum op de kaart van elke pagina in de sectie", () => {
        assert.deepEqual(datums("/nieuws/"), [
          { datetime: "2026-09-15", tekst: "15 september 2026" },
          { datetime: "2026-10-02", tekst: "2 oktober 2026" },
          { datetime: "2026-10-12", tekst: "12 oktober 2026" },
        ]);
      });

      test("zonder card_date staat er geen datum op een kaart, ook niet op die van de sectie zelf", () => {
        assert.deepEqual(datums("/reeks/"), []);
        assert.deepEqual(datums("/"), []);
      });
    });
  });
}
