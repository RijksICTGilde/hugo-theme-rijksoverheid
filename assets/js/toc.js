(function () {
  // Moet gelijk zijn aan het breekpunt in css/components/page-aside.css.
  const BREAKPOINT = "59.375rem";
  const wide = window.matchMedia("(width >= " + BREAKPOINT + ")");

  const panel = document.querySelector(".page-aside");

  // De rechterkolom heeft een eigen schuifvlak. De CSS kent alleen de hoogte
  // zoals het blok geplakt staat; bovenaan de pagina staat het lager, onder de
  // sitekop, en zou de onderkant buiten beeld vallen. De ruimte onder het blok
  // staat in de CSS: meer als de knop naar boven eronder staat.
  let previousHeight = "";
  function fitHeight() {
    if (!panel) return;
    const space = Math.max(window.innerHeight - panel.getBoundingClientRect().top, 0);
    const height = wide.matches ? "calc(" + space + "px - var(--page-aside-bottom, 1rem))" : "";
    if (height === previousHeight) return;
    if (height) {
      panel.style.setProperty("max-height", height);
    } else {
      panel.style.removeProperty("max-height");
    }
    previousHeight = height;
  }

  function scrollIntoPanel(link) {
    if (!panel || panel.scrollHeight <= panel.clientHeight) return;

    const l = link.getBoundingClientRect();
    const v = panel.getBoundingClientRect();

    if (l.top < v.top) {
      panel.scrollTop -= v.top - l.top;
    } else if (l.bottom > v.bottom) {
      panel.scrollTop += l.bottom - v.bottom;
    }
  }

  // Alleen koppen met een link in de inhoudsopgave tellen mee.
  const tocLinks = Array.from(document.querySelectorAll(".toc a[href^='#']"));
  const entries = tocLinks
    .map((link) => {
      const id = decodeURIComponent(link.getAttribute("href").slice(1));
      const el = id && document.getElementById(id);
      return el ? { link, el } : null;
    })
    .filter(Boolean);

  // Een kop is "gepasseerd" zodra hij boven 20% van het venster staat. Koppen
  // in het laatste schermstuk halen die lijn nooit: de pagina is op voordat ze
  // zo hoog komen. Daarom schuift de lijn op het laatste stuk scrollen mee
  // naar beneden, tot onderaan het hele venster telt en de laatste kop actief
  // is. Een pagina die niet scrollt houdt de gewone lijn.
  function getThreshold() {
    const base = window.innerHeight * 0.2;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    const ramp = Math.min(window.innerHeight - base, maxScroll);
    if (ramp <= 0) return base;
    const rest = Math.max(0, maxScroll - window.scrollY);
    const progress = Math.max(0, ramp - rest) / ramp;
    return base + (window.innerHeight - base) * progress;
  }

  let previousActive = null;
  function updateActiveLink() {
    const threshold = getThreshold();

    let current = null;
    for (const entry of entries) {
      if (entry.el.getBoundingClientRect().top <= threshold) {
        current = entry;
      } else {
        break;
      }
    }

    entries.forEach((entry) => entry.link.classList.remove("active"));
    const active = current ? current.link : null;
    if (active) {
      active.classList.add("active");
      if (active !== previousActive) scrollIntoPanel(active);
    }
    previousActive = active;
  }

  function update() {
    fitHeight();
    if (entries.length) updateActiveLink();
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    }
  }

  if (panel || entries.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    wide.addEventListener("change", onScroll);
    update();
  }

  // Op smal scherm wordt elk blok in de rechterkolom een uitklapregel met een
  // knop in de kop. Zonder JavaScript blijven de blokken open.
  const chevron = document.getElementById("page-aside-chevron");
  const blocks = panel
    ? Array.from(panel.querySelectorAll(":scope > nav"))
        .map((block) => ({
          heading: block.querySelector(":scope > h2"),
          content: block.querySelector(":scope > h2 + *"),
        }))
        .filter((block) => block.heading && block.content)
    : [];

  if (!chevron || !blocks.length) return;

  blocks.forEach((block, i) => {
    if (!block.content.id) block.content.id = "page-aside-block-" + (i + 1);
  });

  function addButton(block) {
    if (block.heading.querySelector(".page-aside-toggle")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-aside-toggle";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", block.content.id);
    button.append(chevron.content.cloneNode(true), ...block.heading.childNodes);
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      block.content.hidden = open;
    });
    block.heading.append(button);
    block.content.hidden = true;
  }

  function removeButton(block) {
    const button = block.heading.querySelector(".page-aside-toggle");
    if (!button) return;
    button.querySelector("svg").remove();
    block.heading.replaceChildren(...button.childNodes);
    block.content.hidden = false;
  }

  function syncButtons() {
    blocks.forEach(wide.matches ? removeButton : addButton);
  }

  wide.addEventListener("change", syncButtons);
  syncButtons();
})();
