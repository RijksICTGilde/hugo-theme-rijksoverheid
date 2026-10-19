/**
 * Het register van alle regels, elk met fixtures. `slecht` is een lijst met
 * argumentlijsten die de regel minstens één bevinding moeten geven; `goed` een
 * lijst die er geen mag geven. Zo kan geen regel stil slagen doordat zijn
 * patroon niets meer vindt (bijvoorbeeld na een hernoemde klasse).
 *
 * Staat een nieuwe regel niet in dit register, dan faalt regels.test.js.
 */

import * as html from "./html.js";
import * as csp from "./csp.js";
import * as bron from "./bron.js";

const MET_MELDING = '<span class="visually-hidden"> (opent in een nieuw venster)</span>';

/** Regels op de HTML van elke pagina: check(html, ctx). */
const HTML_REGELS = [
  {
    naam: "koppenvolgorde",
    check: html.checkHeadingOrder,
    slecht: [
      ["<h1>Titel</h1><h2>Deel</h2><h4>Te diep</h4>"],
      ["<h2>Geen titel</h2>"],
      ["<h1>Een</h1><h1>Twee</h1>"],
      ["<h1 id=a>Titel<h3 class=x>Te diep</h3>"],
      ['<h1>Titel</h1><aside class="page-aside"><h2>Op deze pagina</h2></aside><h3>Te diep</h3>'],
      ["<h1>Titel</h1><aside class=page-aside><h2>Op deze pagina</h2></aside><h3>Te diep</h3>"],
    ],
    goed: [
      ["<h1>Titel</h1><h2>Deel</h2><h3>Subdeel</h3><h2>Ander deel</h2>"],
      ['<h1 id="titel" class="x">Titel</h1><h2 data-a="3">Deel</h2>'],
      ["<h1>Titel</h1><aside class=page-aside><h3>Zijkolom</h3></aside><h2>Deel</h2>"],
      ["<p>Tekst</p>"],
    ],
  },
  {
    naam: "diagram-alt",
    check: html.checkDiagramAlt,
    slecht: [
      ['<img class="mermaid-img mermaid-img--light" src="/a.svg" alt="">'],
      ['<img class="mermaid-img" src="/a.svg">'],
      ["<img class=mermaid-img src=/a.svg alt=>"],
    ],
    goed: [
      ['<img class="mermaid-img mermaid-img--light" src="/a.svg" alt="Stroomschema">'],
      ['<img class="logo" src="/logo.svg" alt="">'],
    ],
  },
  {
    naam: "afbeelding-alt-in-artikel",
    check: html.checkContentImageAlt,
    slecht: [
      ['<article><img src="diagram.svg" alt=""></article>'],
      ['<article><img src="foto.jpg"></article>'],
      ["<article><p>Tekst</p><img src=foto.jpg alt=></article>"],
    ],
    goed: [
      ['<article><img src="foto.jpg" alt="Twee mensen ondertekenen een verklaring"></article>'],
      ['<article><img src="streep.svg" alt="" role="presentation"></article>'],
      ["<article><img src=streep.svg alt= aria-hidden=true></article>"],
      ['<article><img class="mermaid-img" src="d.svg" alt=""></article>'],
      ['<header><img src="logo.svg" alt=""></header><article><p>Tekst</p></article>'],
    ],
  },
  {
    naam: "afbeelding-alt-aanwezig",
    check: html.checkImgAltAanwezig,
    slecht: [['<header><img src="logo.svg"></header>'], ["<img src=a.png>"]],
    goed: [['<header><img src="logo.svg" alt=""></header>'], ["<img src=a.png alt=Naam>"]],
  },
  {
    naam: "diagram-beschrijving",
    check: html.checkDiagramBeschrijving,
    slecht: [
      ['<div class="mermaid-diagram"><img class="mermaid-img" src="/a.svg" alt="Naam"></div>'],
      ['<div class="mermaid-diagram"><img class="mermaid-img" alt="Naam"><p class="mermaid-beschrijving visually-hidden"> </p></div>'],
      ["<div class=mermaid-diagram><img class=mermaid-img alt=Naam></div>"],
    ],
    goed: [
      ['<div class="mermaid-diagram"><img class="mermaid-img" alt="Naam"><p class="mermaid-beschrijving visually-hidden">Wat er te zien is.</p></div>'],
      ["<div class=mermaid-diagram><div><img></div><p class=\"mermaid-beschrijving visually-hidden\">Tekst</p></div>"],
    ],
  },
  {
    naam: "voetnoot-rol",
    check: html.checkVoetnootRol,
    slecht: [
      ['<div class="footnotes" role="doc-endnotes"><hr><ol><li id="fn:1"><p>Noot.</p></li></ol></div>'],
      ["<div class=footnotes role=doc-endnotes><hr><ol><li id=fn:1><p>Noot.</p></li></ol></div>"],
    ],
    goed: [['<div class="footnotes"><hr><ol><li id="fn:1"><p>Noot.</p></li></ol></div>']],
  },
  {
    naam: "geen-nav-in-nav",
    check: html.checkGenesteNav,
    slecht: [
      ['<nav aria-label="a"><ul><li><nav aria-label="b"></nav></li></ul></nav>'],
      ['<nav aria-label="a"><div role="navigation"></div></nav>'],
      ["<nav id=a><nav id=b></nav></nav>"],
    ],
    goed: [
      ['<nav aria-label="a"><div id="mobile-menu"><ul></ul></div></nav><nav aria-label="b"></nav>'],
      ["<nav aria-label=a></nav><nav aria-label=b></nav>"],
    ],
  },
  {
    naam: "lang-op-html",
    check: html.checkHtmlLang,
    slecht: [["<html><head></head></html>"], ["<html lang=en>"], ['<html lang="">'], ["<p>geen html-element</p>"]],
    goed: [['<html lang="nl"><head>'], ["<html lang=nl>"], ['<html class="x" lang="nl-NL">']],
  },
  {
    naam: "unieke-ids",
    check: html.checkUniekeIds,
    slecht: [['<div id="a"></div><p id="a"></p>'], ["<div id=a></div><p id=a></p>"]],
    goed: [['<div id="a"></div><p id="b"></p>'], ['<div class="a"></div><p class="a"></p>']],
  },
  {
    naam: "nieuw-venster-melding-en-rel",
    check: html.checkNieuwVenster,
    slecht: [
      [`<a href="https://x.nl" target="_blank" rel="external">x${MET_MELDING}</a>`],
      ['<a href="https://x.nl" target="_blank" rel="external noopener noreferrer">x</a>'],
      ["<a href=https://x.nl target=_blank>x</a>"],
      ['<a href="https://x.nl" target="_blank" rel="noopener noreferrer"><span class="visually-hidden">besloten</span></a>'],
    ],
    goed: [
      [`<a href="https://x.nl" target="_blank" rel="external noopener noreferrer">x${MET_MELDING}</a>`],
      ["<a href=https://x.nl target=_blank rel=\"external noopener noreferrer\">x<span class=visually-hidden> (besloten omgeving, opent in een nieuw venster)</span></a>"],
      ['<a href="https://x.nl" rel="external noreferrer">x</a>'],
    ],
  },
  {
    naam: "externe-link-rel",
    check: html.checkExterneLinkRel,
    slecht: [
      ['<a href="https://www.rijksoverheid.nl/">x</a>'],
      ['<a href="https://www.rijksoverheid.nl/" rel="external">x</a>'],
      ["<a href=http://x.nl rel=noreferrer>x</a>"],
    ],
    goed: [
      ['<a href="https://www.rijksoverheid.nl/" rel="external noreferrer">x</a>'],
      ['<a href="/over/">x</a>'],
      ['<a href="https://voorbeeld.example/over/">x</a>'],
      ['<a href="mailto:a@example.org">x</a>'],
    ],
  },
  {
    naam: "geen-role-menu",
    check: html.checkGeenRoleMenu,
    slecht: [['<ul role="menu"><li role="menuitem">x</li></ul>'], ["<div role=menubar></div>"]],
    goed: [['<ul role="list"><li><a href="/">x</a></li></ul>'], ['<div role="status"></div>']],
  },
  {
    naam: "geen-aria-live-op-lijst",
    check: html.checkGeenLiveLijst,
    slecht: [['<ul id="results" aria-live="polite"></ul>'], ["<table aria-live=polite></table>"]],
    goed: [['<p role="status"></p><ul id="results"></ul>'], ['<div aria-live="polite"></div>']],
  },
  {
    naam: "landmarks-met-unieke-naam",
    check: html.checkLandmarkNamen,
    slecht: [
      ['<nav aria-label="Hoofdnavigatie"></nav><nav></nav>'],
      ['<nav aria-label="Menu"></nav><nav aria-label="Menu"></nav>'],
      ["<aside></aside><aside aria-label=Zijkolom></aside>"],
    ],
    goed: [
      ['<nav aria-label="Hoofdnavigatie"></nav><nav aria-label="Zie ook"></nav>'],
      ["<nav></nav>"],
      ['<nav aria-labelledby="a"></nav><nav aria-labelledby="b"></nav>'],
    ],
  },
  {
    naam: "skip-link-en-main",
    check: html.checkSkipLink,
    slecht: [
      ['<a href="/x">x</a><main id="main-content" tabindex="-1"></main>'],
      ['<a href="#main-content">Ga</a><main id="anders" tabindex="-1"></main>'],
      ['<a href="#main-content">Ga</a><main id="main-content"></main>'],
      ["<p>Zonder main</p>"],
    ],
    goed: [
      ['<a href="#main-content" class="skip-link">Ga naar de inhoud</a><nav></nav><main id="main-content" tabindex="-1"></main>'],
      ["<a href=#main-content>Ga</a><main id=main-content tabindex=-1></main>"],
    ],
  },
  {
    naam: "iconen-decoratief",
    check: html.checkIconenDecoratief,
    slecht: [['<svg viewBox="0 0 24 24"></svg>'], ['<svg aria-hidden="true"></svg>'], ["<svg focusable=false></svg>"]],
    goed: [
      ['<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"></svg>'],
      ["<svg aria-hidden=true focusable=false></svg>"],
      ['<svg role="img" aria-label="Logo"></svg>'],
    ],
  },
  {
    naam: "naam-bevat-zichtbare-tekst",
    check: html.checkLabelInNaam,
    slecht: [
      ['<button aria-label="Wissel thema">Kleur</button>'],
      ['<a href="/" aria-label="Terug naar het begin">Home</a>'],
    ],
    goed: [
      ['<button aria-label="Zoeken openen">Zoeken</button>'],
      ['<button aria-label="Menu"><svg aria-hidden="true"></svg></button>'],
      ['<button class="search-trigger" aria-label="Zoeken"><svg aria-hidden="true"></svg><span>Zoeken...</span><kbd aria-hidden="true">Ctrl K</kbd></button>'],
      ['<a href="/">Home</a>'],
      ['<a href="#fn:1" aria-label="Voetnoot 1">1</a>'],
      ['<a href="#fnref:1" aria-label="Terug naar voetnoot 1 in de tekst">&#8617;&#xfe0e;</a>'],
    ],
  },
  {
    naam: "titel-vorm",
    check: html.checkTitelVorm,
    slecht: [
      ["<title>Over · Een andere site</title>", { route: "/over/", siteTitel: "Site" }],
      ["<title>Site</title>", { route: "/", siteTitel: "Site" }],
      ["<p>geen titel</p>", { route: "/over/", siteTitel: "Site" }],
      ["<title>Over</title>", { route: "/over/", siteTitel: "Site" }],
    ],
    goed: [
      ["<title>Over &middot; Site</title>", { route: "/over/", siteTitel: "Site" }],
      ["<title>Over · Site</title>", { route: "/over/", siteTitel: "Site" }],
      ["<title>Site: de tagline</title>", { route: "/", siteTitel: "Site" }],
    ],
  },
  {
    naam: "geen-lekkende-syntax",
    check: html.checkLekkendeSyntax,
    slecht: [
      ["<p>Zie <a href=/x>link</a>{.private}</p>"],
      ["<p>{{&lt; callout &gt;}}</p>"],
      ["<p>[!INFO] Titel</p>"],
      ["<p>woord{ref:1}</p>"],
      ["<p>zin[^1]</p>"],
    ],
    goed: [
      ["<pre><code>{{&lt; callout &gt;}} {.x} [!INFO] {ref:1}</code></pre><p>Gewone tekst.</p>"],
      ["<p>Tekst met <code>{.klasse}</code> in code.</p>"],
      ["<p>Gewone tekst met [haakjes] en {accolades}.</p>"],
    ],
  },
  {
    naam: "csp-geen-style-attribuut",
    check: csp.checkInlineStyleAttribuut,
    slecht: [['<p style="color:red">x</p>'], ["<pre style=color:#fff>x</pre>"], ["<div class=a style='x:y'>x</div>"]],
    goed: [['<p class="a">x</p>'], ['<meta name="description" content="Een versie"><img srcset="a.png">']],
  },
  {
    naam: "csp-geen-style-element",
    check: csp.checkStyleElement,
    slecht: [["<style>p{color:red}</style>"], ['<style media="print">p{}</style>']],
    goed: [['<link rel="stylesheet" href="/a.css">'], ["<p>stylesheet</p>"]],
  },
  {
    naam: "csp-geen-inline-script",
    check: csp.checkInlineScript,
    slecht: [["<script>alert(1)</script>"], ['<script type="module">x()</script>']],
    goed: [['<script src="/a.js"></script>'], ["<script defer src=/a.js></script>"]],
  },
  {
    naam: "csp-geen-event-handler",
    check: csp.checkEventHandler,
    slecht: [['<a href="/" onclick="go()">x</a>'], ["<img src=a.png onerror=fout()>"]],
    goed: [['<meta name="description" content="Een versie">'], ['<a href="/" class="online">x</a>']],
  },
  {
    naam: "csp-geen-javascript-url",
    check: csp.checkJavascriptUrl,
    slecht: [['<a href="javascript:void(0)">x</a>'], ["<a href=javascript:go()>x</a>"]],
    goed: [['<a href="/over/">javascript</a>']],
  },
  {
    naam: "csp-geen-derden",
    check: csp.checkGeenDerden,
    slecht: [
      ['<link rel="stylesheet" href="https://cdn.example.net/a.css">'],
      ["<script src=//cdn.example.net/a.js></script>"],
      ['<img src="https://x.nl/a.png" alt="">'],
      ['<img srcset="/a.png 1x, https://x.nl/b.png 2x" alt="">'],
      ["<link rel=preconnect href=https://fonts.gstatic.com>"],
      ['<iframe src="https://video.example.net/x"></iframe>'],
    ],
    goed: [
      ['<link rel="canonical" href="https://voorbeeld.example/over/">'],
      ['<link rel="alternate" type="application/rss+xml" href="https://andere.example/index.xml">'],
      ['<link rel="stylesheet" href="/css/style.css"><script src="/js/b.js"></script>'],
      ['<a href="https://www.rijksoverheid.nl/">x</a>'],
      ['<link rel="stylesheet" href="https://voorbeeld.example/css/style.css">'],
    ],
  },
  {
    naam: "csp-geen-data-url",
    check: csp.checkGeenDataUrl,
    slecht: [['<img src="data:image/png;base64,AAAA" alt="">'], ["<link rel=icon href=data:image/svg+xml,x>"]],
    goed: [['<img src="/a.png" alt="">'], ['<a href="data:text/plain,x">x</a>']],
  },
  {
    naam: "csp-geen-formulier-actie",
    check: csp.checkGeenFormulierActie,
    slecht: [['<form action="/zoek"><input></form>'], ["<form method=post></form>"]],
    goed: [['<form method="dialog"><button>Sluiten</button></form>'], ["<p>geen formulier</p>"]],
  },
];

