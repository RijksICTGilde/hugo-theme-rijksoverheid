// Alles in een eigen functiebereik: de bundel plakt meerdere bestanden in één
// klassiek script, en een dubbele const op het hoogste niveau breekt dan alles.
(function () {
  const root = document.documentElement;

  // Themakeuze in de voet: Systeem, Licht of Donker als keuzerondjes in een
  // uitklappaneel. Systeem wist de eigen keuze; de site volgt dan weer de
  // systeemvoorkeur. data-theme gaat mee voor sites met eigen CSS daarop.
  const themeMenu = document.querySelector('.theme-menu');
  const themeButton = themeMenu && themeMenu.querySelector('.theme-menu-knop');
  const themePanel = themeButton && document.getElementById(themeButton.getAttribute('aria-controls'));

  function themePanelOpen() {
    return !!themeButton && themeButton.getAttribute('aria-expanded') === 'true';
  }

  function setThemePanel(open) {
    themeButton.setAttribute('aria-expanded', String(open));
    themePanel.hidden = !open;
  }

  if (themeButton && themePanel) {
    const radios = themePanel.querySelectorAll('input[type="radio"]');

    const applyScheme = (scheme) => {
      if (scheme === 'light' || scheme === 'dark') {
        root.setAttribute('data-scheme', scheme);
        root.setAttribute('data-theme', scheme);
      } else {
        root.removeAttribute('data-scheme');
        root.removeAttribute('data-theme');
      }
    };

    const storeScheme = (scheme) => {
      try {
        if (scheme === 'light' || scheme === 'dark') {
          localStorage.setItem('theme', scheme);
        } else {
          localStorage.removeItem('theme');
        }
      } catch (e) {
        // Zonder opslag geldt de keuze alleen voor deze pagina.
      }
    };

    const current = root.getAttribute('data-scheme') || root.getAttribute('data-theme');
    radios.forEach(radio => {
      radio.checked = radio.value === (current === 'light' || current === 'dark' ? current : 'system');
      // Pijltjestoetsen wisselen het keuzerondje en vuren change; het paneel
      // blijft dus open tot Escape, een klik ernaast of Tab eruit.
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        applyScheme(radio.value);
        storeScheme(radio.value);
      });
    });

    themeButton.addEventListener('click', () => {
      const open = !themePanelOpen();
      setThemePanel(open);
      if (open) {
        const checked = themePanel.querySelector('input:checked') || radios[0];
        if (checked) checked.focus();
      }
    });

    document.addEventListener('click', event => {
      if (themePanelOpen() && !themeMenu.contains(event.target)) setThemePanel(false);
    });

    // Na focusout pas kijken waar de focus is: relatedTarget is leeg als de
    // focus de pagina verlaat. Bij een vensterwissel blijft activeElement
    // in het paneel staan, en dan blijft het open.
    themeMenu.addEventListener('focusout', () => {
      setTimeout(() => {
        if (themePanelOpen() && !themeMenu.contains(document.activeElement)) setThemePanel(false);
      }, 0);
    });

    themeMenu.hidden = false;
  }

  // Submenupanelen in de sectienavigatie. Het paneel van de huidige sectie
  // staat open; een ander paneel openen sluit dat, en weer dichtklappen zet
  // het terug.
  const defaultPanel = document.querySelector('.subnav-panel:not([hidden])');
  const defaultPanelId = defaultPanel ? defaultPanel.id : null;
  const defaultInSection = document.querySelector('.navbar-sub .in-section');

  document.querySelectorAll('.subnav-toggle').forEach(btn => {
    btn.addEventListener('click', function () {
      const panelId = this.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      const expanded = this.getAttribute('aria-expanded') === 'true';

      document.querySelectorAll('.subnav-panel:not([hidden])').forEach(otherPanel => {
        if (otherPanel.id !== panelId) otherPanel.hidden = true;
      });

      document.querySelectorAll('.subnav-toggle[aria-expanded="true"]').forEach(other => {
        if (other !== this) other.setAttribute('aria-expanded', 'false');
      });

      if (!expanded) {
        document.querySelectorAll('.navbar-sub .in-section').forEach(el => {
          el.classList.remove('in-section');
        });
      }

      this.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;

      if (expanded && panelId !== defaultPanelId && defaultPanelId) {
        const origPanel = document.getElementById(defaultPanelId);
        if (origPanel) origPanel.hidden = false;
        if (defaultInSection) defaultInSection.classList.add('in-section');
      }
    });
  });

  // Mobiel menu. Het aria-label blijft "Menu"; de toestand staat in
  // aria-expanded, dat de schermlezer al voorleest.
  document.querySelectorAll('.navbar .toggle').forEach(btn => {
    btn.addEventListener('click', function () {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!expanded));
    });
  });

  // Escape sluit wat het laatst openging en zet de focus terug op de knop
  // ervan, zodat toetsenbordgebruikers niet op een verdwenen element
  // achterblijven. Staat er een dialoog open (het zoekvenster), dan is de
  // Escape voor die dialoog.
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.querySelector('dialog[open]')) return;

    if (themePanelOpen()) {
      setThemePanel(false);
      themeButton.focus();
      return;
    }

    const openToggle = document.querySelector('.navbar .toggle[aria-expanded="true"]');
    if (openToggle) {
      openToggle.setAttribute('aria-expanded', 'false');
      openToggle.focus();
      return;
    }

    const subnav = document.querySelector('.navbar-sub');
    const openSubnav = document.querySelector('.subnav-toggle[aria-expanded="true"]');
    if (openSubnav && subnav && subnav.contains(document.activeElement)) {
      openSubnav.click();
      openSubnav.focus();
    }
  });

  // Sluit het mobiele menu zodra het brede menu verschijnt; het breekpunt is
  // gelijk aan dat in header.css.
  const desktop = window.matchMedia('(min-width: 768px)');
  desktop.addEventListener('change', event => {
    if (!event.matches) return;
    document.querySelectorAll('.navbar .toggle[aria-expanded="true"]').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
  });

  // Back-to-top: knop pas tonen als er meer dan een schermhoogte is gescrold,
  // zodat hij niet op korte pagina's staat te zweven. De knop staat in de HTML
  // met `hidden`; zonder JS blijft hij dus weg.
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    let backToTopTicking = false;

    const updateBackToTop = () => {
      backToTopTicking = false;
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      backToTop.hidden = scrolled < window.innerHeight;
    };

    const onBackToTopScroll = () => {
      if (backToTopTicking) return;
      backToTopTicking = true;
      window.requestAnimationFrame(updateBackToTop);
    };

    window.addEventListener('scroll', onBackToTopScroll, { passive: true });
    window.addEventListener('resize', onBackToTopScroll, { passive: true });
    updateBackToTop();
  }
})();
