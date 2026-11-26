# Plugin voor Claude Code

Voor wie een site op dit theme onderhoudt, zoals MOZa of het toetsingskader
Archiefwet. De plugin geeft een agent in de site twee skills:

* `naslag` zoekt hooks, params, front matter en shortcodes op in de versie
  van het theme die de site gebruikt, en zegt wat in de site hoort en wat in
  het theme.
* `bijwerken` zet de site op een nieuwe versie van het theme, of test samen
  met de site een wijziging aan het theme die nog niet is uitgebracht.

## Aanzetten in een site

Zet in `.claude/settings.json` van de site:

```json
{
  "extraKnownMarketplaces": {
    "hugo-theme-rijksoverheid": {
      "source": {
        "source": "github",
        "repo": "RijksICTGilde/hugo-theme-rijksoverheid",
        "ref": "v0.3.0"
      }
    }
  },
  "enabledPlugins": {
    "hugo-theme-rijksoverheid@hugo-theme-rijksoverheid": true
  }
}
```

Vertrouw je de map van de site in Claude Code, dan voegt Claude Code de
marketplace toe. Installeer de plugin daarna één keer, vanuit de site:

```sh
claude plugin install hugo-theme-rijksoverheid@hugo-theme-rijksoverheid --scope project
```

## De plugin bijwerken

`ref` zet de plugin vast op een tag van het theme, zodat de skills bij de
versie van het theme in `go.mod` horen. Zet hem op dezelfde versie, en hoog hem
op in dezelfde pull request als het theme; de skill `bijwerken` doet dat mee.
Verandert `ref`, dan haalt Claude Code de plugin opnieuw op; de nieuwe tekst
van de skills geldt na `/reload-plugins` of bij de volgende start.
