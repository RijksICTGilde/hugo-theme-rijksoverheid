---
name: naslag
description: "Naslag voor een site op het Hugo-theme voor de Rijksoverheid (github.com/RijksICTGilde/hugo-theme-rijksoverheid als Hugo Module), zoals MOZa en het toetsingskader Archiefwet: welke hooks, params, front matter, shortcodes en Markdown-extensies het theme heeft in de versie die de site gebruikt, en of een wijziging in de site hoort of in het theme. Gebruik bij: een partial, layout, template, CSS of JS van het theme aanpassen of overschrijven (override), 'kan dit met een hook', 'welke params zijn er', front matter, shortcodes, infoblokken (alerts), tabellen, kleuren, iconen of tokens in zo'n site. Voor een nieuwe versie van het theme of een theme-wijziging samen met de site testen: bijwerken."
---

# Naslag bij het Hugo-theme voor de Rijksoverheid

De site gebruikt `github.com/RijksICTGilde/hugo-theme-rijksoverheid` als Hugo
Module. Wat het theme biedt, hangt af van de versie: zoek het op in de versie
van de site, niet in `main`.

## De versie van de site

* `go.mod` van de site noemt de versie:
  `require github.com/RijksICTGilde/hugo-theme-rijksoverheid v0.3.0`. Een
  pseudo-versie zoals `v0.2.4-0.20261122112152-9acf3b8ad3d4` is een commit
  zonder tag; de laatste twaalf tekens zijn het begin van de hash.
* `hugo config mounts` in de site toont bij het theme onder `dir` de map
  waaruit Hugo het leest. Lees daar `README.md` en `CHANGELOG.md`. Met een
  `replace` in `go.mod` of `HUGO_MODULE_REPLACEMENTS` is dat een lokale map,
  ook als `version` nog een versie noemt.
* Die map ligt in de cache van Hugo (`hugo config | grep cachedir`, daaronder
  `modules/filecache/modules/pkg/mod/`), niet in `go env GOMODCACHE`. Een
  hoofdletter staat in dat pad als uitroepteken plus kleine letter:
  `github.com/!rijks!i!c!t!gilde/hugo-theme-rijksoverheid@<versie>`.
* Op GitHub staat dezelfde versie onder de tag of de commit:
  `https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/tree/<tag of commit>`.

## Wat het theme biedt

Dit is de API van het theme. De README van die versie noemt alles, onder deze
koppen. Zoek een naam daar op en verzin er geen:

* hooks: "Hooks", partials die de site vervangt door een bestand met hetzelfde
  pad in `layouts/_partials/`;
* params en menu's: "Params" en "Menu's";
* front matter: "Front matter";
* shortcodes: "Shortcodes";
* Markdown: "Inhoud", met alerts zoals `> [!NOTE]`, de linktitel `besloten`
  en `{aria-label="..."}` of `{print-together="true"}` op de regel onder een
  tabel. Die attributen werken alleen met
  `markup.goldmark.parser.attribute.block: true` in de config van de site
  ("Wat de site zelf zet"); zonder staat de regel als tekst op de pagina;
* eigen CSS: "CSS en JavaScript" (elk `assets/css/*.css` van de site komt na
  de CSS van het theme);
* wat Hugo niet uit het theme overneemt, zoals `outputs` en `markup`: "Wat de
  site zelf zet".

Een README van v0.2 heeft andere koppen en nog geen hooks.

## Kopieer geen bestand van het theme

Zet nooit een kopie van een template, partial, CSS- of JS-bestand van het
theme in de site om het aan te passen. Zo'n kopie krijgt geen fixes meer uit
nieuwe versies.

* Gebruik een hook, een param, front matter of een eigen CSS-bestand in
  `assets/css/` met een naam die het theme niet gebruikt.
* Is daar niets voor, dan hoort de wijziging in het theme: open een issue of
  pull request op
  [RijksICTGilde/hugo-theme-rijksoverheid](https://github.com/RijksICTGilde/hugo-theme-rijksoverheid),
  eventueel voor een nieuwe hook.
* In het theme hoort wat elke site van de Rijksoverheid helpt: algemene
  onderdelen, consistentie met NLDD DS en fixes voor toegankelijkheid.
* In de site, via hooks, hoort wat alleen die site aangaat: inhoud,
  koppelingen met andere systemen en eigen keuzes.

Een bestand in de site met hetzelfde pad als een bestand van het theme dat
geen hook is, is zo'n kopie. "Overstappen" in de CHANGELOG noemt de hook of
param die veel kopieën vervangt. De README staat twee vervangingen toe: een
icoon in `static/images/icons/` ("Kleuren, lettertype en iconen") en, buiten
de Rijksoverheid, een eigen lettertype, logo en favicons ("Buiten de
Rijksoverheid").

## Onderdelen

`exampleSite/` in de repository van het theme laat de onderdelen zien:
`exampleSite/content/onderdelen/` met een voorbeeldpagina per onderdeel en
`exampleSite/hugo.yaml` met elke instelling die het theme kent. Die map zit
niet in de module, want hij heeft een eigen `go.mod`: lees hem op GitHub bij
de tag of commit van de site.

## Kleuren, iconen en tokens

Die komen uit het NLDD Designsysteem. Zoek een token- of icoonnaam op met de
plugin `nldd-design-system@nldd` uit de marketplace
[NederlandseDigitaleDienst/ai-plugins](https://github.com/NederlandseDigitaleDienst/ai-plugins).
Hoe een site een kleur van het theme zet: README, "Kleuren, lettertype en
iconen".
