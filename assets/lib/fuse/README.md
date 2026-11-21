# Fuse.js (gevendord)

Lokale kopie van [Fuse.js](https://www.fusejs.io/), een fuzzy-search library
zonder afhankelijkheden. We vendoren het bestand zodat er geen CDN nodig is en
consumer-sites hun Content Security Policy strikt kunnen houden (geen externe
`script-src`).

## Huidige versie

* Pakket: `fuse.js`
* Versie: `7.5.0`
* Bestand: `fuse.min.mjs`, ongewijzigd uit `dist/` van het npm-pakket
* Integriteit: `sha512-sQtrEfA+ez/3G0cCZecF70oqpCRttCexYUG4mUrtWL49ULUzUyxokt5kyqwtKzj1270RaKih+hcP3qLcumccow==` (van het pakket `fuse.js-7.5.0.tgz`)
* Licentie: Apache 2.0 (de kop van het bestand houdt de vermelding)

Fuse levert geen kant-en-klaar browserscript meer (sinds 7.3.0 alleen ESM en
CommonJS). `assets/js/fuse-global.js` importeert het bestand en zet `Fuse` op
`window`; `scripts.html` bouwt dat met `js.Build` tot een gewoon script
(`format: iife`, `target: es2020`, `minify`). Hugo Extended is daarvoor
niet nodig, en Node alleen om bij te werken.

## Bijwerken

De versie staat vast in `tools/fuse/` (een `package.json` en `package-lock.json`
die alleen hiervoor dienen). Dependabot volgt die map.

1. Lees de release notes op <https://github.com/krisk/Fuse/releases> op
   breaking changes.
2. Verhoog `fuse.js` in `tools/fuse/package.json` (Dependabot doet dit voor
   je) en kopieer het bestand over de oude:

   ```sh
   npm install --prefix tools/fuse
   node tools/fuse/vendor.js
   ```

   `vendor.js` zet `fuse.min.mjs` en `LICENSE` uit het pakket in deze map en
   werkt de versie en de integriteit hierboven en de versie in `NOTICES.md`
   bij.
3. Bouw een site met het theme (`hugo --panicOnWarning`) en probeer het zoeken
   uit: openen met Ctrl K, zoeken, een resultaat openen.
4. Vermeld de wijziging in `CHANGELOG.md`.

`node tools/fuse/check.js` vergelijkt de bestanden hier byte voor byte met het
pakket; de CI draait dat. Een Dependabot-PR faalt dus tot iemand `vendor.js`
draait en het resultaat commit, net als bij `tools/nldd/`.

## Waarom geen npm-afhankelijkheid?

Het theme heeft geen Node-toolchain. Een gevendord bestand houdt de installatie
voor consumer-sites eenvoudig: alleen `hugo` is genoeg.
