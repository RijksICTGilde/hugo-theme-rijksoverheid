# Changelog

Alle noemenswaardige wijzigingen aan dit project worden gedocumenteerd
in dit bestand. Het formaat is gebaseerd op
[Keep a Changelog](https://keepachangelog.com/nl/1.1.0/) en het project
volgt [Semantic Versioning](https://semver.org/lang/nl/).

## [Unreleased]

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
