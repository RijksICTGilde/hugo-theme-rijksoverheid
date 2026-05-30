# hugo-theme-RO

Hugo-thema voor Rijksoverheid-sites, gebaseerd op het
[moza-site](https://github.com/RijksICTGilde/moza-site) design system.
Levert layout, components en design-tokens; consumer-sites brengen hun
eigen content + project-specifieke styling mee.

Vereist [Hugo Extended] ≥ 0.162 en [Go] ≥ 1.26 (voor Hugo Modules).

## Snelstart

Minimale `hugo.yaml` voor een nieuwe consumer-site. De keys voor
`locale`, `outputs`, `markup`, `enableGitInfo` etc. **moeten op
consumer-niveau**, omdat Hugo's config-merging top-level keys met
`_merge: none` niet uit het thema komen.

```yaml
baseURL: https://example.rijksoverheid.nl/
title: Mijn RO-site

# Lokalisatie + Git-gebaseerde lastmod
locale: nl-NL
defaultContentLanguage: nl
enableGitInfo: true
enableRobotsTXT: true

# JSON-output nodig voor de search-index
outputs:
  home: [HTML, RSS, JSON]

markup:
  goldmark:
    extensions:
      footnote: true
  tableOfContents:
    startLevel: 2
    endLevel: 4

module:
  imports:
    - path: github.com/RijksICTGilde/hugo-theme-ro

# Zie sectie "Menus" hieronder voor footer + section-navs
menus:
  main:
    - { name: Home, pageRef: /, weight: 1 }

params:
  tagline: "Korte tagline onder de banner"
  footer:
    tagline: "Eén Overheid. Voor iedereen!"
  search:
    enable: true
    priority_sections: []   # optioneel: ['blogs', 'docs'] etc.
```

Bouwen:

```bash
hugo mod get -u github.com/RijksICTGilde/hugo-theme-ro
hugo server
```

## Lokale theme-ontwikkeling

Voor parallelle ontwikkeling op thema + site, gebruik `go.mod`'s
`replace`-directive in de consumer (geen env-vars of direnv nodig):

```bash
# In consumer's repo
git clone git@github.com:RijksICTGilde/hugo-theme-RO.git ../hugo-theme-RO-local
```

In `go.mod` van de consumer:

```go
replace github.com/RijksICTGilde/hugo-theme-ro => ../hugo-theme-RO-local
```

`hugo server` pakt vanaf nu wijzigingen in de lokale theme-clone live op.

## Menus

Het thema kent vier menu-conventies. Alle zijn optioneel; alleen `main`
is sterk aangeraden.

| Menu | Locatie | Doel |
|---|---|---|
| `main` | header | top-navigatie |
| `footer-links` | footer, links-kant | service-links (contact, sitemap, …) |
| `footer-rechts` | footer, rechts-kant | beleid-links (privacy, cookies, toegankelijkheid, …) |
| `<sectie>_nav` | side-nav binnen een section | optioneel; activeert section-nav als consumer dit menu definieert |

Voorbeeld met alle drie hoofd-menus:

```yaml
menus:
  main:
    - { name: Home,    pageRef: /,         weight: 1 }
    - { name: Over,    pageRef: /over,     weight: 2 }
    - { name: Normen,  pageRef: /normen,   weight: 3 }

  footer-links:
    - { name: Contact, url: https://...,   weight: 1 }
    - { name: Sitemap, url: https://...,   weight: 2 }

  footer-rechts:
    - { name: Privacy,         url: https://..., weight: 1 }
    - { name: Toegankelijkheid, url: https://..., weight: 2 }
```

Externe URL's gebruiken `url:`; interne pages `pageRef:`. Beide
ondersteund.

## Architectuur

- **CSS-pipeline**: tokens.css → fonts.css → base.css → layout.css →
  `components/*.css` glob → consumer's `assets/css/*.css` (excl.
  theme-namen). Eén gefingerprinte stylesheet via `_partials/head.html`.
- **Design tokens** in `assets/css/tokens.css`: `--color-*`, `--font-*`,
  `--content-max-width`, `--radius-*`. Consumers overrulen op `:root`-
  niveau (bv. `--color-primary`, `--color-banner`).
- **JS-bundle**: `base.js` + `toc.js` + Fuse + `search.js` concatenated
  + fingerprinted via `_partials/scripts.html`.
- **Image processing**: WebP via `resources.Resize` (q80), als enkele
  `<img>` in de hero. AVIF gaf bij onze hero te veel kwaliteitsverlies.

## Components

| Component | Doel |
|---|---|
| `.card-grid` (+ `.boxed`, `.clickable`, `.columns-2`) | Responsive grid + opt-in border/click/columns |
| `.box` (+ `.box.info`/`.warning`/`.success`/`.danger`) | Niet-klikbare content-container, semantische varianten |
| `blockquote.callout` (+ `.muted`/`.warning`/`.success`/`.danger`, `.corner-*`) | Info-block met header + content; via `{{< callout titel="..." >}}` shortcode |
| `.references` (+ inline `.ref-tooltip`) | Footnote-accordeon onderaan + inline tooltip-markers; opt-in via `show_referenties` frontmatter |
| `.button` (+ `.button-outline`, `.button-ghost`) | Knoppen |
| `.search-modal` | Fuzzy site-search via Fuse.js; sectie-priority via `params.search.priority_sections` |
| `.page-banner` (+ `.page-banner--warning`/`--info`) | Site-wide melding bovenaan via `params.page_banner` |
| `.page-nav` | Prev/next binnen reeks; opt-in via `prev_next: true` op section `_index.md` |
| `.breadcrumb`, `.toc` | Standaard breadcrumbs + sticky TOC |
| Header / Footer | Site-shell met `--color-banner` token (default `--color-rijksblauw`) |

Externe links: gebruik partial `render-link.html` (autodetect external/
private/internal) zodat `rel="external"` + icon consistent zijn.

## Shortcodes

| Shortcode | Doel |
|---|---|
| `{{< callout titel="..." variant="muted\|warning\|success\|danger" corner="..." >}}body{{< /callout >}}` | Info-block |
| `{{< tiles columns="2\|3" aria="..." field="tiles" >}}` | Card-grid uit `params.tiles` frontmatter |
| `{{< card-grid section="..." >}}` | Card-grid van pages in een section |

## Per-page frontmatter

```yaml
---
title: ""
description: ""
weight: 0                   # sort-volgorde binnen section
prev_next: true             # in section _index.md: enable prev/next-nav
manual_layout: true         # in section _index.md: body bepaalt layout (geen auto-cards)
show_lastmod: true          # toon "laatst aangepast" footer
show_referenties: true      # render referenties-accordeon (vereist .Params.referenties)
cascade:                    # propageer params naar alle descendants
  show_lastmod: true
toc: false                  # disable auto-TOC voor deze pagina
---
```

## Licentie

Dit project is gelicentieerd onder de [EUPL v1.2](LICENSE).

[Hugo Extended]: https://github.com/gohugoio/hugo/releases
[Go]: https://go.dev
