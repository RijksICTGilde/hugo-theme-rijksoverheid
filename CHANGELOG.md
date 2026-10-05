# Changelog

Alle noemenswaardige wijzigingen aan dit project worden gedocumenteerd
in dit bestand. Het formaat is gebaseerd op
[Keep a Changelog](https://keepachangelog.com/nl/1.1.0/) en het project
volgt [Semantic Versioning](https://semver.org/lang/nl/).

## [Unreleased]

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

[0.2.2]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v0.2.2
[0.2.1]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v0.2.1
[0.2.0]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v0.2.0
[0.1.0]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v0.1.0