/** Regels op elk CSS-bestand in de uitvoer: check(css). */
const CSS_UITVOER_REGELS = [
  {
    naam: "css-geen-externe-of-data-bronnen",
    check: csp.checkCssBronnen,
    slecht: [
      ["a{background:url(data:image/svg+xml;utf8,<svg/>)}"],
      ['@import url("https://fonts.googleapis.com/css?family=x");'],
      ["@font-face{src:url(https://cdn.example.net/f.woff2)}"],
      ["a{mask-image:url('//cdn.example.net/i.svg')}"],
    ],
    goed: [
      ['@font-face{src:url("/fonts/a.woff2") format("woff2")}'],
      ["a{mask-image:url(../icons/x.svg)}"],
      ["a{color:red}"],
    ],
  },
];

const geef = (naam, tekst) => ({ [naam]: tekst });

/** Regels op de bron van het theme: check(...). */
const BRON_REGELS = [
  {
    naam: "tokens-gedefinieerd",
    check: bron.checkTokens,
    slecht: [
      [{ css: geef("a.css", "a{color:var(--bestaat-niet)}"), primitives: null }],
      [{ css: geef("a.css", ":root{--x:1} a{color:var(--primitives-color-blue-500)}"), primitives: "" }],
      [{ css: geef("a.css", "a{color:var(--primitives-color-blue-500)}"), primitives: null }],
      [{ css: geef("a.css", "a{color:var(--primitives-bestaat-niet, red)}"), primitives: ":root{--primitives-color-blue-500:#00f}" }],
    ],
    goed: [
      [{ css: geef("a.css", ":root{--x:1} a{color:var(--x)}"), primitives: null }],
      [{ css: geef("a.css", "a{color:var(--niet-gezet, red)}"), primitives: null }],
      [{ css: geef("a.css", "a{left:var(--ref-offset-x)}"), primitives: null, js: "tip.style.setProperty('--ref-offset-x', '1px')" }],
      [{ css: geef("a.css", "a{color:var(--primitives-color-blue-500)}"), primitives: ":root{--primitives-color-blue-500:#00f}" }],
      [{ css: geef("a.css", "/* var(--alleen-in-commentaar) */ a{color:red}"), primitives: null }],
    ],
  },
  {
    naam: "css-geen-data-theme",
    check: bron.checkDataScheme,
    slecht: [[geef("a.css", ':root[data-theme="dark"]{--x:1}')], [geef("a.css", ":root:not([data-theme=light]){--x:1}")]],
    goed: [[geef("a.css", ':root[data-scheme="dark"]{--x:1}')], [geef("a.css", "/* data-theme */ a{}")]],
  },
  {
    naam: "css-template-alleen-relurl",
    check: bron.checkCssTemplate,
    slecht: [[geef("a.css", "a{content:'{{ .Site.Title }}'}")], [geef("a.css", "a{background:url({{ resources.Get \"x\" }})}")]],
    goed: [
      [geef("a.css", 'a{mask-image:url("{{ relURL "images/icons/lock.svg" }}")}')],
      [geef("a.css", 'a{mask-image:url("{{ "images/x.svg" | relURL }}")}')],
    ],
  },
  {
    naam: "css-reduced-motion",
    check: bron.checkReducedMotion,
    slecht: [[geef("a.css", "a{transition:all 1s}")], [geef("a.css", "/* @media (prefers-reduced-motion) */ a{}")]],
    goed: [[geef("a.css", "@media (prefers-reduced-motion: reduce){a{transition:none}}")]],
  },
  {
    naam: "js-csp-en-opslag",
    check: bron.checkJsBron,
    slecht: [
      ["x.js", "eval('1+1')"],
      ["x.js", "const f = new Function('return 1')"],
      ["x.js", "el.setAttribute('style', 'color:red')"],
      ["x.js", "el.innerHTML = '<p style=\"color:red\">x</p>'"],
      ["x.js", "document.write('x')"],
      ["x.js", "try { localStorage.setItem('toc', '1') } catch (e) {}"],
      ["x.js", "localStorage.getItem('theme')"],
      ["x.js", "const K = 'toc'; try { localStorage.getItem(K) } catch (e) {}"],
      ["x.js", "try { localStorage.getItem(sleutel()) } catch (e) {}"],
    ],
    goed: [
      ["x.js", "try { localStorage.getItem('theme') } catch (e) {}"],
      ["x.js", "const KEY = 'theme';\ntry {\n  if (a) { localStorage.setItem(KEY, 'dark') }\n} catch (e) {}"],
      ["x.js", "el.style.setProperty('--x', '1px')"],
      ["x.js", "// eval( staat alleen in commentaar\nconst a = 1;"],
      ["referenties.js", "try { localStorage.getItem('refs') } catch (e) {}"],
    ],
  },
];

export { HTML_REGELS, CSS_UITVOER_REGELS, BRON_REGELS };
