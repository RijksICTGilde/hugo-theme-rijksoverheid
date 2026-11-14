/**
 * Kleine HTML-hulpjes voor de regels, zonder npm. De uitvoer van Hugo is
 * geldig en (met --minify) zonder aanhalingstekens waar die niet nodig zijn;
 * een tokenizer die beide aankan is genoeg, een volledige parser is dat niet.
 */

const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
const ATTR = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr",
]);

/** Haalt commentaar en de inhoud van script, style en template weg. De tags blijven staan. */
function schoon(html) {
  // Herhalen tot er niets meer verandert: na één ronde kan "<!<!---->--" nog "<!--" opleveren.
  let vorige;
  do {
    vorige = html;
    html = html.replace(/<!--[\s\S]*?-->/g, "");
  } while (html !== vorige);
  return html.replace(/(<(script|style|template|textarea)\b[^>]*>)[\s\S]*?(<\/\2>)/gi, "$1$3");
}

/** Leest de attributen van een openingstag. Namen in kleine letters; een attribuut zonder waarde is "". */
function attrs(tekst) {
  const kaart = new Map();
  for (const m of tekst.matchAll(ATTR)) {
    const naam = m[1].toLowerCase();
    if (!kaart.has(naam)) kaart.set(naam, m[2] ?? m[3] ?? m[4] ?? "");
  }
  return kaart;
}

/** Alle tags in volgorde: { naam, sluit, attrs, begin, eind }. */
function tags(html) {
  const lijst = [];
  for (const m of schoon(html).matchAll(TAG)) {
    lijst.push({
      naam: m[2].toLowerCase(),
      sluit: m[1] === "/",
      attrs: attrs(m[3]),
      begin: m.index,
      eind: m.index + m[0].length,
    });
  }
  return lijst;
}

function klassen(kaart) {
  return (kaart.get("class") ?? "").split(/\s+/).filter(Boolean);
}

/**
 * Alle elementen met tag `naam`, met hun binnenste HTML (diepte-bewust).
 * `filter` krijgt de attributen en bepaalt welke elementen meetellen.
 */
function elementen(html, naam, filter = () => true) {
  const bron = schoon(html);
  const lijst = [];
  const alle = [];
  for (const m of bron.matchAll(TAG)) {
    alle.push({
      naam: m[2].toLowerCase(),
      sluit: m[1] === "/",
      attrs: attrs(m[3]),
      begin: m.index,
      eind: m.index + m[0].length,
    });
  }
  for (let i = 0; i < alle.length; i++) {
    const open = alle[i];
    if (open.sluit || open.naam !== naam || !filter(open.attrs)) continue;
    let diepte = 1;
    let sluit = null;
    for (let j = i + 1; j < alle.length && diepte > 0; j++) {
      if (alle[j].naam !== naam) continue;
      diepte += alle[j].sluit ? -1 : 1;
      if (diepte === 0) sluit = alle[j];
    }
    lijst.push({
      attrs: open.attrs,
      begin: open.begin,
      eind: sluit ? sluit.eind : open.eind,
      binnen: sluit ? bron.slice(open.eind, sluit.begin) : "",
    });
  }
  return lijst;
}

/** De tekst van een stuk HTML, zonder tags en met samengevouwen witruimte. */
function tekstVan(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&middot;/gi, "·")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Knipt de gegeven elementen (uit `elementen`) uit de HTML. */
function zonderElementen(html, lijst) {
  const bron = schoon(html);
  let uit = "";
  let vanaf = 0;
  for (const el of [...lijst].sort((a, b) => a.begin - b.begin)) {
    if (el.begin < vanaf) continue;
    uit += bron.slice(vanaf, el.begin);
    vanaf = el.eind;
  }
  return uit + bron.slice(vanaf);
}

export { schoon, attrs, tags, klassen, elementen, tekstVan, zonderElementen, VOID };
