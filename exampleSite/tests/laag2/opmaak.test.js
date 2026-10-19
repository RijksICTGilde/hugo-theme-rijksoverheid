/**
 * Opmaak in een echte browser, voor wat een regex op de CSS niet ziet: hoe de
 * regels samen uitpakken bij vergrote tekst, in de afdruk en op een smal of
 * breed scherm.
 *
 * Bouw eerst de site (`npm run build`): `public` en `public-nieuw-venster`.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";
import { PUPPETEER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds } from "../lib/site.js";

const BUILDS = builds();

let browser;
const servers = [];
const baseUrls = [];

before(async () => {
  browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
  for (const [i, build] of BUILDS.entries()) {
    assert.ok(existsSync(build.dir), `${build.dir} bestaat niet; draai eerst npm run build`);
    servers[i] = await startServer(build.dir);
    baseUrls[i] = `http://127.0.0.1:${servers[i].address().port}`;
  }
});

after(async () => {
  await browser?.close();
  for (const server of servers) server?.close();
});

/**
 * Opent een pagina in een nieuw tabblad. `wortel` is de lettergrootte-instelling
 * van de browser (niet `html { font-size }`): een mediaquery in rem rekent
 * ertegen en schaalt dus mee.
 */
async function open(route, { build = 0, breedte = 1280, hoogte = 900, wortel, afdruk = false, voorkeur } = {}) {
  const page = await browser.newPage();
  if (wortel) {
    const cdp = await page.createCDPSession();
    await cdp.send("Page.setFontSizes", { fontSizes: { standard: wortel, fixed: wortel } });
  }
  await page.setViewport({ width: breedte, height: hoogte });
  if (afdruk || voorkeur) {
    // Via CDP in één keer: emulateMediaType en emulateMediaFeatures van puppeteer heffen elkaar op.
    const cdp = await page.createCDPSession();
    await cdp.send("Emulation.setEmulatedMedia", {
      media: afdruk ? "print" : "",
      features: voorkeur ? [{ name: "prefers-color-scheme", value: voorkeur }] : [],
    });
  }
  await page.goto(baseUrls[build] + route, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/**
 * Contrastverhouding (WCAG) van twee CSS-kleuren. De browser zet ze zelf om
 * naar sRGB, dus ook oklch en light-dark() uit de tokens.
 */
function contrast(page, voor, achter) {
  return page.evaluate(
    (a, b) => {
      const canvas = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
      const luminantie = (kleur) => {
        canvas.clearRect(0, 0, 1, 1);
        canvas.fillStyle = kleur;
        canvas.fillRect(0, 0, 1, 1);
        const [r, g, b] = Array.from(canvas.getImageData(0, 0, 1, 1).data.slice(0, 3), (n) => {
          const c = n / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const [licht, donker] = [luminantie(a), luminantie(b)].sort((x, y) => y - x);
      return (licht + 0.05) / (donker + 0.05);
    },
    voor,
    achter,
  );
}

describe("zoekfilters (1.4.11)", () => {
  for (const schema of ["light", "dark"]) {
    test(`de rand van een filterknop haalt 3:1 tegen het zoekvenster (${schema})`, async () => {
      const page = await open(`/?scheme=${schema}`);
      try {
        const kleuren = await page.evaluate(() => {
          const filter = document.querySelector(".search-filter:not(.active)");
          const stijl = getComputedStyle(filter);
          return {
            rand: stijl.borderTopColor,
            randBreedte: stijl.borderTopWidth,
            venster: getComputedStyle(document.querySelector(".search-modal-content")).backgroundColor,
          };
        });
        assert.notEqual(kleuren.randBreedte, "0px", "de filterknop heeft geen rand");
        const verhouding = await contrast(page, kleuren.rand, kleuren.venster);
        assert.ok(verhouding >= 3, `rand ${kleuren.rand} tegen ${kleuren.venster}: ${verhouding.toFixed(2)}:1`);
      } finally {
        await page.close();
      }
    });
  }
});

describe("kaarten (1.4.3)", () => {
  for (const schema of ["light", "dark"]) {
    test(`de titel van een kaart heeft de linkkleur en minstens 4,5:1 tegen de achtergrond (${schema})`, async () => {
      const page = await open(`/?scheme=${schema}`);
      try {
        const kleuren = await page.evaluate(() => {
          const titel = document.querySelector(".card header a");
          if (!titel) return null;
          // Een gewone link in de tekst is de maat voor "de linkkleur".
          const proef = document.createElement("a");
          proef.href = "#";
          document.querySelector("main").append(proef);
          const link = getComputedStyle(proef).color;
          proef.remove();
          let achtergrond = "";
          for (let el = titel; el; el = el.parentElement) {
            const kleur = getComputedStyle(el).backgroundColor;
            if (kleur !== "rgba(0, 0, 0, 0)") {
              achtergrond = kleur;
              break;
            }
          }
          return { titel: getComputedStyle(titel).color, link, achtergrond };
        });
        assert.ok(kleuren, "geen kaart op de homepage");
        assert.equal(kleuren.titel, kleuren.link, "de kaarttitel heeft niet de kleur van een gewone link");
        const verhouding = await contrast(page, kleuren.titel, kleuren.achtergrond);
        assert.ok(verhouding >= 4.5, `${verhouding.toFixed(2)}:1`);
      } finally {
        await page.close();
      }
    });
  }
});

describe("skip-link", () => {
  for (const wortel of [16, 32]) {
    test(`staat buiten beeld tot de focus erop komt, ook bij ${wortel}px basistekst`, async () => {
      const page = await open("/", { wortel });
      try {
        // De hoogte is geen heel getal: staat de onderrand precies op 0, dan toont de afronding een streep.
        const verborgen = await page.evaluate(() => document.querySelector(".skip-link").getBoundingClientRect().bottom);
        assert.ok(verborgen <= -1, `de onderrand staat op ${verborgen}px; verwacht minstens 1px boven het beeld`);
        await page.keyboard.press("Tab");
        const staat = await page.evaluate(() => {
          const link = document.activeElement;
          const vak = link.getBoundingClientRect();
          const bovenaan = (x, y) => document.elementFromPoint(x, y) === link;
          return {
            skipLink: link.classList.contains("skip-link"),
            links: vak.left,
            boven: vak.top,
            onbedekt: [[vak.left + 1, vak.top + 1], [vak.right - 1, vak.bottom - 1], [(vak.left + vak.right) / 2, (vak.top + vak.bottom) / 2]].every(([x, y]) => bovenaan(x, y)),
          };
        });
        assert.ok(staat.skipLink, "de eerste Tab komt niet op de skip-link");
        assert.ok(staat.links >= 0 && staat.boven >= 0, `de skip-link staat bij focus op ${staat.links},${staat.boven}`);
        assert.ok(staat.onbedekt, "de skip-link wordt bij focus deels bedekt");
      } finally {
        await page.close();
      }
    });
  }
});

describe("zwevende vlakken (1.4.11)", () => {
  for (const schema of ["light", "dark"]) {
    test(`tooltip, themapaneel en toast hebben dezelfde rand van minstens 3:1 (${schema})`, async () => {
      // Het diagram heeft een knop met data-tooltip; zonder zo'n element maakt tooltip.js geen ballon.
      const page = await open(`/onderdelen/diagram/?scheme=${schema}`);
      try {
        const vlakken = await page.evaluate(() => {
          const stijl = (selector) => {
            const element = document.querySelector(selector);
            if (!element) return null;
            const s = getComputedStyle(element);
            return { rand: s.borderTopColor, breedte: s.borderTopWidth, vlak: s.backgroundColor };
          };
          return {
            tooltip: stijl(".tooltip"),
            themapaneel: stijl(".theme-options"),
            toast: stijl(".toast"),
            pagina: getComputedStyle(document.body).backgroundColor,
          };
        });
        const bevindingen = [];
        for (const naam of ["tooltip", "themapaneel", "toast"]) {
          const vlak = vlakken[naam];
          if (!vlak) {
            bevindingen.push(`${naam}: niet in de pagina`);
            continue;
          }
          if (vlak.breedte === "0px") bevindingen.push(`${naam}: geen rand`);
          if (vlak.rand !== vlakken.tooltip?.rand) bevindingen.push(`${naam}: rand ${vlak.rand} wijkt af van de tooltip`);
          for (const [tegen, kleur] of [["het vlak", vlak.vlak], ["de pagina", vlakken.pagina]]) {
            const verhouding = await contrast(page, vlak.rand, kleur);
            if (verhouding < 3) bevindingen.push(`${naam}: rand tegen ${tegen} ${verhouding.toFixed(2)}:1`);
          }
        }
        assert.deepEqual(bevindingen, []);
      } finally {
        await page.close();
      }
    });
  }
});

describe("iconen van links bij geforceerde kleuren (1.4.1)", () => {
  test("het slot en het externe-linkicoon blijven zichtbaar in forced-colors", async () => {
    const nieuwVenster = BUILDS.findIndex((build) => build.nieuwVenster);
    assert.notEqual(nieuwVenster, -1, "geen build met nieuw_venster: true");
    const page = await open("/onderdelen/links/", { build: nieuwVenster });
    try {
      await page.emulateMediaFeatures([{ name: "forced-colors", value: "active" }]);
      const uitslag = await page.evaluate(() => {
        const achtergrond = (selector) => {
          const link = document.querySelector(selector);
          return link ? getComputedStyle(link, "::after").backgroundColor : null;
        };
        const tekst = getComputedStyle(document.body);
        return {
          pagina: tekst.backgroundColor,
          tekst: tekst.color,
          slot: achtergrond('main a[rel~="private"]'),
          extern: achtergrond('main a[target="_blank"][rel~="external"]:not([rel~="private"])'),
        };
      });
      assert.ok(uitslag.slot && uitslag.extern, "geen besloten of externe link op de pagina");
      for (const icoon of ["slot", "extern"]) {
        assert.notEqual(uitslag[icoon], uitslag.pagina, `het ${icoon}icoon heeft de kleur van de pagina (${uitslag.pagina})`);
        assert.equal(uitslag[icoon], uitslag.tekst, `het ${icoon}icoon heeft niet de tekstkleur van het systeem`);
      }
    } finally {
      await page.close();
    }
  });
});

describe("zoekmarkering (1.3.1, 4.1.2)", () => {
  test("gegenereerde tekst komt niet in de naam van een kop of link", async () => {
    const page = await open("/onderdelen/links/?q=pagina");
    try {
      await page.waitForSelector("mark[data-search-highlight]");
      const cdp = await page.createCDPSession();
      const { nodes } = await cdp.send("Accessibility.getFullAXTree");
      const namen = nodes
        .filter((node) => !node.ignored && ["heading", "link"].includes(node.role?.value))
        .map((node) => node.name?.value ?? "");
      assert.ok(
        namen.some((naam) => /pagina/i.test(naam)),
        "geen kop of link met de zoekterm: de controle ziet de markering niet",
      );
      assert.deepEqual(namen.filter((naam) => /gemarkeerd/i.test(naam)), []);
    } finally {
      await page.close();
    }
  });
});

describe("zoekvenster bij vergrote tekst (1.4.4)", () => {
  for (const breedte of [320, 360, 412]) {
    test(`veld en sluitknop blijven in beeld bij ${breedte}px breed met 16 tot 32px basistekst`, async () => {
      const bevindingen = [];
      for (const wortel of [16, 20, 24, 32]) {
        const page = await open("/", { breedte, wortel });
        try {
          const knop = await page.evaluateHandle(() =>
            [...document.querySelectorAll(".search-trigger")].find((el) => el.getClientRects().length > 0),
          );
          await knop.asElement().click();
          await page.waitForSelector("dialog.search-modal[open]");
          const uitslag = await page.evaluate(() => {
            const vak = (selector) => document.querySelector(selector).getBoundingClientRect();
            const venster = { breedte: document.documentElement.clientWidth, hoogte: window.innerHeight };
            const inhoud = vak(".search-modal-content");
            const buiten = [];
            // 0,5px marge voor subpixelafronding.
            if (inhoud.left < -0.5 || inhoud.right > venster.breedte + 0.5) buiten.push("het zoekvenster");
            for (const [naam, selector] of [
              ["het icoon", ".search-modal-header .search-icon"],
              ["het veld", ".search-modal .search-input"],
              ["de sluitknop", "#search-close"],
            ]) {
              const el = vak(selector);
              if (el.left < inhoud.left - 0.5 || el.right > inhoud.right + 0.5) buiten.push(`${naam} (buiten het zoekvenster)`);
              if (el.left < -0.5 || el.right > venster.breedte + 0.5 || el.top < -0.5 || el.bottom > venster.hoogte + 0.5) {
                buiten.push(`${naam} (buiten beeld)`);
              }
            }
            const overloop = document.documentElement.scrollWidth - venster.breedte;
            if (overloop > 1) buiten.push(`horizontale overloop van ${overloop}px`);
            return buiten;
          });
          for (const regel of uitslag) bevindingen.push(`${wortel}px basistekst: ${regel}`);
        } finally {
          await page.close();
        }
      }
      assert.deepEqual(bevindingen, []);
    });
  }
});

describe("externe links in de afdruk", () => {
  const linksOp = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll("main a[href]")].map((a) => {
        const stijl = getComputedStyle(a, "::after");
        return {
          href: a.getAttribute("href"),
          rel: a.getAttribute("rel") ?? "",
          content: stijl.content,
          mask: stijl.maskImage,
          display: stijl.display,
        };
      }),
    );
  const isExtern = (link) => /\bexternal\b/.test(link.rel);
  const isBesloten = (link) => /\bprivate\b/.test(link.rel);

  for (const [i, build] of BUILDS.entries()) {
    test(`een externe of besloten link toont zijn URL zonder icoon (${build.naam})`, async () => {
      const page = await open("/onderdelen/links/", { build: i, afdruk: true });
      try {
        const links = await linksOp(page);
        const extern = links.filter(isExtern);
        assert.ok(extern.some((link) => !isBesloten(link)), "geen gewone externe link op de pagina");
        assert.ok(extern.some(isBesloten), "geen besloten link op de pagina");
        const bevindingen = [];
        for (const link of extern) {
          if (link.content !== `" (${link.href})"`) bevindingen.push(`${link.href}: content ${link.content}`);
          if (link.mask !== "none") bevindingen.push(`${link.href}: icoon (mask-image) blijft staan`);
          if (link.display !== "inline") bevindingen.push(`${link.href}: display ${link.display}`);
        }
        assert.deepEqual(bevindingen, []);
      } finally {
        await page.close();
      }
    });

    test(`een interne link krijgt geen URL achter zich (${build.naam})`, async () => {
      const page = await open("/onderdelen/links/", { build: i, afdruk: true });
      try {
        const intern = (await linksOp(page)).filter((link) => !isExtern(link));
        assert.ok(intern.length > 0, "geen interne links op de pagina");
        assert.deepEqual(intern.filter((link) => link.content !== "none" && link.content !== "normal").map((link) => link.href), []);
      } finally {
        await page.close();
      }
    });
  }

  test("op het scherm houdt een externe link in een nieuw venster zijn icoon", async () => {
    const nieuwVenster = BUILDS.findIndex((build) => build.nieuwVenster);
    assert.notEqual(nieuwVenster, -1, "geen build met nieuw_venster: true");
    const page = await open("/onderdelen/links/", { build: nieuwVenster });
    try {
      const extern = (await linksOp(page)).filter((link) => isExtern(link) && !isBesloten(link));
      assert.ok(extern.length > 0, "geen gewone externe link op de pagina");
      assert.deepEqual(extern.filter((link) => link.mask === "none").map((link) => link.href), []);
    } finally {
      await page.close();
    }
  });
});

describe("rechterkolom naast de tekst", () => {
  // Het breekpunt zelf staat hier niet vast: staat de kolom onder de tekst, dan is er niets te meten.
  for (const breedte of [960, 1024, 1100, 1280, 1440]) {
    test(`is minstens 14rem breed en laat de tekstkolom intact bij ${breedte}px`, async () => {
      const page = await open("/onderdelen/lange-pagina/", { breedte });
      try {
        const m = await page.evaluate(() => {
          const wortel = document.documentElement;
          const rem = parseFloat(getComputedStyle(wortel).fontSize);
          const aside = document.querySelector("main > article > .page-aside").getBoundingClientRect();
          const tekst = document.querySelector("main > article > .artikel-tekst").getBoundingClientRect();
          return {
            rem,
            aside: aside.width,
            tekst: tekst.width,
            maxTekst: parseFloat(getComputedStyle(wortel).getPropertyValue("--article-max-width")),
            naast: aside.left >= tekst.right - 1,
            overloop: wortel.scrollWidth - wortel.clientWidth,
          };
        });
        assert.ok(m.overloop <= 1, `horizontale overloop van ${m.overloop}px`);
        if (breedte >= 1100) assert.ok(m.naast, "de kolom staat niet naast de tekst");
        if (m.naast) assert.ok(m.aside >= 14 * m.rem - 0.5, `de kolom is ${m.aside}px (${(m.aside / m.rem).toFixed(1)}rem)`);
        if (breedte >= 1280) assert.equal(m.tekst, m.maxTekst, "de tekstkolom is niet meer zo breed als --article-max-width");
      } finally {
        await page.close();
      }
    });
  }
});

describe("diagram in de afdruk", () => {
  const welke = (page) =>
    page.evaluate(() => {
      const toon = (selector) => [...document.querySelectorAll(selector)].map((img) => getComputedStyle(img).display);
      return { licht: toon(".mermaid-img--light"), donker: toon(".mermaid-img--dark") };
    });

  for (const [naam, route, voorkeur] of [
    ["data-scheme dark", "/onderdelen/diagram/?scheme=dark", null],
    ["prefers-color-scheme dark", "/onderdelen/diagram/", "dark"],
  ]) {
    test(`toont altijd de lichte variant, ook bij ${naam}`, async () => {
      const page = await open(route, { afdruk: true, voorkeur });
      try {
        const { licht, donker } = await welke(page);
        assert.ok(licht.length > 0, "geen diagram op de pagina");
        assert.deepEqual([...new Set(licht)], ["block"], "de lichte variant is verborgen");
        assert.deepEqual([...new Set(donker)], ["none"], "de donkere variant staat zichtbaar");
      } finally {
        await page.close();
      }
    });
  }

  test("op het scherm volgt het diagram wel het donkere schema", async () => {
    const page = await open("/onderdelen/diagram/?scheme=dark");
    try {
      const { licht, donker } = await welke(page);
      assert.deepEqual([...new Set(licht)], ["none"]);
      assert.deepEqual([...new Set(donker)], ["block"]);
    } finally {
      await page.close();
    }
  });
});

describe("tabellen in de afdruk", () => {
  test("een tabel met data-print-bijeen breekt niet over een paginagrens, een andere wel", async () => {
    const page = await open("/", { afdruk: true });
    try {
      const breekt = await page.evaluate(() => {
        // De exampleSite heeft geen tabel met dit attribuut; zo'n tabel zet render-table.html
        // of de shortcode table-without-header neer.
        const zetTabel = (id, bijeen) => {
          const wikkel = document.createElement("div");
          wikkel.className = "tabel-wrap";
          const tabel = document.createElement("table");
          tabel.id = id;
          if (bijeen) tabel.setAttribute("data-print-bijeen", "");
          wikkel.append(tabel);
          document.querySelector("main").append(wikkel);
          return getComputedStyle(tabel).breakInside;
        };
        return { bijeen: zetTabel("bijeen", true), gewoon: zetTabel("gewoon", false) };
      });
      assert.deepEqual(breekt, { bijeen: "avoid", gewoon: "auto" });
    } finally {
      await page.close();
    }
  });
});
