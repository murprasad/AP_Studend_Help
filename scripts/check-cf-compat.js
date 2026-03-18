#!/usr/bin/env node
/**
 * check-cf-compat.js
 * Scans src/ for banned AI SDK imports that are incompatible with Cloudflare Workers.
 * Exits 1 if any violations are found, 0 if clean.
 */

const fs = require("fs");
const path = require("path");

const BANNED_PATTERNS = [
  'from "groq-sdk"',
  "from 'groq-sdk'",
  'from "@anthropic-ai/sdk"',
  "from '@anthropic-ai/sdk'",
  'from "@huggingface/inference"',
  "from '@huggingface/inference'",
  'from "cohere-ai"',
  "from 'cohere-ai'",
  'require("groq-sdk")',
  "require('groq-sdk')",
  'require("@anthropic-ai/sdk")',
  "require('@anthropic-ai/sdk')",
  'require("@huggingface/inference")',
  "require('@huggingface/inference')",
  'require("cohere-ai")',
  "require('cohere-ai')",
];

function walkDir(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".cf-deploy") continue;
      walkDir(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const srcDir = path.join(__dirname, "..", "src");
const files = walkDir(srcDir);

const violations = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of BANNED_PATTERNS) {
      if (line.includes(pattern)) {
        violations.push({
          file: path.relative(path.join(__dirname, ".."), filePath),
          line: i + 1,
          pattern,
          text: line.trim(),
        });
      }
    }
  }
}

if (violations.length === 0) {
  console.log(`✅ CF Workers compat check passed (${files.length} files scanned)`);
  process.exit(0);
} else {
  console.error(`\n❌ CF Workers compat check FAILED — ${violations.length} banned import(s) found:\n`);
  console.error("  These SDKs use Node.js HTTP clients incompatible with Cloudflare Workers.");
  console.error("  Replace them with plain fetch() calls.\n");
  console.error(`  ${"File".padEnd(60)} ${"Line".padEnd(6)} Banned Import`);
  console.error(`  ${"─".repeat(60)} ${"─".repeat(6)} ${"─".repeat(40)}`);
  for (const v of violations) {
    console.error(`  ${v.file.padEnd(60)} ${String(v.line).padEnd(6)} ${v.pattern}`);
  }
  console.error("");
  process.exit(1);
}
