#!/usr/bin/env node

/**
 * Bereidt een release voor: verplaatst de inhoud van `## [Unreleased]` in
 * CHANGELOG.md naar een nieuwe sectie `## [X.Y.Z] - <datum>`, voegt de
 * linkverwijzing toe en zet de versie in de installatie-instructies van
 * README.md en in de `ref` van de plugin (plugins/hugo-theme-rijksoverheid/README.md).
 *
 * Gebruik: node tools/release/release.mjs X.Y.Z [--dir <map met CHANGELOG.md en README.md>]
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_URL = "https://github.com/RijksICTGilde/hugo-theme-rijksoverheid";
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const REF_LINE = /^\[[^\]]+\]: /;

// Datum van vandaag in Europe/Amsterdam als YYYY-MM-DD (en-CA geeft die vorm).
export function today(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function prepareChangelog(changelog, version, date) {
  if (!SEMVER.test(version)) {
    throw new Error(`Ongeldige versie '${version}': verwacht X.Y.Z (SemVer, zonder 'v').`);
  }
  const escaped = version.replaceAll(".", "\\.");
  if (
    new RegExp(`^## \\[${escaped}\\]`, "m").test(changelog) ||
    new RegExp(`^\\[${escaped}\\]: `, "m").test(changelog)
  ) {
    throw new Error(`Versie ${version} staat al in CHANGELOG.md.`);
  }

  const lines = changelog.split("\n");
  const start = lines.findIndex((l) => /^## \[Unreleased\]\s*$/.test(l));
  if (start === -1) throw new Error("Geen '## [Unreleased]' gevonden in CHANGELOG.md.");

  // De sectie loopt tot de volgende release-kop of de linkverwijzingen onderaan.
  let end = lines.findIndex((l, i) => i > start && (/^## \[/.test(l) || REF_LINE.test(l)));
  if (end === -1) end = lines.length;

  const body = lines.slice(start + 1, end);
  // Lege '### ' koppen tellen niet als inhoud.
  const hasContent = body.some((l) => l.trim() !== "" && !/^###\s/.test(l));
  if (!hasContent) throw new Error("De sectie '## [Unreleased]' is leeg: er valt niets uit te brengen.");

  while (body.length && body[0].trim() === "") body.shift();
  while (body.length && body[body.length - 1].trim() === "") body.pop();

  const rest = lines.slice(end);
  const ref = `[${version}]: ${REPO_URL}/releases/tag/v${version}`;
  const refAt = rest.findIndex((l) => REF_LINE.test(l));
  if (refAt === -1) {
    while (rest.length && rest[rest.length - 1].trim() === "") rest.pop();
    rest.push("", ref, "");
  } else {
    rest.splice(refAt, 0, ref);
  }

  return [
    ...lines.slice(0, start + 1),
    "",
    `## [${version}] - ${date}`,
    "",
    ...body,
    "",
    ...rest,
  ].join("\n");
}

export function prepareReadme(readme, version) {
  const pattern = /hugo-theme-rijksoverheid@v\d+\.\d+\.\d+/g;
  const count = (readme.match(pattern) ?? []).length;
  return { text: readme.replace(pattern, `hugo-theme-rijksoverheid@v${version}`), count };
}

const PLUGIN_README = join("plugins", "hugo-theme-rijksoverheid", "README.md");

export function preparePluginReadme(readme, version) {
  const pattern = /("ref":\s*")v\d+\.\d+\.\d+(")/g;
  const count = (readme.match(pattern) ?? []).length;
  return { text: readme.replace(pattern, `$1v${version}$2`), count };
}

function main(argv) {
  const args = argv.slice(2);
  const dirAt = args.indexOf("--dir");
  let dir = process.cwd();
  if (dirAt !== -1) {
    dir = resolve(args[dirAt + 1] ?? "");
    args.splice(dirAt, 2);
  }
  const version = args[0];
  if (!version || args.length !== 1) {
    console.error("Gebruik: node tools/release/release.mjs X.Y.Z [--dir <map>]");
    process.exit(2);
  }

  try {
    const changelogPath = join(dir, "CHANGELOG.md");
    const readmePath = join(dir, "README.md");
    const changelog = prepareChangelog(readFileSync(changelogPath, "utf8"), version, today());
    const readme = prepareReadme(readFileSync(readmePath, "utf8"), version);
    if (readme.count === 0) {
      console.error("Waarschuwing: geen 'hugo-theme-rijksoverheid@vX.Y.Z' gevonden in README.md.");
    }
    const pluginPath = join(dir, PLUGIN_README);
    const plugin = existsSync(pluginPath) ? preparePluginReadme(readFileSync(pluginPath, "utf8"), version) : null;
    if (plugin && plugin.count === 0) {
      console.error(`Waarschuwing: geen '"ref": "vX.Y.Z"' gevonden in ${PLUGIN_README}.`);
    }
    writeFileSync(changelogPath, changelog);
    writeFileSync(readmePath, readme.text);
    if (plugin) writeFileSync(pluginPath, plugin.text);
    console.log(`Release ${version} voorbereid (${today()}).`);
  } catch (err) {
    console.error(`Fout: ${err.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv);
