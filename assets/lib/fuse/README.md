# Fuse.js (gevendoreerd)

Dit bestand is een lokale kopie van [Fuse.js](https://www.fusejs.io/),
een fuzzy-search library zonder afhankelijkheden. We vendoreren de
bundel zodat we geen externe CDN nodig hebben en zodat consumer-sites
hun Content Security Policy strikt kunnen houden (geen externe
`script-src`).

## Huidige versie

* Pakket: `fuse.js`
* Versie: `7.3.0`
* Bron: `https://cdn.jsdelivr.net/npm/fuse.js@7.3.0/dist/fuse.mjs`
* Bundler: jsDelivr (Rollup + Terser, zie kop van het bestand)
* Licentie: Apache 2.0

## Bumpen naar een nieuwe versie

1. Controleer of er nieuwe versies zijn op
   <https://github.com/krisk/Fuse/releases>.
2. Lees de release notes en eventuele breaking changes.
3. Vervang `fuse.min.js` door de nieuwe bundel, bijvoorbeeld:

   ```sh
   curl -fSLo assets/vendor/fuse/fuse.min.js \
     "https://cdn.jsdelivr.net/npm/fuse.js@<nieuwe-versie>/dist/fuse.min.js"
   ```

4. Werk de versie hierboven bij.
5. Vermeld de bump in `CHANGELOG.md` onder `## [Unreleased]`.
6. Test de zoekfunctie in een ontwikkelomgeving van een consumer-site.

## Waarom geen npm dependency?

Het theme heeft geen Node toolchain en geen package manager. Een
gevendoreerde bundel houdt de installatieprocedure voor consumer-sites
zo eenvoudig mogelijk: enkel `hugo` is genoeg.
