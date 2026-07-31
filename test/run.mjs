#!/usr/bin/env node
// Runs the maintained unit suite with Node's built-in test runner.
//
// Usage:  node test/run.mjs
//
// The suite needs no third-party runner. It uses:
//   --experimental-transform-types   full TS support (parameter properties in
//                                     lib/store.ts aren't handled by strip-only
//                                     type removal)
//   --import ./test/loader-register   registers a resolver hook so Node can load
//                                     the app's source the way the bundler does
//                                     (extensionless imports, the @/* alias, and
//                                     a next/headers stub for server modules)
//
// Files are listed explicitly rather than globbed so unrelated/legacy test
// files dropped into test/ can never break the run.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "..");

const SUITE = [
  "test/unit/wav.test.ts",
  "test/unit/credits.test.ts",
  "test/unit/options.test.ts",
  "test/unit/script-edit.test.ts",
  "test/unit/billing.test.ts",
  "test/unit/auth.test.ts",
  "test/unit/script.test.ts",
  "test/unit/tts.test.ts",
  "test/unit/extract.test.ts",
  "test/unit/store.test.ts",
];

const args = [
  "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
  "--disable-warning=ExperimentalWarning",
  "--experimental-transform-types",
  "--import",
  "./test/loader-register.mjs",
  "--test",
  ...SUITE,
];

const result = spawnSync(process.execPath, args, {
  cwd: projectRoot,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
