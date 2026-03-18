// Patches the generated Prisma client so it works on BOTH Node.js and CF Workers.
// Must run after `prisma generate` since generate overwrites the files.
//
// Two-stage patching strategy:
// Stage 1 (this script): patch wasm.js to use wasm-node-loader.mjs
//   → makes Node.js dev/build work (fs.readFileSync loads the WASM)
// Stage 2 (prepare-cf-deploy.js): re-patch the CF Workers copy of wasm.js
//   → back to wasm-worker-loader.mjs so wrangler can bundle the .wasm file

const fs = require("fs");
const path = require("path");

const clientDir = path.resolve("node_modules/.prisma/client");
const pkgPath = path.join(clientDir, "package.json");
const wasmJsPath = path.join(clientDir, "wasm.js");
const loaderPath = path.join(clientDir, "wasm-node-loader.mjs");

// 1. Write the universal WASM loader.
//    - No top-level await (prevents inline execution during esbuild bundling).
//    - Tries Node.js readFileSync first; falls back to wrangler-bundled import.
const loaderContent = `\
// Universal WASM loader — works on Node.js (including webpack/Next.js dev) AND Cloudflare Workers.
// No top-level await so esbuild does not execute it inline at bundle time.
// Prisma reads: (await (await import('...')).default).default

export default (async function loadWasm() {
  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");

  // Strategy 1: resolve relative to __dirname (standard Node.js ESM via fileURLToPath)
  try {
    const { dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    // import.meta.url may be a webpack synthetic URL — only use it if it starts with file://
    const metaUrl = import.meta.url;
    if (metaUrl && metaUrl.startsWith("file://")) {
      const __dir = dirname(fileURLToPath(metaUrl));
      const wasmBuffer = readFileSync(resolve(__dir, "./query_engine_bg.wasm"));
      return { default: await WebAssembly.compile(wasmBuffer) };
    }
  } catch { /* fall through */ }

  // Strategy 2: resolve from a known absolute path using require.resolve (works in webpack CJS context)
  try {
    const r = (typeof require !== "undefined") ? require : null;
    if (r) {
      const wasmPath = r.resolve(".prisma/client/query_engine_bg.wasm");
      const wasmBuffer = readFileSync(wasmPath);
      return { default: await WebAssembly.compile(wasmBuffer) };
    }
  } catch { /* fall through */ }

  // Strategy 3: hardcoded path relative to node_modules (last resort for webpack dev server)
  try {
    const cwd = (typeof process !== "undefined") ? process.cwd() : "";
    if (cwd) {
      const wasmPath = resolve(cwd, "node_modules/.prisma/client/query_engine_bg.wasm");
      const wasmBuffer = readFileSync(wasmPath);
      return { default: await WebAssembly.compile(wasmBuffer) };
    }
  } catch { /* fall through */ }

  // Strategy 4: Cloudflare Workers — wrangler bundles the .wasm file as an ES module
  const wasmImport = await import("./query_engine_bg.wasm");
  const wasmModule = wasmImport.default || wasmImport;
  return { default: wasmModule };
})();
`;
fs.writeFileSync(loaderPath, loaderContent);

// 2. Patch package.json imports map — add "node" condition, keep "workerd" first.
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.imports = pkg.imports || {};
pkg.imports["#wasm-engine-loader"] = {
  workerd: "./wasm-worker-loader.mjs",
  worker: "./wasm-worker-loader.mjs",
  "edge-light": "./wasm-edge-light-loader.mjs",
  node: "./wasm-node-loader.mjs",
  default: "./wasm-worker-loader.mjs",
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// 3. Patch wasm.js: replace the engine loader import with wasm-node-loader.mjs.
//    esbuild (used by OpenNext) cannot resolve "#"-imports from CJS modules.
//    For Node.js runtime, wasm-node-loader.mjs uses readFileSync to load the WASM.
//    prepare-cf-deploy.js will re-patch this to wasm-worker-loader.mjs for CF Workers.
let wasmJs = fs.readFileSync(wasmJsPath, "utf8");
const nodeLoader   = `'./wasm-node-loader.mjs'`;
const workerLoader = `'./wasm-worker-loader.mjs'`;
const hashLoader   = `'#wasm-engine-loader'`;

let patched = false;
for (const from of [hashLoader, workerLoader]) {
  if (wasmJs.includes(from)) {
    wasmJs = wasmJs.split(from).join(nodeLoader);
    fs.writeFileSync(wasmJsPath, wasmJs);
    console.log(`✓ Patched wasm.js: ${from} → wasm-node-loader.mjs`);
    patched = true;
    break;
  }
}
if (!patched && wasmJs.includes(nodeLoader)) {
  console.log("✓ wasm.js already patched to wasm-node-loader.mjs");
} else if (!patched) {
  console.warn("⚠ Could not find wasm engine loader in wasm.js — skipped");
}

console.log("✓ Patched .prisma/client for Node.js WASM + CF Workers support");
