/**
 * Toetsenbord- en gedragstests in een echte browser (WCAG 2.1.1, 2.1.2, 2.4.1,
 * 2.4.3, 2.4.7, 1.4.13, 2.3.3, 4.1.2): Escape sluit het menu, het zoekvenster,
 * de themakeuze en een bron-tooltip, en de focus gaat terug naar waar hij
 * vandaan kwam. Een regex op de HTML ziet dit gedrag niet.
 *
 * De selectors volgen het contract van de herbouw:
 *   - menuknop:    button[aria-controls="mobile-menu"], met vaste naam "Menu"
 *   - zoekknop:    .search-trigger, opent het <dialog>
 *   - themakeuze:  een button[aria-expanded] in .footer-settings
 *   - bron-tooltip: .ref-wrapper met .ref-term en .ref-tooltip
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
const SMAL = { width: 400, height: 800 };

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

/** Opent een pagina in een nieuw tabblad en geeft die terug; sluit zelf af met `klaar`. */
async function open(route, viewport = BREED, { javascript = true } = {}) {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(javascript);
  await page.setViewport(viewport);
  await page.goto(baseUrl + route, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/** Het eerste element dat past bij de selector en echt zichtbaar is. */
async function zichtbaar(page, selector) {
  const handles = await page.$$(selector);
  for (const handle of handles) {
    const zichtbaarNu = await handle.evaluate((el) => {
      const stijl = getComputedStyle(el);
      return el.getClientRects().length > 0 && stijl.visibility !== "hidden";
    });
    if (zichtbaarNu) return handle;
  }
  return null;
}

const actief = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el ? { tag: el.tagName.toLowerCase(), id: el.id, klasse: el.className?.toString?.() ?? "", href: el.getAttribute("href") } : null;
  });

/** Staat de focus op precies dit element? */
const heeftFocus = (page, handle) => page.evaluate((el) => document.activeElement === el, handle);

describe("skip-link (2.4.1)", () => {
  test("de eerste Tab gaat naar de skip-link en Enter zet de focus in <main>", async () => {
    const page = await open("/");
    try {
      await page.keyboard.press("Tab");
      const eerste = await actief(page);
      assert.equal(eerste?.href, "#main-content", "de eerste focusstop is niet de skip-link");
      await page.keyboard.press("Enter");
      const nu = await actief(page);
      assert.equal(nu?.id, "main-content", "de focus verhuist niet mee naar <main>");
    } finally {
      await page.close();
    }
  });
});

describe("menu op een smal scherm (2.1.1, 4.1.2)", () => {
  async function menuKnop(page) {
    const knop = await zichtbaar(page, 'button[aria-controls="mobile-menu"]');
    assert.ok(knop, 'geen zichtbare button[aria-controls="mobile-menu"] bij 400px breed');
    return knop;
  }
  const verwacht = (knop) => knop.evaluate((el) => el.getAttribute("aria-expanded"));
  const menuZichtbaar = (page) =>
    page.evaluate(() => {
      const menu = document.getElementById("mobile-menu");
      return !!menu && !menu.hidden && menu.getClientRects().length > 0 && getComputedStyle(menu).visibility !== "hidden";
    });

  test("de knop heet Menu, en die naam verandert niet als het menu opent", async () => {
    const page = await open("/", SMAL);
    try {
      const knop = await menuKnop(page);
      const naam = () => knop.evaluate((el) => (el.getAttribute("aria-label") ?? el.textContent).trim());
      assert.equal(await naam(), "Menu");
      await knop.focus();
      await page.keyboard.press("Enter");
      assert.equal(await naam(), "Menu");
    } finally {
      await page.close();
    }
  });

  test("Enter opent het menu, Escape sluit het en de focus gaat terug naar de knop", async () => {
    const page = await open("/", SMAL);
    try {
      const knop = await menuKnop(page);
      assert.equal(await verwacht(knop), "false");
      assert.equal(await menuZichtbaar(page), false, "het menu is zichtbaar terwijl aria-expanded=false");
      await knop.focus();
      await page.keyboard.press("Enter");
      assert.equal(await verwacht(knop), "true");
      assert.equal(await menuZichtbaar(page), true, "het menu opent niet");
      await page.keyboard.press("Escape");
      assert.equal(await verwacht(knop), "false");
      assert.equal(await menuZichtbaar(page), false, "het menu sluit niet");
      assert.ok(await heeftFocus(page, knop), "de focus is niet teruggegaan naar de menuknop");
    } finally {
      await page.close();
    }
  });

  test("Escape met de focus in het menu zet de focus terug op de knop", async () => {
    const page = await open("/", SMAL);
    try {
      const knop = await menuKnop(page);
      await knop.focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Tab");
      const binnen = await page.evaluate(() => !!document.activeElement?.closest("#mobile-menu"));
      assert.ok(binnen, "de eerste Tab na het openen gaat niet naar een link in het menu");
      await page.keyboard.press("Escape");
      assert.equal(await verwacht(knop), "false");
      assert.ok(await heeftFocus(page, knop), "de focus is niet teruggegaan naar de menuknop");
    } finally {
      await page.close();
    }
  });
});

