# Hugo theme voor de Rijksoverheid

Hugo theme dat de visuele en functionele basis levert voor sites in de
stijl van de Rijksoverheid. Het theme bevat layouts, design tokens,
componenten en een sitebrede zoekfunctie. Consumer-sites brengen hun
eigen content en optionele projectstyling mee.

Dit theme staat onder de [EUPL 1.2 licentie](LICENSE) en is bedoeld
voor hergebruik door overheidsorganisaties.

## Vereisten

| Tool          | Minimale versie | Opmerking                       |
|---------------|-----------------|---------------------------------|
| Hugo Extended | 0.162.0         | Vanwege moderne template syntax |
| Go            | 1.26            | Nodig voor Hugo Modules         |

Installatie: zie [Hugo Extended releases](https://github.com/gohugoio/hugo/releases)
en [go.dev/dl](https://go.dev/dl/).

## Versioning

Dit project volgt Semantic Versioning. Tags hebben de vorm
`vMAJOR.MINOR.PATCH`, bijvoorbeeld `v0.1.0`. Zolang de major op 0 staat
mogen breaking changes voorkomen tussen minor versies. Vanaf `v1.0.0`
geldt de SemVer-belofte en vereisen breaking changes een major bump
(`/v2` suffix in het module-path volgens Go modules).

Pin op een vaste tag voor reproduceerbare builds, of werk bij met
`hugo mod get -u`. Zie de [CHANGELOG](CHANGELOG.md) voor wijzigingen
per release.

## Snelstart

Minimaal nodig om het theme in een nieuwe Hugo-site te gebruiken:

```sh
hugo new site mijn-site --format=yaml
cd mijn-site
hugo mod init github.com/<organisatie>/mijn-site
hugo mod get github.com/RijksICTGilde/hugo-theme-rijksoverheid@v0.1.0
```

Schrijf vervolgens een `hugo.yaml`. Het minimale werkende voorbeeld:

```yaml
baseURL: https://example.rijksoverheid.nl/
title: Mijn RO-site
defaultContentLanguage: nl

module:
  imports:
    - path: github.com/RijksICTGilde/hugo-theme-rijksoverheid
```

Start daarna de development server:

```sh
hugo server
```

### Veelgebruikte uitbreidingen

Voeg toe wat je nodig hebt. Alles hieronder is optioneel.

Hoofdmenu en footer-tekst:

```yaml
menus:
  main:
    - { name: Home, pageRef: /, weight: 1 }

params:
  tagline: "Korte tagline onder de banner"
  footer:
    tagline: "Eén Overheid. Voor iedereen!"
```

Sitebrede zoekfunctie (vereist JSON-output van de home page):

```yaml
outputs:
  home: [HTML, RSS, JSON]

params:
  search:
    enable: true
    priority_sections: []
```

Voetnoten en aangepaste table of contents:

```yaml
markup:
  goldmark:
    extensions:
      footnote: true
  tableOfContents:
    startLevel: 2
    endLevel: 4
```

Back-to-top-knop (staat standaard aan):

```yaml
params:
  back_to_top: false   # zet de knop uit
```

`lastmod` op pagina's afleiden uit git-historie, en `robots.txt`
genereren:

```yaml
enableGitInfo: true
enableRobotsTXT: true
```

Belangrijk: top-level keys zoals `outputs`, `markup`, `menus` en
`enableGitInfo` moeten op consumer-niveau staan. Hugo merget die niet
uit het theme.

Bijwerken naar de laatste release:

```sh
hugo mod get -u github.com/RijksICTGilde/hugo-theme-rijksoverheid
hugo mod tidy
```

## Lokale theme-ontwikkeling

Voor parallelle ontwikkeling op theme en site gebruik je de
`replace`-directive van Go modules in de consumer. Geen omgevingsvariabelen
of `direnv` nodig.

```sh
git clone git@github.com:RijksICTGilde/hugo-theme-rijksoverheid.git \
  ../hugo-theme-rijksoverheid-local
```

In `go.mod` van de consumer:

```go
replace github.com/RijksICTGilde/hugo-theme-rijksoverheid =>
  ../hugo-theme-rijksoverheid-local
```

`hugo server` pakt vanaf nu wijzigingen in de lokale theme-clone live op.

## Positionering ten opzichte van NL Design System

Dit theme is **geen** implementatie van het
[NL Design System](https://nldesignsystem.nl/). Het bevat een eigen set
componenten en design tokens die de visuele identiteit van de
Rijksoverheid invullen. Voor projecten die juist NL Design System
componenten nodig hebben, biedt dit theme geen vervanging.

Concreet betekent dit:

* Onze tokens volgen de RO-huisstijl (Rijksoverheid Serif en Sans,
  Rijksblauw, hemelblauw, etc.).
* Componenten zoals `card-grid`, `box`, `callout` en `page-banner` zijn
  niet één-op-één compatibel met componenten uit het NL Design System.
* Toegankelijkheid wordt op WCAG 2.2 niveau AA als basisdoel
  gehanteerd, vergelijkbaar met het NL Design System uitgangspunt.

## Menus

Het theme kent vier menu-conventies. Allemaal optioneel, alleen `main`
is sterk aanbevolen.

| Menu             | Locatie                  | Doel                                                     |
|------------------|--------------------------|----------------------------------------------------------|
| `main`           | header                   | Topnavigatie                                             |
| `footer-links`   | footer, linkerkant       | Service links zoals contact, sitemap                     |
| `footer-rechts`  | footer, rechterkant      | Beleid links zoals privacy, cookies, toegankelijkheid    |
| `<sectie>_nav`   | sidenav binnen een sectie| Activeert sectie-navigatie als consumer dit menu definieert |

Voorbeeld met de drie hoofdmenu's:

```yaml
menus:
  main:
    - { name: Home,    pageRef: /,        weight: 1 }
    - { name: Over,    pageRef: /over,    weight: 2 }
    - { name: Normen,  pageRef: /normen,  weight: 3 }

  footer-links:
    - { name: Contact, url: https://..., weight: 1 }
    - { name: Sitemap, url: https://..., weight: 2 }

  footer-rechts:
    - { name: Privacy,         url: https://..., weight: 1 }
    - { name: Toegankelijkheid, url: https://..., weight: 2 }
```

Externe URL's gebruiken `url:`, interne pagina's `pageRef:`. Beide
worden ondersteund.

## Architectuur

* **CSS pipeline**: `tokens.css` → `fonts.css` → `base.css` →
  `layout.css` → `components/*.css` glob → `assets/css/*.css` van de
  consumer (exclusief theme bestanden). Resultaat is één gefingerprinte
  stylesheet via `_partials/head.html`.
* **Design tokens** in `assets/css/tokens.css`: `--color-*`, `--font-*`,
  `--content-max-width`, `--radius-*`. Consumer-sites overrulen op
  `:root` niveau, bijvoorbeeld `--color-primary` of `--color-banner`.
* **JS bundle**: `base.js` + `toc.js` + `referenties.js` + Fuse.js +
  `search.js`, geconcatenateerd en gefingerprint via
  `_partials/scripts.html`. Het theme bevat geen inline `<script>`-tags,
  zodat een strikte Content Security Policy mogelijk blijft.
* **Image processing**: WebP via `resources.Resize` met kwaliteit 80,
  als enkel `<img>` in de hero. AVIF leverde bij onze hero te veel
  kwaliteitsverlies op.

## Componenten

| Component                                                                                            | Doel                                                                                  |
|------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `.card-grid` (`.boxed`, `.clickable`, `.columns-2`)                                                  | Responsive grid met opt-in border, click area en kolomvariant                         |
| `.box` (`.box.info`, `.box.warning`, `.box.success`, `.box.danger`)                                  | Niet klikbare contentcontainer met semantische varianten                              |
| `blockquote.callout` (`.muted`, `.warning`, `.success`, `.danger`, `.corner-*`)                      | Infoblock met header en content. Bereikbaar via `{{< callout titel="..." >}}` shortcode |
| `.references` (inline `.ref-tooltip`)                                                                | Voetnotenaccordeon onderaan en inline tooltip markers. Opt-in via `show_referenties`  |
| `.button` (`.button-outline`, `.button-ghost`)                                                       | Knoppen in primaire, outline en ghost variant                                         |
| `.search-modal`                                                                                      | Fuzzy site-search via Fuse.js. Sectievoorrang via `params.search.priority_sections`   |
| `.page-banner` (`.page-banner--warning`, `.page-banner--info`)                                       | Site-brede melding bovenaan via `params.page_banner`                                  |
| `.page-nav`                                                                                          | Prev/next binnen een reeks. Opt-in via `prev_next: true` op section `_index.md`       |
| `.back-to-top`                                                                                        | Zwevende "naar boven"-knop op lange pagina's. Uit te zetten via `params.back_to_top: false`   |
| `.breadcrumb`, `.toc`                                                                                | Standaard breadcrumbs en sticky table of contents                                     |
| Header en footer                                                                                     | Site shell met `--color-banner` token (default `--color-rijksblauw`)                  |

Voor externe links gebruik je de partial `render-link.html`. Die
detecteert automatisch of een link extern, besloten of intern is en
zorgt voor een consistent `rel="external"` en bijbehorend icoon.

## Shortcodes

| Shortcode                                                                                  | Doel                                              |
|--------------------------------------------------------------------------------------------|---------------------------------------------------|
| `{{< callout titel="..." variant="muted\|warning\|success\|danger" corner="..." >}}body{{< /callout >}}` | Infoblock                                         |
| `{{< tiles columns="2\|3" aria="..." field="tiles" >}}`                                    | Card-grid uit `params.tiles` frontmatter          |
| `{{< card-grid section="..." >}}`                                                          | Card-grid van pagina's in een section             |

## Per-page frontmatter

```yaml
---
title: ""
description: ""
weight: 0                   # sortvolgorde binnen section
prev_next: true             # in section _index.md: enable prev/next-nav
manual_layout: true         # in section _index.md: body bepaalt layout (geen auto-cards)
show_lastmod: true          # toon "laatst aangepast" footer
show_referenties: true      # render referenties-accordeon (vereist .Params.referenties)
cascade:                    # propageer params naar alle descendants
  show_lastmod: true
toc: false                  # disable auto-TOC voor deze pagina
---
```

## Toegankelijkheid

Het theme volgt WCAG 2.2 niveau AA als basisdoel. Wat het theme zelf
oplevert:

* Semantische landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`).
* Skip-link naar de hoofdinhoud.
* `aria-label`, `aria-current` en `aria-expanded` op interactieve
  componenten.
* Zichtbare focus states via `:focus-visible`.
* Respect voor `prefers-color-scheme` en `prefers-reduced-motion`.

De toegankelijkheid van de uiteindelijke site hangt ook af van de
content die de consumer aanlevert. Alt-teksten, kopstructuur en
leesbaarheid zijn de verantwoordelijkheid van de site-redactie.

## Content Security Policy

Het theme genereert geen inline `<script>`-tags. Een geschikte minimale
CSP voor een consumer-site is bijvoorbeeld:

```http
Content-Security-Policy:
  default-src 'self';
  img-src 'self' data:;
  font-src 'self';
  style-src 'self';
  script-src 'self';
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none'
```

Pas dit aan zodra je site externe scripts, fonts of afbeeldingen
inlaadt.

## Bijdragen

Pull requests en issues zijn welkom. Lees eerst
[CONTRIBUTING.md](CONTRIBUTING.md) en de
[Gedragscode](CODE_OF_CONDUCT.md). Beveiligingsmeldingen graag via de
procedure in [SECURITY.md](SECURITY.md).

## Licentie

Dit project is gelicentieerd onder de
[EUPL 1.2](LICENSE).
