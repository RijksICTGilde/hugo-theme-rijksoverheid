/**
 * Regels op de gebouwde HTML. Elke regel krijgt de HTML van een pagina en een
 * context ({ route, basisHost, siteTitel }) en geeft een lijst bevindingen.
 *
 * De regels voor kopvolgorde, alt-teksten, voetnoten en diagrammen komen uit
 * moza-site (scripts/a11y/regels.js) en zijn hier generiek gemaakt. Ze lezen
 * de tags in plaats van de ruwe tekst, zodat ze ook werken op geminificeerde
 * HTML zonder aanhalingstekens.
 */

import { tags, klassen, elementen, tekstVan, zonderElementen, schoon } from "../lib/html.js";

const DECORATIEF = (kaart) => kaart.get("role") === "presentation" || kaart.get("aria-hidden") === "true";

/** Beginstand van elke regel: de context mag ontbreken. */
function metStandaard(ctx = {}) {
  return { route: "/x/", basisHost: "voorbeeld.example", siteTitel: "Voorbeeldsite", ...ctx };
}

function zijkolommen(html) {
  return elementen(html, "aside", (a) => klassen(a).includes("page-aside"));
}

/**
 * Koppenstructuur (WCAG 1.3.1). Axe rekent `heading-order` tot best-practice
 * en zet die regel uit bij WCAG2AA; HTML_CodeSniffer dekt het niet.
 *
 * De rechterkolom staat tussen de h1 en de tekst; zijn koppen ("Op deze
 * pagina") zouden een sprong van h1 naar h3 in de tekst maskeren.
 */
function checkHeadingOrder(html) {
  const findings = [];
  const levels = tags(zonderElementen(html, zijkolommen(html)))
    .filter((t) => !t.sluit && /^h[1-6]$/.test(t.naam))
    .map((t) => Number(t.naam[1]));

  if (levels.length === 0) return findings;
  if (levels[0] !== 1) {
    findings.push(`eerste kop op de pagina is een h${levels[0]}, verwacht een h1`);
  }

  const h1Count = levels.filter((level) => level === 1).length;
  if (h1Count > 1) {
    findings.push(`${h1Count} h1-koppen op één pagina, verwacht er precies één`);
  }

  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      findings.push(`kopniveau springt van h${levels[i - 1]} naar h${levels[i]}`);
    }
  }

  return findings;
}

/**
 * Tekstalternatief van Mermaid-diagrammen (WCAG 1.1.1). De render hook vult
 * `alt` met `accTitle`, of met `accDescr` als de titel ontbreekt; ontbreken
 * beide, dan geeft `alt=""` een geldig maar onterecht "decoratief" diagram.
 */
function checkDiagramAlt(html) {
  const findings = [];

  for (const t of tags(html)) {
    if (t.sluit || t.naam !== "img" || !klassen(t.attrs).includes("mermaid-img")) continue;
    const alt = t.attrs.get("alt");
    if (alt === undefined) {
      findings.push("diagram zonder alt-attribuut");
    } else if (alt.trim() === "") {
      findings.push("diagram met lege alt-tekst; voeg accTitle en accDescr toe aan het Mermaid-blok");
    }
  }

  return findings;
}

/**
 * Tekstalternatief van afbeeldingen in de content (WCAG 1.1.1). `alt=""` is
 * geldige HTML voor een decoratieve afbeelding, dus scanners melden niets bij
 * een inhoudelijke afbeelding zonder alt-tekst. Alleen het artikel wordt
 * gecontroleerd; de rest van de pagina komt uit de templates.
 *
 * Is een afbeelding wél decoratief, markeer dat dan met `role="presentation"`
 * of `aria-hidden="true"`.
 */
function checkContentImageAlt(html) {
  const findings = [];

  for (const artikel of elementen(html, "article")) {
    for (const t of tags(artikel.binnen)) {
      if (t.sluit || t.naam !== "img" || klassen(t.attrs).includes("mermaid-img")) continue;
      const alt = t.attrs.get("alt");
      const src = t.attrs.get("src") ?? "afbeelding";
      if (alt === undefined) {
        findings.push(`${src} zonder alt-attribuut`);
      } else if (alt.trim() === "" && !DECORATIEF(t.attrs)) {
        findings.push(`${src} met lege alt-tekst; beschrijf de afbeelding of markeer haar als decoratief`);
      }
    }
  }

  return findings;
}