describe("zoekvenster (2.1.1, 2.1.2, 2.1.4)", () => {
  for (const [naam, viewport] of [["breed scherm", BREED], ["smal scherm", SMAL]]) {
    test(`Enter opent het venster, Escape sluit het en de focus gaat terug naar de zoekknop (${naam})`, async () => {
      const page = await open("/", viewport);
      try {
        const knop = await zichtbaar(page, ".search-trigger");
        assert.ok(knop, "geen zichtbare .search-trigger");
        await knop.focus();
        await page.keyboard.press("Enter");
        const open1 = await page.evaluate(() => {
          const dialog = document.querySelector("dialog[open]");
          return { open: !!dialog, focusBinnen: !!dialog && dialog.contains(document.activeElement) };
        });
        assert.ok(open1.open, "het zoekvenster opent niet");
        assert.ok(open1.focusBinnen, "de focus staat niet in het zoekvenster");
        await page.keyboard.press("Escape");
        assert.equal(await page.evaluate(() => !!document.querySelector("dialog[open]")), false, "het zoekvenster sluit niet");
        assert.ok(await heeftFocus(page, knop), "de focus is niet teruggegaan naar de zoekknop");
      } finally {
        await page.close();
      }
    });
  }

  test("Ctrl+K opent het venster en de knop kondigt de sneltoets aan", async () => {
    const page = await open("/");
    try {
      const knop = await zichtbaar(page, ".search-trigger");
      assert.ok(knop, "geen zichtbare .search-trigger");
      const sneltoets = await knop.evaluate((el) => el.getAttribute("aria-keyshortcuts"));
      assert.match(sneltoets ?? "", /Control\+K/, "aria-keyshortcuts ontbreekt of noemt Control+K niet");
      const hint = await page.$(".search-trigger kbd.search-shortcut");
      assert.ok(hint, "geen zichtbare kbd.search-shortcut in de zoekknop");
      assert.equal(await hint.evaluate((el) => el.getAttribute("aria-hidden")), "true");
      await page.keyboard.down("Control");
      await page.keyboard.press("k");
      await page.keyboard.up("Control");
      assert.ok(await page.evaluate(() => !!document.querySelector("dialog[open]")), "Ctrl+K opent het zoekvenster niet");
      await page.keyboard.press("Escape");
    } finally {
      await page.close();
    }
  });

  test("een gewone letter zonder modifier opent het venster niet (2.1.4)", async () => {
    const page = await open("/");
    try {
      for (const toets of ["/", "k", "s"]) await page.keyboard.press(toets);
      assert.equal(await page.evaluate(() => !!document.querySelector("dialog[open]")), false);
    } finally {
      await page.close();
    }
  });
});

