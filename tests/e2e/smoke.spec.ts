import { test, expect } from "@playwright/test";

/**
 * End-to-end smoke of the model-D flow. Requires browsers:
 *   npx playwright install
 * The dev server is started automatically (see playwright.config.ts).
 */

test.beforeEach(async ({ page }) => {
  // Skip the boot animation deterministically.
  await page.addInitScript(() => {
    localStorage.setItem("zk.booted", "1");
    localStorage.setItem("zk.theme", "tokyo-night");
  });
});

test("hero renders the positioning", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Ziad Alatrash/ })).toBeVisible();
  await expect(page.getByText(/not an API caller/)).toBeVisible();
});

test("theme choice persists across reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Change color theme" }).click();
  await page.getByRole("option", { name: "dracula" }).click();
  await page.reload();
  const bg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--term-bg").trim(),
  );
  expect(bg).toBe("#282a36");
});

test("command palette opens and navigates", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open the command palette" }).click();
  await expect(page.getByText(/command palette/)).toBeVisible();
});
