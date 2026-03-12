// Node.js implementation of `#wasm-engine-loader` for Prisma's WASM client.
// Wrangler provides this alias automatically on Cloudflare Workers.
// For Node.js (local dev + `next build`), we load the WASM binary via fs.

"use strict";

const fs = require("fs");
const path = require("path");

// The WASM file is in the generated Prisma client directory
const wasmPath = path.resolve(
  __dirname,
  "../../node_modules/.prisma/client/query_engine_bg.wasm"
);

// Compile the WASM module synchronously at startup
const wasmBuffer = fs.readFileSync(wasmPath);
const wasmModulePromise = WebAssembly.compile(wasmBuffer);

// Export in the format Prisma's getQueryEngineWasmModule expects:
// a promise that resolves to { default: WebAssembly.Module }
module.exports = {
  default: wasmModulePromise.then((mod) => ({ default: mod })),
};
