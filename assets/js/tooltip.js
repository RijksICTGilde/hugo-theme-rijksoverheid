/* Tooltip voor knoppen en links met `data-tooltip="tekst"`. De ballon is puur
   visueel (aria-hidden): de toegankelijke naam komt uit de tekst van het
   element zelf, dus herhaal die in data-tooltip of vul hem alleen aan.

   WCAG 1.4.13: de ballon sluit met Escape, blijft staan zolang de aanwijzer op
   het element of op de ballon staat (of het element toetsenbordfocus heeft) en
   verdwijnt nooit vanzelf. Hij staat in <body>, zodat een scrollend paneel of
   overflow: hidden hem niet afknipt. Positioneren gaat via CSSOM, want een
   style-attribuut blokkeert de CSP. */
(function () {
  if (!document.querySelector("[data-tooltip]")) return;

  const RUIMTE = 6;
  const MARGE = 8;
  const ballon = document.createElement("div");
  ballon.className = "tooltip";
  ballon.setAttribute("aria-hidden", "true");
  ballon.hidden = true;
  document.body.appendChild(ballon);

  let actief = null;
  let gesloten = null; // met Escape gesloten; pas weer te openen na verlaten
  let opDeAanwijzer = false;
  let timer = 0;

  const vindTrigger = (knoop) =>
    knoop instanceof Element ? knoop.closest("[data-tooltip]") : null;
  const hoortErbij = (knoop) =>
    knoop instanceof Node && (ballon.contains(knoop) || (actief !== null && actief.contains(knoop)));

  function plaats(el) {
    const r = el.getBoundingClientRect();
    // Meten vanaf links 0, anders is de ballon smaller naarmate hij verder naar rechts staat.
    ballon.style.setProperty("left", "0px");
    const { width, height } = ballon.getBoundingClientRect();
    const onder = r.bottom + RUIMTE;
    const past = onder + height <= window.innerHeight - MARGE;
    const boven = r.top - RUIMTE - height;
    const toonBoven = !past && boven >= MARGE;
    const links = Math.max(MARGE, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - MARGE));
    ballon.style.setProperty("top", `${toonBoven ? boven : onder}px`);
    ballon.style.setProperty("left", `${links}px`);
    ballon.classList.toggle("tooltip-boven", toonBoven);
  }

  function toon(el) {
    if (gesloten === el) return;
    window.clearTimeout(timer);
    actief = el;
    ballon.textContent = el.dataset.tooltip;
    ballon.hidden = false;
    plaats(el);
  }

  function verberg() {
    window.clearTimeout(timer);
    actief = null;
    opDeAanwijzer = false;
    ballon.hidden = true;
  }

  // Even wachten: de aanwijzer kan onderweg zijn naar de ballon of naar een
  // volgend element.
  function plan() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (actief && !opDeAanwijzer && !actief.matches(":focus-visible")) verberg();
    }, 100);
  }

  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    if (gesloten && !gesloten.contains(e.target)) gesloten = null;
    const el = vindTrigger(e.target);
    if (el) {
      opDeAanwijzer = true;
      toon(el);
    } else if (hoortErbij(e.target)) {
      opDeAanwijzer = true;
      window.clearTimeout(timer);
    }
  });

  document.addEventListener("pointerout", (e) => {
    if (e.pointerType === "touch") return;
    const van = vindTrigger(e.target);
    if (!van && !ballon.contains(e.target)) return;
    if (hoortErbij(e.relatedTarget)) return;
    if (van && gesloten === van && !van.contains(e.relatedTarget)) gesloten = null;
    opDeAanwijzer = false;
    plan();
  });

  document.addEventListener("focusin", (e) => {
    const el = vindTrigger(e.target);
    if (el && el.matches(":focus-visible")) toon(el);
  });

  document.addEventListener("focusout", (e) => {
    const el = vindTrigger(e.target);
    if (!el) return;
    if (gesloten === el) gesloten = null;
    if (actief === el && !opDeAanwijzer) verberg();
  });

  // Capture-fase: deze Escape komt voor die van base.js, die eerder in de bundel zit.
  const sluitMetEscape = (e) => {
    if (e.key !== "Escape" || e.defaultPrevented || ballon.hidden) return;
    if (document.querySelector("dialog[open]")) return;
    gesloten = actief;
    verberg();
    e.preventDefault();
  };
  document.addEventListener("keydown", sluitMetEscape, { capture: true });

  const herplaats = () => {
    if (actief && !ballon.hidden) plaats(actief);
  };
  window.addEventListener("scroll", herplaats, { passive: true, capture: true });
  window.addEventListener("resize", herplaats, { passive: true });
})();
