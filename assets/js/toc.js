(function () {
  // Moet gelijk zijn aan het breekpunt in css/components/page-aside.css.
  const BREEKPUNT = "59.375rem";
  const breed = window.matchMedia("(width >= " + BREEKPUNT + ")");

  const vlak = document.querySelector(".page-aside");

  // De rechterkolom heeft een eigen schuifvlak. De CSS kent alleen de hoogte
  // zoals het blok geplakt staat; bovenaan de pagina staat het lager, onder de
  // sitekop, en zou de onderkant buiten beeld vallen.
  let vorigeHoogte = "";
  function pasHoogteAan() {
    if (!vlak) return;
    const rand = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const ruimte = window.innerHeight - vlak.getBoundingClientRect().top - rand;
    const hoogte = breed.matches ? Math.max(ruimte, 0) + "px" : "";
    if (hoogte === vorigeHoogte) return;
    if (hoogte) {
      vlak.style.setProperty("max-height", hoogte);
    } else {
      vlak.style.removeProperty("max-height");
    }
    vorigeHoogte = hoogte;
  }

  // Houd de actieve link zichtbaar in het schuifvlak van de kolom.
  function toonInSchuifvlak(link) {
    if (!vlak || vlak.scrollHeight <= vlak.clientHeight) return;

    const l = link.getBoundingClientRect();
    const v = vlak.getBoundingClientRect();

    if (l.top < v.top) {
      vlak.scrollTop -= v.top - l.top;
    } else if (l.bottom > v.bottom) {
      vlak.scrollTop += l.bottom - v.bottom;
    }
  }

  // Markeer de actieve sectie in de inhoudsopgave tijdens het scrollen. Alleen
  // koppen met een link in de inhoudsopgave tellen mee.
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

  let vorigeActieve = null;
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
    const actief = current ? current.link : null;
    if (actief) {
      actief.classList.add("active");
      if (actief !== vorigeActieve) toonInSchuifvlak(actief);
    }
    vorigeActieve = actief;
  }

  function bijwerken() {
    pasHoogteAan();
    if (entries.length) updateActiveLink();
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        bijwerken();
      });
    }
  }

  if (vlak || entries.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    breed.addEventListener("change", onScroll);
    bijwerken();
  }

  // Op smal scherm wordt elk blok in de rechterkolom een uitklapregel met een
  // knop in de kop. Zonder JavaScript blijven de blokken open.
  const chevron = document.getElementById("page-aside-chevron");
  const blokken = vlak
    ? Array.from(vlak.querySelectorAll(":scope > nav"))
        .map((blok) => ({
          kop: blok.querySelector(":scope > h2"),
          inhoud: blok.querySelector(":scope > h2 + *"),
        }))
        .filter((blok) => blok.kop && blok.inhoud)
    : [];

  if (!chevron || !blokken.length) return;

  blokken.forEach((blok, i) => {
    if (!blok.inhoud.id) blok.inhoud.id = "page-aside-blok-" + (i + 1);
  });

  function maakKnop(blok) {
    if (blok.kop.querySelector(".page-aside-toggle")) return;
    const knop = document.createElement("button");
    knop.type = "button";
    knop.className = "page-aside-toggle";
    knop.setAttribute("aria-expanded", "false");
    knop.setAttribute("aria-controls", blok.inhoud.id);
    knop.append(chevron.content.cloneNode(true), ...blok.kop.childNodes);
    knop.addEventListener("click", () => {
      const open = knop.getAttribute("aria-expanded") === "true";
      knop.setAttribute("aria-expanded", String(!open));
      blok.inhoud.hidden = open;
    });
    blok.kop.append(knop);
    blok.inhoud.hidden = true;
  }

  function haalKnopWeg(blok) {
    const knop = blok.kop.querySelector(".page-aside-toggle");
    if (!knop) return;
    knop.querySelector("svg").remove();
    blok.kop.replaceChildren(...knop.childNodes);
    blok.inhoud.hidden = false;
  }

  function pasAan() {
    blokken.forEach(breed.matches ? haalKnopWeg : maakKnop);
  }

  breed.addEventListener("change", pasAan);
  pasAan();
})();
