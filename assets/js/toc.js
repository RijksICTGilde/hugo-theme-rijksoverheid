(function () {
  const toc = document.getElementById("toc");
  const toggleButton = document.querySelector(".toc-toggle");
  const STORAGE_KEY = "toc-open";

  // TOC toggle functionaliteit
  if (toc && toggleButton) {
    // Herstel voorkeur uit localStorage
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState === "true") {
      openToc();
    }

    toggleButton.addEventListener("click", function () {
      const isOpen = toc.classList.contains("is-open");
      if (isOpen) {
        closeToc();
      } else {
        openToc();
      }
    });

    function openToc() {
      toc.classList.add("is-open");
      toggleButton.setAttribute("aria-expanded", "true");
      toggleButton.querySelector(".visually-hidden").textContent =
        "Inhoudsopgave verbergen";
      localStorage.setItem(STORAGE_KEY, "true");
    }

    function closeToc() {
      toc.classList.remove("is-open");
      toggleButton.setAttribute("aria-expanded", "false");
      toggleButton.querySelector(".visually-hidden").textContent =
        "Inhoudsopgave tonen";
      localStorage.setItem(STORAGE_KEY, "false");
    }
  }

  // Active link highlighting.
  const tocLinks = Array.from(document.querySelectorAll(".toc a[href^='#']"));
  const entries = tocLinks
    .map((link) => {
      const id = decodeURIComponent(link.getAttribute("href").slice(1));
      const el = id && document.getElementById(id);
      return el ? { link, el } : null;
    })
    .filter(Boolean);

  if (!entries.length) return;

  function updateActiveLink() {
    const threshold = window.innerHeight * 0.2;

    let current = null;
    for (const entry of entries) {
      // getBoundingClientRect i.p.v. offsetTop: betrouwbaar ongeacht
      // offsetParent (bv. koppen in een gepositioneerde sectie/<details>).
      if (entry.el.getBoundingClientRect().top <= threshold) {
        current = entry;
      } else {
        break;
      }
    }

    entries.forEach((entry) => entry.link.classList.remove("active"));
    if (current) current.link.classList.add("active");
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        updateActiveLink();
      });
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateActiveLink();
})();
