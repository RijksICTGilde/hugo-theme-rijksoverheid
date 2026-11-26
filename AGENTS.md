# Instructies voor agents

Dit is een Hugo-theme voor sites van de Rijksoverheid, op het NLDD
Designsysteem. De afspraken staan in [CONTRIBUTING.md](CONTRIBUTING.md) en
gelden ook voor een agent: lees die eerst. Hieronder staat wat je daarnaast
moet weten.

Claude Code leest dit bestand zelf. Staat er ook een `CLAUDE.md` of
`CLAUDE.local.md` in deze map of erboven, dan leest Claude alleen die; zet daar
dan `@AGENTS.md` in.

## NLDD Designsysteem

Kleuren, iconen, lettertype en tokens komen uit het
[NLDD Designsysteem](https://design.digitaledienst.overheid.nl/), met de
broncode in
[NederlandseDigitaleDienst/design-system](https://github.com/NederlandseDigitaleDienst/design-system).
Zoek een token- of icoonnaam daar op en verzin er geen; `nldd lint` (zie
[tools/nldd/README.md](tools/nldd/README.md)) vangt een token dat niet bestaat.

Voor agents is er een plugin met de componenten, tokens, iconen en
ontwerprichtlijnen. `.claude/settings.json` zet die aan voor Claude Code:
vertrouw je deze map, dan voegt Claude Code de marketplace van NLDD toe. Heb
je de plugin nog niet, installeer hem dan één keer:

```text
claude plugin install nldd-design-system@nldd --scope project
```

Voor Codex en andere tools staat de uitleg in de
[marketplace van de Nederlandse Digitale Dienst](https://github.com/NederlandseDigitaleDienst/ai-plugins#installeren).

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
* Namen die een site ziet zijn Engels, zoals CONTRIBUTING onder "Stijl en
  conventies" vastlegt.
* Vraagt een onderdeel een instelling die Hugo niet uit het theme overneemt,
  zoals `markup`, zet die dan in de README onder "Wat de site zelf zet". Zo
  werkt `{aria-label="..."}` onder een tabel alleen met
  `markup.goldmark.parser.attribute.block: true`.

## Controleren

* Bouw de voorbeeldsite en draai laag 1 en laag 2 zoals in
  [exampleSite/README.md](exampleSite/README.md), plus htmltest en
  `pre-commit run --all-files`.
* Raak je tokens, iconen of `tools/nldd/` aan, draai dan ook
  `node tools/nldd/check.js` en `nldd lint`, zoals in
  [tools/nldd/README.md](tools/nldd/README.md).
* Een nieuwe toets faalt zonder zijn wijziging: probeer dat uit.
* Een refactor verandert de gebouwde voorbeeldsite niet: bouw voor en na en
  vergelijk de uitvoer.
* De bestanden die `tools/nldd/` en `tools/fuse/` maken, werk je bij met het
  script daar, niet met de hand.

## Een versie uitbrengen

In Claude Code: de skill `/release` (`.claude/skills/release/SKILL.md`). Andere
agents volgen "Een release maken" in CONTRIBUTING.
