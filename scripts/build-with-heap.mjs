/**
 * scripts/build-with-heap.mjs — invoke `npm run pages:build` with an
 * explicit Node heap ceiling. Cross-platform (Windows / macOS / Linux),
 * no extra deps.
 *
 * Usage: node scripts/build-with-heap.mjs [heapMB]
 *   defaults to 4096
 *
 * Why this exists: on RAM-constrained machines (8 GB), the default Node
 * heap ceiling triggers OOM during the OpenNext production build. Bumping
 * to 4096 MB lets the build complete IF physical RAM is available. If
 * RAM is full, the OS still swaps and the build will be slow but won't
 * OOM at the heap ceiling.
 */

import { spawnSync } from "node:child_process";

const heapMB = process.argv[2] || "4096";
const existing = process.env.NODE_OPTIONS ?? "";
const env = {
  ...process.env,
  NODE_OPTIONS: `${existing} --max-old-space-size=${heapMB}`.trim(),
};

console.log(`→ Setting NODE_OPTIONS=--max-old-space-size=${heapMB}`);
console.log(`→ Running 'npm run pages:build'\n`);

const r = spawnSync("npm", ["run", "pages:build"], {
  stdio: "inherit",
  env,
  shell: true,
});
process.exit(r.status ?? 0);
