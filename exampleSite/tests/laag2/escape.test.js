/**
 * Escape in een echte browser (WCAG 2.1.1, 2.4.3, 1.4.13): een Escape sluit
 * één ding, het binnenste eerst: het zoekvenster, een tooltip, de themakeuze in
 * de voet, het mobiele menu, de zoekmarkering. Alle listeners hangen aan
 * document en draaien in de volgorde van de bundel, dus een regex op de broncode
 * ziet niet of twee ervan dezelfde toets opeten.
 *
 * Elke test opent twee of drie lagen tegelijk, drukt voor elke laag op Escape
 * en kijkt na elke toets welke laag dicht is en waar de focus staat.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";
import { PUPPETEER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds } from "../lib/site.js";

const SITE = builds()[0];
const BREED = { width: 1280, height: 900 };
const SMAL = { width: 375, height: 800 };

// De diagrampagina heeft links met data-tooltip, de lange pagina bron-tooltips.
const DIAGRAM = "/onderdelen/diagram/";
const LANG = "/onderdelen/lange-pagina/";
const MARKEER_DIAGRAM = `${DIAGRAM}?q=controle`;
const MARKEER_LANG = `${LANG}?q=inleiding`;

let browser;
let server;
let baseUrl;

before(async () => {
  assert.ok(existsSync(SITE.dir), `${SITE.dir} bestaat niet; draai eerst npm run build`);
  server = await startServer(SITE.dir);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
});

after(async () => {
  await browser?.close();
  server?.close();
});

async function open(route, viewport = BREED) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(baseUrl + route, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

const pauze = (ms = 120) => new Promise((klaar) => setTimeout(klaar, ms));

/** Wacht tot de voorwaarde de verwachte waarde geeft (overgangen en timers kosten tijd). */
async function wacht(voorwaarde, verwacht = true, ms = 2000) {
  const tot = Date.now() + ms;
  for (;;) {
    if ((await voorwaarde()) === verwacht) return true;
    if (Date.now() > tot) return false;
    await pauze(40);
  }
}

async function zichtbaar(page, selector) {
  for (const handle of await page.$$(selector)) {
    const ja = await handle.evaluate((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden");
    if (ja) return handle;
  }
  return null;
}

/** Tab tot de focus op een element staat dat bij de selector past, zoals een toetsenbordgebruiker. */
async function tabNaar(page, selector, max = 150) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate((s) => !!document.activeElement?.matches(s), selector)) return page.evaluateHandle(() => document.activeElement);
  }
  assert.fail(`Tab komt in ${max} keer niet bij ${selector}`);
}

const heeftFocus = (page, handle) => page.evaluate((el) => document.activeElement === el, handle);
const actiefElement = (page) => page.evaluateHandle(() => document.activeElement);

const MENU = 'button[aria-controls="mobile-menu"]';
const THEMA = ".footer-settings button[aria-expanded]";
const expanded = (handle) => handle.evaluate((el) => el.getAttribute("aria-expanded") === "true");

/**
 * De lagen die Escape kan sluiten. `open` zet de laag open en geeft de knop
 * terug waar de focus naartoe moet als de laag weer dicht is, of null als de
 * focus niet verhuist; `isOpen` leest de stand uit de pagina.
 */
const LAGEN = {
  zoekvenster: {
    naam: "het zoekvenster",
    async open(page) {
      const knop = await zichtbaar(page, ".search-trigger");
      assert.ok(knop, "geen zichtbare .search-trigger");
      await knop.focus();
      await page.keyboard.press("Enter");
      return knop;
    },
    isOpen: (page) => page.evaluate(() => !!document.querySelector("dialog[open]")),
  },
  menu: {
    naam: "het mobiele menu",
    async open(page) {
      const knop = await zichtbaar(page, MENU);
      assert.ok(knop, `geen zichtbare ${MENU}`);
      await knop.focus();
      await page.keyboard.press("Enter");
      return knop;
    },
    isOpen: (page) => page.evaluate((s) => document.querySelector(s)?.getAttribute("aria-expanded") === "true", MENU),
  },
  themakeuze: {
    naam: "de themakeuze",
    async open(page) {
      const knop = await page.$(THEMA);
      assert.ok(knop, `geen ${THEMA}`);
      await knop.evaluate((el) => el.scrollIntoView());
      await knop.focus();
      await page.keyboard.press("Enter");
      return knop;
    },
    isOpen: (page) => page.evaluate((s) => document.querySelector(s)?.getAttribute("aria-expanded") === "true", THEMA),
  },
  markering: {
    naam: "de zoekmarkering",
    // Staat al open door ?q= in de route.
    open: async () => null,
    isOpen: (page) =>
      page.evaluate(() => document.querySelectorAll("mark[data-search-highlight]").length > 0 && !document.getElementById("highlight-bar").hidden),
  },
};

