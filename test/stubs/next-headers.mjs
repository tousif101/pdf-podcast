// Minimal stand-in for `next/headers`, which only loads inside the Next.js
// server runtime. The unit tests that transitively import it never call these
// functions (they exercise pure logic elsewhere in the module), so throwing on
// use makes any accidental reliance obvious rather than silently passing.

function notAvailable() {
  throw new Error(
    "next/headers is not available outside the Next.js runtime (test stub)",
  );
}

export const cookies = notAvailable;
export const headers = notAvailable;
export const draftMode = notAvailable;
