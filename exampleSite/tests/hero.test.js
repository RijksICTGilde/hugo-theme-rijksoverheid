/**
 * De herofoto is decoratie: onder 550px valt hij weg, en een beschrijving zou
 * daar ook wegvallen (WCAG 1.4.10). Een ingevulde hero.image_alt staat niet in
 * de voorbeeldsite; daarom bouwt deze test twee proefsites met het theme in
 * tmp/hero-*. Daar is hugo voor nodig.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { EXAMPLE_DIR, THEME_DIR } from "./lib/site.js";
import { elementen, klassen, tags } from "./lib/html.js";

const WAARSCHUWING = "hero.image_alt wordt niet meer gebruikt";

/** Bouwt een proefsite met een hero en deze image_alt; geeft de uitvoer van hugo en de homepage terug. */
function bouw(naam, imageAlt) {
  const map = join(EXAMPLE_DIR, "tmp", `hero-${naam}`);
  const site = join(map, "site");
  mkdirSync(join(site, "content"), { recursive: true });
  mkdirSync(join(site, "assets", "images"), { recursive: true });
  writeFileSync(join(site, "hugo.yaml"), "baseURL: https://proef.example/\ntitle: Proefsite\ndefaultContentLanguage: nl\ndisableKinds: [taxonomy, term]\n");
  writeFileSync(
    join(site, "content", "_index.md"),
    `---\nlayout: hero\ntitle: Proefsite\nhero:\n  image: images/hero.png\n  image_alt: ${JSON.stringify(imageAlt)}\n  title: Proefsite\n  text: Een hero op de homepage.\n---\n`,
  );
  copyFileSync(join(EXAMPLE_DIR, "assets", "images", "hero.png"), join(site, "assets", "images", "hero.png"));
  const hugo = spawnSync(
    "hugo",
    ["--cleanDestinationDir", "--source", site, "--themesDir", dirname(THEME_DIR), "--theme", basename(THEME_DIR), "--destination", join(map, "public")],
    { encoding: "utf8" },
  );
  assert.equal(hugo.status, 0, `de proefsite bouwt niet (is hugo geïnstalleerd?): ${hugo.error?.message ?? hugo.stderr}`);
  return { uitvoer: hugo.stdout + hugo.stderr, html: readFileSync(join(map, "public", "index.html"), "utf8") };
}

function heroAlt(html) {
  const hero = elementen(html, "div", (a) => klassen(a).includes("hero"))[0];
  assert.ok(hero, "geen .hero op de homepage");
  const img = tags(hero.binnen).find((t) => t.naam === "img");
  assert.ok(img, "geen img in de hero");
  return img.attrs.get("alt");
}

describe("herofoto (1.1.1, 1.4.10)", () => {
  test("met een ingevulde hero.image_alt waarschuwt de build en blijft de alt leeg", () => {
    const { uitvoer, html } = bouw("met-alt", "Een ondernemer kijkt op een tablet.");
    assert.ok(uitvoer.includes(WAARSCHUWING), `geen waarschuwing over hero.image_alt in de uitvoer van hugo:\n${uitvoer}`);
    assert.equal(heroAlt(html), "");
  });

  test("met een lege hero.image_alt waarschuwt de build niet", () => {
    const { uitvoer, html } = bouw("lege-alt", "");
    assert.ok(!uitvoer.includes(WAARSCHUWING), `onnodige waarschuwing:\n${uitvoer}`);
    assert.equal(heroAlt(html), "");
  });
});
