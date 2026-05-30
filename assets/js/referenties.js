/*
  Klap de referenties-accordeon automatisch uit bij een referentie-link klik
*/
(function () {
  function openDetailsFor(hash) {
    if (!hash || hash.charAt(0) !== '#') return;
    var el = document.getElementById(hash.slice(1));
    if (!el) return;
    var d = el.closest('details');
    if (d && !d.open) {
      d.open = true;
      requestAnimationFrame(function () {
        el.scrollIntoView({ block: 'center' });
      });
    }
  }
  window.addEventListener('hashchange', function () {
    openDetailsFor(window.location.hash);
  });
  if (window.location.hash) {
    openDetailsFor(window.location.hash);
  }
})();
