/**
 * Meting voor reflow (WCAG 1.4.10) en herschalen van tekst (WCAG 1.4.4): loopt
 * er content horizontaal buiten het venster? Overgenomen uit moza-site
 * (scripts/a11y/reflow.js, #295).
 *
 * axe en HTML_CodeSniffer meten dit niet, dus pa11y ziet een overloop nooit.
 * Zonder deze controle kan een fix hiervoor stil verdwijnen zonder dat een
 * gate afgaat.
 *
 * Gemeten op twee breedtes en twee basislettergroottes. 320 pixels is de
 * ondergrens uit het criterium; 1024 staat erbij omdat de balk, de
 * subnavigatie en de rechterkolom alleen op desktop bestaan en juist bij
 * grote tekst omvallen.
 */

const COMBINATIES = [
  { breedte: 320, wortel: 16 },
  { breedte: 320, wortel: 32 },
  { breedte: 1024, wortel: 16 },
  { breedte: 1024, wortel: 32 },
];

/** Subpixelafrondingen in de layout mogen geen bevinding opleveren. */
const MARGE = 1;

/** Hoeveel elementen we per combinatie noemen; de rest zegt niets nieuws. */
const MAX_VOORBEELDEN = 3;

/**
 * Meet de overloop en noem de elementen die eraan schuldig zijn. Draait in de
 * pagina, dus zonder import en met alleen DOM-API's.
 */
function meetInPagina(marge, maxVoorbeelden) {
  const wortel = document.documentElement;
  const venster = wortel.clientWidth;
  const overloop = wortel.scrollWidth - venster;
  if (overloop <= marge) return { overloop: 0, voorbeelden: [] };

  const inSchuifvlak = (el) => {
    for (let ouder = el.parentElement; ouder; ouder = ouder.parentElement) {
      const stijl = getComputedStyle(ouder);
      if (stijl.overflowX === "auto" || stijl.overflowX === "scroll") return true;
    }
    return false;
  };

  const voorbeelden = [];
  for (const el of document.querySelectorAll("body *")) {
    const vak = el.getBoundingClientRect();
    if (vak.width === 0 || vak.right <= venster + marge) continue;
    // De inhoud van een schuifvlak mag breder zijn dan het venster: dat is de
    // bedoelde oplossing voor een brede tabel. Het schuifvlak zelf niet.
    if (inSchuifvlak(el)) continue;
    const naam =
      el.tagName.toLowerCase() +
      (el.id ? `#${el.id}` : "") +
      (typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/).join(".")}` : "");
    if (!voorbeelden.includes(naam)) voorbeelden.push(naam);
    if (voorbeelden.length === maxVoorbeelden) break;
  }

  return { overloop, voorbeelden };
}

export { meetInPagina, COMBINATIES, MARGE, MAX_VOORBEELDEN };
