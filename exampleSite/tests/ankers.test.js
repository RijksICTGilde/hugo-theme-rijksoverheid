/**
 * Ankers: elk zoekresultaat met een #anker wijst naar een id dat op die
 * pagina bestaat, en geen pagina heeft een id twee keer. index.json en
 * inhoud.html geven koppen en uitklapblokken hun id allebei via
 * koppen-ids.html; lopen ze uiteen, dan scrolt een zoekresultaat nergens
 * heen. Bouw eerst, zie site.test.js.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { builds, collectRoutes, paginaBestand, BASIS_HOST } from "./lib/site.js";
import { tags } from "./lib/html.js";

/** De ids van een pagina, in volgorde; ids in een <template> tellen niet mee. */
const ids = (html) => tags(html).filter((t) => !t.sluit && t.attrs.has("id")).map((t) => t.attrs.get("id"));

/** Pad en anker van een url uit de index, allebei gedecodeerd; null zonder anker. */
function doel(url) {
  const u = new URL(url, `https://${BASIS_HOST}/`);
  if (!u.hash) return null;
  const decodeer = (s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  return { route: decodeer(u.pathname), id: decodeer(u.hash.slice(1)) };
}

for (const build of builds()) {
  describe(`build ${build.naam}`, () => {
    const indexPad = join(build.dir, "index.json");
    const bestaat = existsSync(indexPad);
    test("heeft een zoekindex", () => {
      assert.ok(bestaat, `${indexPad} bestaat niet; bouw eerst de site (zie site.test.js)`);
    });
    if (!bestaat) return;

    const index = JSON.parse(readFileSync(indexPad, "utf8"));
    const idsPerRoute = new Map(collectRoutes(build.dir).map((route) => [route, ids(readFileSync(paginaBestand(build.dir, route), "utf8"))]));
    const ankers = index.map((item) => ({ url: item.url, doel: doel(item.url) })).filter((a) => a.doel);

    test("elk anker in de zoekindex bestaat op zijn pagina", () => {
      const missend = ankers.filter(({ doel }) => !idsPerRoute.get(doel.route)?.includes(doel.id)).map((a) => a.url);
      assert.deepEqual(missend, []);
    });

    test("dekking: de index heeft ankers naar koppen zonder Markdown-id", () => {
      // Een infoblok, een callout en een tegel: koppen die alleen koppen-ids.html een id geeft.
      for (const url of ["/onderdelen/lange-pagina/#een-waarschuwing-met-titel", "/onderdelen/lange-pagina/#gelukt", "/over/#contact"]) {
        assert.ok(
          ankers.some((a) => a.url === url),
          `${url} staat niet in de zoekindex`,
        );
      }
    });

    test("geen pagina heeft een id twee keer", () => {
      const dubbel = [];
      for (const [route, lijst] of idsPerRoute) {
        const gezien = new Set();
        for (const id of lijst) {
          if (gezien.has(id)) dubbel.push(`${route}  #${id}`);
          gezien.add(id);
        }
      }
      assert.deepEqual(dubbel, []);
    });
  });
}
