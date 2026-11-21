# Instructies voor Claude

Dit is een Hugo-theme voor sites van de Rijksoverheid, op het NLDD
Designsysteem. De afspraken staan in [CONTRIBUTING.md](CONTRIBUTING.md) en
gelden ook voor een agent: lees die eerst. Hieronder staat wat je daarnaast
moet weten.

## Sites bouwen op dit theme

MOZa ([MinBZK/moza-site](https://github.com/MinBZK/moza-site)) en het
toetsingskader Archiefwet
([RijksICTGilde/toetsingskader-archiefwet](https://github.com/RijksICTGilde/toetsingskader-archiefwet))
gebruiken het theme als Hugo Module en vervangen partials door een bestand met
hetzelfde pad. Hooks, params, front matter, parameters van shortcodes en de
sleutels die een hook krijgt zijn daarom API:

* Een andere naam of een ander contract breekt zo'n site zonder foutmelding.
  Zet het in `CHANGELOG.md` onder "Breaking" en "Overstappen", met wat een site
  moet doen.
* Wil een site iets anders, maak dan liever een hook of een param dan dat de
  site een bestand van het theme kopieert.

## Controleren

* Bouw de voorbeeldsite en draai laag 1 en laag 2 zoals in
  [exampleSite/README.md](exampleSite/README.md), plus htmltest en
  `pre-commit run --all-files`.
* Een nieuwe toets faalt zonder zijn wijziging: probeer dat uit.
* Een refactor verandert de gebouwde voorbeeldsite niet: bouw voor en na en
  vergelijk de uitvoer.
* De bestanden die `tools/nldd/` en `tools/fuse/` maken, werk je bij met het
  script daar, niet met de hand.

## Een versie uitbrengen

Gebruik de skill `release` in `.claude/skills/release/SKILL.md`.
