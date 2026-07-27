import { test, expect } from "@playwright/test";

/**
 * The shelf used to be a single `repeat(N, 1fr)` row with a hard 553px minimum,
 * so on any viewport under 700px it overflowed a cabinet that had no scroll
 * container. Three of seven projects could not be reached by touch at all.
 *
 * These check the two properties that failed, at the sizes they failed at.
 */

const PHONES = [
  { name: "small", width: 320, height: 568 },
  { name: "common", width: 390, height: 844 },
  { name: "large", width: 430, height: 932 },
  { name: "landscape", width: 844, height: 390 },
];

/** Parked where the station is fully revealed and the shelf is usable. */
const STATION = "/?seq=0.33";

for (const phone of PHONES) {
  test.describe(`shelf at ${phone.name} (${phone.width}x${phone.height})`, () => {
    test.use({ viewport: { width: phone.width, height: phone.height } });

    test("every cartridge is reachable", async ({ page }) => {
      await page.goto(`${STATION}&touch`);
      const carts = page.locator("[data-cart-id]");
      const count = await carts.count();
      expect(count).toBeGreaterThan(0);

      const reachable = await page.evaluate(() => {
        const items = [...document.querySelectorAll<HTMLElement>("[data-cart-id]")];
        const rack = items[0].parentElement!;
        const seen = new Set<string>();
        const sweep = () => {
          const rr = rack.getBoundingClientRect();
          for (const el of items) {
            const r = el.getBoundingClientRect();
            const insideRack = r.left >= rr.left - 1 && r.right <= rr.right + 1;
            const onScreen = r.right <= window.innerWidth + 1 && r.left >= -1;
            if (insideRack && onScreen) seen.add(el.dataset.cartId!);
          }
        };
        const max = rack.scrollWidth - rack.clientWidth;
        for (let x = 0; x <= max; x += 30) {
          rack.scrollLeft = x;
          sweep();
        }
        rack.scrollLeft = max;
        sweep();
        rack.scrollLeft = 0;
        return [...seen];
      });

      expect(reachable.sort()).toHaveLength(count);
    });

    test("the station fits inside the pinned viewport", async ({ page }) => {
      await page.goto(STATION);
      // Landscape is the case that used to put the whole shelf below the fold.
      const bottom = await page.evaluate(() => {
        const cart = document.querySelector<HTMLElement>("[data-cart-id]")!;
        const cabinet = cart.parentElement!.parentElement!;
        return cabinet.getBoundingClientRect().bottom;
      });
      expect(bottom).toBeLessThanOrEqual(phone.height);
    });

    test("cartridges are all the same size", async ({ page }) => {
      await page.goto(STATION);
      const widths = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("[data-cart-id]")].map(
          (el) => el.offsetWidth,
        ),
      );
      expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    });

    test("the page never scrolls sideways", async ({ page }) => {
      await page.goto(STATION);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

test.describe("touch shelf", () => {
  // Only viewport and touch: a full device descriptor carries
  // defaultBrowserType, which Playwright refuses inside a describe.
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("takes two taps to load, and previews on the first", async ({ page }) => {
    // ?touch forces the hoverless path: Chromium still reports (hover: hover)
    // under plain touch emulation.
    await page.goto(`${STATION}&touch`);
    const cart = page.locator('[data-cart-id="omnipotence"] button');

    await expect(cart).toHaveAttribute("aria-label", /Select$/);
    await cart.tap();

    // The first tap only previews: it puts the project on the television.
    await expect(cart).toHaveAttribute("aria-label", /Load$/);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    await cart.tap();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 8000 });
  });

  test("a vertical swipe over the rack still moves the page", async ({ page }) => {
    await page.goto("/");
    const start = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(start);
  });
});
