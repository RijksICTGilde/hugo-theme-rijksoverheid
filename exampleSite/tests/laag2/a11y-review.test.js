/**
 * Bevindingen uit de toegankelijkheidsreview (R1), getoetst in een echte
 * browser en in de toegankelijkheidsboom van Chromium:
 *   - woordmerk (1.3.1, 2.5.3): de naam naast het lint staat in de boom.
 *     Zonder params.logo.url is het logo geen link; met url is het een
 *     gewone link waarvan de naam de zichtbare tekst bevat;
 *   - bronterm (4.1.2): een knop met de term als naam en de brontekst als
 *     beschrijving, met unieke id's, ook als dezelfde bron vaker voorkomt en
 *     reftext.html vaker op een pagina draait. Zonder woord ervoor is het
 *     nummer de term;
 *   - infoblok zonder titel (1.4.1): de shortcode callout krijgt dezelfde
 *     verborgen typenaam als de alerts; andere alerttypen blijven neutraal.
 *
 * Een logo zonder url, een bron die vaker voorkomt en infoblokken zonder
 * titel staan niet in de voorbeeldsite. Daarvoor bouwt deze test een kleine
 * proefsite met het theme in tmp/a11y-review; daar is hugo voor nodig.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import puppeteer from "puppeteer";
import { PUPPETEER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds, EXAMPLE_DIR, THEME_DIR } from "../lib/site.js";

const SITE = builds()[0];
const PROEF = join(EXAMPLE_DIR, "tmp", "a11y-review");
const BREED = { width: 1280, height: 900 };
const SMAL = { width: 320, height: 800 };

const PROEFSITE = {
  "hugo.yaml": `baseURL: https://proef.example/
title: Proefsite
defaultContentLanguage: nl
disableKinds: [taxonomy, term]
params:
  logo:
    woordmerk:
      - Ministerie van Proefzaken
      - Directie Proeven
`,
  "content/_index.md": "---\ntitle: Proefsite\n---\n\nDe homepage.\n",
  "content/bronnen.md": `---
title: Bronnen
referenties:
  - tekst: Eerste bron
    url: https://example.org/eerste
  - tekst: Tweede bron, zonder link
---

Een zin met {{< bronnen >}}eerste{ref:1} en nog eens eerste{ref:1}{{< /bronnen >}}.

En verder {{< bronnen >}}weer{ref:1} en tweede{ref:2}{{< /bronnen >}}.

Tot slot {{< bronnen >}}**vet**{ref:2}{{< /bronnen >}}.
`,
  "layouts/_shortcodes/bronnen.html": '{{- partial "reftext.html" (dict "tekst" .Inner "page" .Page) -}}\n',
  "content/infoblokken.md": `---
title: Infoblokken
---

{{< callout variant="success" >}}Variant gelukt.{{< /callout >}}

{{< callout variant="warning" >}}Variant waarschuwing.{{< /callout >}}

{{< callout variant="danger" >}}Variant gevaar.{{< /callout >}}

{{< callout variant="info" >}}Variant info.{{< /callout >}}

{{< callout variant="muted" >}}Variant gedempt.{{< /callout >}}

{{< callout >}}Zonder variant.{{< /callout >}}

{{< callout titel="Let op" variant="warning" >}}Met titel.{{< /callout >}}

> [!TIP]
> Alert tip.

> [!IMPORTANT]
> Alert belangrijk.

> [!CAUTION]
> Alert pas op.

> [!NOTE]
> Alert notitie.

> [!SUCCESS]
> Ander alerttype.

> [!DANGER]
> Nog een ander alerttype.
`,
};

let browser;
let site;
let proef;

/** Schrijft de proefsite naar tmp/ en bouwt hem met het theme uit THEME_DIR. */
function bouwProefsite() {
  for (const [naam, inhoud] of Object.entries(PROEFSITE)) {
    const pad = join(PROEF, "site", naam);
    mkdirSync(dirname(pad), { recursive: true });
    writeFileSync(pad, inhoud);
  }
  try {
    execFileSync(
      "hugo",
      ["--quiet", "--panicOnWarning", "--cleanDestinationDir", "--source", join(PROEF, "site"), "--themesDir", dirname(THEME_DIR), "--theme", basename(THEME_DIR), "--destination", join(PROEF, "public")],
      { stdio: "pipe" },
    );
  } catch (err) {
    assert.fail(`de proefsite bouwt niet (is hugo geïnstalleerd?): ${err.stderr?.toString() || err.message}`);
  }
}

