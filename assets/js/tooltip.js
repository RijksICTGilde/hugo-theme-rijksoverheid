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

  const GAP = 2;
  const MARGIN = 8;
  const balloon = document.createElement("div");
  balloon.className = "tooltip";
  balloon.setAttribute("aria-hidden", "true");
  balloon.hidden = true;
  document.body.appendChild(balloon);

  let active = null;
  let dismissed = null; // met Escape gesloten; pas weer te openen na verlaten
  let onPointer = false;
  let timer = 0;

  const findTrigger = (node) =>
    node instanceof Element ? node.closest("[data-tooltip]") : null;
  const belongsToTooltip = (node) =>
    node instanceof Node && (balloon.contains(node) || (active !== null && active.contains(node)));

  function place(el) {
    const r = el.getBoundingClientRect();
    // Meten vanaf links 0, anders is de ballon smaller naarmate hij verder naar rechts staat.
    balloon.style.setProperty("left", "0px");
    const { width, height } = balloon.getBoundingClientRect();
    const below = r.bottom + GAP;
    const fits = below + height <= window.innerHeight - MARGIN;
    const above = r.top - GAP - height;
    const showAbove = !fits && above >= MARGIN;
    const left = Math.max(MARGIN, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - MARGIN));
    balloon.style.setProperty("top", `${showAbove ? above : below}px`);
    balloon.style.setProperty("left", `${left}px`);
    balloon.classList.toggle("tooltip-top", showAbove);
  }

  function show(el) {
    if (dismissed === el) return;
    window.clearTimeout(timer);
    active = el;
    balloon.textContent = el.dataset.tooltip;
    balloon.hidden = false;
    place(el);
  }

  function hide() {
    window.clearTimeout(timer);
    active = null;
    onPointer = false;
    balloon.hidden = true;
  }

  // Even wachten: de aanwijzer kan onderweg zijn naar de ballon of naar een
  // volgend element.
  function schedule() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (active && !onPointer && !active.matches(":focus-visible")) hide();
    }, 100);
  }

  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    if (dismissed && !dismissed.contains(e.target)) dismissed = null;
    const el = findTrigger(e.target);
    if (el) {
      onPointer = true;
      show(el);
    } else if (belongsToTooltip(e.target)) {
      onPointer = true;
      window.clearTimeout(timer);
    }
  });

  document.addEventListener("pointerout", (e) => {
    if (e.pointerType === "touch") return;
    const from = findTrigger(e.target);
    if (!from && !balloon.contains(e.target)) return;
    if (belongsToTooltip(e.relatedTarget)) return;
    if (from && dismissed === from && !from.contains(e.relatedTarget)) dismissed = null;
    onPointer = false;
    schedule();
  });

  document.addEventListener("focusin", (e) => {
    const el = findTrigger(e.target);
    if (el && el.matches(":focus-visible")) show(el);
  });

  document.addEventListener("focusout", (e) => {
    const el = findTrigger(e.target);
    if (!el) return;
    if (dismissed === el) dismissed = null;
    if (active === el && !onPointer) hide();
  });

  // Capture-fase: deze Escape komt voor die van base.js, die eerder in de bundel zit.
  const closeOnEscape = (e) => {
    if (e.key !== "Escape" || e.defaultPrevented || balloon.hidden) return;
    if (document.querySelector("dialog[open]")) return;
    dismissed = active;
    hide();
    e.preventDefault();
  };
  document.addEventListener("keydown", closeOnEscape, { capture: true });

  const reposition = () => {
    if (active && !balloon.hidden) place(active);
  };
  window.addEventListener("scroll", reposition, { passive: true, capture: true });
  window.addEventListener("resize", reposition, { passive: true });
})();
