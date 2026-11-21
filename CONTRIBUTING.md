# Bijdragen

Fijn dat je wilt bijdragen aan dit theme. We werken open en transparant.
Voorstellen, vragen en patches zijn welkom, of je nu bij de overheid
werkt of niet.

Dit document beschrijft hoe je effectief kunt bijdragen. Houd ook de
[Gedragscode](CODE_OF_CONDUCT.md) aan.

## Wat je kunt bijdragen

* Bugmeldingen, met reproductie en versie-informatie.
* Voorstellen voor nieuwe componenten of verbeteringen.
* Documentatieverbeteringen en vertalingen.
* Pull requests die issues oplossen of features toevoegen.

## Eerst overleggen of meteen aan de slag

Voor kleine fixes (typo, kleur, kleine bug) mag je direct een pull
request openen. Voor grotere wijzigingen openen we liever eerst een
issue, zodat we vooraf afstemmen of de richting past.

## Lokale ontwikkeling

Vereisten:

* Hugo 0.162.0 of nieuwer; Extended is niet nodig.
* Go versie 1.26 of nieuwer voor Hugo Modules.
* Node 22 of nieuwer voor de controles in `exampleSite/`.
* Python 3 voor de `pre-commit` hooks.

Stappen om lokaal te werken:

1. Fork de repository en clone je fork.
2. Installeer `pre-commit` met `pip install pre-commit` en activeer met
   `pre-commit install`. Dit zorgt dat checks bij elke commit draaien.
3. Werk aan een eigen branch met een korte, beschrijvende naam.
4. Bouw en controleer je wijziging met de voorbeeldsite: zie
   [exampleSite/README.md](exampleSite/README.md). Geef een nieuw onderdeel
   daar een voorbeeld, zodat de controles het raken. Wil je het ook in een
   eigen site zien, gebruik dan de `replace` uit "Lokale
   theme-ontwikkeling" in de `README.md`.

## Stijl en conventies

* Templates onder `layouts/` volgen Hugo conventies, inclusief
  `_partials/`, `_shortcodes/` en `_markup/`.
* CSS staat onder `assets/css/`. Componenten krijgen een eigen bestand
  onder `assets/css/components/`. Gebruik design tokens uit `tokens.css`
  in plaats van vaste kleuren of maten.
* JavaScript staat onder `assets/js/`: gewone scripts (ES2020) zonder
  buildstap en zonder frameworks. Alleen Fuse.js gaat door `js.Build`,
  omdat het als ES-module komt. Alle scripts komen via `scripts.html` in
  één bundel, zodat een Content Security Policy zonder `unsafe-inline`
  werkt: geen inline scripts, geen `<style>` en geen `style`-attributen.
* Namen in code zijn Engels, zoals in Hugo en NLDD DS: bestanden, params, front
  matter, parameters van shortcodes, sleutels van hooks, classes,
  CSS-variabelen en variabelen in templates en scripts. Commentaar,
  documentatie, teksten in de interface, ids in een URL en de toetsen in
  `exampleSite/tests/` zijn Nederlands.
* Bestandsnamen, CSS-classnamen en parameters van shortcodes in kebab-case;
  params en front matter in snake_case, zoals in Hugo.
* Commit messages in Conventional Commits-stijl, bijvoorbeeld
  `feat: voeg page-banner variant toe` of `fix: corrigeer aria-label op
  zoekmodal`.

## Gegenereerde bestanden en onderdelen van derden

* `assets/css/nldd-primitives.css` en `static/images/icons/*.svg` komen uit
  het NLDD Designsysteem, via `tools/nldd/`. Pas ze niet met de hand aan;
  zie [tools/nldd/README.md](tools/nldd/README.md). De CI controleert dat ze
  gelijk zijn aan wat de generator maakt.
* `assets/lib/fuse/` is een kopie van het npm-pakket `fuse.js`, bijgehouden
  via `tools/fuse/`. Pas het niet met de hand aan: verhoog de versie in
  `tools/fuse/package.json`, draai `node tools/fuse/vendor.js` en commit het
  resultaat; zie [assets/lib/fuse/README.md](assets/lib/fuse/README.md). De CI
  controleert dat de kopie gelijk is aan het pakket.
