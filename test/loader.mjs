// ESM resolution hook that lets Node's native loader import the app's source
// the same way the Next.js/TypeScript bundler does: it fills in extensionless
// relative specifiers (e.g. `./supabase/admin` -> `./supabase/admin.ts`) and
// resolves the `@/*` path alias from tsconfig to the project root.
//
// This exists purely so the test runner can load unmodified source files; the
// app itself never uses this loader.

import { access } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const PROJECT_ROOT = resolvePath(fileURLToPath(import.meta.url), "..", "..");
const CANDIDATE_EXTS = [".ts", ".tsx", ".mts", ".js", ".mjs"];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveWithExtensions(basePath) {
  if (await exists(basePath)) return basePath;
  for (const ext of CANDIDATE_EXTS) {
    if (await exists(basePath + ext)) return basePath + ext;
  }
  // Fall back to a directory index file.
  for (const ext of CANDIDATE_EXTS) {
    const indexPath = resolvePath(basePath, "index" + ext);
    if (await exists(indexPath)) return indexPath;
  }
  return null;
}

const STUBS = {
  "next/headers": new URL("./stubs/next-headers.mjs", import.meta.url).href,
};

export async function resolve(specifier, context, nextResolve) {
  // Server-only Next.js modules that cannot load outside the Next runtime.
  if (STUBS[specifier]) {
    return { url: STUBS[specifier], shortCircuit: true };
  }

  // `@/foo/bar` -> <project root>/foo/bar (tsconfig "paths").
  if (specifier.startsWith("@/")) {
    const target = resolvePath(PROJECT_ROOT, specifier.slice(2));
    const resolved = await resolveWithExtensions(target);
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
  }

  // Extensionless relative imports: `./x`, `../x`.
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith("file:")
  ) {
    try {
      return await nextResolve(specifier, context);
    } catch (err) {
      if (err?.code !== "ERR_MODULE_NOT_FOUND") throw err;
      const parentDir = dirname(fileURLToPath(context.parentURL));
      const base = resolvePath(parentDir, specifier);
      const resolved = await resolveWithExtensions(base);
      if (resolved) {
        return { url: pathToFileURL(resolved).href, shortCircuit: true };
      }
      throw err;
    }
  }

  return nextResolve(specifier, context);
}
