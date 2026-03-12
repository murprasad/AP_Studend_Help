// Shim for the Node.js `fs` module used on Cloudflare Workers.
// Most of the real `fs` API is forwarded unchanged (works fine on Node.js).
// `readdir` / `readdirSync` are replaced with safe no-ops so Prisma's binary
// engine detector finds nothing and falls through to the configured driver adapter.

"use strict";

const realFs = require("node:fs");

module.exports = {
  ...realFs,

  readdir: function (path, options, callback) {
    const cb = typeof options === "function" ? options : callback;
    if (typeof cb === "function") cb(null, []);
  },

  readdirSync: function () {
    return [];
  },
};
