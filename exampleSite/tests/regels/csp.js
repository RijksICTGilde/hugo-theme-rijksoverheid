/**
 * Controles op constructies die de Content-Security-Policy blokkeert.
 *
 * Zonder `unsafe-inline` negeert de browser inline styles en scripts zonder
 * foutmelding: de pagina laadt, maar ziet er anders uit dan lokaal. Deze
 * controle maakt dat verschil zichtbaar. Het patroon voor inline inhoud komt
 * uit moza-site (scripts/csp/regels.js).
 *
 * Het theme dwingt zelf geen header af; de policy hieronder is de strengste
 * waar elke site mee moet kunnen werken (contract 2.2).
 */

import { tags } from "../lib/html.js";

const POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; " +
  "object-src 'none'; base-uri 'self'; form-action 'none'";

const PATTERNS = {
  style: [
    [/<[a-z][^>]*?\sstyle\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "inline style-attribuut"],
    [/<style[\s>]/gi, "style-element"],
  ],
  script: [
    [/<script(?![^>]*\ssrc\s*=)[^>]*>/gi, "inline script"],
    [/<[a-z][^>]*?\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "event handler-attribuut"],
    [/(?:href|src)\s*=\s*["']?javascript:/gi, "javascript:-URL"],
  ],
};

/** Leest de directives uit een policy-tekst. */
function parseCsp(tekst) {
  const directives = {};
  for (const part of tekst.split(";")) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) directives[name] = values;
  }
  return directives;
}

/** Geeft de soorten inline inhoud waarvoor de policy ze blokkeert. */
function blockedSources(directives) {
  const fallback = directives["default-src"] ?? [];
  return Object.keys(PATTERNS).filter((kind) => {
    const values = directives[`${kind}-src`] ?? fallback;
    return values.length > 0 && !values.includes("'unsafe-inline'");
  });
}

/** Zoekt geblokkeerde constructies in één HTML-document. */
function findViolations(html, kinds) {
  const findings = [];

  for (const kind of kinds) {
    for (const [pattern, label] of PATTERNS[kind]) {
      for (const [match] of html.matchAll(pattern)) {
        findings.push({ label, fragment: match.slice(0, 80) });
      }
    }
  }

  return findings;
}

const DIRECTIVES = parseCsp(POLICY);
const GEBLOKKEERD = blockedSources(DIRECTIVES);

/** Een regel per soort constructie, zodat een fixture precies die ene regel kan eisen. */
function perLabel(label) {
  return (html) =>
    findViolations(html, GEBLOKKEERD)
      .filter((f) => f.label === label)
      .map((f) => `${f.label}: ${f.fragment}`);
}

const checkInlineStyleAttribuut = perLabel("inline style-attribuut");
const checkStyleElement = perLabel("style-element");
const checkInlineScript = perLabel("inline script");
const checkEventHandler = perLabel("event handler-attribuut");
const checkJavascriptUrl = perLabel("javascript:-URL");

/** Rel-waarden van een <link> die iets laden (de overige, zoals canonical, zijn alleen metagegevens). */
const LADENDE_REL = /^(stylesheet|preload|modulepreload|prefetch|preconnect|dns-prefetch|icon|apple-touch-icon|manifest|mask-icon)$/i;

function hostVan(url) {
  const m = url.trim().match(/^(?:https?:)?\/\/([^/?#:]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function kandidaten(t) {
  const urls = [];
  const a = t.attrs;
  if (t.naam === "link" && (a.get("rel") ?? "").split(/\s+/).some((r) => LADENDE_REL.test(r))) {
    urls.push(a.get("href"));
  } else if (["script", "img", "iframe", "frame", "embed", "audio", "video", "source", "track", "input"].includes(t.naam)) {
    urls.push(a.get("src"));
    for (const kandidaat of (a.get("srcset") ?? "").split(",")) urls.push(kandidaat.trim().split(/\s+/)[0]);
  } else if (t.naam === "object") {
    urls.push(a.get("data"));
  }
  return urls.filter(Boolean);
}

/**
 * Geen verzoeken naar derden (contract 2.2): scripts, stijlen, lettertypen,
 * afbeeldingen en frames komen van de eigen site.
 */
function checkGeenDerden(html, ctx = {}) {
  const basisHost = (ctx.basisHost ?? "voorbeeld.example").toLowerCase();
  const findings = [];
  for (const t of tags(html)) {
    if (t.sluit) continue;
    for (const url of kandidaten(t)) {
      const host = hostVan(url);
      if (host && host !== basisHost) findings.push(`<${t.naam}> laadt ${url}`);
    }
  }
  return findings;
}

/** `img-src 'self'` en `font-src 'self'` laten geen data:-URL's toe. */
function checkGeenDataUrl(html) {
  const findings = [];
  for (const t of tags(html)) {
    if (t.sluit) continue;
    for (const url of kandidaten(t)) {
      if (/^data:/i.test(url.trim())) findings.push(`<${t.naam}> laadt een data:-URL`);
    }
  }
  return findings;
}

/** `form-action 'none'`: een formulier dat verstuurt, wordt geblokkeerd. method="dialog" verstuurt niet. */
function checkGeenFormulierActie(html) {
  return tags(html)
    .filter((t) => !t.sluit && t.naam === "form" && (t.attrs.get("method") ?? "").toLowerCase() !== "dialog")
    .map(() => "<form> dat verstuurt; form-action is 'none'");
}

/** CSS in de uitvoer: geen externe url(), geen data:-URL (CSP img-src/font-src), geen @import naar elders. */
function checkCssBronnen(css) {
  const findings = [];
  for (const m of css.matchAll(/url\(\s*(["']?)([^)"']*)\1\s*\)/gi)) {
    const url = m[2].trim();
    if (/^data:/i.test(url)) findings.push(`url(data:...) in CSS: ${url.slice(0, 40)}`);
    else if (hostVan(url)) findings.push(`CSS laadt ${url}`);
  }
  for (const m of css.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)/gi)) {
    if (hostVan(m[1])) findings.push(`@import naar ${m[1]}`);
  }
  return findings;
}

/** Geen `style`-attribuut in HTML en geen inline-bronnen: alle vijf soorten achter elkaar. */
function checkCsp(html) {
  return findViolations(html, GEBLOKKEERD).map((f) => `${f.label}: ${f.fragment}`);
}

export {
  POLICY,
  DIRECTIVES,
  GEBLOKKEERD,
  parseCsp,
  blockedSources,
  findViolations,
  checkCsp,
  checkInlineStyleAttribuut,
  checkStyleElement,
  checkInlineScript,
  checkEventHandler,
  checkJavascriptUrl,
  checkGeenDerden,
  checkGeenDataUrl,
  checkGeenFormulierActie,
  checkCssBronnen,
};
