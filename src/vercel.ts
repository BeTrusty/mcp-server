// Vercel build entry — bun bundles this into api/index.js (--target=node).
// Importing from ./index (not running it) ensures import.meta.main is false,
// so the Bun.serve() block is dead-code-eliminated by the bundler.
export { default } from "./index";
