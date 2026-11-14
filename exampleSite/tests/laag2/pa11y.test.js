/**
 * Toets de gebouwde site op WCAG 2.1 AA met pa11y-ci (HTML_CodeSniffer en axe), op alle routes, in licht
 * en donker thema. Naar het voorbeeld van moza-site (scripts/a11y/run.js).
 *
 * Een geautomatiseerde toets dekt ongeveer een derde van de WCAG-eisen. Deze
 * gate bewaakt regressies; hij vervangt geen WCAG-EM-onderzoek.
 *
 * pa11y kent alleen WCAG2A, WCAG2AA en WCAG2AAA, en dat is WCAG 2.1: zowel
 * HTML_CodeSniffer als de axe-tags van pa11y stoppen bij 2.1. De regels van
 * WCAG 2.2 AA (doelgebied van 24 bij 24 pixels) draaien daarom apart in
 * wcag22.test.js.
 *
 * Elke pass is een eigen pa11y-ci-run (een eigen browser). De donkere passes
 * zetten het schema op twee manieren: via de browserinstelling
 * prefers-color-scheme en via data-scheme op <html> (de server voegt dat toe
 * bij ?scheme=dark).
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { PUPPETEER_ARGS, DONKER_ARGS } from "./lib/puppeteer-args.js";
import { startServer } from "./lib/server.js";
import { builds, collectRoutes, EXAMPLE_DIR } from "../lib/site.js";

const SITE = builds()[0];
const PA11Y_CI = join(EXAMPLE_DIR, "node_modules", "pa11y-ci", "bin", "pa11y-ci.js");
const CONFIG_DIR = join(EXAMPLE_DIR, "tmp");

const GEDEELD = {
  timeout: 60000,
  concurrency: 4,
  // Een eigen browsercontext per pagina faalt op puppeteer 25 met
  // "Target.closeTarget: No target with given id found".
  useIncognitoBrowserContext: false,
  // Bevindingen die axe niet zeker weet ("incomplete") mogen de build niet
  // laten falen; ze horen thuis in de handmatige toets.
  levelCapWhenNeedsReview: "warning",
};

const PASSES = [
  {
    naam: "licht (WCAG 2.1 AA, htmlcs en axe)",
    vraag: "",
    args: PUPPETEER_ARGS,
    defaults: { standard: "WCAG2AA", runners: ["htmlcs", "axe"] },
  },
  {
    naam: "donker via prefers-color-scheme (WCAG 2.1 AA, htmlcs en axe)",
    vraag: "",
    args: DONKER_ARGS,
    defaults: { standard: "WCAG2AA", runners: ["htmlcs", "axe"] },
  },
  {
    naam: "donker via data-scheme (WCAG 2.1 AA, htmlcs en axe)",
    vraag: "?scheme=dark",
    args: PUPPETEER_ARGS,
    defaults: { standard: "WCAG2AA", runners: ["htmlcs", "axe"] },
  },
  {
    naam: "licht via data-scheme (WCAG 2.1 AA, donkere browserinstelling)",
    vraag: "?scheme=light",
    args: DONKER_ARGS,
    defaults: { standard: "WCAG2AA", runners: ["htmlcs", "axe"] },
  },
];

let server;
let baseUrl;
const routes = existsSync(SITE.dir) ? collectRoutes(SITE.dir) : [];

before(async () => {
  assert.ok(existsSync(SITE.dir), `${SITE.dir} bestaat niet; draai eerst npm run build`);
  assert.ok(existsSync(PA11Y_CI), "pa11y-ci is niet geïnstalleerd; draai npm ci in exampleSite");
  assert.ok(routes.length > 0, `geen routes in ${SITE.dir}`);
  server = await startServer(SITE.dir);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  // Zonder deze controle loopt een stille serverfout uit op tientallen timeouts.
  const probe = await fetch(`${baseUrl}${routes[0]}`).catch(() => null);
  assert.ok(probe?.ok, `webserver op ${baseUrl} antwoordt niet`);
  mkdirSync(CONFIG_DIR, { recursive: true });
});

after(() => server?.close());

/** Draait pa11y-ci met een config en geeft { code, uitvoer }. Niet spawnSync: de server draait in dit proces. */
function draaiPa11yCi(configPad) {
  return new Promise((resolve) => {
    const kind = spawn(process.execPath, [PA11Y_CI, "--config", configPad], { stdio: ["ignore", "pipe", "pipe"] });
    let uitvoer = "";
    kind.stdout.on("data", (d) => (uitvoer += d));
    kind.stderr.on("data", (d) => (uitvoer += d));
    kind.on("close", (code) => resolve({ code: code ?? 1, uitvoer }));
  });
}

describe(`pa11y-ci op ${routes.length} pagina's`, () => {
  PASSES.forEach((pass, i) => {
    test(pass.naam, { timeout: 600000 }, async () => {
      const config = {
        defaults: { ...GEDEELD, ...pass.defaults, chromeLaunchConfig: { args: pass.args } },
        urls: routes.map((route) => `${baseUrl}${route}${pass.vraag}`),
      };
      const configPad = join(CONFIG_DIR, `pa11yci-${i + 1}.json`);
      writeFileSync(configPad, JSON.stringify(config, null, 2));
      const { code, uitvoer } = await draaiPa11yCi(configPad);
      assert.equal(code, 0, `pa11y-ci eindigde met code ${code}\n${uitvoer}`);
    });
  });
});
