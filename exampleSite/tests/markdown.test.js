/**
 * De Markdown-versie van een pagina (index.md, uit markdown-body.html): een
 * alert houdt zijn soort als vetgedrukte typenaam, {ref:N} en de
 * attribuutlijsten van Goldmark lekken er niet in, en de binnenkant van een
 * codeblok blijft letterlijk staan. Bouw eerst, zie site.test.js.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { builds, EXAMPLE_DIR, THEME_DIR } from "./lib/site.js";

const LANGE_PAGINA = "onderdelen/lange-pagina";
// Heeft alleen een Markdown-versie en staat niet in lijsten (build.list: never).
const PROEF = "onderdelen/proef-ankers-markdown";

const bron = (pad) => readFileSync(join(EXAMPLE_DIR, "content", pad, "index.md"), "utf8");

/** De typenamen uit infoblok-typenamen.html, de tabel van zowel de HTML als de Markdown. */
function typenamen() {
  const template = readFileSync(join(THEME_DIR, "layouts/_partials/infoblok-typenamen.html"), "utf8");
  const dict = template.match(/return dict ((?:"[^"]*"\s*)+)/);
  assert.ok(dict, "geen dict met typenamen in infoblok-typenamen.html");
  return Object.fromEntries([...dict[1].matchAll(/"([^"]*)"\s+"([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

/** Splitst Markdown in codeblokken met hekken (met de hekken erbij) en de tekst daarbuiten. */
function splits(tekst) {
  const code = [];
  const buiten = [];
  let hek = null;
  let blok = [];
  for (const regel of tekst.split("\n")) {
    const streep = regel.match(/^[ \t>]*(`{3,}|~{3,})/)?.[1];
    if (hek) {
      blok.push(regel);
      if (streep && regel.replace(/^[ \t>]+|[ \t]+$/g, "") === streep && streep.startsWith(hek)) {
        code.push(blok.join("\n"));
        hek = null;
      }
    } else if (streep) {
      hek = streep;
      blok = [regel];
    } else {
      buiten.push(regel);
    }
  }
  return { code, buiten };
}

/** De eerste regel die een alert in de bron in de Markdown-uitvoer moet krijgen; null als die wegvalt. */
function verwachteRegel(type, titel, namen) {
  const naam = namen[type.toLowerCase()];
  if (naam) return titel ? `> **${naam}:** ${titel}` : `> **${naam}:**`;
  return titel ? `> **${titel}**` : null;
}

for (const build of builds()) {
  describe(`build ${build.naam}`, () => {
    const lees = (pad) => {
      const bestand = join(build.dir, pad, "index.md");
      assert.ok(existsSync(bestand), `${bestand} bestaat niet; bouw eerst de site (zie site.test.js)`);
      return readFileSync(bestand, "utf8");
    };

    test("een alert wordt een citaat met de typenaam uit infoblok-typenamen.html", () => {
      const namen = typenamen();
      assert.ok(Object.keys(namen).length >= 4, "verwacht minstens vier typenamen");
      const regels = lees(LANGE_PAGINA).split("\n");
      const alerts = [...bron(LANGE_PAGINA).matchAll(/^> \[!(\w+)\][ \t]*(.*?)[ \t]*$/gm)];
      assert.ok(alerts.length >= 12, `verwacht minstens 12 alerts in de bron, gevonden ${alerts.length}`);
      for (const [, type, titel] of alerts) {
        const verwacht = verwachteRegel(type, titel, namen);
        if (!verwacht) continue;
        const plek = regels.indexOf(verwacht);
        assert.ok(plek !== -1, `[!${type}] ${titel}: verwacht de regel "${verwacht}"`);
        // Een titel is een kop: de tekst eronder is een eigen alinea in het citaat.
        if (titel) assert.equal(regels[plek + 1], ">", `[!${type}] ${titel}: verwacht een lege citaatregel na de titel`);
        else assert.match(regels[plek + 1], /^> \S/, `[!${type}]: verwacht de tekst direct onder de typenaam`);
      }
      assert.deepEqual(regels.filter((r) => /\[!\w+\]/.test(r)), []);
    });

    test("ook een alert in kleine letters, maar alleen op de eerste regel van een citaat", () => {
      const regels = lees(PROEF).split("\n");
      assert.ok(regels.includes("> **Tip:** Een tip in kleine letters"), "[!tip]+ niet omgezet");
      assert.ok(regels.includes("> [!NOTE] Dit is geen alert, want het staat niet op de eerste regel."), "een [!NOTE] midden in een citaat is veranderd");
    });

    test("{ref:N} en attribuutlijsten lekken niet in de tekst buiten codeblokken", () => {
      const { buiten } = splits(lees(PROEF));
      const tekst = buiten.join("\n");
      assert.doesNotMatch(tekst, /\{ref:\d+\}/);
      assert.doesNotMatch(tekst, /\{[#.][^}]*\}|\{[\w-]+=[^}]*\}/);
      for (const regel of [
        "Een woord met een bron en een tweede bron midden in de zin.",
        "## Een kop met een eigen id",
        "## Een kop met een klasse en een label",
        "Een alinea met een klasse op de regel eronder.",
      ]) {
        assert.ok(buiten.includes(regel), `verwacht de regel "${regel}"`);
      }
    });

    test("de binnenkant van een codeblok blijft letterlijk staan", () => {
      const verwacht = splits(bron(PROEF)).code;
      assert.ok(verwacht.length >= 3, `verwacht minstens drie codeblokken in de bron, gevonden ${verwacht.length}`);
      assert.deepEqual(splits(lees(PROEF)).code, verwacht);
    });
  });
}
