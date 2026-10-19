---
title: Een lange pagina met alle onderdelen van een tekst
description: Deze pagina laat koppen, lijsten, tabellen, code, infoblokken, citaten, afbeeldingen en bronnen zien.
card_title: Lange pagina
card_description: Alle onderdelen van een tekstpagina op één plek.
weight: 1
date: 2026-10-01
lastmod: 2026-10-15
show_date: true
show_lastmod: true
status: Voorbeeld
lead_image: leadbeeld.png
lead_image_alt: Een vlak dat van lichtblauw langzaam overgaat in wit.
lead_image_caption: Een verloop van lichtblauw naar wit. De afbeelding is alleen een voorbeeld.
relevante_links:
  - titel: Het nieuws van de voorbeelddienst
    pagina: /nieuws
  - titel: Rijksoverheid.nl
    url: https://www.rijksoverheid.nl/
  - titel: Samenwerkruimte voor medewerkers
    url: https://samenwerkruimten.nl/voorbeeld
show_referenties: true
referenties:
  - tekst: Digitale Overheid, Richtlijnen voor toegankelijkheid
    url: https://www.digitoegankelijk.nl/
  - tekst: Forum Standaardisatie, pas toe of leg uit
    url: https://www.forumstandaardisatie.nl/
  - tekst: Een bron zonder link, alleen met tekst
---

Dit is de inleiding van een lange pagina. Hier staat veel op één plek, zodat we alle onderdelen van een tekst kunnen testen.[^1] De pagina heeft een inhoudsopgave, voetnoten en een lijst met bronnen. Een bron kan ook midden in de tekst staan, bijvoorbeeld bij het woord {{< bron woord="toegankelijkheidsonderzoek" nummer="1" >}} of bij {{< bron woord="standaarden" nummer="2" >}}.

Sommige woorden komen uit het Engels. Een goed voorbeeld is <span lang="en">accessibility statement</span>, wat in het Nederlands een toegankelijkheidsverklaring heet. Ook de afkorting <abbr title="Web Content Accessibility Guidelines" lang="en">WCAG</abbr> is Engels. Een schermlezer leest zulke woorden met een Nederlandse stem voor, tenzij we de taal aangeven.

Tot slot een paar tekens: een vinkje ✅ en een raket 🚀 staan gewoon in de tekst. Een schermlezer leest ze voor met hun eigen naam. De emoji {{< emoji teken="🚫" aria-label="Kan beter" >}} heeft een eigen tekst voor schermlezers, en {{< emoji teken="💡" aria-hidden=true >}} wordt niet voorgelezen.

## Tekst en lijsten

Een alinea bestaat uit zinnen die bij elkaar horen. Houd zinnen kort en gebruik woorden die iedereen kent. Zo begrijpt de lezer je tekst in één keer.

### Opsommingen

Dit is een lijst zonder volgorde:

- Een korte zin staat voorop.
- Een lijst heeft meer dan één punt.
- Een lijst kan een lijst in een lijst hebben:
  - een punt op het tweede niveau;
  - nog een punt op het tweede niveau.

Dit is een lijst met volgorde:

1. Open de pagina.
2. Lees de tekst.
3. Kijk of je alles begrijpt.

### Opmaak in de tekst

Je kunt woorden **vet** of *schuin* maken. Een toets staat tussen <kbd>Ctrl</kbd> en <kbd>K</kbd>. Een stukje code staat in `deze opmaak`. Een lang stuk code zonder spaties, zoals `een_zeer_lange_naam_van_een_instelling_die_niet_afbreekt_op_een_smal_scherm`, mag de pagina niet breder maken.

#### Een kop van niveau vier

Deze kop staat in de inhoudsopgave, omdat de inhoudsopgave tot en met niveau vier gaat. Een kop van niveau vijf staat er niet in.

##### Een kop van niveau vijf

Deze kop staat niet in de inhoudsopgave.

## Tabellen

### Een brede tabel

Een brede tabel past niet op een smal scherm. De tabel schuift dan binnen een eigen vlak. Dat vlak is met het toetsenbord te bereiken.

| Dienst | Onderdeel | Eigenaar | Status | Laatste controle | Volgende controle | Aantal gebruikers | Opmerking |
|--------|-----------|----------|--------|------------------|-------------------|------------------:|-----------|
| Aanvragen | Webformulier | Team Aanvragen | Live | 1 september 2026 | 1 december 2026 | 12.400 | Werkt ook zonder JavaScript. |
| Berichten | Berichtenbox | Team Berichten | Live | 15 september 2026 | 15 december 2026 | 8.150 | Berichten blijven drie jaar bewaard. |
| Betalen | Betaalpagina | Team Betalen | In test | 30 september 2026 | 30 oktober 2026 | 310 | Nog niet voor iedereen open. |
| Zoeken | Zoekfunctie | Team Zoeken | Live | 2 oktober 2026 | 2 januari 2027 | 21.900 | Zoekt in alle pagina's van de site. |

### Een tabel zonder kopregel

Soms heeft een tabel geen kopregel. De eerste kolom is dan de kop van elke rij. Zo weet een schermlezer bij elk gegeven waar het bij hoort.

