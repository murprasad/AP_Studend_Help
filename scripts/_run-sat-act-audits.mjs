/**
 * Runs SAT/ACT audits sequentially to avoid Haiku rate limits.
 * SAT_MATH and SAT_READING_WRITING already running in parallel — this
 * script handles ACT_ENGLISH, ACT_MATH, ACT_READING, ACT_SCIENCE
 * waiting for SAT to free up the rate limit budget.
 */
import { spawn } from "node:child_process";

const courses = ["ACT_ENGLISH", "ACT_MATH", "ACT_READING", "ACT_SCIENCE"];

function run(course) {
  return new Promise((resolve) => {
    console.log(`\n── starting ${course} ──`);
    const proc = spawn("node", ["scripts/_sample-coverage-audit.mjs", `--course=${course}`], {
      stdio: ["ignore", "inherit", "inherit"],
      shell: true,
    });
    proc.on("exit", (code) => {
      console.log(`── ${course} exited ${code} ──`);
      resolve();
    });
  });
}

for (const c of courses) {
  await run(c);
  // Small breather between courses
  await new Promise((r) => setTimeout(r, 5000));
}
console.log("\n══ ALL ACT AUDITS DONE ══");