/** Een tooltip: `soort` is "data" (tooltip.js) of "bron" (referenties.js), `via` is "toets" of "aanwijzer". */
function tooltip(soort, via) {
  const trigger = soort === "data" ? ".mermaid-download" : ".ref-term";
  return {
    naam: `${soort === "data" ? "de tooltip" : "de bron-tooltip"} (${via === "toets" ? "toetsenbordfocus" : "aanwijzer"})`,
    async open(page) {
      if (via === "toets") {
        await tabNaar(page, trigger);
      } else {
        const element = await page.$(trigger);
        assert.ok(element, `geen ${trigger}`);
        await element.hover();
      }
      return null;
    },
    isOpen:
      soort === "data"
        ? (page) => page.evaluate(() => {
            const ballon = document.querySelector("body > .tooltip");
            return !!ballon && !ballon.hidden;
          })
        : (page) => page.evaluate(() => {
            const wrapper = [...document.querySelectorAll(".ref-wrapper")].find((w) => w.matches(":hover, :focus-within"));
            const tip = wrapper?.querySelector(".ref-tooltip");
            if (!tip) return false;
            const stijl = getComputedStyle(tip);
            return stijl.display !== "none" && stijl.visibility !== "hidden" && parseFloat(stijl.opacity) > 0.5;
          }),
  };
}

/**
 * Opent de lagen in de gegeven volgorde (buitenste eerst) en drukt dan voor
 * elke laag op Escape, binnenste eerst. Na elke toets: alleen die laag is
 * dicht en de focus staat waar hij hoort.
 */
async function sluitBinnenNaarBuiten(route, viewport, lagen) {
  const page = await open(route, viewport);
  try {
    const terug = [];
    for (const laag of lagen) {
      terug.push(await laag.open(page));
      assert.ok(await wacht(() => laag.isOpen(page)), `${laag.naam} gaat niet open`);
    }
    for (let i = lagen.length - 1; i >= 0; i--) {
      const focusVoor = await actiefElement(page);
      await page.keyboard.press("Escape");
      await pauze();
      assert.ok(await wacht(() => lagen[i].isOpen(page), false), `Escape sluit ${lagen[i].naam} niet`);
      for (let j = 0; j < i; j++) {
        assert.ok(await lagen[j].isOpen(page), `dezelfde Escape sluit ook ${lagen[j].naam}`);
      }
      if (terug[i]) {
        assert.ok(await heeftFocus(page, terug[i]), `de focus is niet teruggegaan naar de knop van ${lagen[i].naam}`);
      } else {
        assert.ok(await heeftFocus(page, focusVoor), `de focus is verhuisd bij het sluiten van ${lagen[i].naam}`);
      }
    }
  } finally {
    await page.close();
  }
}

const { zoekvenster, menu, themakeuze, markering } = LAGEN;

describe("Escape op een smal scherm (375 px)", () => {
  const gevallen = [
    ["/", [menu, zoekvenster]],
    [MARKEER_LANG, [markering, zoekvenster]],
    [DIAGRAM, [menu, tooltip("data", "toets")]],
    [LANG, [menu, tooltip("bron", "toets")]],
    [MARKEER_DIAGRAM, [markering, tooltip("data", "toets")]],
    [MARKEER_LANG, [markering, tooltip("bron", "toets")]],
    ["/", [menu, themakeuze]],
    [MARKEER_LANG, [markering, menu]],
    [MARKEER_LANG, [markering, themakeuze]],
    [MARKEER_DIAGRAM, [markering, menu, tooltip("data", "toets")]],
  ];
  for (const [route, lagen] of gevallen) {
    const namen = [...lagen].reverse().map((l) => l.naam);
    test(`eerst ${namen.join(", dan ")} (${route})`, () => sluitBinnenNaarBuiten(route, SMAL, lagen));
  }
});

describe("Escape op een breed scherm (1280 px)", () => {
  const gevallen = [
    [MARKEER_LANG, [markering, zoekvenster]],
    [DIAGRAM, [themakeuze, tooltip("data", "aanwijzer")]],
    [LANG, [themakeuze, tooltip("bron", "aanwijzer")]],
    [MARKEER_DIAGRAM, [markering, tooltip("data", "toets")]],
    [MARKEER_LANG, [markering, tooltip("bron", "toets")]],
    [MARKEER_LANG, [markering, themakeuze]],
  ];
  for (const [route, lagen] of gevallen) {
    const namen = [...lagen].reverse().map((l) => l.naam);
    test(`eerst ${namen.join(", dan ")} (${route})`, () => sluitBinnenNaarBuiten(route, BREED, lagen));
  }

  test("het zoekvenster gaat voor een tooltip die er nog staat", async () => {
    const page = await open(DIAGRAM);
    try {
      const knop = await zoekvenster.open(page);
      // Een echte aanwijzer kan niet door het venster heen; dit is de korte tijd tussen openen en uitkomen van pointerout.
      await page.evaluate(() => {
        document.querySelector(".mermaid-download").dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }));
      });
      const ballon = tooltip("data", "toets");
      assert.ok(await wacht(() => ballon.isOpen(page)), "de tooltip verschijnt niet");
      await page.keyboard.press("Escape");
      await pauze();
      assert.equal(await zoekvenster.isOpen(page), false, "Escape sluit het zoekvenster niet");
      assert.ok(await ballon.isOpen(page), "dezelfde Escape sluit ook de tooltip");
      assert.ok(await heeftFocus(page, knop), "de focus is niet teruggegaan naar de zoekknop");
      await page.keyboard.press("Escape");
      assert.ok(await wacht(() => ballon.isOpen(page), false), "de tweede Escape sluit de tooltip niet");
    } finally {
      await page.close();
    }
  });
});