* Komt er een onderdeel van derden bij, of een nieuwe versie (een font,
  een icoon, een bibliotheek zoals Fuse.js), werk dan
  [NOTICES.md](NOTICES.md) bij met de herkomst en de licentie.

## Toegankelijkheid

Dit theme mikt op WCAG 2.2 niveau AA. Bij elke wijziging die de DOM,
de focusvolgorde of de bediening raakt, controleer minimaal:

* Toetsenbordbediening werkt zonder muis, en Escape sluit wat openging met
  de focus terug op de knop.
* Focus is altijd zichtbaar en wordt niet bedekt.
* Decoratieve elementen krijgen lege `alt` of `aria-hidden`.
* Betekenisvolle iconen krijgen een tekstuele toelichting.
* Contrast is minstens 4,5:1 voor tekst en 3:1 voor bedieningselementen en
  focusringen, in licht én donker.
* Geen horizontaal scrollen op 320 pixels breed en bij 200% tekst.
* Laag 1 en laag 2 van de voorbeeldsite slagen. Ze vinden niet alles: probeer
  een wijziging aan de bediening ook met een schermlezer.

## Pull requests

Voor een pull request graag:

1. Een korte beschrijving van het probleem of de wens.
2. Schermafdrukken bij visuele wijzigingen, licht en donker.
3. Een verwijzing naar het bijbehorende issue, indien aanwezig.
4. Een vermelding in `CHANGELOG.md` onder `## [Unreleased]`.

Reviews kunnen door iedereen met commit rights worden afgehandeld.
Minstens één review is vereist voor merge naar `main`.

## Een release maken

Een release is een knop, een pull request en een merge. De versie volgt
[SemVer](https://semver.org/lang/nl/); hieronder staat `X.Y.Z` voor de nieuwe
versie.

1. Zet de wijzigingen onder `## [Unreleased]` in `CHANGELOG.md`. Een lege
   sectie geeft een foutmelding.
2. Start in Actions de workflow **Prepare release** op `main` en vul de versie
   in, zonder `v`.
3. De workflow opent de pull request `release: vX.Y.Z`. Daarin staat de inhoud
   van `[Unreleased]` onder `## [X.Y.Z] - <datum>` en de nieuwe versie in de
   `hugo mod get`-regels van `README.md`. Controleer de tekst, de datum en de
   CI.
4. Merge de pull request. **Tag release** zoekt via de API de gemergde pull
   request van de branch `release/vX.Y.Z` in deze repository op, controleert
   de kop `## [X.Y.Z]` in `CHANGELOG.md` en pusht de tag `vX.Y.Z`. Die tag
   start **Release**, die de GitHub release maakt met de tekst uit de
   changelog.

Daarna zijn **Tag release** en **Release** groen, staat `vX.Y.Z` onder
Releases en werkt
`hugo mod get github.com/RijksICTGilde/hugo-theme-rijksoverheid@vX.Y.Z`.

Faalt **Prepare release**, dan is er niets aangemaakt: pas de changelog of de
versie aan en start opnieuw. Bleef er een branch `release/vX.Y.Z` achter,
verwijder die dan eerst. Faalt **Tag release**, herstel het dan op `main` en
push de tag met de hand: `git tag -a vX.Y.Z -m vX.Y.Z` en
`git push origin vX.Y.Z`. Ook die tag start **Release**.

Lokaal proberen: `node tools/release/release.mjs X.Y.Z` past `CHANGELOG.md` en
`README.md` aan, en `node --test tools/release/*.test.mjs` draait de toetsen.

### Eenmalige instelling

De workflows gebruiken een GitHub App, zoals Toon: een pull request of tag van
het standaard `GITHUB_TOKEN` start geen CI en geen release.

1. Maak een GitHub App met de repository-rechten Contents en Pull requests
   (read and write), en installeer hem op alleen deze repository.
2. Maak onder Settings, Environments de environment `release` en laat alleen
   `main` hem gebruiken.
3. Zet daarin de variabele `RELEASE_APP_CLIENT_ID` (client ID van de App) en
   het secret `RELEASE_APP_PRIVATE_KEY` (de private key).
4. Beschermt een ruleset `main` of de tags `v*`, geef de App dan het recht om
   tags te maken en `release/*` te pushen.

## Licentie van bijdragen

Door een bijdrage te leveren ga je akkoord met publicatie onder de
[EUPL 1.2 licentie](LICENSE) van dit project.
