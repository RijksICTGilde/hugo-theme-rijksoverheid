---
name: release
description: Een nieuwe versie van het theme uitbrengen en daarna MOZa en het toetsingskader erop zetten. Gebruik bij "release", "versie bumpen", "nieuwe versie" of "vX.Y.Z uitbrengen".
---

# Een versie uitbrengen

De release loopt via een pull request: de workflow Prepare release maakt die,
en na de merge maken Tag release en Release de tag en de GitHub release.
`CONTRIBUTING.md` legt dat uit onder "Een release maken".

1. **Kies de versie** volgens SemVer. Zolang de major 0 is, geeft een breaking
   change een nieuwe minor (0.3.0 wordt 0.4.0) en de rest een patch. Breaking
   is alles waarvoor een site iets moet aanpassen: een andere naam, een ander
   contract van een hook of param, of een onderdeel dat verdwijnt.
2. **Loop `## [Unreleased]` in `CHANGELOG.md` na.** Staat elke wijziging erin,
   en staat wat een site moet doen onder "Breaking" en "Overstappen"? Met een
   lege sectie stopt de workflow.
3. **Start de workflow** en volg hem:

   ```sh
   gh workflow run prepare-release.yml --ref main -f version=X.Y.Z
   gh run watch
   ```

4. **Controleer de pull request `release: vX.Y.Z`**: de datum, de tekst uit de
   changelog, de versie in `README.md` en een groene CI. Merge alleen als de
   eigenaar dat zegt.
5. **Na de merge** zijn Tag release en Release groen
   (`gh run list --workflow tag-release.yml` en
   `gh run list --workflow release.yml`), en toont `gh release view vX.Y.Z` de
   tekst uit de changelog.
6. **Zet de sites erop**, elk in een eigen pull request in hun repository:

   ```sh
   hugo mod get github.com/RijksICTGilde/hugo-theme-rijksoverheid@vX.Y.Z
   hugo mod tidy
   ```

   Lees "Overstappen" van elke versie sinds de vorige, pas de site aan, bouw
   hem en draai zijn toetsen.

Direct na een push of een nieuwe tag kent sum.golang.org de versie soms nog
niet, en dan faalt `hugo mod get` bij "verifying module". Vroeg iemand de
versie op voordat hij bestond, dan kan dat volgens de FAQ van proxy.golang.org
tot 30 minuten duren. Wacht en probeer het opnieuw. Omzeil de
checksumdatabase niet met `GONOSUMDB` of `GOSUMDB=off`: dan komt er een hash
in `go.sum` die niemand heeft gecontroleerd.

Pusht Tag release geen tag, zet hem dan met de hand zoals "Een release maken"
in `CONTRIBUTING.md` beschrijft.
