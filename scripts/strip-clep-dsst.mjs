/**
 * Strip CLEP/DSST from StudentNest landing/about/pricing.
 *
 * Strategy: hardcode `clepOn=false`/`dsstOn=false` in page.tsx and remove
 * the `isClepEnabled`/`isDsstEnabled` import. The existing `{clepOn && ...}`
 * JSX blocks then evaluate to `false` and React renders nothing — bundler
 * dead-code-elims at build time. Surgical rip-out of nested JSX is risky
 * (brace-counting through emoji-heavy content); the always-false constant
 * approach is functionally identical and 0-risk.
 *
 * Surgical strips: clepCourses array (unused), CLEP testimonial entry,
 * CLEP-aware copy in stat bar.
 */

import { readFileSync, writeFileSync } from "node:fs";

function strip(path, mutator) {
  const before = readFileSync(path, "utf8");
  const after = mutator(before);
  if (before === after) {
    console.log(`(no change) ${path}`);
    return;
  }
  writeFileSync(path, after);
  console.log(`✓ ${path} (${before.length} → ${after.length})`);
}

// 1. Landing page
strip("src/app/page.tsx", (s) => {
  // Drop isClepEnabled, isDsstEnabled from imports.
  s = s.replace(
    "import { isClepEnabled, isDsstEnabled, getExamLabel, getCourseCount, getVisibleCourses } from \"@/lib/settings\";",
    "import { getExamLabel, getCourseCount, getVisibleCourses } from \"@/lib/settings\";",
  );

  // Hardcode clepOn/dsstOn to false. Drop the safeFlag calls.
  const oldPromise = `  const [clepOn, dsstOn, visibleCoursesAllowlist] = await Promise.all([
    safeFlag(isClepEnabled, false),
    safeFlag(isDsstEnabled, false),
    getVisibleCourses().catch(() => "all" as const),
  ]);`;
  const newPromise = [
    '  // CLEP/DSST removed from StudentNest 2026-05-03 — those products live on PrepLion.',
    '  // Flags are constants now; existing {clepOn && ...} JSX dead-code-elims at build.',
    '  const clepOn = false;',
    '  const dsstOn = false;',
    '  const visibleCoursesAllowlist = await getVisibleCourses().catch(() => "all" as const);',
  ].join("\n");
  if (!s.includes(oldPromise)) throw new Error("Promise.all block not found");
  s = s.replace(oldPromise, newPromise);

  // Remove the clepCourses array (it's referenced only inside `{clepOn && ...}`
  // JSX blocks which now eval to false). Block runs from line ~91 to ~100.
  const clepCoursesStart = s.indexOf("const clepCourses = [");
  if (clepCoursesStart >= 0) {
    const arrEnd = s.indexOf("\n];", clepCoursesStart) + 3;
    // Trim leading/trailing newlines around the block.
    const trimStart = s.lastIndexOf("\n", clepCoursesStart - 1) + 1;
    const trimEnd = s.indexOf("\n", arrEnd) + 1;
    s = s.slice(0, trimStart) + s.slice(trimEnd);
  }

  // Remove the CLEP testimonial entry (3rd in the testimonials array).
  // It's the one with `context: "CLEP College Algebra"`.
  const clepTestiStart = s.indexOf("    quote: \"I passed CLEP College Algebra");
  if (clepTestiStart >= 0) {
    // Find the enclosing `{ ... },` block.
    const blockStart = s.lastIndexOf("  {", clepTestiStart);
    const blockEnd = s.indexOf("  },", clepTestiStart) + "  },".length;
    const trimStart = s.lastIndexOf("\n", blockStart - 1) + 1;
    const trimEnd = s.indexOf("\n", blockEnd) + 1;
    s = s.slice(0, trimStart) + s.slice(trimEnd);
  }

  // Strip the testimonial filter (CLEP-only, dead with clepOn=false).
  s = s.replace(
    `  const visibleTestimonials = testimonials.filter((t) => {
    if (!clepOn && t.context.startsWith("CLEP")) return false;
    return true;
  });`,
    `  const visibleTestimonials = testimonials;`,
  );

  // Strip CLEP-aware copy in the social-proof stat bar (always-false branch).
  s = s.replace(
    "...(clepOn ? [{ icon: \"💰\", stat: \"$1,200+ saved per CLEP exam\", sub: \"Skip courses, keep the credit\" }] : [{ icon: \"📚\", stat: \"Exam-aligned questions\", sub: \"Match real exam formats\" }]),",
    "{ icon: \"📚\", stat: \"Exam-aligned questions\", sub: \"Match real exam formats\" },",
  );

  return s;
});

// 2. About page — strip CLEP/DSST mentions if any.
strip("src/app/(marketing)/about/page.tsx", (s) => {
  // Same hardcoding pattern. About may or may not gate sections by clepOn/dsstOn.
  if (!s.includes("isClepEnabled") && !s.includes("isDsstEnabled") && !s.includes("clepOn") && !s.includes("dsstOn")) {
    return s;
  }
  s = s.replace(
    /import \{ ([^}]*?)isClepEnabled,?\s*/g,
    (m, before) => `import { ${before}`,
  );
  s = s.replace(
    /import \{ ([^}]*?)isDsstEnabled,?\s*/g,
    (m, before) => `import { ${before}`,
  );
  // Clean up double commas / leading commas from the import strip.
  s = s.replace(/import \{ ,/g, "import { ");
  s = s.replace(/, ,/g, ",");
  s = s.replace(/, \}/g, " }");
  return s;
});

// 3. Pricing page — strip CLEP/DSST.
strip("src/app/(marketing)/pricing/pricing-client.tsx", (s) => {
  if (!s.includes("clepOn") && !s.includes("dsstOn")) return s;
  return s; // Hands-off; we'll add a PrepLion handoff line manually in Phase 4 instead.
});

console.log("\nDone. Run `npx tsc --noEmit` to verify.");
