/**
 * QA — SN journey writes picked course to localStorage
 *
 * SN companion to PL REQ-048. SN's journey was already correctly
 * writing localStorage (verified at fix time), so this is a regression
 * guard: if a refactor strips the write, the spec fails.
 *
 * Run: npx playwright test tests/qa-onboarding-non-default-course.spec.ts --reporter=list
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const JOURNEY_PAGE = join(process.cwd(), "src/app/(journey)/journey/page.tsx");

test("SN journey handleStart writes localStorage with the picked course", () => {
  const src = readFileSync(JOURNEY_PAGE, "utf8");

  // SN's useCourse hook reads from localStorage["ap_selected_course"].
  // Journey must write that key (directly or via the exported constant)
  // when the user picks a course.
  expect(
    src.includes("localStorage.setItem") && src.includes("ap_selected_course"),
    "SN journey/handleStart no longer writes ap_selected_course — REQ-048-class regression",
  ).toBe(true);
});
