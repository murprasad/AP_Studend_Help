// Patches the generated Prisma client to add a Node.js-compatible WASM loader.
// The default wasm-worker-loader.mjs uses `import('./file.wasm')` which doesn't
// work on Node.js without special flags.  We add a "node" condition to the
// .prisma/client/package.json imports map pointing to our own loader.
//
// This must run after `prisma generate` since generate overwrites the files.

const fs = require("fs");
const path = require("path");

const clientDir = path.resolve("node_modules/.prisma/client");
const pkgPath = path.join(clientDir, "package.json");
const loaderPath = path.join(clientDir, "wasm-node-loader.mjs");

// 1. Write the Node.js WASM loader
const loaderContent = `\
// Node.js implementation of Prisma's \`#wasm-engine-loader\`.
// Wrangler provides this automatically on Cloudflare Workers by bundling the
// .wasm file so that \`import('./file.wasm')\` returns { default: WebAssembly.Module }.
// For Node.js we replicate that format using fs.readFileSync + WebAssembly.compile.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const wasmPath = resolve(__dirname, "./query_engine_bg.wasm");
const wasmBuffer = readFileSync(wasmPath);
const wasmModule = await WebAssembly.compile(wasmBuffer);

// Prisma reads: (await (await import('#wasm-engine-loader')).default).default
// so we export: Promise<{ default: WebAssembly.Module }>
export default Promise.resolve({ default: wasmModule });
`;
fs.writeFileSync(loaderPath, loaderContent);

// 2. Patch package.json imports map to add the "node" condition
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.imports = pkg.imports || {};
pkg.imports["#wasm-engine-loader"] = {
  node: "./wasm-node-loader.mjs",
  "edge-light": "./wasm-edge-light-loader.mjs",
  workerd: "./wasm-worker-loader.mjs",
  worker: "./wasm-worker-loader.mjs",
  default: "./wasm-worker-loader.mjs",
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log("✓ Patched .prisma/client for Node.js WASM support");