before(async () => {
  assert.ok(existsSync(SITE.dir), `${SITE.dir} bestaat niet; draai eerst npm run build`);
  bouwProefsite();
  const server = await startServer(SITE.dir);
  site = { server, url: `http://127.0.0.1:${server.address().port}` };
  const proefServer = await startServer(join(PROEF, "public"));
  proef = { server: proefServer, url: `http://127.0.0.1:${proefServer.address().port}` };
  browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
});

after(async () => {
  await browser?.close();
  site?.server.close();
  proef?.server.close();
});

/** Opent een pagina in een nieuw tabblad en geeft die terug; sluit zelf af. */
async function open(basis, route, viewport = BREED, { javascript = true } = {}) {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(javascript);
  await page.setViewport(viewport);
  await page.goto(basis.url + route, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/** Alle knopen van de toegankelijkheidsboom onder een element, plat. */
async function knopen(page, selector, interestingOnly = false) {
  const wortel = await page.$(selector);
  assert.ok(wortel, `geen ${selector}`);
  const uit = [];
  (function loop(knoop) {
    if (!knoop) return;
    uit.push(knoop);
    for (const kind of knoop.children ?? []) loop(kind);
  })(await page.accessibility.snapshot({ root: wortel, interestingOnly }));
  return uit;
}

const normaal = (tekst) => tekst.replace(/\s+/g, " ").trim();

describe("woordmerk naast het lint (1.3.1, 2.5.3)", () => {
  for (const [naam, viewport] of [["breed scherm", BREED], ["smal scherm", SMAL]]) {
    test(`zonder params.logo.url is het logo geen link en staat de naam in de boom (${naam})`, async () => {
      const page = await open(proef, "/", viewport);
      try {
        const logo = await page.$eval(".site-logo", (el) => ({
          bedienbaar: el.querySelectorAll("a, button, [tabindex]").length,
          verborgen: el.querySelectorAll("[aria-hidden]").length,
          alt: el.querySelector("img")?.getAttribute("alt"),
        }));
        assert.deepEqual(logo, { bedienbaar: 0, verborgen: 0, alt: "" });
        const boom = await knopen(page, ".site-logo");
        assert.ok(!boom.some((k) => k.role === "link"), "een link in het logo");
        const teksten = boom.filter((k) => k.role === "StaticText").map((k) => k.name);
        assert.ok(teksten.includes("Ministerie van Proefzaken"), `"Ministerie van Proefzaken" niet in de boom: ${JSON.stringify(teksten)}`);
        assert.ok(teksten.includes("Directie Proeven"), `"Directie Proeven" niet in de boom: ${JSON.stringify(teksten)}`);
      } finally {
        await page.close();
      }
    });
  }

  test("met params.logo.url is het logo een link in de tabvolgorde, met de zichtbare tekst in de naam", async () => {
    const page = await open(site, "/");
    try {
      const link = await page.$(".site-logo a");
      assert.ok(link, "geen link in .site-logo");
      const attrs = await link.evaluate((a) => ({ tabindex: a.getAttribute("tabindex"), verborgen: a.getAttribute("aria-hidden") }));
      assert.deepEqual(attrs, { tabindex: null, verborgen: null });
      let bereikt = false;
      for (let i = 0; i < 5 && !bereikt; i++) {
        await page.keyboard.press("Tab");
        bereikt = await page.evaluate((a) => document.activeElement === a, link);
      }
      assert.ok(bereikt, "de logolink is niet met Tab te bereiken");
      const zichtbaar = normaal(await page.$eval(".site-logo-woordmerk", (el) => el.innerText));
      const [knoop] = await knopen(page, ".site-logo a");
      assert.equal(knoop.role, "link");
      assert.ok(normaal(knoop.name).startsWith(zichtbaar), `naam "${knoop.name}" begint niet met de zichtbare tekst "${zichtbaar}"`);
    } finally {
      await page.close();
    }
  });
});

describe("bronterm (4.1.2)", () => {
  /** Rol, naam en beschrijving van elke term, met het doel van aria-describedby. */
  async function termen(page) {
    const uit = [];
    for (const term of await page.$$(".ref-term")) {
      const knoop = await page.accessibility.snapshot({ root: term, interestingOnly: false });
      const doel = await term.evaluate((el) => {
        const ids = (el.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
        const doelen = ids.map((id) => document.querySelectorAll(`[id="${CSS.escape(id)}"]`));
        const vak = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          zichtbaar: vak.width > 0 && vak.height > 0,
          gevonden: doelen.map((lijst) => lijst.length),
          doelRol: doelen[0]?.[0]?.getAttribute("role") ?? null,
          tekst: doelen[0]?.[0]?.textContent.trim() ?? null,
        };
      });
      uit.push({ rol: knoop.role, naam: knoop.name, beschrijving: knoop.description ?? "", ...doel });
    }
    return uit;
  }

  test("op de lange pagina is elke term een knop met de bron als beschrijving", async () => {
    const page = await open(site, "/onderdelen/lange-pagina/");
    try {
      const lijst = await termen(page);
      assert.ok(lijst.length >= 2, `verwacht minstens twee termen, gevonden ${lijst.length}`);
      for (const t of lijst) {
        assert.equal(t.tag, "button", `term "${t.naam}" is geen <button>`);
        assert.equal(t.rol, "button");
        assert.ok(t.naam, "term zonder naam");
        assert.ok(t.zichtbaar, `term "${t.naam}" heeft geen afmeting`);
        assert.deepEqual(t.gevonden, [1], `aria-describedby van "${t.naam}" wijst niet naar precies één element`);
        assert.equal(t.doelRol, "tooltip", `aria-describedby van "${t.naam}" wijst niet naar een role="tooltip"`);
        assert.ok(t.beschrijving, `term "${t.naam}" zonder beschrijving`);
        assert.equal(t.beschrijving, t.tekst, `beschrijving van "${t.naam}" is niet de brontekst`);
      }
    } finally {
      await page.close();
    }
  });

  test("dezelfde bron in één en in twee aanroepen geeft unieke id's en één anker per bron, en zonder woord een nummer", async () => {
    const page = await open(proef, "/bronnen/");
    try {
      const lijst = await termen(page);
      assert.deepEqual(
        lijst.map((t) => [t.rol, t.naam, t.beschrijving]),
        [
          ["button", "eerste", "Eerste bron"],
          ["button", "eerste", "Eerste bron"],
          ["button", "weer", "Eerste bron"],
          ["button", "tweede", "Tweede bron, zonder link"],
          ["button", "Bron 2", "Tweede bron, zonder link"],
        ],
      );
      for (const t of lijst) {
        assert.equal(t.tag, "button", `term "${t.naam}" is geen <button>`);
        assert.ok(t.zichtbaar, `term "${t.naam}" heeft geen afmeting`);
        assert.deepEqual(t.gevonden, [1], `aria-describedby van "${t.naam}" wijst niet naar precies één element`);
        assert.equal(t.doelRol, "tooltip", `aria-describedby van "${t.naam}" wijst niet naar een role="tooltip"`);
      }
      const ids = await page.evaluate(() => {
        const alle = [...document.querySelectorAll("[id]")].map((el) => el.id);
        return {
          dubbel: [...new Set(alle.filter((id, i) => alle.indexOf(id) !== i))],
          ankers: alle.filter((id) => id.startsWith("refback-")).sort(),
        };
      });
      assert.deepEqual(ids, { dubbel: [], ankers: ["refback-1", "refback-2"] });
    } finally {
      await page.close();
    }
  });
});

describe("infoblok zonder titel (1.4.1)", () => {
  test("callouts krijgen de typenaam van de alert met dezelfde kleur, in de tekst ervoor", async () => {
    const page = await open(proef, "/infoblokken/");
    try {
      const blokken = await page.$$eval(".callout", (lijst) => lijst.map((el) => [el.className, el.querySelector(".content").textContent]));
      assert.deepEqual(
        blokken.map(([klasse, tekst]) => [klasse, normaal(tekst)]),
        [
          ["callout success", "Tip: Variant gelukt."],
          ["callout warning", "Waarschuwing: Variant waarschuwing."],
          ["callout danger", "Pas op: Variant gevaar."],
          ["callout info", "Variant info."],
          ["callout muted", "Variant gedempt."],
          ["callout", "Zonder variant."],
          ["callout warning", "Met titel."],
          ["callout success", "Tip: Alert tip."],
          ["callout warning", "Belangrijk: Alert belangrijk."],
          ["callout danger", "Pas op: Alert pas op."],
          ["callout info", "Alert notitie."],
          ["callout", "Ander alerttype."],
          ["callout", "Nog een ander alerttype."],
        ],
      );
    } finally {
      await page.close();
    }
  });
});
