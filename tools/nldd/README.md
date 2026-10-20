# NLDD-generator

Genereert uit `@nldd/design-system` de kleuren (`assets/css/nldd-primitives.css`) en de iconen (`static/images/icons/*.svg`) van het theme. Wie een site bouwt heeft dit niet nodig: de gegenereerde bestanden staan in git. Node 20 of nieuwer.

## Nieuwe NLDD-versie verwerken

```sh
cd tools/nldd
npm install @nldd/design-system@<versie> --save-exact
node tokens.js
node iconen.js
node check.js
```

Commit `package.json`, `package-lock.json` en de gewijzigde bestanden samen. Daarna in `assets/css/tokens.css` en een proefsite kijken of de koppeling nog klopt, en `NOTICES.md` bijwerken met de nieuwe versie.

## Controle

`npm ci --prefix tools/nldd && node tools/nldd/check.js` genereert in een tijdelijke map en vergelijkt met de repo. Exit 1 bij een verschil. Dit draait in CI.

## Bestanden

- `tokens.js`: alle kleurschalen, referentiekleuren, functionele aliassen en typografie, plus `--theme-neutral-<stap>` (coolgray met meer verzadiging in dark).
- `iconen.js`: de iconen uit de tabel `ICONS`, met de klassen die CSS en JS verwachten. Een icoon dat NLDD hernoemt, geeft een foutmelding.
- `NLDD_DIR` wijst naar een andere uitgepakte pakketmap, bijvoorbeeld om een nieuwe versie te proberen zonder `npm install`.
