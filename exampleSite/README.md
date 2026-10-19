# Voorbeeldsite

Een site met elk onderdeel van het theme, om aan te ontwikkelen en om de
controles op te draaien. `hugo.yaml` zet elke instelling die het theme kent.
`go.mod` wijst met `replace` naar de map erboven, dus de site gebruikt altijd
het theme uit deze checkout. Een site die het theme downloadt, krijgt deze map
niet mee.

## Vereisten

Hugo 0.162.0 of nieuwer, Go 1.26 voor Hugo Modules en Node 22 of nieuwer. Laag
1 gebruikt alleen Node; laag 2 heeft `npm ci` nodig.

## Bouwen en bekijken

```sh
cd exampleSite
hugo server
```

De controles werken op twee builds:

```sh
npm run build
```

`public/` heeft de standaardinstellingen. `public-nieuw-venster/` bouwt met
`config/nieuw-venster/`, waar `params.links.nieuw_venster: true` aanstaat.
Beide bouwen met `--panicOnWarning`: een waarschuwing van het theme is een
fout.

## Controles

| Controle | Wat | Commando |
|---|---|---|
| Laag 1 | Regels op de bron van het theme (onder meer CSP en opslag) en op de gebouwde HTML: koppen, namen, links en de uitvoerformaten. Alleen Node | `npm test` |
| htmltest | Interne links en ankers in `public/` | `htmltest` |
| Laag 2 | In Chromium: pa11y (WCAG 2.1 AA) in licht en donker, axe voor WCAG 2.2 AA (doelgrootte), reflow op 320 pixels en bij 200% tekst, en bediening met het toetsenbord | `npm ci` en `npm run laag2` |

Een deel van laag 2 draai je met `npm run pa11y`, `npm run wcag22`,
`npm run reflow`, `npm run toetsenbord`, `npm run escape` of
`npm run opmaak`. Puppeteer haalt zelf een Chrome op;
met `PUPPETEER_EXECUTABLE_PATH` gebruik je een geïnstalleerde.

De CI draait laag 1 en htmltest op Hugo 0.162.0 en op de nieuwste versie, en
laag 2 op 0.162.0.

Automatische controles vinden maar een deel van de toegankelijkheidsproblemen.
Ze bewaken regressies; ze vervangen geen onderzoek met een toetsenbord en een
schermlezer.

## Een onderdeel toevoegen

Geef een nieuw onderdeel van het theme een pagina of een voorbeeld in deze
site, en een nieuwe instelling een waarde in `hugo.yaml`, zodat de controles
het raken. Een nieuwe testfile in `tests/` (laag 1) of `tests/laag2/` draait
vanzelf mee.
