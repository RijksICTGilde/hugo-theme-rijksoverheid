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
        "repo": "RijksICTGilde/hugo-theme-rijksoverheid"
      },
      "autoUpdate": true
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

De plugin heeft geen versienummer: Claude Code volgt de commits op `main`.
Door `autoUpdate` hierboven haalt Claude Code nieuwe tekst van de skills
vanzelf op tijdens een sessie; die geldt na `/reload-plugins` of bij de
volgende start. Zonder `autoUpdate` doe je het met
`claude plugin update hugo-theme-rijksoverheid@hugo-theme-rijksoverheid`.
