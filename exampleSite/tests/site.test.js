/**
 * Draait alle regels over de gebouwde exampleSite. Bouw eerst, vanuit de
 * map exampleSite:
 *
 *   hugo --minify --panicOnWarning --destination public
 *   hugo --minify --panicOnWarning --environment nieuw-venster --destination public-nieuw-venster
 *
 * Zonder build falen deze tests met de opdracht erbij; ze slagen nooit stil.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { builds, collectRoutes, paginaBestand, lees, BASIS_HOST, SITE_TITEL } from "./lib/site.js";
import { HTML_REGELS, CSS_UITVOER_REGELS } from "./regels/index.js";
import { tags, elementen, klassen, tekstVan } from "./lib/html.js";

// Routes die de inhoud van de exampleSite moet opleveren. Een route minder
// betekent dat een regel een pagina niet meer ziet.
const VERWACHTE_ROUTES = [
  "/",
  "/404.html",
  "/handleiding/",
  "/handleiding/zo-lees-je-een-pagina/",
  "/nieuws/",
  "/nieuws/donker-thema/",
  "/nieuws/nieuwe-website-online/",
  "/nieuws/toegankelijkheid-getest/",
  "/onderdelen/",
  "/onderdelen/buiten-de-zoekindex/",
  "/onderdelen/diagram/",
  "/onderdelen/lange-pagina/",
  "/onderdelen/lange-woorden/",
  "/onderdelen/links/",
  "/onderdelen/zonder-inhoudsopgave/",
  "/over/",
  "/over/contact/",
  "/over/privacy/",
  "/over/toegankelijkheid/",
];

const BOUW_HULP =
  "Bouw de site eerst: `hugo --minify --panicOnWarning --destination public` en " +
  "`hugo --minify --panicOnWarning --environment nieuw-venster --destination public-nieuw-venster`, " +
  "beide vanuit exampleSite.";

for (const build of builds()) {
  describe(`build ${build.naam}`, () => {
    const bestaat = existsSync(build.dir);
    test("is gebouwd", () => {
      assert.ok(bestaat, `${build.dir} bestaat niet. ${BOUW_HULP}`);
    });
    if (!bestaat) return;

    const routes = collectRoutes(build.dir);
    const paginas = new Map(routes.map((route) => [route, readFileSync(paginaBestand(build.dir, route), "utf8")]));

    const pagina = (route) => paginas.get(route) ?? "";

    test("heeft alle verwachte pagina's, en geen onverwachte", () => {
      assert.deepEqual(routes, VERWACHTE_ROUTES);
    });

    for (const regel of HTML_REGELS) {
      test(`regel ${regel.naam} op elke pagina`, () => {
        const bevindingen = [];
        for (const [route, html] of paginas) {
          const ctx = { route, basisHost: BASIS_HOST, siteTitel: SITE_TITEL };
          for (const b of new Set(regel.check(html, ctx))) bevindingen.push(`${route}  ${b}`);
        }
        assert.deepEqual(bevindingen, []);
      });
    }

    const css = lees(join(build.dir), /\.css$/);
    describe("CSS in de uitvoer", () => {
      test("er is CSS", () => {
        assert.ok(Object.keys(css).length >= 1, "geen .css in de uitvoer");
      });
      for (const regel of CSS_UITVOER_REGELS) {
        test(`regel ${regel.naam}`, () => {
          const bevindingen = Object.entries(css).flatMap(([naam, tekst]) => regel.check(tekst).map((b) => `${naam}  ${b}`));
          assert.deepEqual(bevindingen, []);
        });
      }
    });

    describe("dekking: de regels zien echt materiaal", () => {
      const aantal = (html, naam, filter) => tags(html).filter((t) => !t.sluit && t.naam === naam && (!filter || filter(t.attrs))).length;

      test("de lange pagina heeft afbeeldingen in het artikel, een tabel, voetnoten en Engelse fragmenten", () => {
        const html = pagina("/onderdelen/lange-pagina/");
        const artikel = elementen(html, "article")[0];
        assert.ok(artikel, "geen <article>");
        assert.ok(aantal(artikel.binnen, "img") >= 2, "verwacht een leadbeeld en een figuur in het artikel");
        assert.ok(aantal(html, "table") >= 2, "verwacht een brede tabel en een tabel zonder kopregel");
        assert.ok(/\bfootnotes\b/.test(html), "verwacht een voetnotenblok");
        assert.ok(aantal(html, "span", (a) => a.get("lang") === "en") >= 1, 'verwacht een fragment met lang="en"');
        assert.ok(aantal(html, "h4") >= 1, "verwacht een h4");
      });

      test("het diagram heeft twee diagrammen met een beschrijving", () => {
        const html = pagina("/onderdelen/diagram/");
        assert.equal(elementen(html, "div", (a) => klassen(a).includes("mermaid-diagram")).length, 2);
        assert.ok(aantal(html, "img", (a) => klassen(a).includes("mermaid-img")) >= 4, "verwacht een licht en een donker plaatje per diagram");
        assert.equal(elementen(html, "p", (a) => klassen(a).includes("mermaid-beschrijving")).length, 2);
      });

      test("elke pagina heeft een main, een h1 en minstens twee navs", () => {
        for (const [route, html] of paginas) {
          assert.ok(aantal(html, "main") === 1, `${route}: precies een <main>`);
          assert.ok(aantal(html, "h1") >= 1, `${route}: een h1`);
          assert.ok(aantal(html, "nav") >= 2, `${route}: minstens twee <nav>-elementen (hoofdmenu en voet)`);
        }
      });

      test("de pagina's met inhoudsopgave hebben een rechterkolom", () => {
        assert.ok(aantal(pagina("/onderdelen/lange-pagina/"), "aside", (a) => klassen(a).includes("page-aside")) >= 1);
      });

      test("het zoekvenster is aanwezig", () => {
        assert.ok(aantal(pagina("/"), "dialog") >= 1, "geen <dialog> voor het zoekvenster");
      });
    });

    describe("links naar een nieuw venster", () => {
      const links = [...paginas.values()].flatMap((html) => elementen(html, "a", (a) => a.get("target") === "_blank"));
      if (build.nieuwVenster) {
        test("staan aan in deze build: externe links openen in een nieuw venster", () => {
          assert.ok(links.length >= 3, `verwacht minstens 3 links met target="_blank", gevonden ${links.length}`);
          assert.ok(
            links.some((l) => (l.attrs.get("rel") ?? "").split(/\s+/).includes("external")),
            "verwacht een externe link met rel=external",
          );
          assert.ok(
            links.some((l) => /besloten/i.test(tekstVan(l.binnen))),
            "verwacht een besloten link met de melding besloten omgeving",
          );
        });
      } else {
        test("staan standaard uit: geen enkele link opent in een nieuw venster", () => {
          assert.deepEqual(links.map((l) => l.attrs.get("href")), []);
        });
        test("en er staat geen verborgen melding over een nieuw venster", () => {
          const melding = [...paginas].filter(([, html]) => /opent in een nieuw venster/i.test(html)).map(([route]) => route);
          assert.deepEqual(melding, []);
        });
      }
    });

    describe("besloten en externe links", () => {
      test("de links-pagina heeft externe en besloten links met het juiste rel en een melding", () => {
        const html = pagina("/onderdelen/links/");
        const extern = elementen(html, "a", (a) => /^https?:\/\//.test(a.get("href") ?? "") && !(a.get("href") ?? "").includes(BASIS_HOST));
        assert.ok(extern.length >= 7, `verwacht minstens 7 externe links, gevonden ${extern.length}`);
        const besloten = extern.filter((l) => /besloten omgeving/i.test(tekstVan(l.binnen)));
        assert.ok(besloten.length >= 4, `verwacht minstens 4 besloten links, gevonden ${besloten.length}`);
        for (const l of extern) assert.ok((l.attrs.get("rel") ?? "").split(/\s+/).includes("external"), `${l.attrs.get("href")} zonder rel=external`);
      });
    });

    describe("uitvoerformaten", () => {
      const lees1 = (pad) => (existsSync(join(build.dir, pad)) ? readFileSync(join(build.dir, pad), "utf8") : null);

      test("llms.txt en llms-full.txt bestaan en noemen de sectiekoppen", () => {
        const kort = lees1("llms.txt");
        assert.ok(kort, "llms.txt ontbreekt");
        assert.match(kort, /Onderdelen van het theme/);
        assert.ok(lees1("llms-full.txt"), "llms-full.txt ontbreekt");
      });

      test("llms.secties: tekst onder de kop, en volledig: false alleen in llms.txt", () => {
        assert.match(lees1("llms.txt"), /^## Nieuws\n\nDe drie nieuwste berichten\.\n\n- \[/m);
        const vol = lees1("llms-full.txt");
        assert.match(vol, /^# Onderdelen van het theme$/m);
        assert.doesNotMatch(vol, /^# Nieuws$/m, "de sectie nieuws heeft volledig: false");
      });

      test("elke pagina heeft een markdown-uitvoer en een verwijzing ernaar", () => {
        assert.ok(lees1("onderdelen/lange-pagina/index.md"), "onderdelen/lange-pagina/index.md ontbreekt");
        const html = pagina("/onderdelen/lange-pagina/");
        assert.ok(
          tags(html).some((t) => t.naam === "link" && t.attrs.get("rel") === "alternate" && t.attrs.get("type") === "text/markdown"),
          'geen <link rel="alternate" type="text/markdown">',
        );
      });

      test("index.json is geldige JSON met een item voor de lange pagina", () => {
        const json = lees1("index.json");
        assert.ok(json, "index.json ontbreekt");
        const index = JSON.parse(json);
        assert.ok(Array.isArray(index) && index.length >= 10, "verwacht minstens 10 items in de zoekindex");
        assert.ok(index.some((item) => item.url?.includes("/onderdelen/lange-pagina/")));
      });

      test("robots.txt en sitemap.xml bestaan", () => {
        assert.ok(lees1("robots.txt"), "robots.txt ontbreekt");
        assert.ok(lees1("sitemap.xml"), "sitemap.xml ontbreekt");
      });
    });
  });
}