describe("themakeuze in de voet", () => {
  const OPENER = ".footer-settings button[aria-expanded]";

  test("Enter opent de keuze, Escape sluit hem en de focus gaat terug naar de knop", async () => {
    const page = await open("/");
    try {
      const knop = await page.$(OPENER);
      assert.ok(knop, `geen ${OPENER}; de themakeuze is een uitklapknop in .footer-settings`);
      await knop.evaluate((el) => el.scrollIntoView());
      await knop.focus();
      await page.keyboard.press("Enter");
      assert.equal(await knop.evaluate((el) => el.getAttribute("aria-expanded")), "true", "de themakeuze opent niet");
      const paneelZichtbaar = await knop.evaluate((el) => {
        const paneel = document.getElementById(el.getAttribute("aria-controls") ?? "");
        return !!paneel && !paneel.hidden && paneel.getClientRects().length > 0;
      });
      assert.ok(paneelZichtbaar, "het paneel van aria-controls is niet zichtbaar");
      await page.keyboard.press("Escape");
      assert.equal(await knop.evaluate((el) => el.getAttribute("aria-expanded")), "false", "de themakeuze sluit niet");
      assert.ok(await heeftFocus(page, knop), "de focus is niet teruggegaan naar de knop van de themakeuze");
    } finally {
      await page.close();
    }
  });

  test("een gekozen schema zet data-scheme en bewaart alleen de sleutel theme", async () => {
    const page = await open("/");
    try {
      const knop = await page.$(OPENER);
      assert.ok(knop, `geen ${OPENER}`);
      await knop.evaluate((el) => el.scrollIntoView());
      await knop.focus();
      await page.keyboard.press("Enter");
      const donker = await page.evaluateHandle(() => [...document.querySelectorAll(".footer-settings button, .footer-settings [role=radio]")].find((b) => /donker/i.test(b.textContent)));
      const element = donker.asElement();
      assert.ok(element, "geen knop Donker in .footer-settings");
      await element.focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-scheme")), "dark");
      const sleutels = await page.evaluate(() => Object.keys(localStorage));
      assert.deepEqual(sleutels, ["theme"]);
    } finally {
      await page.close();
    }
  });
});

describe("bron-tooltip (1.4.13)", () => {
  test("verschijnt bij focus en sluit met Escape zonder dat de focus verspringt", async () => {
    const page = await open("/onderdelen/lange-pagina/");
    try {
      const term = await page.$(".ref-wrapper .ref-term");
      assert.ok(term, "geen .ref-wrapper .ref-term op de lange pagina");
      await term.focus();
      // De tooltip schakelt met een korte overgang; wacht tot hij de verwachte stand heeft.
      const tipIs = async (verwacht) => {
        for (let i = 0; i < 20; i++) {
          const zichtbaarNu = await term.evaluate((el) => {
            const tip = el.closest(".ref-wrapper").querySelector(".ref-tooltip");
            const stijl = getComputedStyle(tip);
            return stijl.display !== "none" && stijl.visibility !== "hidden" && parseFloat(stijl.opacity) > 0.5;
          });
          if (zichtbaarNu === verwacht) return true;
          await new Promise((klaar) => setTimeout(klaar, 50));
        }
        return false;
      };
      assert.ok(await tipIs(true), "de tooltip verschijnt niet bij focus");
      await page.keyboard.press("Escape");
      assert.ok(await tipIs(false), "Escape sluit de tooltip niet");
      assert.ok(await heeftFocus(page, term), "de focus is verspringd na Escape");
    } finally {
      await page.close();
    }
  });
});

