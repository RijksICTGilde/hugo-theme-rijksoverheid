---
title: Proef voor de Markdown-uitvoer
description: Testinhoud voor tests/markdown.test.js. De pagina heeft alleen een Markdown-versie en staat niet in lijsten, menu's of de zoekindex.
outputs:
  - markdown
build:
  list: never
---

Een woord met een bron{ref:1} en een tweede bron {ref:2} midden in de zin.

## Een kop met een eigen id {#eigen-id}

## Een kop met een klasse en een label {.klasse aria-label="Een label"}

Een alinea met een klasse op de regel eronder.
{.uitgelicht}

> [!tip]+ Een tip in kleine letters
> Het type is niet hoofdlettergevoelig, en het plusteken valt weg.

> Een gewoon citaat.
> [!NOTE] Dit is geen alert, want het staat niet op de eerste regel.

```markdown
> [!WARNING] Een alert in een codeblok blijft staan
Een woord{ref:1} in een codeblok.
{.klasse}
## Een kop in een codeblok {#id}
```

````text
```
Een codeblok in een codeblok, met {ref:3} en {#id}.
```
> [!CAUTION] Ook dit blijft staan.
````

~~~
> [!TIP] Een codeblok met tildes.
{aria-label="blijft staan"}
~~~
