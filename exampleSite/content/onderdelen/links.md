---
title: Links naar andere sites en besloten omgevingen
description: Zo ziet een link eruit naar een andere site, naar een besloten omgeving en naar een pagina op deze site.
card_title: Links
card_description: Interne, externe en besloten links, en het effect van de instelling voor een nieuw venster.
weight: 3
---

Een link zegt waar hij heen gaat. Als een link naar een andere site of naar een besloten omgeving gaat, hoort een schermlezer dat ook.

## Links naar andere pagina's

- Een link naar [de lange pagina](/onderdelen/lange-pagina).
- Een link naar [een kop op een andere pagina](/onderdelen/lange-pagina#tabellen).
- Een link naar [een stukje verderop op deze pagina](#besloten-omgevingen).
- Een link naar [een e-mailadres](mailto:voorbeeld@example.org).

## Links naar andere sites

- Een link naar [Rijksoverheid.nl](https://www.rijksoverheid.nl/).
- Een link naar [Digitoegankelijk](https://www.digitoegankelijk.nl/ "Informatie over toegankelijkheid"), met een titel.
- Een link naar een [pagina met een zeer lang adres](https://www.example.org/een/zeer/lang/adres/met/veel/onderdelen/die/samen/niet/op/een/smal/scherm/passen/en/daarom/moeten/afbreken).

## Besloten omgevingen

Sommige sites zijn alleen open voor medewerkers die zijn ingelogd. Zo'n link krijgt een slotje en een verborgen melding.

- Een link naar [een besloten omgeving](https://www.example.org/intern "private").
- Een link naar [nog een besloten omgeving](https://www.example.org/intern-twee "besloten").
- Een link naar [de samenwerkruimte](https://samenwerkruimten.nl/voorbeeld). Dit adres herkent het theme zelf als besloten.
- Een link naar [de chat van Digilab](https://digilab.overheid.nl/chat/voorbeeld). Ook dit adres herkent het theme zelf.

## Een nieuw venster

Standaard openen links naar andere sites in hetzelfde venster. Met de instelling `params.links.nieuw_venster` openen ze in een nieuw venster. Zo'n link krijgt dan een verborgen melding en een icoon.

Deze site bouwen we twee keer: een keer met de instelling uit en een keer aan. Bouw de tweede versie met `hugo --environment nieuw-venster`. Op die versie openen de links op deze pagina in een nieuw venster.
