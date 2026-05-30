# Changelog

Alle noemenswaardige wijzigingen aan dit project worden gedocumenteerd
in dit bestand. Het formaat is gebaseerd op
[Keep a Changelog](https://keepachangelog.com/nl/1.1.0/).

## Versioning

Tags hebben de vorm `vYYYY.M.D`, bijvoorbeeld `v2026.5.30`. Geen
leading zeros, zodat tags geldig blijven als Go module versies. Bij
meerdere releases op dezelfde dag voegen we een suffix toe:
`v2026.5.30-2`.

## [2026.5.31]

Eerste publieke release.

### Toegevoegd

* Layouts voor home, list, page, hero en 404.
* Componenten card-grid, box, callout, references, button,
  search-modal, page-banner, page-nav, breadcrumb en table of contents.
* Design tokens in `assets/css/tokens.css` voor kleur, typografie en
  layout.
* Sitebrede zoekfunctie met Fuse.js, gevendoreerd in
  `assets/vendor/fuse/`.
* Dark mode via `prefers-color-scheme` en respect voor
  `prefers-reduced-motion`.
* `publiccode.yml`, `SECURITY.md`, `CONTRIBUTING.md` en
  `CODE_OF_CONDUCT.md` voor publicatie als open source.
* `.editorconfig`, `.pre-commit-config.yaml`, `.markdownlint.yaml` en
  `.yamllint` voor consistente code en docs.
* GitHub Actions workflows voor lint, publiccode-validatie en releases.

[2026.5.31]: https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag/v2026.5.31
