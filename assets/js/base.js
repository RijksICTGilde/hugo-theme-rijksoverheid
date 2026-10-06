// Theme toggle
const toggle = document.getElementById('theme-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    let targetTheme = 'light';

    if (!currentTheme) {
      targetTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
    } else {
      targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    }

    document.documentElement.setAttribute('data-theme', targetTheme);
    localStorage.setItem('theme', targetTheme);
  });
}

// Subnav panel toggles
const defaultPanel = document.querySelector('.subnav-panel:not([hidden])');
const defaultPanelId = defaultPanel ? defaultPanel.id : null;
const defaultInSection = document.querySelector('.navbar-sub .in-section');

document.querySelectorAll('.subnav-toggle').forEach(btn => {
  btn.addEventListener('click', function() {
    const panelId = this.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    const expanded = this.getAttribute('aria-expanded') === 'true';

    document.querySelectorAll('.subnav-panel:not([hidden])').forEach(otherPanel => {
      if (otherPanel.id !== panelId) {
        otherPanel.hidden = true;
      }
    });

    document.querySelectorAll('.subnav-toggle[aria-expanded="true"]').forEach(other => {
      if (other !== this) {
        other.setAttribute('aria-expanded', 'false');
      }
    });

    if (!expanded) {
      document.querySelectorAll('.navbar-sub .in-section').forEach(el => {
        el.classList.remove('in-section');
      });
    }

    this.setAttribute('aria-expanded', !expanded);
    if (panel) panel.hidden = expanded;

    if (expanded && panelId !== defaultPanelId && defaultPanelId) {
      const origPanel = document.getElementById(defaultPanelId);
      if (origPanel) origPanel.hidden = false;
      if (defaultInSection) defaultInSection.classList.add('in-section');
    }
  });
});

// Mobile menu toggle. Het aria-label blijft "Menu"; de toestand staat in
// aria-expanded, dat de schermlezer al voorleest.
document.querySelectorAll('.navbar .toggle').forEach(btn => {
  btn.addEventListener('click', function() {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', !expanded);
  });
});

// Escape sluit het mobiele menu en zet de focus terug op de menuknop, zodat
// toetsenbordgebruikers niet op een verdwenen link achterblijven. Staat er een
// dialoog open (het zoekvenster), dan is de Escape voor die dialoog.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.querySelector('dialog[open]')) return;
  const openToggle = document.querySelector('.navbar .toggle[aria-expanded="true"]');
  if (!openToggle) return;
  openToggle.setAttribute('aria-expanded', 'false');
  openToggle.focus();
});

// Mobile theme toggle (sync with main toggle)
const mobileThemeToggle = document.querySelector('.mobile-theme');
if (mobileThemeToggle && toggle) {
  mobileThemeToggle.addEventListener('click', () => {
    toggle.click();
  });
}

// Sluit mobiel menu bij resize naar desktop
const desktopBreakpoint = 900;
let wasDesktop = window.innerWidth >= desktopBreakpoint;

window.addEventListener('resize', () => {
  const isDesktop = window.innerWidth >= desktopBreakpoint;
  if (isDesktop && !wasDesktop) {
    document.querySelectorAll('.toggle[aria-expanded="true"]').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
  }
  wasDesktop = isDesktop;
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
