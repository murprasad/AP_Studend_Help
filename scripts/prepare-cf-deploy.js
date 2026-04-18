// Assembles the Cloudflare Pages deploy directory from the OpenNext build output.
// Static assets must be at root (for CF Pages to serve /_next/...) AND
// the worker's sibling dirs (server-functions, cloudflare, middleware, .build)
// must also be at root so the _worker.js imports resolve correctly.
const fs = require("fs");
const path = require("path");

const src = path.resolve(".open-next");
const dest = path.resolve(".cf-deploy");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Wipe and recreate
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest);

// 1. Static assets at root (gives us _next/ at root)
copyDir(path.join(src, "assets"), dest);

// 2. _worker.js at root (Cloudflare Pages picks this up as the Worker)
fs.copyFileSync(path.join(src, "worker.js"), path.join(dest, "_worker.js"));

// 3. Worker sibling dirs that _worker.js imports at runtime
for (const dir of ["server-functions", "cloudflare", "middleware"]) {
  const s = path.join(src, dir);
  if (fs.existsSync(s)) copyDir(s, path.join(dest, dir));
}

// 4. .build (durable objects)
const buildDir = path.join(src, ".build");
if (fs.existsSync(buildDir)) copyDir(buildDir, path.join(dest, ".build"));

// 5. _routes.json — tell CF Pages to serve static files directly from the
//    static deployment (bypassing the worker). Without the extra excludes,
//    CF Pages routes /sw.js, /manifest.webmanifest, /og-image.svg, icons,
//    and the rest of /public/ through the Next.js worker handler, which
//    doesn't know about them and returns 404.
const routesJson = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/_next/static/*",
    "/BUILD_ID",
    "/sw.js",
    "/manifest.webmanifest",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/og-image.svg",
    "/icons/*",
    "/fonts/*",
    "/images/*",
  ],
};
fs.writeFileSync(
  path.join(dest, "_routes.json"),
  JSON.stringify(routesJson, null, 2)
);

// 6. Patch Prisma's OpenSSL/libssl detector in the server handler bundle.
//    Prisma calls `fs.promises.readdir()` to find libssl.so files; the catch
//    block only ignores ENOENT, so the unenv "not implemented" error re-throws
//    and breaks all database operations on Cloudflare Workers.
//    We expand the catch to also swallow unenv "not implemented" errors.
const handlerPath = path.join(dest, "server-functions/default/handler.mjs");
if (fs.existsSync(handlerPath)) {
  let handler = fs.readFileSync(handlerPath, "utf8");
  // Original:  catch(t){if(t.code==="ENOENT")return;throw t}
  // Patched:   also return for unenv "not implemented" errors
  const original = `catch(t){if(t.code==="ENOENT")return;throw t}`;
  const patched  = `catch(t){if(t.code==="ENOENT"||String(t.message).includes("not implemented"))return;throw t}`;
  if (handler.includes(original)) {
    handler = handler.split(original).join(patched);
    console.log("✓ Patched Prisma fs.readdir catch block");
  } else {
    console.warn("⚠ Could not find Prisma readdir catch pattern — patch skipped");
  }

  // Patch 2: Prisma uses eval("__dirname") to locate binary engines.
  // eval() is blocked on Cloudflare Workers by default. Replace with empty
  // string — the engine path won't resolve, Prisma falls through to adapter.
  const evalPattern = `eval("__dirname")`;
  const evalReplacement = `""`;
  const evalCount = (handler.match(new RegExp(evalPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  if (evalCount > 0) {
    handler = handler.split(evalPattern).join(evalReplacement);
    console.log(`✓ Patched ${evalCount} eval("__dirname") call(s)`);
  } else {
    console.warn("⚠ Could not find eval(\"__dirname\") — patch skipped");
  }

  fs.writeFileSync(handlerPath, handler);
}

// 7. The universal wasm-node-loader.mjs handles both Node.js and CF Workers
//    so no re-patching of wasm.js is needed for the CF Workers bundle.

console.log("✓ .cf-deploy assembled");
