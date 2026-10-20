(function () {
  'use strict';

  var indexPromise = null;
  var searchModal;
  var searchInput;
  var searchResults;
  var searchStatus;
  var opener = null;
  var activeFilter = '';
  var searchSeq = 0;
  var prioSections = [];
  var sectionWeights = {};
  var maxResults = 10;

  var fuseOptions = {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'content', weight: 1 }
    ],
    threshold: 0.3, // 0 = exact match, 1 = alles matcht
    ignoreLocation: true,
    includeScore: true,
    findAllMatches: true,
    minMatchCharLength: 2
  };

  function readNumber(value, fallback) {
    var number = parseFloat(value);
    return isNaN(number) ? fallback : number;
  }

  // De instellingen komen als data-attributen uit search.html (params.search).
  function readConfig() {
    var data = searchModal.dataset;

    prioSections = (data.searchPriority || '').split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);

    fuseOptions.threshold = Math.min(1, Math.max(0, readNumber(data.searchThreshold, 0.3)));
    maxResults = Math.max(0, Math.floor(readNumber(data.searchMaxResults, 10)));

    // Factor op de Fuse-score: onder 1 komt een sectie eerder, boven 1 later.
    try {
      var weights = JSON.parse(data.searchWeights || '{}');
      Object.keys(weights).forEach(function (section) {
        var factor = Number(weights[section]);
        if (isFinite(factor) && factor >= 0) {
          sectionWeights[section.toLowerCase()] = factor;
        }
      });
    } catch (e) {
      sectionWeights = {};
    }
  }

  function init() {
    searchModal = document.getElementById('search-modal');
    searchInput = document.getElementById('search-input');
    searchResults = document.getElementById('search-results');
    searchStatus = document.getElementById('search-status');

    if (!searchModal || !searchInput || !searchResults) {
      return;
    }

    readConfig();
    setupEventListeners();
  }

  function openModal(trigger) {
    if (searchModal.open) return;
    opener = trigger || document.activeElement;
    searchModal.showModal();
    searchInput.select();
    // Alvast ophalen, zodat de eerste zoekopdracht niet op het netwerk wacht.
    loadSearchIndex().catch(function () {});
  }

  function closeModal() {
    searchModal.close();
  }

  // Opruimen bij elke manier van sluiten: knop, Escape en klik naast het venster.
  function onClosed() {
    // Het close-event komt asynchroon; is het venster alweer open, dan niet wissen.
    if (searchModal.open) return;
    searchSeq++;
    hideResults();
    searchInput.value = '';
    activeFilter = '';

    var filterButtons = searchModal.querySelectorAll('.search-filter');
    filterButtons.forEach(function (btn, i) {
      btn.classList.toggle('active', i === 0);
      btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    });
    if (filterButtons.length) {
      activeFilter = filterButtons[0].dataset.section || '';
    }

    // Bij Ctrl+K vanaf de pagina zelf is de opener <body>; dan herstelt de dialoog de focus zelf.
    if (opener && opener !== document.body && document.contains(opener) && typeof opener.focus === 'function') {
      opener.focus();
    }
    opener = null;
  }

  function loadSearchIndex() {
    if (indexPromise) {
      return indexPromise;
    }
    if (typeof Fuse === 'undefined') {
      return Promise.reject(new Error('Fuse is niet geladen'));
    }

    var searchIndexUrl = searchModal.dataset.searchIndex || '/index.json';
    indexPromise = fetch(searchIndexUrl)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Zoekindex niet beschikbaar: ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        // Items uit search-index-extra.html kunnen een veld missen.
        var searchData = data
          .filter(function (item) { return item && item.url; })
          .map(function (item) {
            return {
              title: item.title || '',
              url: item.url,
              content: item.content || '',
              section: item.section
            };
          });

        return new Fuse(searchData, fuseOptions);
      })
      .catch(function (error) {
        indexPromise = null;
        throw error;
      });

    return indexPromise;
  }

  function sectionWeight(section) {
    var weight = sectionWeights[String(section).toLowerCase()];
    return weight === undefined ? 1 : weight;
  }

  function performSearch(query) {
    var seq = ++searchSeq;

    if (!query || query.length < 2) {
      hideResults();
      return;
    }

    loadSearchIndex().then(function (fuse) {
      // Een langzamer antwoord op een eerdere zoekopdracht niet meer tonen.
      if (seq !== searchSeq) return;

      var results = fuse.search(query);

      // De-dupliceer: toon alleen beste resultaat per pagina (URL zonder anchor)
      var seenPages = {};
      results = results.filter(function (result) {
        var baseUrl = result.item.url.split('#')[0];
        if (seenPages[baseUrl]) {
          return false;
        }
        seenPages[baseUrl] = true;
        return true;
      });

      results.forEach(function (result) {
        result.score = result.score * sectionWeight(result.item.section);
      });

      if (activeFilter) {
        results = results.filter(function (result) {
          return result.item.section === activeFilter;
        });
      }

      // Exacte treffers eerst: Fuse's fuzzy (typo-tolerantie) valt weg zodra er
      // een exacte treffer is.
      var qLower = query.toLowerCase();
      function hasSubstring(item) {
        return item.title.toLowerCase().indexOf(qLower) !== -1
            || item.content.toLowerCase().indexOf(qLower) !== -1;
      }
      var hasAnySubstring = results.some(function (r) { return hasSubstring(r.item); });
      if (hasAnySubstring) {
        results = results.filter(function (r) { return hasSubstring(r.item); });
      }

      // Voorrang per sectie (params.search.priority_sections), daarbinnen op score.
      function rank(result) {
        var index = prioSections.indexOf(result.item.section);
        return index === -1 ? 999 : index;
      }
      results.sort(function (a, b) {
        return (rank(a) - rank(b)) || (a.score - b.score);
      });

      var total = results.length;
      if (maxResults > 0) {
        results = results.slice(0, maxResults);
      }

      displayResults(results, query, total);
    }).catch(function () {
      if (seq !== searchSeq) return;
      showMessage('Zoeken lukt nu niet. Probeer het later opnieuw.');
    });
  }

  function buildSearchUrl(baseUrl, query) {
    var hashIndex = baseUrl.indexOf('#');
    var path = hashIndex !== -1 ? baseUrl.substring(0, hashIndex) : baseUrl;
    var hash = hashIndex !== -1 ? baseUrl.substring(hashIndex) : '';
    var separator = path.indexOf('?') === -1 ? '?' : '&';
    return path + separator + 'q=' + encodeURIComponent(query) + hash;
  }

  function announce(message) {
    if (searchStatus) {
      searchStatus.textContent = message;
    }
  }

  function showMessage(message, announcement) {
    searchResults.textContent = '';
    var li = document.createElement('li');
    li.className = 'search-no-results';
    li.textContent = message;
    searchResults.appendChild(li);
    announce(announcement || message);
  }

  function displayResults(results, query, total) {
    if (results.length === 0) {
      showMessage('Geen resultaten gevonden voor "' + query + '"', 'Geen resultaten gevonden voor ' + query);
      return;
    }

    if (total > results.length) {
      announce('De eerste ' + results.length + ' van ' + total + ' zoekresultaten');
    } else {
      announce(results.length === 1 ? '1 zoekresultaat' : results.length + ' zoekresultaten');
    }

    var fragment = document.createDocumentFragment();
    results.forEach(function (result, i) {
      var item = result.item;

      var link = document.createElement('a');
      link.href = buildSearchUrl(item.url, query);
      link.className = 'search-result-item';
      link.tabIndex = i === 0 ? 0 : -1;

      // Niveau 2: het zoekvenster heeft zelf geen kop.
      var title = document.createElement('h2');
      title.className = 'search-result-title';
      appendHighlighted(title, item.title, query);
      link.appendChild(title);

      var snippet = getSnippet(item.content, query);
      if (snippet) {
        var snippetEl = document.createElement('span');
        snippetEl.className = 'search-result-snippet';
        appendHighlighted(snippetEl, snippet, query);
        link.appendChild(snippetEl);
      }

      var li = document.createElement('li');
      li.appendChild(link);
      fragment.appendChild(li);
    });

    searchResults.textContent = '';
    searchResults.appendChild(fragment);
  }

  function hideResults() {
    searchResults.textContent = '';
    announce('');
  }

  function getSnippet(content, query) {
    if (!content) return '';

    var text = content.replace(/\n+/g, '\n').replace(/[ \t]+/g, ' ').trim();
    var maxLength = 250;

    if (!query) {
      if (text.length <= maxLength) return text;
      return truncateAtWordBoundary(text, maxLength) + '…';
    }

    var lowerText = text.toLowerCase();
    var lowerQuery = query.toLowerCase();
    var matchIndex = lowerText.indexOf(lowerQuery);

    if (matchIndex === -1) {
      if (text.length <= maxLength) return text;
      return truncateAtWordBoundary(text, maxLength) + '…';
    }

    if (text.length <= maxLength) {
      return text;
    }

    var queryLength = query.length;
    var halfContext = Math.floor((maxLength - queryLength) / 2);

    var start = Math.max(0, matchIndex - halfContext);
    var end = Math.min(text.length, matchIndex + queryLength + halfContext);

    if (start === 0) {
      end = Math.min(text.length, maxLength);
    } else if (end === text.length) {
      start = Math.max(0, text.length - maxLength);
    }

    if (start > 0) {
      var spaceAfterStart = text.indexOf(' ', start);
      if (spaceAfterStart !== -1 && spaceAfterStart < matchIndex) {
        start = spaceAfterStart + 1;
      }
    }

    if (end < text.length) {
      var spaceBeforeEnd = text.lastIndexOf(' ', end);
      if (spaceBeforeEnd !== -1 && spaceBeforeEnd > matchIndex + queryLength) {
        end = spaceBeforeEnd;
      }
    }

    var snippet = text.substring(start, end).trim();

    if (start > 0) snippet = '…' + snippet;
    if (end < text.length) snippet = snippet + '…';

    return snippet;
  }

  function truncateAtWordBoundary(text, maxLength) {
    if (text.length <= maxLength) return text;
    var truncated = text.substring(0, maxLength);
    var lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace);
    }
    return truncated;
  }

  function appendText(parent, text) {
    text.split('\n').forEach(function (line, i) {
      if (i > 0) parent.appendChild(document.createElement('br'));
      if (line) parent.appendChild(document.createTextNode(line));
    });
  }

  // Zet tekst in het element en markeert de zoekterm met <mark>. Alleen
  // tekstknopen, dus geen HTML uit de index in de pagina.
  function appendHighlighted(parent, text, query) {
    if (!text) return;
    var parts = text.split(new RegExp('(' + escapeRegex(query) + ')', 'gi'));
    parts.forEach(function (part, i) {
      if (i % 2 === 1) {
        var mark = document.createElement('mark');
        mark.textContent = part;
        parent.appendChild(mark);
      } else {
        appendText(parent, part);
      }
    });
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Een veld waarin je tikt: daar blijft Ctrl+K voor het veld zelf.
  function isTypingTarget(element) {
    // Na sluiten houdt Chrome de focus soms op het verborgen zoekveld zelf.
    if (!element || searchModal.contains(element)) return false;
    if (element.isContentEditable || element.tagName === 'TEXTAREA') return true;
    if (element.tagName !== 'INPUT') return false;
    return !/^(button|checkbox|radio|submit|reset|image|file|range|color)$/i.test(element.type);
  }

  function setupEventListeners() {
    // Een delegated klik dekt elke .search-trigger, ook als die later komt.
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('.search-trigger');
      if (trigger) {
        openModal(trigger);
      }
    });

    searchModal.addEventListener('close', onClosed);

    var closeButton = document.getElementById('search-close');
    if (closeButton) {
      closeButton.addEventListener('click', closeModal);
    }

    var filterButtons = searchModal.querySelectorAll('.search-filter');
    if (filterButtons.length) {
      activeFilter = filterButtons[0].dataset.section || '';
    }
    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        filterButtons.forEach(function (btn) {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');

        activeFilter = button.dataset.section || '';
        var query = searchInput.value.trim();
        if (query.length >= 2) {
          performSearch(query);
        }
      });
    });

    var debounceTimer;
    searchInput.addEventListener('input', function (e) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        performSearch(e.target.value.trim());
      }, 150);
    });

    searchModal.addEventListener('click', function (e) {
      if (e.target === searchModal) {
        closeModal();
      }
    });

    // Een resultaat op de pagina waar je al bent verandert alleen het anker,
    // dus het venster moet zelf dicht. De focus gaat dan niet terug naar de
    // knop, anders scrolt die de pagina weg van het anker.
    searchResults.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a.search-result-item');
      if (!link) return;
      var target = new URL(link.href, window.location.href);
      if (target.pathname === window.location.pathname && target.search === window.location.search) {
        opener = null;
        closeModal();
      }
    });

    // Sneltoets Ctrl+K / Cmd+K. Bewust geen losse letter zoals "/": die vuurt
    // ook op spraakinvoer en is niet uit te zetten (WCAG 2.1.4). Met een
    // modifier valt de sneltoets buiten 2.1.4. De hint in de kop is
    // aria-hidden; aria-keyshortcuts meldt de toets aan hulptechnologie.
    document.querySelectorAll('.search-trigger').forEach(function (trigger) {
      if (!trigger.hasAttribute('aria-keyshortcuts')) {
        trigger.setAttribute('aria-keyshortcuts', 'Control+K Meta+K');
      }
    });
    if (/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)) {
      document.querySelectorAll('.search-shortcut').forEach(function (hint) {
        hint.textContent = '⌘ K';
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.isComposing) return;
      if (typeof e.key !== 'string' || e.key.toLowerCase() !== 'k') return;
      if (e.ctrlKey === e.metaKey || e.altKey || e.shiftKey) return;
      if (searchModal.open) return;
      if (isTypingTarget(document.activeElement)) return;

      e.preventDefault();
      openModal(document.activeElement);
    });

    searchInput.addEventListener('keydown', function (e) {
      var items = searchResults.querySelectorAll('.search-result-item');

      if (e.key === 'Escape') {
        // In een zoekveld wist de browser met Escape eerst de tekst; dat sluit
        // het venster niet, dus dat doen we zelf.
        e.preventDefault();
        closeModal();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length > 0) {
          items[0].focus();
        }
      } else if (e.key === 'Enter') {
        if (items.length > 0) {
          e.preventDefault();
          items[0].click();
        }
      }
    });

    searchResults.addEventListener('keydown', function (e) {
      var items = searchResults.querySelectorAll('.search-result-item');
      var activeItem = document.activeElement;
      var activeIndex = Array.from(items).indexOf(activeItem);

      if (activeIndex === -1) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeIndex < items.length - 1) {
          items[activeIndex + 1].focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeIndex > 0) {
          items[activeIndex - 1].focus();
        } else {
          searchInput.focus();
        }
      }
    });
  }

  function highlightPageContent() {
    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim();

    if (query.length < 2) return;

    var mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // q parameter blijft in URL zodat highlight deelbaar is
    var count = highlightTextNodes(mainContent, query);
    if (count > 0) {
      showHighlightBar(query, count);
    }
  }

  function showHighlightBar(query, count) {
    var highlightBar = document.getElementById('highlight-bar');
    var querySpan = document.getElementById('highlight-bar-query');
    var status = document.getElementById('highlight-status');

    if (!highlightBar || !querySpan) return;

    querySpan.textContent = query;
    highlightBar.hidden = false;
    highlightBar.addEventListener('click', function () { hideHighlights(true); });
    document.addEventListener('keydown', handleHighlightEscape);

    // De melding staat in een live region die al in de pagina zit; de tekst
    // komt er iets later in, zodat een schermlezer hem als wijziging oppakt.
    if (status) {
      var message = 'Zoekterm "' + query + '" is ' + count + ' keer gemarkeerd op deze pagina. Druk op Escape om de markering te verwijderen.';
      window.setTimeout(function () { status.textContent = message; }, 500);
    }
  }

  function handleHighlightEscape(e) {
    if (e.key === 'Escape' && !e.defaultPrevented && !(searchModal && searchModal.open)) {
      e.preventDefault();
      hideHighlights(false);
    }
  }

  function hideHighlights(restoreFocus) {
    var mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.querySelectorAll('mark[data-search-highlight]').forEach(function (mark) {
        mark.replaceWith(mark.textContent);
      });
      mainContent.normalize();
    }

    var highlightBar = document.getElementById('highlight-bar');
    if (highlightBar) {
      highlightBar.hidden = true;
    }

    var status = document.getElementById('highlight-status');
    if (status) {
      status.textContent = 'Markering verwijderd.';
    }

    // De knop die de focus had, verdwijnt: zonder dit valt de focus naar het
    // begin van de pagina (WCAG 2.4.3).
    if (restoreFocus && mainContent) {
      mainContent.focus({ preventScroll: true });
    }

    var url = new URL(window.location.href);
    url.searchParams.delete('q');
    window.history.replaceState({}, '', url.toString());

    document.removeEventListener('keydown', handleHighlightEscape);
  }

  // Geeft het aantal markeringen terug.
  function highlightTextNodes(element, query) {
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        // Geen script en stijl, geen eerdere markering, en niets in een
        // SVG-tekening: daar werkt een HTML-element niet.
        var skip = !parent || parent.closest('script, style, noscript, textarea, mark, svg');
        return skip ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });

    var regex = new RegExp('(' + escapeRegex(query) + ')', 'gi');
    var nodesToProcess = [];
    var node;

    while ((node = walker.nextNode())) {
      regex.lastIndex = 0;
      if (regex.test(node.nodeValue)) {
        nodesToProcess.push(node);
      }
    }

    var count = 0;
    nodesToProcess.forEach(function (textNode) {
      var parts = textNode.nodeValue.split(regex);
      var fragment = document.createDocumentFragment();

      parts.forEach(function (part, i) {
        if (i % 2 === 1) {
          var mark = document.createElement('mark');
          mark.setAttribute('data-search-highlight', '');
          mark.textContent = part;
          fragment.appendChild(mark);
          count++;
        } else if (part) {
          fragment.appendChild(document.createTextNode(part));
        }
      });

      textNode.parentNode.replaceChild(fragment, textNode);
    });

    return count;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      highlightPageContent();
    });
  } else {
    init();
    highlightPageContent();
  }
})();
