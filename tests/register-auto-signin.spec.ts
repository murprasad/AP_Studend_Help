/**
 * E2E test for auto-sign-in on register + middleware onboarding enforcement.
 *
 * Ported from PrepLion 2026-05-21. Adjusted to studentnest.ai base URL.
 *
 * Verifies:
 *   1. Register flow auto-signs-in the user (no manual "Continue to Login" step)
 *   2. Middleware redirects un-onboarded users from /practice/* to /journey
 */

import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.E2E_BASE_URL || "https://studentnest.ai";

function makeTestEmail() {
  return `test-register-${Date.now()}-${Math.floor(Math.random() * 1000)}@test.studentnest.ai`;
}

async function cleanup(email: string) {
  const prisma = new PrismaClient();
  try {
    await prisma.user.delete({ where: { email } }).catch(() => {});
  } finally {
    await prisma.$disconnect();
  }
}

async function fillRegisterForm(page: Page, email: string, password: string, opts?: { firstName?: string; lastName?: string }) {
  await page.fill('input[name="firstName"]', opts?.firstName ?? "Test");
  await page.fill('input[name="lastName"]', opts?.lastName ?? "User");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  // gradeLevel is a Radix Select (if present on SN) — click trigger then option
  const gradeTrigger = page.locator('button[role="combobox"]').first();
  if (await gradeTrigger.count()) {
    await gradeTrigger.click().catch(() => {});
    const option = page.getByRole('option').first();
    if (await option.count()) await option.click().catch(() => {});
  }
}

test.describe("SN register auto-sign-in + middleware onboarding enforcement", () => {
  test("auto-sign-in: register lands user on /journey or /practice/quickstart (not /login)", async ({ page }) => {
    const email = makeTestEmail();
    const password = "TestPass329";
    try {
      await page.goto(`${BASE}/register?track=ap`);
      await page.waitForLoadState("networkidle");
      await fillRegisterForm(page, email, password, { firstName: "Auto", lastName: "SignIn" });
      await page.click('button[type="submit"]');

      await page.waitForURL(/\/(journey|onboarding|practice\/quickstart)/, { timeout: 20000 });
      const landed = new URL(page.url()).pathname;

      const continueToLoginButton = await page.locator('text=Continue to Login').count();
      expect(continueToLoginButton).toBe(0);
      expect(landed).toMatch(/^\/(journey|onboarding|practice\/quickstart)/);
    } finally {
      if (email) await cleanup(email);
    }
  });

  test("middleware: un-onboarded user hitting /practice/COURSE is redirected", async ({ page }) => {
    const email = makeTestEmail();
    const password = "TestPass329";
    try {
      await page.goto(`${BASE}/register?track=ap`);
      await page.waitForLoadState("networkidle");
      await fillRegisterForm(page, email, password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(journey|onboarding|practice\/quickstart)/, { timeout: 20000 });

      await page.goto(`${BASE}/practice/AP_BIOLOGY`);
      await page.waitForURL(/\/(journey|onboarding|practice\/quickstart)/, { timeout: 10000 });
      const finalPath = new URL(page.url()).pathname;
      expect(finalPath).toMatch(/^\/(journey|onboarding|practice\/quickstart)/);
    } finally {
      if (email) await cleanup(email);
    }
  });

  test("register failure: empty form stays on /register", async ({ page }) => {
    await page.goto(`${BASE}/register?track=ap`);
    await page.waitForLoadState("networkidle");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);
    const path = new URL(page.url()).pathname;
    expect(path).toBe("/register");
  });
});
