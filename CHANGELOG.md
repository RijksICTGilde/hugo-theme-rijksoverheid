# Changelog

Alle noemenswaardige wijzigingen aan dit project worden gedocumenteerd
in dit bestand. Het formaat is gebaseerd op
[Keep a Changelog](https://keepachangelog.com/nl/1.1.0/) en het project
volgt [Semantic Versioning](https://semver.org/lang/nl/).

## [Unreleased]

Het theme is opnieuw opgebouwd vanuit
[moza-site](https://github.com/MinBZK/moza-site): kleuren, lettertype en
iconen uit het NLDD Designsysteem, en de structuur en de
toegankelijkheidsfixes van moza na een WCAG-onderzoek. Wat het theme al beter
deed (het mobiele menu, de scroll-spy, het afbreken van koppen, de
focusringen, de hero, de Ctrl+K-hint) is gebleven. Lees "Breaking" en
"Overstappen" voordat je bijwerkt.

### Breaking

* **Kleuren uit NLDD.** De namen van de tokens blijven, de waarden komen nu
  uit `assets/css/nldd-primitives.css`. Zichtbaar anders: links
  (`#01689b` wordt `#2c588b`), de donkere achtergrond (`#0f172a` wordt
  `#091629`) en de primaire kleur in donker (`#80d5fc` wordt `#85b5ee`). In
  donker is de bodytekst een tint zachter dan de koppen.
  `--color-rijks-blauw` en `--color-rijks-oranje` zijn een verouderde alias van
  `--color-rijksblauw` en `--color-rijksoranje`.
* **`data-scheme`.** De CSS reageert op `data-scheme="light|dark"` op `<html>`
  in plaats van `data-theme`. `theme-init.js` zet in deze versie nog beide.
* **RijksSans** vervangt RO-Sans en RO-Serif. `--font-serif` is een verouderde
  alias van `--font-sans`; de tagline staat in schuine sans.
* **Iconen uit NLDD.** `toc-open.svg`, `toc-close.svg`, `mail.svg`, `sun.svg`
  en `moon.svg` zijn weg; `chevron-down.svg` en `waarschuwing.svg` zijn nieuw.
* **Externe links** openen in hetzelfde tabblad, zonder icoon. Met
  `params.links.nieuw_venster: true` komt het oude gedrag terug.
* **Infoblok.** Alerts en de shortcode `callout` geven een
  `<div class="callout">` met een kop (`h3`, instelbaar met
  `params.infoblok.kopniveau`) in plaats van een `<blockquote>` met een
  `<span class="title">`. Een infoblok is geen citaat (WCAG 1.3.1).
* **Kaarten** zijn een lijst (`<ul class="card-grid" role="list">` met `<li>`),
  met de kaarttitel op het kopniveau dat past bij de kop erboven. In de
  artikelkolom staan ze in hooguit twee kolommen.
* **Inhoudsopgave.** De uitklapbare inhoudsopgave (`.toc-toggle`,
  `aside#toc`, opslag `toc-open`) is vervangen door een rechterkolom
  (`.page-aside`) direct na de titel, met relevante links en de
  inhoudsopgave.
* **Kop en voet.** Het kruimelpad en "laatst bijgewerkt" staan in de voet;
  "laatst bijgewerkt" alleen op een leespagina, niet op een lijstpagina zonder
  eigen tekst, ook niet met `show_lastmod`. De
  keuze voor licht of donker is een menu "Weergave" in de voet met Systeem,
  Licht en Donker, in plaats van de zon-en-maanknop in de kop. De zoekknop is
  een menu-item. De sitenaam is altijd een link; het logo is alleen een link
  met `params.logo.url`.
* **Paginatitel** volgens NLDD: `Pagina · Site`, op de homepage
  `Site: tagline`.
* **Ondertitel.** De voet toont `params.tagline`, dezelfde zin als naast de
  sitenaam. Op een smal scherm staat de ondertitel niet in de kop; zonder de
  voet was hij daar weg (WCAG 1.4.10). `params.footer.tagline` vervalt.
* **Links** zijn onderstreept in lopende tekst, niet in navigatie en kaarten.
  Knoppen hebben geen handcursor meer; alleen wat eruitziet als een link.
* **Zoeken.** Het aantal resultaten staat in een aparte
  `<p id="search-status" role="status">`; de lijst heeft geen `aria-live` meer.
  Fuse.js 7.5.0 staat als ESM in `assets/lib/fuse/fuse.min.mjs` en wordt via
  `js.Build` geladen; `fuse.min.js` is weg. De zoekknop en het zoekvenster
  staan er alleen als de site een JSON-index maakt.
* **Melding over de zoekmarkering.** De knop `#highlight-bar` staat als eerste
  in `<main>` (`baseof.html`) in plaats van in `search.html`: een strook in de
  markeringskleur bovenaan de inhoud. `.toast` is geen zwevende melding meer.
* **Head.** `head.html` roept nu `meta.html` en `head-css.html` aan. De
  zoekindex (`index.json`) heeft een item per kop, per uitklapblok en per
  sectie.

### Toegevoegd

* `tools/nldd/`: generator voor de kleuren en iconen uit NLDD 0.23.0, met
  `check.js` als controle in CI. `NOTICES.md` met de herkomst en licenties van
  fonts, logo, iconen en Fuse.js.
* Tokens `--color-surface`, `--color-bg-success`, `--color-bg-warning`,
  `--color-bg-danger`, `--color-accent-info`, `--color-accent-success`,
  `--color-accent-warning`, `--color-accent-danger`, `--color-border-strong`,
  `--color-border-surface` (de rand van zwevende vlakken) en `--font-mono`.
* Rechterkolom met inhoudsopgave, relevante links (`relevante_links`) en de
  hook `page-aside-extra.html`; leadbeeld (`lead_image`); labels onder de
  titel (`show_date`, `status`).
* `sectienavigatie: true` op een sectie: op de sectie en op elke pagina erin
  staat het blok "Relevante pagina's" in de rechterkolom, met de huidige
  pagina gemarkeerd (`aria-current`). Met `relevante_links` heet het blok
  "Relevante pagina's en links". Een sectie met `sectienavigatie` en eigen
  tekst is een leespagina, met de kaarten onder de tekst.
* Uitvoer voor taalmodellen (`llms.txt`, `llms-full.txt`, Markdown per pagina)
  en RSS met de volledige inhoud; `robots.txt`. Het theme definieert de
  uitvoerformaten; de site zet ze aan met `outputs`.
* `meta.html` met canonical, Open Graph, Twitter en een alternate-link naar de
  Markdown-versie, en de hooks `favicons.html`, `og-image.html`,
  `llm-instructies.html` en `search-index-extra.html`.
* Codekleuring zonder inline stijlen (`markup.highlight.noClasses: false`),
  tabellen in een eigen schuifvlak, een printstijl, figuren, labels, een
  pull-quote, citaten die na elkaar van hoek wisselen en een tooltip die dicht
  bij zijn element staat, blijft staan en sluit met Escape.
* Shortcodes `quote`, `table-without-header`, `emoji` en `boom`, een
  boomschema dat een schermlezer als lijst met niveaus voorleest. `callout`
  heeft `kopniveau`; `card-grid` heeft `niveau` en `klassen`, zodat `boxed`,
  `clickable` en `columns-2` ook via de shortcode werken
  ([#27](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/27)).
* Params `links.nieuw_venster`, `links.besloten`, `linkcontrole` (besloten
  links overslaan in htmltest), `infoblok.kopniveau`,
  `search.threshold`, `search.max_results`, `search.section_weights`,
  `afzender`, `llms.secties` (met `tekst` en `volledig`) en `og.afbeelding`.
* Een waarschuwing (`> [!WARNING]`, `> [!IMPORTANT]` en
  `callout variant="warning"`) heeft een icoon, zoals info.
* Front matter `zoekindex: false`: de pagina blijft uit de zoekindex.
* Hooks `font-preload.html` en `head-extra.html` voor de head,
  `lastmod-datum.html` voor de datum achter "laatst bijgewerkt",
  `markdown-extra.html` voor eigen shortcodes in de Markdown-uitvoer en
  `rss-extra.html` voor de inhoud van een item in de RSS-feed.
* `exampleSite/` met controles op toegankelijkheid, CSP en links, in CI op de
  minimale en de nieuwste Hugo. Laag 2 tabt door elke pagina, in licht en
  donker, en meldt elk element waarvan de focus niet zichtbaar verandert
  (WCAG 2.4.7); laag 1 meldt vormen in inline SVG die de minifier open liet.
  `doc.go`, zodat Dependabot een site met dit theme kan bijwerken.
  `module.hugoVersion.min`.

### Opgelost

* Back-to-top verscheen nooit: de knop stond na de scriptbundel, waardoor
  `base.js` hem niet vond.
* Bij geblokkeerde opslag stopte `toc.js` de hele scriptbundel, inclusief
  zoeken. `localStorage` staat nu overal in `try`/`catch`.
* Het submenupaneel staat direct na zijn knop in de DOM (WCAG 2.4.3). Het
  mobiele menu toont de structuur als geneste lijst, met een verborgen
  onderscheid bij gelijke namen.
* Geen horizontaal scrollen meer op 320px of bij 200% tekst in het menu, de
  subnavigatie, infoblokken, kaarten, tabellen, knoppen en vorige/volgende
  (WCAG 1.4.10). De skip-link blijft verborgen bij 200% tekst.
* Zoekveld met een naam gelijk aan de zichtbare tekst (WCAG 2.5.3). De
  markering van de zoekterm op de pagina werkt weer en wordt aan een
  schermlezer gemeld
  ([#11](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/11)).
* Sectiepagina's staan in de zoekindex
  ([#29](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/29),
  deels).
* Mermaid werkt in page bundles, met breedte en hoogte, `accTitle` als alt,
  `accDescr` als verborgen beschrijving en een downloadlink met een eigen naam.
* Voetnoten hebben een kop en links met een naam; de rol `doc-endnotes` is weg.
* Het icoon in een infoblok is decoratief in plaats van een afbeelding met de
  Engelse alt "Info icon" (WCAG 1.1.1). Een infoblok zonder titel noemt zijn
  type in verborgen tekst, ook met de shortcode `callout` (WCAG 1.4.1).
* Een bronterm (`reftext.html`) is een knop met de bron als beschrijving, in
  plaats van een focusbare `span` zonder rol (WCAG 4.1.2), en de stippellijn
  eronder haalt 3:1. Een `$` in de brontekst of de URL blijft staan.
* Het woordmerk naast het lint is leesbaar voor hulptechnologie; zonder
  `params.logo.url` stond het in een verborgen link (WCAG 1.3.1).
* Zonder `params.logo` heet het beeldmerk in de kop Rijksoverheid in plaats
  van een lege alt-tekst: een schermlezer hoorde nergens van wie de site is
  (WCAG 1.1.1).
* De melding boven de pagina is een regio "Melding" in plaats van een
  `role="status"` die bij het laden niets meldt.
* Zonder JavaScript staan er geen zoekknoppen meer die niets doen.
* De titel van een zoekresultaat is een kop van niveau 2 (WCAG 1.3.1).
* De melding over de zoekmarkering is een strook bovenaan de inhoud in plaats
  van een vaste balk onderin, die een element met focus kon afdekken (WCAG
  2.4.11). Ze is de eerste focusstop van de inhoud; Enter of Escape op de
  melding zet de focus op de inhoud (WCAG 2.4.3). Ze markeert haar eigen tekst
  niet.
* De gemarkeerde zoekterm is ook vet, en onderstreept in tekst die al vet is,
  zoals een kop of de titel van een zoekresultaat: de kleur alleen haalt
  1,35:1 tegen de pagina (WCAG 1.4.1).
* Het zoekvenster sluit niet meer als je in het paneel indrukt en ernaast
  loslaat, of andersom. In het zoekveld raakt de tekst de focusring niet meer.
* Een link in een `figcaption` of een tabelbijschrift is onderstreept, zoals
  in lopende tekst (WCAG 1.4.1).
* De meta-description begint niet meer met een kop.
* De 404-pagina heet "Pagina niet gevonden" in plaats van "404 Page not
  found", ook in de titel en de deelgegevens.
* De hero haalt een afbeelding op die past bij het scherm (`srcset` van 800
  tot hooguit 4000 pixels, zonder opschalen) in plaats van altijd een van
  4000 pixels breed. Onder 550px valt de foto weg en laadt alleen een
  miniatuur.
* Een sectie met één pagina toont onderaan alleen "Vorige", niet ook "Terug
  naar" dezelfde pagina.
* De RSS-feed zet het pad niet dubbel bij een baseURL met submap.
* Het zoekvenster haalt in een meertalige site de index van de eigen taal
  op in plaats van die van de standaardtaal.
* Een link naar een uitklapblok met een letter als é in zijn id klapt het
  blok weer open.
* De bijwerkinstructie van Fuse.js verwees naar een bestand dat sinds 7.3.0
  niet meer bestaat.

### Verwijderd

* RO-Sans, RO-Serif en het ongebruikte `ro-icons-2.3.woff`.
* `params.search.enable: true` is niet meer nodig; `false` zet zoeken nog wel
  uit.

### Overstappen

* Werk bij met een vaste versie:
  `hugo mod get github.com/RijksICTGilde/hugo-theme-rijksoverheid@v0.3.0`.
  Met `hugo mod get -u` gaat een site op v0.2 zonder waarschuwing naar v0.3.
  Zonder `tools.go` haalt `go mod tidy` het theme uit `go.mod`, waarna de
  build stil de nieuwste versie neemt.
* Heb je eigen versies van `article.html`, `baseof.html`, `lastmod.html`,
  `scripts.html`, `index.json` of `search.js`, vergelijk ze dan met deze
  versie:
  * een eigen `scripts.html` laadt Fuse met
    `resources.Get "js/fuse-global.js" | js.Build (dict "minify" true "format" "iife" "target" "es2020")`
    (`lib/fuse/fuse.min.js` bestaat niet meer, de build stopt) en neemt
    `js/tooltip.js` op;
  * een eigen `baseof.html` zet de knop `#highlight-bar` uit die van het theme
    als eerste in `<main>`; zonder die knop markeert het zoeken niets;
  * een eigen `search.js` vult `#search-status`, anders meldt een schermlezer
    geen resultaten (WCAG 4.1.3). Hij slaat `#highlight-bar` over bij het
    markeren en laat een Escape met `e.defaultPrevented` liggen:
    `referenties.js` en `tooltip.js` sluiten hun ballon daarmee, anders
    verdwijnt de markering ook;
  * een eigen `index.json` geeft tekst zonder HTML-entiteiten
    (`htmlUnescape` na `plainify`): `search.js` decodeert ze niet meer;
  * een eigen inhoudsopgave naast het artikel staat onderaan de pagina: de
    rechterkolom werkt alleen als `.page-aside` binnen `<article>`, met de
    tekst in `<div class="artikel-tekst">`. Gebruik `page-aside.html` en voor
    eigen blokken de hook `page-aside-extra.html`;
  * `footer.html` toont "laatst bijgewerkt" nu zelf; haal een eigen aanroep
    van `lastmod.html` in de artikelvoet weg, anders staat de zin er twee
    keer. Voor alleen een andere datum is er de hook `lastmod-datum.html`.
* Een eigen layout die `icon.html` aanroept met `toc-open`, `toc-close`,
  `mail`, `sun` of `moon` stopt met een fout. Haal de aanroep weg, bij
  `toc-open` en `toc-close` met de knop `.toc-toggle` eromheen: die heeft geen
  CSS en geen JavaScript meer. Of zet het icoon in `static/images/icons/` van
  de site.
* CSS op `blockquote.callout` wordt `.callout`; CSS op `[data-theme]` wordt
  `[data-scheme]`. Eigen kaart-markup wordt een lijst:
  `<ul class="card-grid" role="list">` met per kaart
  `<li><article class="card">`. De opmaak van `article > footer p` en
  `section > footer p` (gedempt en cursief) is weg.
* Alleen een link zonder class in lopende tekst is onderstreept; een link met
  een eigen class daar onderstreep je zelf (WCAG 1.4.1).
* Bewerk je gerenderde links na, bijvoorbeeld met een reguliere expressie,
  test dat dan opnieuw: een externe link heeft standaard geen verborgen
  melding "(opent in een nieuw venster)" meer.
* Zet `markup.highlight.noClasses: false` en, voor de nieuwe uitvoer, de
  `outputs` uit de README. Gebruik `locale` in plaats van het verouderde
  `languageCode`. Zet `build.noJSConfigInAssets: true`, anders schrijft het
  zoeken `assets/jsconfig.json` in de site.
* Het theme levert nu `rss.xml` met de volledige tekst en `robots.txt` met de
  sitemap; een eigen bestand in de site gaat voor.
* Reken het contrast na als je `--color-primary` of `--color-banner` zelf
  zet: de kleuren eromheen zijn veranderd.
* Een site die bijwerkt met Dependabot, zet een `tools.go` in de root; zie de
  README.
* Haal `params.footer.tagline` weg; de build waarschuwt zolang het er staat.
  De voet toont nu `params.tagline`; was de oude tekst anders, dan staat die
  niet meer in de voet.

## [0.2.3]

### Gewijzigd

* Kop met `params.logo.woordmerk` volgt de rijkshuisstijl: het lint staat
  in het midden van de pagina en het woordmerk hangt er rechts naast.
  Voorheen werden lint en woordmerk samen gecentreerd, waardoor het lint
  zo'n 94px links van het midden stond. Lint (40/45/48px), tekst
  (12/13,5/15px) en afstanden schalen mee op 576 en 992px, de tekst is
  rijksblauw. Het woordmerk blijft ook tussen 600 en 820px zichtbaar.
* Zoeken opent met Ctrl+K (Cmd+K op macOS) in plaats van de losse toets
  `/`, die niet uit te zetten was en ook op spraakinvoer reageerde
  (WCAG 2.1.4). De hint in de kop toont de nieuwe toets en
  `aria-keyshortcuts` meldt hem aan hulpsoftware
  ([#14](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/14)).

### Toegevoegd

* `params.logo.woordmerk` mag een lijst zijn: één regel per item, de
  eerste vet (organisatie, met daaronder het ministerie).

### Opgelost

* Skip-link: `<main id="main-content">` heeft `tabindex="-1"`, zodat de
  focus naar de inhoud verhuist en niet alleen de scrollpositie
  (WCAG 2.4.1) ([#15](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/15)).
* Zoekknop: geen `aria-label="Zoeken"` meer op de knop met zichtbare
  tekst; de naam komt uit de tekst zelf (WCAG 2.5.3). De icoonknop op
  mobiel houdt zijn label ([#16](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/16)).
* Mobiel menu: geen genest navigatielandmark meer (WCAG 1.3.1), de
  menuknop heet vast "Menu" en Escape sluit het menu en zet de focus terug
  op de knop. Met het zoekvenster open is Escape voor het zoekvenster
  ([#18](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/18)).
* Externe links (`render-link`, secundair menu) melden dat ze in een nieuw
  venster openen, met een verborgen "(opent in een nieuw venster)"
  (WCAG 1.3.1). Besloten links melden "(besloten omgeving, opent in een
  nieuw venster)". Meta-description en zoekindex laten de melding weg.
  **Let op:** de linkinhoud bevat nu een
  `<span class="visually-hidden nieuw-venster-melding">`; wie gerenderde
  links nabewerkt met regexen of `textContent` moet die meenemen
  ([#17](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/17)).
* Bron-tooltip sluit met Escape zonder dat focus of muis verplaatst
  (WCAG 1.4.13) en geeft geen horizontale scroll meer: gesloten staat hij
  buiten de layout, open blijft hij binnen het venster (WCAG 1.4.10)
  ([#10](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/10)).
* Hero knipt geen tekst meer af bij tekstvergroting: minimale in plaats
  van vaste hoogte, afbeelding als achtergrondlaag (WCAG 1.4.4)
  ([#12](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/12)).
* Links in de inhoudsopgave zijn minstens 24px hoog (WCAG 2.5.8). Een
  knop in de inhoudsopgave houdt zijn eigen maten ([#23](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/23)).
* `.button` heeft een eigen focusring in plaats van `outline: none`, zodat
  focus van hover te onderscheiden is en zichtbaar blijft als een site de
  knopkleuren overschrijft (WCAG 2.4.7) ([#24](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/24)).
* Koppen breken lange woorden af (`hyphens: auto`, met
  `overflow-wrap: break-word` als terugval); lange samenstellingen lieten
  de pagina op 320px horizontaal scrollen (WCAG 1.4.10) ([#40](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/40)).

## [0.2.2]

### Opgelost

* TOC scroll-spy: koppen in het laatste schermstuk worden nu ook actief. Die
  haalden de lijn op 20% van het venster nooit, omdat de pagina eerder op
  was; op korte pagina's werden de laatste secties zo nooit gemarkeerd. Op het
  laatste stuk scrollen schuift de lijn mee naar beneden, tot onderaan de
  laatste kop actief is.
* Changelog: de vorige release heette hier `[0.3.0]`, maar is als `v0.2.1`
  uitgebracht. Daardoor vond de release-workflow geen sectie en faalde.

## [0.2.1]

### Toegevoegd

* Optionele `params.logo` voor de kop: `url` laat het logo naar een andere
  site linken, `woordmerk` zet een tekst naast het lint en `label` voegt een
  verborgen toelichting aan de linknaam toe. Zonder deze params blijft de kop
  ongewijzigd
  ([#20](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/issues/20)).

### Opgelost

* TOC scroll-spy ("Op deze pagina") volgt nu alleen koppen die ook een
  TOC-link hebben, in plaats van elke `h2`/`h3`/`h4` in het artikel. De
  actieve sectie loopt daardoor vloeiend mee; voorheen verdween de highlight
  zodra je in een sectie zonder TOC-link scrolde (bv. diepere koppen of een
  als `<summary>` gerenderde kop). Gebruikt `getBoundingClientRect` i.p.v.
  `offsetTop` en `requestAnimationFrame`-throttling
  ([#8](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/pull/8)).

## [0.2.0]

### Toegevoegd

* Back-to-top-knop: zwevende "naar boven"-knop rechtsonder die verschijnt
  zodra er meer dan een schermhoogte is gescrold. Bedoeld voor lange
  pagina's. De knop is een anchor naar `#main-content` en werkt dus ook
  zonder JS. Opt-in met `params.back_to_top: true`
  ([#9](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/pull/9)).

### Opgelost

* Focusindicatoren en contrast in zoeken, footer en toast
  ([#19](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/pull/19)).

## [0.1.0]

Eerste publieke release.

### Toegevoegd

* Layouts voor home, list, page, hero en 404.
* Componenten card-grid, box, callout, references, button,
  search-modal, page-banner, page-nav, breadcrumb en table of contents.
* Design tokens in `assets/css/tokens.css` voor kleur, typografie en
  layout.
* Sitebrede zoekfunctie met Fuse.js, gevendoreerd in `assets/lib/fuse/`.
* Dark mode via `prefers-color-scheme` en respect voor
  `prefers-reduced-motion`.
* `publiccode.yml`, `SECURITY.md`, `CONTRIBUTING.md` en
  `CODE_OF_CONDUCT.md` voor publicatie als open source.
* `.editorconfig`, `.pre-commit-config.yaml`, `.markdownlint.yaml` en
  `.yamllint` voor consistente code en docs.
* GitHub Actions workflows voor lint, publiccode-validatie en releases.

[0.2.3]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v0.2.3
[0.2.2]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v0.2.2
[0.2.1]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v0.2.1
[0.2.0]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v0.2.0
[0.1.0]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v0.1.0
