# Hugo theme voor de Rijksoverheid

Hugo theme voor websites in de stijl van de Rijksoverheid. Het theme levert
layouts, kleuren, lettertype en iconen uit het
[NLDD Designsysteem](https://github.com/NederlandseDigitaleDienst/design-system),
een sitebrede zoekfunctie en uitvoer voor taalmodellen. Sites brengen hun
eigen inhoud mee en, waar nodig, een eigen stylesheet.

Het theme mikt op WCAG 2.2 niveau AA, werkt onder een strikte Content Security
Policy en doet geen verzoeken naar andere domeinen. Het staat onder de
[EUPL 1.2](LICENSE) en is bedoeld voor hergebruik door overheidsorganisaties.
Fonts, logo en iconen hebben een eigen licentie; zie [NOTICES.md](NOTICES.md).

## Vereisten

| Gereedschap | Minimale versie | Opmerking |
|---|---|---|
| Hugo | 0.162.0 | De standaardeditie volstaat; Extended is niet nodig |
| Go | 1.26 | Nodig voor Hugo Modules |

Het theme zet `module.hugoVersion.min`; met een oudere Hugo krijg je een
waarschuwing.

## Versies

Het theme volgt Semantic Versioning, met tags als `v0.3.0`. Zolang de major op
0 staat, mag een minor-versie breken; de [CHANGELOG](CHANGELOG.md) noemt dat
onder "Breaking", met wat een site moet doen. Pin daarom op een vaste tag en
werk bij via een pull request (zie [Bijwerken](#bijwerken)).

## Snelstart

```sh
hugo new site mijn-site --format=yaml
cd mijn-site
hugo mod init github.com/<organisatie>/mijn-site
hugo mod get github.com/RijksICTGilde/hugo-theme-rijksoverheid@v0.3.0
```

Een minimale `hugo.yaml`:

```yaml
baseURL: https://www.voorbeeld.nl/
title: Mijn site
locale: nl

module:
  imports:
    - path: github.com/RijksICTGilde/hugo-theme-rijksoverheid

outputs:
  home: [HTML, RSS, JSON]   # JSON is de zoekindex

markup:
  highlight:
    noClasses: false        # codekleuring via CSS, nodig onder een strikte CSP

build:
  noJSConfigInAssets: true  # anders schrijft het zoeken assets/jsconfig.json in de site
```

Start daarna `hugo server`.

## Configuratie

### Wat de site zelf zet

Hugo neemt uit een theme-module `params` over (diep samengevoegd) en `menus`,
`outputFormats` en `mediaTypes` (alleen sleutels die de site zelf niet heeft).
`outputs`, `markup`, `build`, `disableKinds`, `security`, `permalinks` en
`enableRobotsTXT` neemt Hugo niet over: die staan altijd in de config van de
site. Bron: de
[merge strategy](https://gohugo.io/configuration/introduction/) van Hugo.

Het theme heeft geen eigen pagina's voor taxonomieën. Gebruikt de site geen
labels of categorieën, zet dan `disableKinds: [taxonomy, term]`; anders maakt
Hugo lege pagina's "Tags" en "Categories" die ook in de sitemap staan.

Het theme definieert de uitvoerformaten `llms`, `llmsfull` en `markdown`. Wil
je ze, zet ze dan aan in `outputs`:

```yaml
outputs:
  home: [HTML, RSS, JSON, llms, llmsfull]
  section: [HTML, RSS, llms, llmsfull]
  page: [HTML, markdown]

enableRobotsTXT: true

markup:
  highlight:
    noClasses: false
  tableOfContents:
    startLevel: 2
    endLevel: 4
```

### Menu's

| Menu | Plek | Doel |
|---|---|---|
| `main` | kop | Hoofdnavigatie, één niveau |
| `secondary` | mobiel menu | Extra links, zoals naar een andere site |
| `footer-links` | voet, links | Bijvoorbeeld contact en sitemap |
| `footer-rechts` | voet, rechts | Bijvoorbeeld privacy en toegankelijkheid |
| `<naam>` | sectienavigatie | Activeer met `second_nav: <naam>` in de front matter van de sectie. Een item met pagina's eronder krijgt een submenu met die pagina's |

Gebruik `pageRef:` voor eigen pagina's en `url:` voor andere sites.

### Params

Alles is optioneel.

| Param | Standaard | Doel |
|---|---|---|
| `tagline` | | Ondertitel naast de sitenaam; ook in de titel van de homepage |
| `description` | | Beschrijving voor pagina's zonder eigen `description` |
| `logo.url`, `logo.woordmerk`, `logo.label` | eigen homepage | Woordmerk naast het lint en een logolink naar een andere site |
| `footer.tagline`, `footer.links`, `footer.rechts` | | Tekst in de voet en de koppen van de twee linkkolommen |
| `afzender.naam`, `afzender.url`, `afzender.tekst` | | Regel in de voet met de organisatie achter de site |
| `links.nieuw_venster` | `false` | `true` opent externe links in een nieuw venster, met melding en icoon |
| `infoblok.kopniveau` | `3` | Kopniveau van de titel van een infoblok (2 tot en met 6) |
| `search.enable` | aan als er een JSON-index is | `false` zet zoeken uit |
| `search.filters` | | Filters in het zoekvenster, als lijst met `label` en `section` |
| `search.priority_sections` | | Secties waarvan de resultaten bovenaan staan |
| `search.threshold` | `0.3` | Hoe streng Fuse.js zoekt: 0 is exact, 1 is alles |
| `search.max_results` | `10` | Aantal resultaten; 0 is alles |
| `search.section_weights` | | Factor per sectie op de zoekscore; onder 1 komt een sectie eerder |
| `llms.secties` | | Secties in `llms.txt`, als lijst met `sectie`, `kop` en optioneel `limiet`, `tekst` (een regel onder de kop) en `volledig: false` (niet in `llms-full.txt`) |
| `og.afbeelding` | `favicon-192x192.png` | Deelafbeelding van 1200 bij 630 pixels |
| `back_to_top` | `false` | Knop "naar boven" op lange pagina's |
| `page_banner.type`, `.strong`, `.text` | | Melding boven aan elke pagina |

### Front matter

| Veld | Doel |
|---|---|
| `title`, `description`, `page_title` | Titel, beschrijving en een afwijkende titel voor het tabblad |
| `card_title`, `card_description`, `image`, `image_alt` | Hoe de pagina als kaart verschijnt |
| `show_date`, `status` | Labels onder de titel |
| `lead_image`, `lead_image_alt`, `lead_image_caption` | Leadbeeld boven de tekst |
| `toc`, `toc_tot_en_met` | `toc: false` zet de inhoudsopgave uit; `toc_tot_en_met` beperkt de diepte |
| `relevante_links` | Lijst met `titel` en `pagina` of `url`, in de rechterkolom |
| `show_lastmod` | Toon "laatst bijgewerkt" in de voet (met `enableGitInfo: true` uit git) |
| `prev_next` | In `_index.md`: vorige en volgende binnen de sectie |
| `manual_layout` | In `_index.md`: geen automatische kaarten (`hide_tiles` werkt ook) |
| `second_nav` | In `_index.md`: menu voor de sectienavigatie |
| `hero.image`, `hero.image_alt`, `hero.title`, `hero.text` | Hero op de homepage |
| `wide` | Artikel over de volle breedte |

### Hooks

Partials die een site met hetzelfde pad in `layouts/_partials/` vervangt.

| Partial | Standaard | Doel |
|---|---|---|
| `favicons.html` | de favicons van het theme | Eigen favicons |
| `font-preload.html` | RijksSans | Het lettertype dat de browser vooraf ophaalt; leeg voor geen |
| `head-extra.html` | leeg | Extra elementen in de `<head>`, na de CSS van het theme |
| `og-image.html` | `params.og.afbeelding` | Deelafbeelding per pagina; geeft een pad terug |
| `llm-instructies.html` | leeg | Eigen tekst boven in `llms.txt` |
| `page-aside-extra.html` | leeg | Extra blok in de rechterkolom, bijvoorbeeld downloads |
| `search-index-extra.html` | leeg | Extra items in de zoekindex |

Vervang liever een hook dan een groot partial: een eigen kopie van
`header.html` krijgt geen fixes uit nieuwe versies van het theme meer.

## Onderdelen

### Kop en voet

De kop heeft de sitenaam (altijd een link), het hoofdmenu, de zoekknop en,
binnen een sectie met `second_nav`, de sectienavigatie met submenu's. Het mobiele menu sluit met Escape en geeft de focus terug aan de
knop. De voet heeft het kruimelpad, "laatst bijgewerkt", de linkkolommen, de
afzender en de keuze voor de weergave: Systeem, Licht of Donker. Die keuze
werkt met JavaScript; zonder JavaScript volgt de site de instelling van het
systeem.

### Pagina's

Een artikel heeft de titel, eventuele labels, de rechterkolom (inhoudsopgave,
relevante links en de hook `page-aside-extra.html`), het leadbeeld en de tekst.
Op een breed scherm staat de kolom rechts; op een smal scherm staat hij boven
de tekst en klapt hij uit. De inhoudsopgave volgt de positie op de pagina.
Een sectie toont haar pagina's als kaarten; het kopniveau van de kaarten volgt
uit de laatste kop in de tekst van de sectie.

### Inhoud

- **Links.** Een externe link opent in hetzelfde tabblad. Met
  `params.links.nieuw_venster: true` opent hij in een nieuw venster, met een
  verborgen melding en een icoon. Een link naar een besloten omgeving krijgt
  een slot en een verborgen melding. Markeer hem met de linktitel `besloten`:
  `[Werkruimte](https://... "besloten")`. Links naar samenwerkruimten.nl en
  de chat op digilab.overheid.nl herkent het theme zelf.
- **Infoblokken.** GitHub-alerts worden een infoblok met een echte kop:
  `> [!NOTE]` en `> [!INFO]` worden info, `> [!TIP]` succes, `> [!IMPORTANT]` en
  `> [!WARNING]` waarschuwing, `> [!CAUTION]` gevaar. Een titel zet je achter het
  type: `> [!WARNING] Let op`.
- **Tabellen** staan in een eigen schuifvlak met een naam ("Tabel 1"), zodat een
  brede tabel de pagina niet laat scrollen.
- **Code** wordt gekleurd via CSS-klassen (`noClasses: false`); een breed
  codeblok scrolt in een eigen vlak.
- **Voetnoten** krijgen een kop "Voetnoten" en links met een naam.
- **Bronnen.** `referenties.html` (een bronnenlijst) en `reftext.html` (een
  woord met `{ref:N}` erachter krijgt de bron als tooltip) zijn partials voor
  een eigen layout of shortcode; de bronnen staan in `referenties` in de front
  matter, de lijst verschijnt met `show_referenties: true`. De voorbeeldsite
  heeft een shortcode `bron`.
- **Mermaid.** Het theme toont voorgerenderde SVG's in een licht en een donker
  versie; het rendert zelf niets. Het pad en de naam van de SVG staan bovenin
  `layouts/_markup/render-codeblock-mermaid.html`. Geef elk diagram een
  `accTitle` (de alt-tekst) en een `accDescr` (de beschrijving).

Een eigen layout die `.Content` toont, stuurt die door
`partial "inhoud.html" .Content`. Anders missen voetnoten, tabellen en
codeblokken hun namen.

### Shortcodes

| Shortcode | Gebruik |
|---|---|
| `callout` | `{{< callout titel="..." variant="info\|muted\|success\|warning\|danger" corner="..." kopniveau="3" >}}...{{< /callout >}}` |
| `card-grid` | `{{< card-grid section="..." niveau="3" klassen="boxed clickable" >}}`: kaarten van een sectie |
| `tiles` | `{{< tiles field="tiles" columns="2\|3" niveau="3" >}}`: kaarten uit de front matter |
| `quote` | `{{< quote source="..." >}}...{{< /quote >}}`: citaat met bron |
| `table-without-header` | Tabel zonder koprij, met de eerste kolom als rijkop |
| `emoji` | `{{< emoji teken="..." aria-label="..." >}}`, of `aria-hidden="true"` als hij alleen versiert |

### Zoeken

Zoeken staat aan zodra de homepage een JSON-index maakt (`outputs.home` met
`JSON`). Het venster opent met de zoekknop of met Ctrl+K (Cmd+K op macOS); de
sneltoets reageert niet terwijl je in een ander veld typt. Het aantal
resultaten wordt aan een schermlezer gemeld. De index bevat pagina's, secties
en de stukken onder elke `h2`, `h3` en elk uitklapblok.

### Uitvoer voor taalmodellen en RSS

Met de `outputs` hierboven maakt de site `llms.txt` en `llms-full.txt`, per
pagina een Markdown-versie (`index.md`, met een `<link rel="alternate">` in de
head), en een RSS-feed met de volledige inhoud. Met `enableRobotsTXT: true`
komt er een `robots.txt` die naar de sitemap en `llms.txt` verwijst.

## Kleuren, lettertype en iconen

De kleuren komen uit het NLDD Designsysteem. `assets/css/nldd-primitives.css`
bevat de 19 kleurschalen van NLDD, gegenereerd met `tools/nldd/`, plus een
eigen neutrale schaal (`--theme-neutral-*`) die in het donkere thema blauw
blijft. `assets/css/tokens.css` koppelt de tokens van het theme (`--color-*`)
daaraan. Elke kleur heeft een waarde voor licht en voor donker.

Een site past kleuren aan op `:root`, bijvoorbeeld:

```css
:root {
  --color-primary: var(--primitives-color-hemelblauw-700);
  --color-banner: var(--primitives-color-hemelblauw-700);
}
```

Reken daarna het contrast na in licht én donker. Het attribuut voor de keuze
van de bezoeker is `data-scheme="light"` of `data-scheme="dark"` op `<html>`;
`data-theme` wordt in deze versie nog gezet voor sites met eigen CSS daarop.

Het lettertype is RijksSans, de iconen komen uit NLDD. Een site vervangt een
icoon door een bestand met dezelfde naam in `static/images/icons/`. RijksSans
en het Rijkslogo zijn alleen voor de Rijksoverheid; zie
[NOTICES.md](NOTICES.md).

## Buiten de Rijksoverheid

RijksSans, het Rijkslogo en de favicons met het lint zijn alleen voor de
Rijksoverheid en wie in haar opdracht werkt. Een andere organisatie publiceert
ze niet en sluit ze uit bij de import van het theme:

```yaml
module:
  imports:
    - path: github.com/RijksICTGilde/hugo-theme-rijksoverheid
      mounts:
        - source: layouts
          target: layouts
        - source: assets
          target: assets
        - source: static
          target: static
          excludeFiles:
            - fonts/RijksSans*
            - images/logo-rijksoverheid.svg
            - favicon*
            - apple-touch-icon.png
```

Zet er daarna eigen bestanden voor in de plaats:

- **Lettertype:** een eigen `assets/css/fonts.css` met de `@font-face`-regels,
  `--font-sans` op `:root` in de CSS van de site, en een eigen of lege
  `layouts/_partials/font-preload.html`.
- **Logo:** een eigen `static/images/logo-rijksoverheid.svg` (de naam blijft
  zo), met de naam van de organisatie in `params.logo.woordmerk`.
- **Favicons:** eigen bestanden in `static/` en, bij andere namen, een eigen
  `layouts/_partials/favicons.html`.
- **Kleuren:** de tokens op `:root`, zoals hierboven.

Met `excludeFiles` laat elke site ook bestanden van het theme weg die ze niet
gebruikt, zoals `images/icons/arrow-up.svg` zonder `back_to_top`.

## Toegankelijkheid

Het theme mikt op WCAG 2.2 niveau AA. Wat het zelf regelt:

- landmarks met een naam, een skip-link die de focus naar de inhoud zet;
- bediening met het toetsenbord, met een zichtbare focus die niet wordt bedekt;
- geen horizontaal scrollen op 320 pixels en bij 200% tekst;
- contrast van minstens 4,5:1 voor tekst en 3:1 voor bedieningselementen, in
  licht en donker;
- echte koppen, lijsten en tabelkoppen, en namen voor tabellen, codeblokken,
  voetnoten en diagrammen;
- meldingen voor schermlezers bij zoekresultaten;
- `prefers-reduced-motion` en een werkende site zonder JavaScript.

De inhoud is van de site: alt-teksten, koppen in de goede volgorde, duidelijke
linkteksten en taal op B1-niveau. Automatische controles vinden maar een deel
van de problemen; toets ook met een toetsenbord en een schermlezer, en houd
een toegankelijkheidsverklaring bij.

Het theme is Nederlandstalig: `<html lang="nl">` en de teksten van de
interface staan vast. Geef een passage in een andere taal een eigen `lang`,
zoals `<span lang="en">`.

## Publiceren: HTTPS en headers

Het theme levert HTML, CSS en JavaScript; de rest regelt de hosting. HTTPS met
HSTS, TLS en security.txt staan op de lijst "pas toe of leg uit" van het
[Forum Standaardisatie](https://www.forumstandaardisatie.nl/open-standaarden/verplicht).
Regel bij de hosting:

- HTTPS met een redirect vanaf HTTP, en `Strict-Transport-Security` met een
  `max-age` van minstens een jaar;
- `/.well-known/security.txt` volgens RFC 9116, met `Contact` en `Expires`;
- de headers `Content-Security-Policy` (hieronder),
  `X-Content-Type-Options: nosniff` en `Referrer-Policy: same-origin`;
- `text/markdown; charset=utf-8` als type voor `.md` en
  `text/plain; charset=utf-8` voor `.txt`.

Controleer het resultaat met [internet.nl](https://internet.nl/). Hugo zet in
elke pagina een `<meta name="generator">` met zijn versie;
`disableHugoGeneratorInject: true` laat die weg.

Het theme heeft geen inline scripts, geen `<style>`-blokken en geen
`style`-attributen. Deze policy werkt:

```http
Content-Security-Policy: default-src 'self'; img-src 'self'; font-src 'self'; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'
```

Zet daarvoor `markup.highlight.noClasses: false`; anders schrijft Hugo de
codekleuring als `style`-attributen. Met `markup.goldmark.renderer.unsafe: true`
kan inhoud zelf `style` meebrengen; controleer de gebouwde site dan op
`style=`.

## CSS en JavaScript

De CSS is één bundel, in deze volgorde: `nldd-primitives.css`, `tokens.css`,
`fonts.css`, `base.css`, `layout.css`, de componenten (op naam), en daarna elk
`assets/css/*.css` van de site. CSS in een submap van `assets/css/` doet niet
mee; zet daar stylesheets die alleen bij een eigen layout horen. De bundel gaat
door `resources.ExecuteAsTemplate`: gebruik in CSS geen dubbele accolades
behalve voor `relURL`.

De JavaScript is ook één bundel (`base.js`, `toc.js`, `referenties.js`,
`tooltip.js`, Fuse.js en `search.js`), plus `theme-init.js` in de head om het
gekozen kleurschema zonder flits te zetten.

## Lokale theme-ontwikkeling

Werk je tegelijk aan het theme en een site, zet dan in `go.mod` van de site:

```go
replace github.com/RijksICTGilde/hugo-theme-rijksoverheid => ../hugo-theme-rijksoverheid
```

Haal die regel weg voordat je commit.

## Bijwerken

Hugo haalt het theme op met `git clone`; `go.sum` legt de inhoud vast. Werk bij
met:

```sh
hugo mod get github.com/RijksICTGilde/hugo-theme-rijksoverheid@v0.3.0
hugo mod tidy
```

Dependabot kan dit ook, met één extra bestand in de site. Zonder dat bestand
haalt Dependabot de regel van het theme stil uit `go.mod` (`go mod tidy` ziet
geen Go-code die hem gebruikt), en pakt Hugo bij de volgende build de nieuwste
versie. Zet daarom in de root van de site een `tools.go`:

```go
//go:build tools

package tools

import _ "github.com/RijksICTGilde/hugo-theme-rijksoverheid"
```

en in `.github/dependabot.yml` het ecosysteem `gomod`. Laat de CI na het
bouwen ook `hugo mod verify` en `git diff --exit-code -- go.mod go.sum`
draaien, zodat een stille wijziging van de versie opvalt.

## Testsite en controles

`exampleSite/` is een site met elk onderdeel van het theme. Hij heeft een eigen
`go.mod` en valt daardoor buiten wat een site downloadt. Zie
[exampleSite/README.md](exampleSite/README.md) voor de controles en hoe je ze
lokaal draait. De CI bouwt hem op de minimale en de nieuwste Hugo en draait de
controles op elke pull request.

## NLDD Designsysteem en NL Design System

Het theme gebruikt de kleuren, het lettertype en de iconen van het NLDD
Designsysteem van de Nederlandse Digitale Dienst, en volgt de
ontwerprichtlijnen daarvan. Het gebruikt geen web components van NLDD: alles
is HTML en CSS uit het theme zelf. Het is geen implementatie van het
[NL Design System](https://nldesignsystem.nl/), de gemeenschap van
overheidsorganisaties met eigen componenten en huisstijlen.

## Bijdragen

Pull requests en issues zijn welkom. Lees eerst
[CONTRIBUTING.md](CONTRIBUTING.md) en de [gedragscode](CODE_OF_CONDUCT.md).
Meld een beveiligingsprobleem volgens [SECURITY.md](SECURITY.md).

## Licentie

De code staat onder de [EUPL 1.2](LICENSE). Voor fonts, logo, iconen en Fuse.js
gelden eigen voorwaarden; zie [NOTICES.md](NOTICES.md).
