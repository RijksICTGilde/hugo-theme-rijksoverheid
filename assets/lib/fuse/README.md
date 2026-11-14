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
(`format: iife`, `target: es2020`, `minify`). Daarvoor volstaat de
standaardeditie van Hugo; Node is alleen nodig om bij te werken.

## Bijwerken

1. Lees de release notes op <https://github.com/krisk/Fuse/releases> op
   breaking changes.
2. Haal het pakket op in een lege map en controleer de integriteit tegen de
   registry (beide regels moeten gelijk zijn):

   ```sh
   mkdir /tmp/fuse && cd /tmp/fuse
   npm pack fuse.js@<versie>
   npm view fuse.js@<versie> dist.integrity
   echo "sha512-$(openssl dgst -sha512 -binary fuse.js-<versie>.tgz | openssl base64 -A)"
   ```

3. Pak het uit en kopieer het bestand over de oude:

   ```sh
   tar xzf fuse.js-<versie>.tgz
   cp package/dist/fuse.min.mjs <theme>/assets/lib/fuse/fuse.min.mjs
   ```

4. Werk de versie en de integriteit hierboven bij.
5. Bouw een site met het theme (`hugo --panicOnWarning`) en probeer het zoeken
   uit: openen met Ctrl K, zoeken, een resultaat openen.
6. Vermeld de wijziging in `CHANGELOG.md`.

## Waarom geen npm-afhankelijkheid?

Het theme heeft geen Node-toolchain. Een gevendord bestand houdt de installatie
voor consumer-sites eenvoudig: alleen `hugo` is genoeg.
