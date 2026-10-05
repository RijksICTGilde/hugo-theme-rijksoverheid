/*
  Referenties: accordeon uitklappen bij een referentie-link, en de inline
  bron-tooltips (.ref-wrapper/.ref-tooltip) binnen beeld en sluitbaar houden.
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

  /* Open tooltip binnen de viewport schuiven via --ref-offset-x. De tooltip
     staat links uitgelijnd op de term; rechts in de regel steekt hij anders
     buiten beeld en geeft hij horizontale scroll (1.4.10). Meten zonder
     transform: offsetWidth plus het eerste regelfragment van de wrapper. */
  var MARGE = 16;
  function placeTooltip(wrapper) {
    var tip = wrapper.querySelector('.ref-tooltip');
    var rects = wrapper.getClientRects();
    if (!tip || !rects.length || !tip.offsetWidth) return;
    var vw = document.documentElement.clientWidth;
    var left = rects[0].left;
    // Alleen naar links schuiven, en nooit voorbij de linkermarge.
    var shift = Math.min(0, vw - MARGE - (left + tip.offsetWidth));
    shift = Math.max(shift, Math.min(0, MARGE - left));
    tip.style.setProperty('--ref-offset-x', Math.round(shift) + 'px');
  }
  function onShow(e) {
    var wrapper = e.target.closest && e.target.closest('.ref-wrapper');
    if (wrapper) placeTooltip(wrapper);
  }
  document.addEventListener('mouseover', onShow);
  document.addEventListener('focusin', onShow);

  /* Escape sluit de open tooltip zonder focus of muis te verplaatsen (1.4.13).
     Listener staat vóór die van search.js in de bundel; stopImmediatePropagation
     voorkomt dat dezelfde toets ook de zoektermmarkering weghaalt. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelectorAll('.ref-wrapper:hover, .ref-wrapper:focus-within');
    var closed = false;
    for (var i = 0; i < open.length; i++) {
      if (open[i].classList.contains('is-dismissed')) continue;
      open[i].classList.add('is-dismissed');
      closed = true;
    }
    if (closed) e.stopImmediatePropagation();
  });

  /* Pas weer tonen na een nieuwe hover of focus: de class gaat eraf zodra
     zowel de muis als de focus buiten de wrapper is. */
  function onLeave(e) {
    var wrapper = e.target.closest && e.target.closest('.ref-wrapper.is-dismissed');
    if (!wrapper || (e.relatedTarget && wrapper.contains(e.relatedTarget))) return;
    var stillHovered = e.type === 'focusout' && wrapper.matches(':hover');
    var stillFocused = e.type === 'mouseout' && wrapper.contains(document.activeElement);
    if (!stillHovered && !stillFocused) wrapper.classList.remove('is-dismissed');
  }
  document.addEventListener('mouseout', onLeave);
  document.addEventListener('focusout', onLeave);
})();
