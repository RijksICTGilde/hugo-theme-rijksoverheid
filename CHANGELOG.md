# Changelog

Alle noemenswaardige wijzigingen aan dit project worden gedocumenteerd
in dit bestand. Het formaat is gebaseerd op
[Keep a Changelog](https://keepachangelog.com/nl/1.1.0/) en het project
volgt [Semantic Versioning](https://semver.org/lang/nl/).

## [Unreleased]

### Toegevoegd

* Back-to-top-knop: zwevende "naar boven"-knop rechtsonder die verschijnt
  zodra er meer dan een schermhoogte is gescrold. Bedoeld voor lange
  pagina's. De knop is een anchor naar `#main-content` en werkt dus ook
  zonder JS. Opt-in met `params.back_to_top: true`.

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

[0.1.0]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v0.1.0