describe("focus (2.4.3, 2.4.7)", () => {
  test("elke focusstop op de homepage is zichtbaar en heeft een zichtbare focusindicator", async () => {
    const page = await open("/");
    const bevindingen = [];
    try {
      let aantal = 0;
      for (let i = 0; i < 80; i++) {
        await page.keyboard.press("Tab");
        const stop = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return { einde: true };
          // Een element dat we al hadden: de focus is een rondje gegaan, zonder val.
          if (el.dataset.tabGezien) return { einde: true };
          el.dataset.tabGezien = "1";
          const stijl = getComputedStyle(el);
          const naam =
            el.tagName.toLowerCase() +
            (el.id ? `#${el.id}` : "") +
            (el.className?.toString().trim() ? `.${el.className.toString().trim().split(/\s+/).join(".")}` : "") +
            ` "${(el.getAttribute("aria-label") ?? el.textContent).trim().slice(0, 30)}"`;
          return {
            naam,
            zichtbaar: el.getClientRects().length > 0 && stijl.visibility !== "hidden",
            // Een ring op het element, op zijn ::before of ::after (een uitgerekte kaartlink), of op een
            // ouder die de focus bevat.
            indicator: (() => {
              const toont = (s) => (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none";
              if (toont(stijl) || toont(getComputedStyle(el, "::before")) || toont(getComputedStyle(el, "::after"))) return true;
              for (let ouder = el.parentElement, n = 0; ouder && n < 4; ouder = ouder.parentElement, n++) {
                const s = getComputedStyle(ouder);
                if (ouder.matches(":focus-within") && s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) return true;
              }
              return false;
            })(),
          };
        });
        if (stop.einde) break;
        aantal++;
        if (!stop.zichtbaar) bevindingen.push(`${stop.naam}: focus op een onzichtbaar element`);
        else if (!stop.indicator) bevindingen.push(`${stop.naam}: geen outline of box-shadow bij focus`);
      }
      assert.ok(aantal >= 8, `maar ${aantal} focusstops op de homepage; verwacht minstens 8`);
      assert.deepEqual(bevindingen, []);
    } finally {
      await page.close();
    }
  });
});

describe("bewegingsvoorkeur (2.3.3)", () => {
  for (const route of ["/", "/onderdelen/lange-pagina/"]) {
    test(`prefers-reduced-motion: geen overgangen of animaties op ${route}`, async () => {
      const page = await open(route);
      try {
        await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
        const bevindingen = await page.evaluate(() => {
          const tijd = (waarde) => Math.max(...waarde.split(",").map((t) => (t.trim().endsWith("ms") ? parseFloat(t) : parseFloat(t) * 1000) || 0));
          const uit = [];
          if (getComputedStyle(document.documentElement).scrollBehavior === "smooth") uit.push("html: scroll-behavior smooth");
          for (const el of document.querySelectorAll("*")) {
            const stijl = getComputedStyle(el);
            if (tijd(stijl.transitionDuration) > 1 && stijl.transitionProperty !== "none") uit.push(`${el.tagName.toLowerCase()}.${el.className}: transition ${stijl.transitionDuration}`);
            if (tijd(stijl.animationDuration) > 1 && stijl.animationName !== "none") uit.push(`${el.tagName.toLowerCase()}.${el.className}: animation ${stijl.animationDuration}`);
          }
          return [...new Set(uit)].slice(0, 10);
        });
        assert.deepEqual(bevindingen, []);
      } finally {
        await page.close();
      }
    });
  }
});

describe("zonder JavaScript", () => {
  test("de homepage toont kop, inhoud en hoofdnavigatie op een breed scherm", async () => {
    const page = await open("/", BREED, { javascript: false });
    try {
      const staat = await page.evaluate(() => {
        const zichtbaar = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
        const links = [...document.querySelectorAll("nav a")].filter(zichtbaar).map((a) => a.getAttribute("href"));
        return { h1: zichtbaar(document.querySelector("h1")), main: zichtbaar(document.querySelector("main")), links };
      });
      assert.ok(staat.h1, "de h1 is niet zichtbaar zonder JavaScript");
      assert.ok(staat.main, "<main> is niet zichtbaar zonder JavaScript");
      assert.ok(staat.links.some((href) => href.includes("onderdelen")), "geen zichtbare link naar Onderdelen in een nav zonder JavaScript");
    } finally {
      await page.close();
    }
  });
});
