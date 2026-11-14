/**
 * De shortcode boom in de gebouwde exampleSite: een figure met een geneste
 * lijst, waarvan elke ul role="list" draagt. Bouw eerst, vanuit exampleSite:
 *
 *   hugo --minify --panicOnWarning --destination public
 *
 * Zonder build falen deze tests met de opdracht erbij; ze slagen nooit stil.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { builds, paginaBestand } from "./lib/site.js";
import { elementen, klassen, tags, tekstVan } from "./lib/html.js";

const BOUW_HULP = "Bouw de site eerst: `hugo --minify --panicOnWarning --destination public`, vanuit exampleSite.";
const ROUTE = "/onderdelen/boom/";

for (const build of builds()) {
  describe(`boom in build ${build.naam}`, () => {
    const bestand = paginaBestand(build.dir, ROUTE);
    const bestaat = existsSync(bestand);
    test("is gebouwd", () => {
      assert.ok(bestaat, `${bestand} bestaat niet. ${BOUW_HULP}`);
    });
    if (!bestaat) return;

    const html = readFileSync(bestand, "utf8");
    const figuren = elementen(html, "figure", (a) => klassen(a).includes("boom"));

    test("de pagina heeft twee boomschema's", () => {
      assert.equal(figuren.length, 2);
    });

    test("elke ul in een boom heeft role=list", () => {
      for (const f of figuren) {
        const uls = tags(f.binnen).filter((t) => t.naam === "ul" && !t.sluit);
        assert.ok(uls.length >= 2, "verwacht een geneste lijst");
        for (const ul of uls) assert.equal(ul.attrs.get("role"), "list", "ul zonder role=list");
      }
    });

    test("de niveaus zijn genest: ul in li in ul", () => {
      const diepte = (binnen) => {
        let max = 0;
        let nu = 0;
        for (const t of tags(binnen)) {
          if (t.naam !== "ul") continue;
          nu += t.sluit ? -1 : 1;
          max = Math.max(max, nu);
        }
        return max;
      };
      assert.equal(diepte(figuren[0].binnen), 3);
      assert.equal(diepte(figuren[1].binnen), 3);
      const buitenste = elementen(figuren[0].binnen, "ul")[0];
      const eersteLi = elementen(buitenste.binnen, "li")[0];
      assert.ok(elementen(eersteLi.binnen, "ul").length >= 1, "geen ul binnen de eerste li");
    });

    test("het bijschrift wordt een figcaption met Markdown", () => {
      const caps = elementen(figuren[0].binnen, "figcaption");
      assert.equal(caps.length, 1);
      assert.match(tekstVan(caps[0].binnen), /per familie onder bericht/);
      assert.ok(tags(caps[0].binnen).some((t) => t.naam === "em"), "Markdown in het bijschrift is niet verwerkt");
      assert.equal(elementen(figuren[1].binnen, "figcaption").length, 0, "figcaption zonder bijschrift");
    });
  });
}