{{< table-without-header label="Contactgegevens van de voorbeelddienst" >}}
| Telefoon | 0800 - 000 00 00 (gratis) |
| Openingstijden | Maandag tot en met vrijdag, van 8.00 tot 17.00 uur |
| Postadres | Postbus 1, 1000 AA Voorbeeldstad |
{{< /table-without-header >}}

## Code in meerdere talen

### YAML

```yaml
params:
  links:
    nieuw_venster: false
  infoblok:
    kopniveau: 3
```

### Go

```go
package main

import "fmt"

func main() {
    fmt.Println("Hallo wereld")
}
```

### Shell

```bash
hugo --source exampleSite --minify --panicOnWarning
```

### JavaScript

```js
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") sluitMenu();
});
```

### HTML

```html
<nav aria-label="Hoofdnavigatie">
  <ul>
    <li><a href="/" aria-current="page">Home</a></li>
  </ul>
</nav>
```

### Een zeer lange regel

```text
Deze regel is veel te lang voor een smal scherm, en daarom moet het codeblok in een eigen vlak schuiven in plaats van de hele pagina breder te maken: 0123456789 0123456789 0123456789 0123456789.
```

## Infoblokken zonder titel

> [!INFO]
> Een infoblok met de soort info, zonder titel.

> [!NOTE]
> Een infoblok met de soort notitie, zonder titel.

> [!TIP]
> Een infoblok met de soort tip, zonder titel.

> [!IMPORTANT]
> Een infoblok met de soort belangrijk, zonder titel.

> [!WARNING]
> Een infoblok met de soort waarschuwing, zonder titel.

> [!CAUTION]
> Een infoblok met de soort gevaar, zonder titel.

## Infoblokken met titel

> [!INFO] Een infoblok met titel
> Een infoblok met de soort info en een titel. De titel is een echte kop.

> [!NOTE] Een notitie met titel
> Een infoblok met de soort notitie en een titel.

> [!TIP] Een tip met titel
> Een infoblok met de soort tip en een titel.

> [!IMPORTANT] Een belangrijk bericht met titel
> Een infoblok met de soort belangrijk en een titel.

> [!WARNING] Een waarschuwing met titel
> Een infoblok met de soort waarschuwing en een titel.

> [!CAUTION] Een gevaar met titel
> Een infoblok met de soort gevaar en een titel.

## Infoblokken met de shortcode callout

{{< callout >}}
Een callout zonder titel en zonder variant.
{{< /callout >}}

{{< callout titel="Een callout met titel" >}}
Een callout met een titel en zonder variant.
{{< /callout >}}

{{< callout titel="Een gedempte callout" variant="muted" >}}
Een callout met de variant gedempt.
{{< /callout >}}

{{< callout titel="Gelukt" variant="success" >}}
Een callout met de variant gelukt.
{{< /callout >}}

{{< callout titel="Let op" variant="warning" corner="bottom-right" >}}
Een callout met de variant waarschuwing en een hoek rechtsonder.
{{< /callout >}}

{{< callout titel="Gevaar" variant="danger" corner="upper-left" >}}
Een callout met de variant gevaar en een hoek linksboven.
{{< /callout >}}

### Een infoblok met een eigen kopniveau

{{< callout titel="Een titel op niveau vier" kopniveau="4" >}}
Deze callout zet zijn titel als kop van niveau vier, omdat de kop erboven van niveau drie is.
{{< /callout >}}

## Uitklapblokken

Een uitklapblok verbergt tekst tot je erop klikt. Gebruik het weinig: tekst die verborgen is, lezen mensen minder snel.

{{< details summary="Wat gebeurt er met één melding?" >}}
Een melding komt binnen bij het team. Binnen vijf werkdagen krijg je antwoord.
{{< /details >}}

## Citaten

Een gewoon citaat in de tekst:

> Een goede tekst is een tekst die je in één keer begrijpt.

Een groot, uitgelicht citaat:

{{< quote source="Voorbeeldpersoon, directeur van de voorbeelddienst" >}}
Wie duidelijk schrijft, krijgt minder vragen.
{{< /quote >}}

## Afbeeldingen

{{< figure src="/images/figuur-golven.png" alt="Een vlak dat van lichtblauw langzaam overgaat in wit." caption="Een afbeelding met een onderschrift. De afbeelding is alleen een voorbeeld." width="800" height="400" loading="lazy" >}}

## Links

Een link naar [een andere pagina van deze site](/onderdelen/links), een link naar [een externe site](https://www.rijksoverheid.nl/) en een link naar [een besloten omgeving](https://samenwerkruimten.nl/voorbeeld). Meer voorbeelden staan op de pagina over [links](/onderdelen/links).

## Hoe voetnoten werken

De voetnoten staan onder de pagina. Een voetnoot heeft een nummer in de tekst, en een link om terug te gaan naar die plek.[^2]

[^1]: Dit is de eerste voetnoot. Een voetnoot geeft extra uitleg zonder de tekst te onderbreken.
[^2]: Dit is de tweede voetnoot, met een [link naar een andere pagina](/nieuws).
