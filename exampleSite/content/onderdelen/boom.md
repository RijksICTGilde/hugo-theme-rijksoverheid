---
title: Een boomschema als geneste lijst
description: Een boomschema dat een schermlezer als geneste lijst voorleest, met de verbindingslijnen in CSS.
card_title: Boomschema
card_description: Een indeling in niveaus, getekend met lijnen en voorgelezen als lijst.
weight: 7
---

Een boomschema laat zien wat bij wat hoort. De lijnen zijn alleen opmaak. Een schermlezer hoort een lijst met niveaus, geen lijntekens.

## Soorten berichten

{{< boom bijschrift="De soorten berichten, per familie onder *bericht*." >}}
- **Bericht**
  - **Notificatie**: wijst op iets
    - [Ontvangstbevestiging](#soorten-berichten)
    - Attendering
    - Arbeidsongeschiktheidsverzekeringsmaatschappijen
  - **Inhoudelijk bericht**: is het iets zelf
    - Besluit, bijvoorbeeld een beschikking
    - Volledige publicatie in het publicatieblad
{{< /boom >}}

## Zonder bijschrift

{{< boom >}}
- Gemeente
  - Afdeling
    - Team
{{< /boom >}}