/**
 * Elke afbeelding op de pagina heeft een alt-attribuut (WCAG 1.1.1), ook die
 * in kop, voet en hero. Een leeg alt is daar toegestaan: dat is decoratief.
 */
function checkImgAltAanwezig(html) {
  return tags(html)
    .filter((t) => !t.sluit && t.naam === "img" && !t.attrs.has("alt"))
    .map((t) => `${t.attrs.get("src") ?? "afbeelding"} zonder alt-attribuut`);
}

/**
 * Beschrijving van Mermaid-diagrammen (WCAG 1.1.1). De alt draagt alleen de
 * korte `accTitle`; de uitgebreide `accDescr` staat als verborgen tekst na het
 * diagram en is het enige volledige tekstalternatief.
 */
function checkDiagramBeschrijving(html) {
  const findings = [];

  for (const diagram of elementen(html, "div", (a) => klassen(a).includes("mermaid-diagram"))) {
    const beschrijving = elementen(diagram.binnen, "p", (a) => klassen(a).includes("mermaid-beschrijving"))[0];
    if (!beschrijving) {
      findings.push("diagram zonder beschrijving; voeg accDescr toe aan het Mermaid-blok");
    } else if (tekstVan(beschrijving.binnen) === "") {
      findings.push("diagram met lege beschrijving; vul accDescr in het Mermaid-blok");
    }
  }

  return findings;
}

/**
 * Voetnotenblok van Goldmark (WCAG 1.3.1). `role="doc-endnotes"` erft van list
 * en eist listitem-kinderen, maar er staat een <hr> en een <ol> in. De partial
 * inhoud.html haalt de rol eruit; slaat een layout die over, dan blijft hij staan.
 */
function checkVoetnootRol(html) {
  const aantal = tags(html).filter((t) => !t.sluit && t.attrs.get("role") === "doc-endnotes").length;
  if (aantal === 0) return [];
  return [
    `voetnotenblok met role="doc-endnotes" (${aantal}x); laat de layout .Content door de partial inhoud.html gaan`,
  ];
}

/** Een `<nav>` of een element met role=navigation binnen een `<nav>` (WCAG 1.3.1, theme #36). */
function checkGenesteNav(html) {
  const findings = [];
  let diepte = 0;
  for (const t of tags(html)) {
    const isNav = t.naam === "nav";
    if (t.sluit) {
      if (isNav && diepte > 0) diepte--;
      continue;
    }
    if (diepte > 0 && (isNav || t.attrs.get("role") === "navigation")) {
      findings.push(`${isNav ? "<nav>" : 'role="navigation"'} binnen een <nav>; gebruik een <div> of <ul>`);
    }
    if (isNav) diepte++;
  }
  return findings;
}

/** `lang` op `<html>` (WCAG 3.1.1). De site is Nederlands. */
function checkHtmlLang(html) {
  const root = tags(html).find((t) => !t.sluit && t.naam === "html");
  if (!root) return ["geen <html>-element"];
  const lang = root.attrs.get("lang");
  if (lang === undefined || lang === "") return ["<html> zonder lang-attribuut"];
  if (!/^nl(-|$)/i.test(lang)) return [`<html lang="${lang}">, verwacht nl`];
  return [];
}

/** Unieke `id`'s (WCAG 4.1.1 is vervallen; ankers, aria-controls en label-for hangen er wel van af). */
function checkUniekeIds(html) {
  const telling = new Map();
  for (const t of tags(html)) {
    if (t.sluit) continue;
    const id = t.attrs.get("id");
    if (id) telling.set(id, (telling.get(id) ?? 0) + 1);
  }
  return [...telling].filter(([, n]) => n > 1).map(([id, n]) => `id="${id}" komt ${n}x voor`);
}

const VERBORGEN_NIEUW_VENSTER = /nieuw venster/i;

/**
 * Links met target="_blank" (WCAG 2.4.4, NeRDS veiligheid): rel met noopener
 * en noreferrer, en een verborgen melding dat de link een nieuw venster opent.
 */
