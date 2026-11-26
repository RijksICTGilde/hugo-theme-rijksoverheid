---
name: bijwerken
description: "Een site op het Hugo-theme voor de Rijksoverheid (github.com/RijksICTGilde/hugo-theme-rijksoverheid als Hugo Module) bijwerken naar een nieuwe versie, of samen met de site een wijziging aan het theme testen die nog niet is uitgebracht. Gebruik bij: theme update, het theme bijwerken of upgraden, hugo mod get, hugo mod tidy, go.mod of go.sum van het theme, een pseudo-version (pseudo-versie) pinnen, HUGO_MODULE_REPLACEMENTS of replace, een theme-PR en een site-PR tegelijk, of 'de site heeft een fix, feature of hook uit het theme nodig'. Voor wat het theme biedt (hooks, params, shortcodes): naslag."
---

# Het theme bijwerken en samen testen

Het theme volgt SemVer. Zolang de major 0 is, kan een nieuwe minor breken
(0.3 naar 0.4) en een patch niet. Breaking is alles waarvoor een site iets
moet aanpassen. Met die regel kiest de skill `/release` van het theme de
versie.

## Naar een release

1. Bouw de site eerst zoals ze nu is naar een eigen map (`hugo -d`, met de
   opties uit haar README of CI), om straks te vergelijken.
2. Lees `CHANGELOG.md` van de doelversie, op GitHub bij die tag: elke versie
   tussen de huidige en het doel, eerst "Breaking" en "Overstappen".
3. Werk bij:

   ```sh
   hugo mod get github.com/RijksICTGilde/hugo-theme-rijksoverheid@vX.Y.Z
   hugo mod tidy
   ```

   Zet de site deze plugin aan in `.claude/settings.json`, zet daar `ref` van
   de marketplace `hugo-theme-rijksoverheid` op dezelfde `vX.Y.Z`.

4. Bekijk de diff van `go.mod` en `go.sum`: alleen regels van het theme.
   `hugo mod tidy` haalt de regels van de oude versie uit `go.sum`. Houdt een
   `tools.go` de require vast (hij importeert het pakket uit `doc.go` van het
   theme), laat die staan: zonder haalt Dependabot met `go mod tidy` het theme
   stil uit `go.mod` (README, "Bijwerken").
5. Pas de site aan volgens "Overstappen".
6. Bouw de site, draai haar eigen controles en lees de waarschuwingen: het
   theme meldt een oude naam met een waarschuwing, niet met een fout.
7. Bouw opnieuw naar een eigen map en vergelijk met `diff -r`. Een andere naam
   van de CSS- en JS-bundel (fingerprint) is te verwachten. Zoek elk ander
   verschil uit dat de CHANGELOG niet verklaart.

## Een wijziging aan het theme testen voor de release

Lokaal, zonder `go.mod` te veranderen:

```sh
HUGO_MODULE_REPLACEMENTS="github.com/RijksICTGilde/hugo-theme-rijksoverheid -> /pad/naar/theme" hugo server
```

Geef een absoluut pad: een relatief pad telt vanaf `themes/` in de site.
`hugo config mounts` toont onder `dir` welke map Hugo gebruikt.

In een pull request van de site pin je een gepushte commit van het theme:

```sh
hugo mod get github.com/RijksICTGilde/hugo-theme-rijksoverheid@<commit>
hugo mod tidy
```

`go.mod` krijgt dan een pseudo-versie zoals
`v0.2.4-0.20261122112152-9acf3b8ad3d4`: de patch na de laatste tag, de
committijd in UTC en de eerste twaalf tekens van de hash. Houd die pull
request een draft tot het theme is uitgebracht, en pin dan de tag.

## Als `hugo mod get` faalt

Direct na een push of een nieuwe tag kennen proxy.golang.org en
sum.golang.org de versie soms nog niet, en dan faalt `hugo mod get`,
bijvoorbeeld bij "verifying module". Wacht een paar minuten en probeer het
opnieuw; vroeg iemand de versie op voordat de tag bestond, dan kan het
volgens de FAQ van proxy.golang.org tot 30 minuten duren. Omzeil de checksumdatabase nooit: geen `GONOSUMDB`,
`GOSUMDB=off`, `GOPRIVATE` of `GOFLAGS`.

## Theme-PR en site-PR tegelijk

Werken twee mensen of twee sessies tegelijk aan een pull request van het theme
en een van de site:

* Spreek af wie naar de theme-PR pusht, en meld elke push.
* Push alleen fast-forward. Force-push de theme-PR niet zonder dat de ander
  het weet.
* Pin de site-PR op de commit van het theme die je wilt testen, en pin
  opnieuw na elke push die je wilt meenemen.
* Na een force-push op de theme-PR pin je opnieuw: de oude commit hoort niet
  meer bij de PR.

## Als de site iets nieuws van het theme nodig heeft

Voor een bug, een feature, een fix voor toegankelijkheid of een ontbrekende
hook:

1. Maak een pull request op het theme, met een regel in `CHANGELOG.md` onder
   `## [Unreleased]`, en test hem met de site zoals hierboven.
2. Na de merge maakt een maintainer de release met de skill `/release` van het
   theme (`.claude/skills/release/SKILL.md` in de repository van het theme).
3. Werk de site bij naar die release, zoals hierboven.
