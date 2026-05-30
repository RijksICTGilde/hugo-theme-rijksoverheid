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

* Hugo Extended versie 0.162 of nieuwer.
* Go versie 1.26 of nieuwer voor Hugo Modules.
* Python 3 voor de `pre-commit` hooks.

Stappen om lokaal te werken:

1. Fork de repository en clone je fork.
2. Installeer `pre-commit` met `pip install pre-commit` en activeer met
   `pre-commit install`. Dit zorgt dat checks bij elke commit draaien.
3. Werk aan een eigen branch met een korte, beschrijvende naam.
4. Test je wijziging in een echte Hugo-site. Een minimale aanpak is in de
   `README.md` beschreven onder "Lokale theme-ontwikkeling".

## Stijl en conventies

* Templates onder `layouts/` volgen Hugo conventies, inclusief
  `_partials/`, `_shortcodes/` en `_markup/`.
* CSS staat onder `assets/css/`. Componenten krijgen een eigen bestand
  onder `assets/css/components/`. Gebruik design tokens uit `tokens.css`
  in plaats van vaste kleuren of maten.
* JavaScript staat onder `assets/js/` en is plain ES5/ES2015. Geen
  buildstap, geen frameworks. Verzamel scripts in `scripts.html` zodat
  Content Security Policy zonder `unsafe-inline` mogelijk blijft.
* Bestandsnamen en CSS-classnamen in kebab-case.
* Commit messages in Conventional Commits-stijl, bijvoorbeeld
  `feat: voeg page-banner variant toe` of `fix: corrigeer aria-label op
  zoekmodal`.

## Toegankelijkheid

Dit theme volgt WCAG 2.2 niveau AA. Bij elke wijziging die de DOM,
focus order of interactie raakt, controleer minimaal:

* Toetsenbordbediening werkt zonder muis.
* Focus is altijd zichtbaar.
* Decoratieve elementen krijgen lege `alt` of `aria-hidden`.
* Betekenisvolle iconen krijgen een tekstuele toelichting.
* Kleurcontrast voor tekst is minstens 4.5 op 1.

## Pull requests

Voor een pull request graag:

1. Een korte beschrijving van het probleem of de wens.
2. Schermafdrukken bij visuele wijzigingen, licht en donker.
3. Een verwijzing naar het bijbehorende issue, indien aanwezig.
4. Een vermelding in `CHANGELOG.md` onder `## [Unreleased]`.

Reviews kunnen door iedereen met commit rights worden afgehandeld.
Minstens één review is vereist voor merge naar `main`.

## Licentie van bijdragen

Door een bijdrage te leveren ga je akkoord met publicatie onder de
[EUPL 1.2 licentie](LICENSE) van dit project.
