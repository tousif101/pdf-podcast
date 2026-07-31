// Registers the extensionless/alias resolution hook (loader.mjs) for the
// current process. Passed to Node via `--import ./test/loader-register.mjs`.

import { register } from "node:module";

register(new URL("./loader.mjs", import.meta.url));
