/**
 * Toetsenbord- en gedragstests in een echte browser (WCAG 2.1.1, 2.1.2, 2.4.1,
 * 2.4.3, 2.4.7, 1.4.13, 2.3.3, 4.1.2): Escape sluit het menu, het zoekvenster,
 * de themakeuze en een bron-tooltip, en de focus gaat terug naar waar hij
 * vandaan kwam. Een regex op de HTML ziet dit gedrag niet. Ook: de melding
 * over de zoekmarkering is de eerste focusstop in de inhoud en dekt niets af
 * (2.4.11), en de markering verschilt niet alleen in kleur (1.4.1).
 *
 * De selectors volgen het contract van de herbouw:
 *   - menuknop:    button[aria-controls="mobile-menu"], met vaste naam "Menu"
 *   - zoekknop:    .search-trigger, opent het <dialog>
 *   - themakeuze:  een button[aria-expanded] in .footer-settings
 *   - bron-tooltip: .ref-wrapper met .ref-term en .ref-tooltip
 *   - melding:     button#highlight-bar.toast bovenaan <main>, zichtbaar bij ?q= met een treffer
 *   - naar boven:  a.back-to-top, na een schermhoogte scrollen
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
async function open(route, viewport = BREED, { javascript = true, wortel } = {}) {
  const page = await browser.newPage();
  if (wortel) {
    // De lettergrootte-instelling van de browser (32 is 200%), niet `html { font-size }`:
    // een mediaquery in rem rekent ertegen en schaalt dan mee.
    const cdp = await page.createCDPSession();
    await cdp.send("Page.setFontSizes", { fontSizes: { standard: wortel, fixed: wortel } });
  }
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
      // De keuze Donker is een radio met een label, of een knop of role=radio met tekst.
      const donker = await page.evaluateHandle(() => {
        const opties = [...document.querySelectorAll('.footer-settings input[type="radio"], .footer-settings [role="radio"], .footer-settings button:not([aria-expanded])')];
        const tekst = (el) => (el.labels?.[0]?.textContent ?? el.textContent ?? "").trim();
        return opties.find((el) => /donker/i.test(tekst(el)));
      });
      const element = donker.asElement();
      assert.ok(element, "geen keuze Donker (radio of knop) in .footer-settings");
      await element.focus();
      await page.keyboard.press("Space");
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

describe("zoekveld (2.4.7)", () => {
  test("Shift+Tab van Sluiten naar het veld toont een focusring die de tekst niet raakt", async () => {
    const page = await open("/");
    try {
      const knop = await zichtbaar(page, ".search-trigger");
      assert.ok(knop, "geen zichtbare .search-trigger");
      await knop.focus();
      await page.keyboard.press("Enter");
      await page.type("#search-input", "pagina");
      await page.keyboard.press("Tab");
      assert.equal((await actief(page))?.id, "search-close", "de Tab vanuit het zoekveld gaat niet naar Sluiten");
      await page.keyboard.down("Shift");
      await page.keyboard.press("Tab");
      await page.keyboard.up("Shift");
      const veld = await page.evaluate(() => {
        const el = document.activeElement;
        const s = getComputedStyle(el);
        // Van de tekst tot de binnenkant van de ring: padding, rand en de ruimte tussen rand en ring.
        const afstand = (kant) => parseFloat(s[`padding${kant}`]) + parseFloat(s[`border${kant}Width`]) + parseFloat(s.outlineOffset);
        return {
          id: el.id,
          ring: el.matches(":focus-visible") && s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2,
          links: afstand("Left"),
          rechts: afstand("Right"),
        };
      });
      assert.equal(veld.id, "search-input", "Shift+Tab vanaf Sluiten gaat niet naar het zoekveld");
      assert.ok(veld.ring, "het zoekveld heeft geen zichtbare focusring");
      assert.ok(
        veld.links >= 8 && veld.rechts >= 8,
        `de tekst ligt ${veld.links}px (links) en ${veld.rechts}px (rechts) van de focusring; verwacht minstens 8px`,
      );
    } finally {
      await page.close();
    }
  });
});

describe("zoekmarkering niet alleen in kleur (1.4.1)", () => {
  test("een markering in lopende tekst is vetter dan de tekst eromheen", async () => {
    const page = await open("/onderdelen/links/?q=pagina");
    try {
      const marks = await page.evaluate(() =>
        [...document.querySelectorAll("mark[data-search-highlight]")].map((mark) => ({
          ouder: Number(getComputedStyle(mark.parentElement).fontWeight),
          mark: Number(getComputedStyle(mark).fontWeight),
          tekst: mark.parentElement.textContent.trim().replace(/\s+/g, " ").slice(0, 40),
        })),
      );
      const lopend = marks.filter((m) => m.ouder < 600);
      assert.ok(lopend.length > 0, "geen markering in lopende tekst bij ?q=pagina: de controle ziet niets");
      assert.deepEqual(
        lopend.filter((m) => m.mark <= m.ouder).map((m) => `${m.tekst} (${m.mark})`),
        [],
        "markeringen die alleen in kleur verschillen van de tekst eromheen",
      );
    } finally {
      await page.close();
    }
  });

  test("in tekst die al vet is, zoals een kop, is de markering onderstreept", async () => {
    const page = await open("/onderdelen/lange-pagina/?q=opsommingen");
    try {
      const marks = await page.evaluate(() =>
        [...document.querySelectorAll("mark[data-search-highlight]")]
          .filter((mark) => Number(getComputedStyle(mark.parentElement).fontWeight) >= 600)
          .map((mark) => ({ lijn: getComputedStyle(mark).textDecorationLine, tekst: mark.parentElement.textContent.trim().slice(0, 40) })),
      );
      assert.ok(marks.length > 0, "geen markering in vette tekst bij ?q=opsommingen: de controle ziet niets");
      assert.deepEqual(marks.filter((m) => !m.lijn.includes("underline")).map((m) => m.tekst), []);
    } finally {
      await page.close();
    }
  });

  test("in een zoekresultaat is de markering vet, en onderstreept in de titel die al vet is", async () => {
    const page = await open("/");
    try {
      const knop = await zichtbaar(page, ".search-trigger");
      assert.ok(knop, "geen zichtbare .search-trigger");
      await knop.focus();
      await page.keyboard.press("Enter");
      await page.type("#search-input", "pagina");
      await page.waitForSelector("#search-results .search-result-title mark");
      const stand = await page.evaluate(() => {
        const alle = (selector) => [...document.querySelectorAll(selector)].map((el) => getComputedStyle(el));
        return {
          fragment: alle(".search-result-snippet mark").map((s) => Number(s.fontWeight)),
          titel: alle(".search-result-title mark").map((s) => s.textDecorationLine),
        };
      });
      assert.ok(stand.fragment.length > 0, "geen markering in de tekst van een zoekresultaat");
      assert.deepEqual(stand.fragment.filter((gewicht) => gewicht < 700), [], "een markering in de tekst van een resultaat is niet vet");
      assert.deepEqual(stand.titel.filter((lijn) => !lijn.includes("underline")), [], "een markering in de titel van een resultaat is niet onderstreept");
    } finally {
      await page.close();
    }
  });
});

describe("melding over de zoekmarkering (2.4.3, 2.4.11)", () => {
  const ROUTE = "/onderdelen/lange-pagina/?q=opsommingen";
  const SMAL_LAAG = { width: 320, height: 640 };
  const STANDEN = [
    { naam: "320px breed", breedte: 320 },
    { naam: "768px breed", breedte: 768 },
    { naam: "1280px breed", breedte: 1280 },
    { naam: "320px breed met 200% tekst", breedte: 320, wortel: 32 },
    { naam: "1280px breed met 200% tekst", breedte: 1280, wortel: 32 },
  ];

  /** Opent een pagina met ?q= en controleert dat de melding in beeld staat. */
  async function metMelding(route = ROUTE, viewport = SMAL_LAAG, opties = {}) {
    const page = await open(route, viewport, opties);
    const staat = await page.evaluate(() => {
      const el = document.getElementById("highlight-bar");
      return !!el && !el.hidden && el.getClientRects().length > 0;
    });
    assert.ok(staat, `de melding #highlight-bar staat niet in beeld bij ${route}`);
    return page;
  }

  /** Skip-link, Enter en Tab, zoals een toetsenbordgebruiker naar de inhoud gaat; de focus hoort dan op de melding. */
  async function naarMelding(page) {
    await page.keyboard.press("Tab");
    assert.equal((await actief(page))?.href, "#main-content", "de eerste focusstop is niet de skip-link");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => ({ id: document.activeElement?.id, inMain: !!document.activeElement?.closest("main") }));
    assert.equal(stop.id, "highlight-bar", "de Tab na de skip-link gaat niet naar de melding");
    assert.ok(stop.inMain, "de melding staat niet in <main>");
  }

  for (const breedte of [320, 1280]) {
    test(`na de skip-link is de melding de eerste focusstop in <main> (${breedte}px breed)`, async () => {
      const page = await metMelding(ROUTE, { width: breedte, height: 640 });
      try {
        await naarMelding(page);
      } finally {
        await page.close();
      }
    });
  }

  for (const toets of ["Enter", "Escape"]) {
    test(`${toets} op de melding haalt de markering weg en zet de focus op <main>`, async () => {
      const page = await metMelding();
      try {
        await naarMelding(page);
        await page.keyboard.press(toets);
        const na = await page.evaluate(() => ({
          markeringen: document.querySelectorAll("mark[data-search-highlight]").length,
          verborgen: document.getElementById("highlight-bar").hidden,
          focus: document.activeElement?.id,
        }));
        assert.deepEqual(na, { markeringen: 0, verborgen: true, focus: "main-content" });
        await page.keyboard.press("Tab");
        assert.ok(await page.evaluate(() => !!document.activeElement?.closest("main")), "de Tab daarna gaat niet naar de inhoud");
      } finally {
        await page.close();
      }
    });
  }

  test("de melding schuift mee met de inhoud en ligt over geen focusbaar element", async () => {
    const page = await metMelding();
    try {
      const stand = await page.evaluate(() => {
        const beschrijf = (el) => `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") ?? el.textContent).trim().replace(/\s+/g, " ").slice(0, 30)}"`;
        const melding = document.getElementById("highlight-bar");
        const focusbaar = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter(
          (el) => el !== melding && el.getClientRects().length > 0,
        );
        const meet = (y) => {
          window.scrollTo({ top: y, behavior: "instant" });
          const m = melding.getBoundingClientRect();
          const raakt = (r) => r.width > 1 && r.height > 1 && r.left < m.right && m.left < r.right && r.top < m.bottom && m.top < r.bottom;
          return { boven: m.top, eronder: focusbaar.filter((el) => [...el.getClientRects()].some(raakt)).map(beschrijf) };
        };
        return { begin: meet(0), verder: meet(200) };
      });
      assert.equal(Math.round(stand.begin.boven - stand.verder.boven), 200, "de melding blijft staan bij scrollen in plaats van mee te schuiven");
      assert.deepEqual([...stand.begin.eronder, ...stand.verder.eronder], [], "focusbare elementen liggen onder de melding");
    } finally {
      await page.close();
    }
  });

  test("de melding markeert haar eigen tekst niet", async () => {
    // "markering" staat op de lange pagina alleen in de tekst van de melding.
    const zonder = await open("/onderdelen/lange-pagina/?q=markering");
    try {
      const stand = await zonder.evaluate(() => ({
        markeringen: document.querySelectorAll("mark").length,
        melding: document.getElementById("highlight-bar")?.hidden === false,
      }));
      assert.deepEqual(stand, { markeringen: 0, melding: false }, "?q=markering markeert de tekst van de melding zelf");
    } finally {
      await zonder.close();
    }
    // "de" staat in de pagina en in "Verwijder de markering".
    const page = await metMelding("/onderdelen/lange-pagina/?q=de");
    try {
      assert.equal(await page.evaluate(() => document.querySelectorAll("#highlight-bar mark").length), 0, "de melding bevat een <mark>");
    } finally {
      await page.close();
    }
  });

  /**
   * Loopt met Tab van het begin van de pagina tot de focus terug is bij het begin. Per focusstop: raakt hij de
   * melding, en hoeveel meetpunten in beeld vallen op het element zelf en niet op iets erboven. De punten liggen
   * per regel (getClientRects): de omhullende rechthoek van een link over twee regels bevat ook tekst ernaast.
   */
  async function tabWandeling(page) {
    await page.evaluate(() => window.scrollTo(0, 0));
    const stops = [];
    for (let i = 0; i < 150; i++) {
      await page.keyboard.press("Tab");
      // base.js zet de knop naar boven in het frame na een scroll aan of uit.
      await page.evaluate(() => new Promise((klaar) => requestAnimationFrame(() => requestAnimationFrame(klaar))));
      const stop = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body || el.dataset.tabGezien) return { einde: true };
        el.dataset.tabGezien = "1";
        const melding = document.getElementById("highlight-bar");
        const m = melding.getBoundingClientRect();
        let raakt = false;
        let punten = 0;
        let vrij = 0;
        for (const r of el.getClientRects()) {
          if (el !== melding && r.width > 1 && r.height > 1 && r.left < m.right && m.left < r.right && r.top < m.bottom && m.top < r.bottom) raakt = true;
          for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) {
            for (const fy of [0.25, 0.5, 0.75]) {
              const x = r.left + r.width * fx;
              const y = r.top + r.height * fy;
              if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
              punten++;
              const bovenop = document.elementFromPoint(x, y);
              if (bovenop && el.contains(bovenop)) vrij++;
            }
          }
        }
        const tekst = (el.getAttribute("aria-label") ?? el.textContent).trim().replace(/\s+/g, " ").slice(0, 30);
        return { naam: `${el.tagName.toLowerCase()} "${tekst}"`, melding: el === melding, raakt, punten, vrij };
      });
      if (stop.einde) break;
      stops.push(stop);
    }
    return stops;
  }

  for (const { naam, breedte, wortel } of STANDEN) {
    test(`Tab langs de hele pagina: geen focusstop onder de melding of geheel uit het zicht (${naam})`, async (t) => {
      const page = await metMelding(ROUTE, { width: breedte, height: 640 }, { wortel });
      try {
        const stops = await tabWandeling(page);
        t.diagnostic(`${stops.length} focusstops`);
        assert.ok(stops.length >= 30, `maar ${stops.length} focusstops op de pagina; verwacht minstens 30`);
        assert.ok(stops.some((s) => s.melding), "de wandeling komt niet langs de melding");
        assert.ok(stops.some((s) => s.naam.includes("Weergave")), "de wandeling komt niet bij de themakeuze in de voet");
        assert.deepEqual(stops.filter((s) => s.raakt).map((s) => s.naam), [], "focusstops liggen (deels) onder de melding");
        assert.deepEqual(
          stops.filter((s) => s.vrij === 0).map((s) => `${s.naam} (${s.punten} meetpunten in beeld)`),
          [],
          "focusstops zijn geheel bedekt of vallen buiten beeld (2.4.11)",
        );
      } finally {
        await page.close();
      }
    });
  }

  for (const breedte of [320, 1280]) {
    test(`de knop naar boven en de ruimte onderaan hangen niet af van de melding (${breedte}px breed)`, async () => {
      /** De knop en de ruimtes onderaan, met de pagina helemaal naar onderen gescrold. */
      async function onderaan(route) {
        const page = await open(route, { width: breedte, height: 640 });
        try {
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          const knop = await page
            .waitForFunction(() => document.querySelector("a.back-to-top")?.hidden === false, { timeout: 2000 })
            .then(() => true, () => false);
          assert.ok(knop, "a.back-to-top verschijnt niet na onderaan scrollen; staat params.back_to_top aan?");
          return await page.evaluate(() => {
            const voet = document.querySelector("body > footer");
            const marge = (el) => getComputedStyle(el).scrollMarginBottom;
            return {
              getoond: document.getElementById("highlight-bar")?.hidden === false,
              knop: document.querySelector("a.back-to-top").getBoundingClientRect().toJSON(),
              voet: getComputedStyle(voet).paddingBottom,
              margeInhoud: marge(document.querySelector("main a[href]")),
              margeVoet: marge(voet.querySelector("a[href]")),
            };
          });
        } finally {
          await page.close();
        }
      }
      const { getoond: zonderGetoond, ...zonder } = await onderaan("/onderdelen/lange-pagina/");
      const { getoond: metGetoond, ...met } = await onderaan(ROUTE);
      assert.equal(zonderGetoond, false, "de melding staat in beeld zonder ?q=");
      assert.equal(metGetoond, true, "de melding staat niet in beeld bij ?q=inleiding");
      assert.deepEqual(met, zonder);
    });
  }
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
