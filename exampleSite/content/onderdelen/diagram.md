---
title: Een diagram met tekst als alternatief
description: Een Mermaid-diagram dat vooraf is omgezet naar een afbeelding, met een korte en een lange beschrijving.
card_title: Diagram
card_description: Een stroomschema met een tekstuele beschrijving voor mensen die het niet kunnen zien.
weight: 2
---

Een diagram is een plaatje. Mensen die het plaatje niet kunnen zien, lezen daarom een beschrijving. De korte titel staat bij de afbeelding. De lange beschrijving staat als verborgen tekst onder het diagram.

## Van aanvraag naar besluit

```mermaid
flowchart LR
  accTitle: Van aanvraag naar besluit
  accDescr: Een aanvraag gaat eerst naar de controle. Als de aanvraag compleet is, volgt het besluit. Als er iets mist, vraagt de dienst om extra gegevens.
  A[Aanvraag] --> B{Compleet?}
  B -->|Ja| C[Besluit]
  B -->|Nee| D[Extra gegevens vragen]
  D --> B
```

## Hetzelfde diagram, een tweede keer

Een tweede diagram met dezelfde titel krijgt een eigen bestand. De theme-hook telt dan door.

```mermaid
flowchart LR
  accTitle: Van aanvraag naar besluit
  accDescr: Dit is dezelfde tekening als hierboven, om te zien dat twee diagrammen met dezelfde titel elkaar niet overschrijven.
  A[Aanvraag] --> B{Compleet?}
  B -->|Ja| C[Besluit]
  B -->|Nee| D[Extra gegevens vragen]
  D --> B
```
