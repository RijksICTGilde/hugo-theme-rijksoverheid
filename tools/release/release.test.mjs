import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareChangelog, preparePluginReadme, prepareReadme, today } from "./release.mjs";

const URL = "https://github.com/RijksICTGilde/hugo-theme-rijksoverheid/releases/tag";
const HEAD = "# Changelog\n\nIntro.\n\n";

const metDatum = `${HEAD}## [Unreleased]

### Toegevoegd

* Nieuw ding.

### Gewijzigd

* Aangepast ding.

## [0.2.3] - 2026-10-06

### Gewijzigd

* Oud.

## [0.2.2] - 2026-10-05

* Ouder.

[0.2.3]: ${URL}/v0.2.3
[0.2.2]: ${URL}/v0.2.2
`;

const zonderDatum = metDatum
  .replace("## [0.2.3] - 2026-10-06", "## [0.2.3]")
  .replace("## [0.2.2] - 2026-10-05", "## [0.2.2]");

for (const [naam, bron] of [
  ["met datums", metDatum],
  ["zonder datums", zonderDatum],
]) {
  test(`verplaatst Unreleased onder de nieuwe versie (${naam})`, () => {
    const uit = prepareChangelog(bron, "0.3.0", "2026-11-21");
    assert.match(
      uit,
      /## \[Unreleased\]\n\n## \[0\.3\.0\] - 2026-11-21\n\n### Toegevoegd\n\n\* Nieuw ding\.\n\n### Gewijzigd\n\n\* Aangepast ding\.\n\n## \[0\.2\.3\]/,
    );
    // Oudere koppen blijven ongemoeid.
    assert.equal(uit.includes("## [0.2.3] - 2026-10-06"), bron.includes("## [0.2.3] - 2026-10-06"));
    // Nieuwste verwijzing bovenaan de lijst.
    assert.match(uit, new RegExp(`\\n\\[0\\.3\\.0\\]: ${URL}/v0\\.3\\.0\\n\\[0\\.2\\.3\\]: `));
    assert.equal((uit.match(/^## \[Unreleased\]/gm) ?? []).length, 1);
  });
}

test("Unreleased als laatste sectie voor de verwijzingen", () => {
  const bron = `${HEAD}## [Unreleased]\n\n* Iets.\n\n[0.1.0]: ${URL}/v0.1.0\n`;
  const uit = prepareChangelog(bron, "0.1.1", "2026-11-21");
  assert.equal(
    uit,
    `${HEAD}## [Unreleased]\n\n## [0.1.1] - 2026-11-21\n\n* Iets.\n\n[0.1.1]: ${URL}/v0.1.1\n[0.1.0]: ${URL}/v0.1.0\n`,
  );
});

test("zonder bestaande verwijzingen komt de verwijzing onderaan", () => {
  const uit = prepareChangelog(`${HEAD}## [Unreleased]\n\n* Iets.\n`, "1.0.0", "2026-11-21");
  assert.ok(uit.endsWith(`\n\n[1.0.0]: ${URL}/v1.0.0\n`));
});

test("weigert ongeldige SemVer", () => {
  for (const v of ["1.0", "v1.0.0", "01.0.0", "1.0.0-rc1", "1.0.0+x", "", "a.b.c", "1.2.3.4"]) {
    assert.throws(() => prepareChangelog(metDatum, v, "2026-11-21"), /Ongeldige versie/, v);
  }
});

test("weigert een bestaande versie", () => {
  assert.throws(() => prepareChangelog(metDatum, "0.2.3", "2026-11-21"), /staat al/);
  assert.throws(() => prepareChangelog(zonderDatum, "0.2.2", "2026-11-21"), /staat al/);
});

test("weigert een lege Unreleased-sectie", () => {
  const leeg = `${HEAD}## [Unreleased]\n\n## [0.2.3]\n\n* Oud.\n\n[0.2.3]: ${URL}/v0.2.3\n`;
  assert.throws(() => prepareChangelog(leeg, "0.3.0", "2026-11-21"), /leeg/);
  const alleenKoppen = leeg.replace("## [Unreleased]\n", "## [Unreleased]\n\n### Toegevoegd\n");
  assert.throws(() => prepareChangelog(alleenKoppen, "0.3.0", "2026-11-21"), /leeg/);
});

test("weigert een changelog zonder Unreleased", () => {
  assert.throws(() => prepareChangelog(`${HEAD}## [0.1.0]\n`, "0.2.0", "2026-11-21"), /Unreleased/);
});

test("README: elke vermelding krijgt de nieuwe versie", () => {
  const bron = "a hugo-theme-rijksoverheid@v0.1.0 b\nhugo-theme-rijksoverheid@v0.3.0\nrijksoverheid@v9.9.9 niet\n";
  const { text, count } = prepareReadme(bron, "0.4.0");
  assert.equal(count, 2);
  assert.equal(
    text,
    "a hugo-theme-rijksoverheid@v0.4.0 b\nhugo-theme-rijksoverheid@v0.4.0\nrijksoverheid@v9.9.9 niet\n",
  );
});

test("plugin: de ref krijgt de nieuwe versie, de rest blijft", () => {
  const bron = '"repo": "x",\n      "ref": "v0.3.0"\n"ref":"v1.2.3"\n"version": "v0.1.0"\n';
  const { text, count } = preparePluginReadme(bron, "0.4.0");
  assert.equal(count, 2);
  assert.equal(text, '"repo": "x",\n      "ref": "v0.4.0"\n"ref":"v0.4.0"\n"version": "v0.1.0"\n');
});

test("today geeft de Amsterdamse datum", () => {
  // 23:30 UTC op 30 juni is al 1 juli in Amsterdam (zomertijd).
  assert.equal(today(new Date("2026-06-30T23:30:00Z")), "2026-07-01");
  assert.equal(today(new Date("2026-01-15T12:00:00Z")), "2026-01-15");
});

test("CLI schrijft beide bestanden en weigert fouten met exit 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "release-test-"));
  writeFileSync(join(dir, "CHANGELOG.md"), metDatum);
  writeFileSync(join(dir, "README.md"), "hugo mod get x/hugo-theme-rijksoverheid@v0.1.0\n");
  mkdirSync(join(dir, "plugins", "hugo-theme-rijksoverheid"), { recursive: true });
  writeFileSync(join(dir, "plugins", "hugo-theme-rijksoverheid", "README.md"), '"ref": "v0.1.0"\n');
  const script = new globalThis.URL("./release.mjs", import.meta.url).pathname;
  execFileSync("node", [script, "0.3.0", "--dir", dir]);
  assert.match(readFileSync(join(dir, "CHANGELOG.md"), "utf8"), /## \[0\.3\.0\] - \d{4}-\d{2}-\d{2}/);
  assert.match(readFileSync(join(dir, "README.md"), "utf8"), /@v0\.3\.0/);
  assert.equal(readFileSync(join(dir, "plugins", "hugo-theme-rijksoverheid", "README.md"), "utf8"), '"ref": "v0.3.0"\n');
  const again = spawnSync("node", [script, "0.3.0", "--dir", dir], { encoding: "utf8" });
  assert.equal(again.status, 1);
  assert.match(again.stderr, /staat al|leeg/);
});