function checkNieuwVenster(html) {
  const findings = [];
  for (const a of elementen(html, "a", (k) => k.get("target") === "_blank")) {
    const href = a.attrs.get("href") ?? "";
    const rel = (a.attrs.get("rel") ?? "").split(/\s+/);
    if (!rel.includes("noopener") || !rel.includes("noreferrer")) {
      findings.push(`${href}: target="_blank" zonder rel="noopener noreferrer"`);
    }
    const melding = elementen(a.binnen, "span", (k) => klassen(k).includes("visually-hidden"))
      .some((s) => VERBORGEN_NIEUW_VENSTER.test(tekstVan(s.binnen)));
    if (!melding) {
      findings.push(`${href}: target="_blank" zonder verborgen melding "opent in een nieuw venster"`);
    }
  }
  return findings;
}

/** Links naar een andere site hebben rel="external noreferrer" (contract 2.2). */
function checkExterneLinkRel(html, ctx) {
  const { basisHost } = metStandaard(ctx);
  const findings = [];
  for (const t of tags(html)) {
    if (t.sluit || t.naam !== "a") continue;
    const href = t.attrs.get("href") ?? "";
    const m = href.match(/^https?:\/\/([^/?#:]+)/i);
    if (!m || m[1].toLowerCase() === basisHost) continue;
    const rel = (t.attrs.get("rel") ?? "").split(/\s+/);
    if (!rel.includes("external") || !rel.includes("noreferrer")) {
      findings.push(`${href}: externe link zonder rel="external noreferrer"`);
    }
  }
  return findings;
}

/** Geen role="menu" voor gewone navigatie of instellingen (WCAG 4.1.2). */
function checkGeenRoleMenu(html) {
  return tags(html)
    .filter((t) => !t.sluit && /^(menu|menubar|menuitem|menuitemcheckbox|menuitemradio)$/i.test(t.attrs.get("role") ?? ""))
    .map((t) => `<${t.naam} role="${t.attrs.get("role")}">; gebruik een lijst met links of knoppen`);
}

/** aria-live op een hele lijst of tabel meldt elke wijziging (WCAG 4.1.3); gebruik een aparte role="status". */
function checkGeenLiveLijst(html) {
  return tags(html)
    .filter((t) => !t.sluit && /^(ul|ol|dl|table|tbody)$/.test(t.naam) && t.attrs.has("aria-live"))
    .map((t) => `aria-live op een <${t.naam}>; zet een aparte role="status" ernaast`);
}

/**
 * Landmarks met dezelfde rol hebben een eigen naam (WCAG 1.3.1, 2.4.1): meer
 * dan één <nav> of <aside> vraagt om een unieke aria-label of aria-labelledby.
 */
function checkLandmarkNamen(html) {
  const findings = [];
  for (const naam of ["nav", "aside"]) {
    const lijst = tags(html).filter((t) => !t.sluit && t.naam === naam);
    if (lijst.length < 2) continue;
    const namen = new Map();
    for (const t of lijst) {
      const label = t.attrs.get("aria-label") ?? (t.attrs.has("aria-labelledby") ? `#${t.attrs.get("aria-labelledby")}` : "");
      if (!label) {
        findings.push(`<${naam}> zonder naam naast andere <${naam}>-elementen`);
      } else {
        namen.set(label, (namen.get(label) ?? 0) + 1);
      }
    }
    for (const [label, n] of namen) {
      if (n > 1) findings.push(`${n} <${naam}>-elementen met dezelfde naam "${label}"`);
    }
  }
  return findings;
}

/** Skip-link naar `<main id="main-content" tabindex="-1">` als eerste link (WCAG 2.4.1). */
function checkSkipLink(html) {
  const findings = [];
  const lijst = tags(html);
  const main = lijst.find((t) => !t.sluit && t.naam === "main");
  if (!main) return ["geen <main>"];
  if (main.attrs.get("id") !== "main-content") findings.push('<main> zonder id="main-content"');
  if (main.attrs.get("tabindex") !== "-1") findings.push('<main> zonder tabindex="-1"; de focus verhuist anders niet mee');
  const eerste = lijst.find((t) => !t.sluit && t.naam === "a");
  if (!eerste || eerste.attrs.get("href") !== "#main-content") {
    findings.push("de eerste link op de pagina is niet de skip-link naar #main-content");
  }
  return findings;
}

/**
 * Inline iconen zijn decoratief (WCAG 1.1.1): aria-hidden="true" en
 * focusable="false". Een svg met role="img" en een naam is een afbeelding.
 */
function checkIconenDecoratief(html) {
  const findings = [];
  for (const t of tags(html)) {
    if (t.sluit || t.naam !== "svg") continue;
    if (t.attrs.get("role") === "img" && (t.attrs.has("aria-label") || t.attrs.has("aria-labelledby"))) continue;
    if (t.attrs.get("aria-hidden") !== "true") findings.push("<svg> zonder aria-hidden=\"true\"");
    else if (t.attrs.get("focusable") !== "false") findings.push("<svg> zonder focusable=\"false\"");
  }
  return findings;
}

/**
 * De toegankelijke naam bevat de zichtbare tekst (WCAG 2.5.3). Een
 * aria-label dat de zichtbare tekst overschrijft, breekt spraakbediening.
 * Zichtbare tekst zonder letters of cijfers (een pijl, een symbool) telt niet.
 */
function checkLabelInNaam(html) {
  const findings = [];
  for (const naam of ["a", "button"]) {
    for (const el of elementen(html, naam, (k) => k.has("aria-label"))) {
      const verborgen = elementen(el.binnen, "span", (k) => k.get("aria-hidden") === "true" || klassen(k).includes("visually-hidden"));
      const kbd = elementen(el.binnen, "kbd", (k) => k.get("aria-hidden") === "true");
      const zichtbaar = tekstVan(zonderElementen(el.binnen, [...verborgen, ...kbd])).replace(/[.…:\s]+$/, "");
      const label = el.attrs.get("aria-label").trim();
      if (/[\p{L}\p{N}]/u.test(zichtbaar) && !label.toLowerCase().includes(zichtbaar.toLowerCase())) {
        findings.push(`<${naam}> met zichtbare tekst "${zichtbaar}" maar aria-label "${label}"`);
      }
    }
  }
  return findings;
}

/**
 * <title> in de vorm van NLDD: homepage "Site: tagline", andere pagina's
 * "Pagina · Site" (contract 2.3).
 */
function checkTitelVorm(html, ctx) {
  const { route, siteTitel } = metStandaard(ctx);
  const titel = elementen(html, "title")[0];
  const tekst = titel ? tekstVan(titel.binnen) : "";
  if (!tekst) return ["pagina zonder <title>"];
  if (route === "/") {
    return tekst.startsWith(`${siteTitel}: `) ? [] : [`titel van de homepage "${tekst}" begint niet met "${siteTitel}: "`];
  }
  return tekst.endsWith(` · ${siteTitel}`) ? [] : [`titel "${tekst}" eindigt niet op " · ${siteTitel}"`];
}

const LEKKEN = [
  [/\{\{[<%]/, "shortcode die niet is uitgevoerd"],
  [/\{[.#][\w-]+[^}\n]*\}/, "Markdown-attribuut dat in de tekst staat"],
  [/\{ref:\d+!?\}/, "ongebruikte bronverwijzing {ref:N}"],
  [/\[!(?:NOTE|TIP|INFO|IMPORTANT|WARNING|CAUTION|SUCCESS|DANGER)\]/i, "infoblok dat niet is omgezet"],
  [/\[\^[\w-]+\]/, "voetnootverwijzing die niet is omgezet"],
];

/** Markdown of een shortcode die ongerenderd in de pagina staat. Code en pre tellen niet mee. */
function checkLekkendeSyntax(html) {
  let tekst = schoon(html);
  tekst = zonderElementen(tekst, [
    ...elementen(tekst, "pre"),
    ...elementen(tekst, "code"),
  ]);
  tekst = tekstVan(tekst);
  return LEKKEN.filter(([patroon]) => patroon.test(tekst)).map(([, naam]) => naam);
}

export {
  checkHeadingOrder,
  checkDiagramAlt,
  checkContentImageAlt,
  checkImgAltAanwezig,
  checkDiagramBeschrijving,
  checkVoetnootRol,
  checkGenesteNav,
  checkHtmlLang,
  checkUniekeIds,
  checkNieuwVenster,
  checkExterneLinkRel,
  checkGeenRoleMenu,
  checkGeenLiveLijst,
  checkLandmarkNamen,
  checkSkipLink,
  checkIconenDecoratief,
  checkLabelInNaam,
  checkTitelVorm,
  checkLekkendeSyntax,
};
