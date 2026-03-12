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

// 5. _routes.json — tell CF Pages to serve /_next/static/* directly from
//    the static deployment (bypassing the worker) so CSS/JS/fonts load correctly.
const routesJson = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/_next/static/*",
    "/BUILD_ID",
  ],
};
fs.writeFileSync(
  path.join(dest, "_routes.json"),
  JSON.stringify(routesJson, null, 2)
);

console.log("✓ .cf-deploy assembled");
