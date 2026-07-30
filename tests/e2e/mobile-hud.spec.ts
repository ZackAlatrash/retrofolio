import { test, expect, type Page } from "@playwright/test";

/**
 * The HUD nav placed four items at fixed centres `gap` apart, with `gap`
 * floored at 100px. That makes the group about 426px wide whatever the screen
 * is, so on every phone the first item ran off the left edge, the last off the
 * right, adjacent items overlapped by 19-31px, and the player chip and language
 * key printed straight through the ones at the ends.
 *
 * A phone bar cannot hold six controls: back-to-title, four destinations and
 * the language key. Compact therefore spends the bar on one control that says
 * where you are, and holds the destinations behind it at full size. The title
 * screen, which has vertical room, gets a stacked menu instead, where there is
 * height for it.
 */

/**
 * Park where the HUD bar has fully formed.
 *
 * Scroll behaviour is forced to `auto` first: the site scrolls smoothly, so a
 * `scrollTo` is still in flight a moment later and any scrollY read against it
 * is a moving target.
 */
async function toHud(page: Page) {
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });
  const total = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.3));
  await page.waitForTimeout(600);
}

/** The one place on screen that is never under the menu panel. */
async function tapBelowMenu(page: Page) {
  const y = await page.evaluate(() => {
    const panel = document.querySelector("#hud-menu")!.getBoundingClientRect();
    return Math.round((panel.bottom + window.innerHeight) / 2);
  });
  await page.touchscreen.tap(Math.round(page.viewportSize()!.width / 2), y);
}

const menuButton = (page: Page) =>
  page.getByRole("button", { name: /Open screen menu/ });

const PHONES = [
  { name: "smallest phone", width: 320, height: 568 },
  { name: "common phone", width: 390, height: 844 },
  { name: "large phone", width: 430, height: 932 },
  { name: "landscape phone", width: 844, height: 390 },
  { name: "narrow window", width: 759, height: 900 },
];

for (const v of PHONES) {
  test.describe(`hud at ${v.name} (${v.width}x${v.height})`, () => {
    test.use({ viewport: { width: v.width, height: v.height }, hasTouch: true });

    test("the bar carries one control, clear of the chip and the key", async ({
      page,
    }) => {
      await toHud(page);
      const control = menuButton(page);
      await expect(control).toBeVisible();

      const r = await page.evaluate(() => {
        const c = document.querySelector<HTMLElement>('[aria-controls="hud-menu"]')!;
        const chip = document.querySelector<HTMLElement>('[aria-label="Back to title"]')!;
        const key = document.querySelector<HTMLElement>('[aria-label="Language"]')!;
        const box = (e: HTMLElement) => e.getBoundingClientRect();
        return {
          c: box(c),
          chipRight: box(chip).right,
          keyLeft: box(key).left,
          vw: window.innerWidth,
        };
      });

      expect(r.c.left).toBeGreaterThanOrEqual(r.chipRight - 1);
      expect(r.c.right).toBeLessThanOrEqual(r.keyLeft + 1);
      expect(r.c.left).toBeGreaterThanOrEqual(-1);
      expect(r.c.right).toBeLessThanOrEqual(r.vw + 1);
      expect(Math.round(r.c.height)).toBeGreaterThanOrEqual(44);
      expect(Math.round(r.c.width)).toBeGreaterThanOrEqual(44);
    });

    test("the control names the screen you are on", async ({ page }) => {
      await toHud(page);
      // Which screen 30% lands on depends on the viewport, so the assertion is
      // that it names one of them rather than a particular one.
      const shown = await page.evaluate(() =>
        (
          document.querySelector('[aria-controls="hud-menu"]')!.textContent || ""
        ).replace(/[^A-Z]/g, ""),
      );
      expect(["PROJECTS", "ABOUT", "SKILLS", "CONTACT", "TITLE"]).toContain(shown);
    });

    test("the menu opens with every destination at full size", async ({ page }) => {
      await toHud(page);
      await menuButton(page).tap();

      const rows = page.locator("#hud-menu button");
      await expect(rows).toHaveCount(5); // four screens plus the title

      const metrics = await page.evaluate(() => {
        const rs = [...document.querySelectorAll<HTMLElement>("#hud-menu button")];
        const panel = document.querySelector<HTMLElement>("#hud-menu")!.getBoundingClientRect();
        return {
          heights: rs.map((r) => Math.round(r.getBoundingClientRect().height)),
          fonts: rs.map((r) => parseFloat(getComputedStyle(r).fontSize)),
          fitsWidth: panel.left >= -1 && panel.right <= window.innerWidth + 1,
          fitsHeight: panel.bottom <= window.innerHeight + 1,
        };
      });
      for (const h of metrics.heights) expect(h).toBeGreaterThanOrEqual(44);
      for (const f of metrics.fonts) expect(f).toBeGreaterThanOrEqual(14);
      expect(metrics.fitsWidth).toBe(true);
      expect(metrics.fitsHeight).toBe(true);
    });

    test("choosing a destination goes there and closes the menu", async ({ page }) => {
      await toHud(page);
      await menuButton(page).tap();
      await page.locator("#hud-menu button", { hasText: "CONTACT" }).tap();

      await expect(page.locator("#hud-menu")).toHaveCount(0);
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const el = document.getElementById("contact");
              return el
                ? el.getBoundingClientRect().top <= window.innerHeight * 0.5
                : false;
            }),
          { timeout: 8000 },
        )
        .toBe(true);
    });

    test("tapping away closes the menu without navigating", async ({ page }) => {
      await toHud(page);
      const before = await page.evaluate(() => window.scrollY);
      await menuButton(page).tap();
      await expect(page.locator("#hud-menu")).toBeVisible();
      // Not the backdrop's centre: the panel covers it on a short screen, so a
      // centre tap lands on a destination instead of dismissing.
      await tapBelowMenu(page);
      await expect(page.locator("#hud-menu")).toHaveCount(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(before);
    });
  });
}

test.describe("the title screen menu", () => {
  test.describe("where there is height for it", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test("stacks, and clears PRESS START and the footer", async ({ page }) => {
      await page.goto("/?touch");
      await page.waitForTimeout(1300);
      const total = await page.evaluate(
        () => document.getElementById("title")!.offsetHeight - window.innerHeight,
      );
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.192));
      await page.waitForTimeout(600);

      const m = await page.evaluate(() => {
        const items = [...document.querySelectorAll<HTMLElement>("button")].filter(
          (b) =>
            /PROJECTS|ABOUT|SKILLS|CONTACT/.test(b.textContent || "") &&
            !b.hasAttribute("aria-controls") &&
            !b.closest("#hud-menu"),
        );
        if (items.length !== 4) return null;
        const boxes = items.map((i) => i.getBoundingClientRect());
        const press = [...document.querySelectorAll<HTMLElement>("button")].find((b) =>
          /PRESS START/.test(b.textContent || ""),
        )!;
        const foot = [...document.querySelectorAll<HTMLElement>("span")].find((s) =>
          /HAARLEM/.test(s.textContent || ""),
        )!;
        // Stacked: each row below the previous, none side by side.
        const stacked = boxes.every((b, i) => i === 0 || b.top >= boxes[i - 1].bottom - 1);
        return {
          stacked,
          minHeight: Math.min(...boxes.map((b) => Math.round(b.height))),
          minWidth: Math.min(...boxes.map((b) => Math.round(b.width))),
          top: Math.min(...boxes.map((b) => b.top)),
          bottom: Math.max(...boxes.map((b) => b.bottom)),
          pressBottom: press.getBoundingClientRect().bottom,
          footTop: foot.getBoundingClientRect().top,
        };
      });

      expect(m).not.toBeNull();
      expect(m!.stacked).toBe(true);
      expect(m!.minHeight).toBeGreaterThanOrEqual(44);
      expect(m!.minWidth).toBeGreaterThanOrEqual(44);
      expect(m!.top).toBeGreaterThanOrEqual(m!.pressBottom - 1);
      expect(m!.bottom).toBeLessThanOrEqual(m!.footTop + 1);
    });
  });

  test.describe("where there is not", () => {
    test.use({ viewport: { width: 320, height: 568 }, hasTouch: true });

    test("is skipped rather than printed over PRESS START and the footer", async ({
      page,
    }) => {
      await page.goto("/?touch");
      await page.waitForTimeout(1300);
      const total = await page.evaluate(
        () => document.getElementById("title")!.offsetHeight - window.innerHeight,
      );
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.192));
      await page.waitForTimeout(600);
      const count = await page.evaluate(
        () =>
          [...document.querySelectorAll("button")].filter(
            (b) =>
              /PROJECTS|ABOUT|SKILLS|CONTACT/.test(b.textContent || "") &&
              !b.hasAttribute("aria-controls") &&
              !b.closest("#hud-menu"),
          ).length,
      );
      expect(count).toBe(0);
    });
  });
});

test.describe("hud on a desktop window", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("keeps the spaced menu, the numerals and the player name", async ({ page }) => {
    await toHud(page);
    // No collapsed control on a mouse: the four items are the nav.
    expect(await menuButton(page).count()).toBe(0);
    const items = await page.evaluate(() =>
      [...document.querySelectorAll("button")]
        .filter((b) => /PROJECTS|ABOUT|SKILLS|CONTACT/.test(b.textContent || ""))
        .map((b) => {
          const r = b.getBoundingClientRect();
          return { t: (b.textContent || "").trim(), l: r.left, r: r.right };
        }),
    );
    expect(items).toHaveLength(4);
    expect(items.some((i) => /^01/.test(i.t))).toBe(true);
    await expect(page.getByRole("button", { name: "Back to title" })).toContainText(
      "ZACK ALATRASH",
    );
    for (const it of items) {
      expect(it.l).toBeGreaterThanOrEqual(-1);
      expect(it.r).toBeLessThanOrEqual(1281);
    }
  });
});

test.describe("no invisible control intercepts a tap", () => {
  /**
   * The nav items set their own pointer-events, so a container set to `none`
   * did not disarm them: a menu faded to opacity 0 still swallowed taps meant
   * for the screen behind it. On a phone that sent a tap-away to SKILLS.
   */
  for (const v of [
    { width: 390, height: 844 },
    { width: 1280, height: 800 },
  ]) {
    test(`${v.width}x${v.height}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: v, hasTouch: true });
      const page = await ctx.newPage();
      await page.goto("/");
      await page.waitForTimeout(1300);
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
      });
      const total = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      );
      const ghosts = new Set<string>();
      for (let i = 0; i <= 16; i++) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round((total * i) / 16));
        await page.waitForTimeout(110);
        const found = await page.evaluate(() => {
          const out: string[] = [];
          // Scoped to the nav's own controls. Other screens have their own
          // invisible-but-armed buttons (the shelf during the scrub, PRESS
          // START); those guard inside their handlers and are tracked apart
          // from this.
          const navish = [...document.querySelectorAll("button")].filter(
            (b) =>
              /PROJECTS|ABOUT|SKILLS|CONTACT/.test(b.textContent || "") &&
              !b.closest("#hud-menu"),
          );
          for (const e of navish) {
            const cs = getComputedStyle(e);
            if (cs.pointerEvents === "none") continue;
            if (cs.visibility === "hidden" || cs.display === "none") continue;
            const r = e.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) continue;
            if (r.bottom <= 0 || r.top >= window.innerHeight) continue;
            // Effective opacity: an ancestor at 0 hides it just as well.
            let op = 1;
            for (let n: Element | null = e; n; n = n.parentElement) {
              op *= parseFloat(getComputedStyle(n).opacity || "1");
            }
            if (op < 0.05) {
              out.push((e.textContent || "").trim().slice(0, 24) || e.tagName);
            }
          }
          return out;
        });
        found.forEach((f) => ghosts.add(f));
      }
      await ctx.close();
      expect([...ghosts]).toEqual([]);
    });
  }
});

test("no interactive control anywhere is under 44px on a phone", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto("/?touch");
  await page.waitForTimeout(1400);
  const total = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  const bad = new Set<string>();
  for (let i = 0; i <= 18; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round((total * i) / 18));
    await page.waitForTimeout(110);
    const found = await page.evaluate(() => {
      const out: string[] = [];
      for (const e of document.querySelectorAll(
        "button,a,input,textarea,[role=button]",
      )) {
        const cs = getComputedStyle(e);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        if (parseFloat(cs.opacity) < 0.05 || cs.pointerEvents === "none") continue;
        const r = e.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        if (r.bottom <= 0 || r.top >= window.innerHeight) continue;
        if (r.width < 44 || r.height < 44) {
          const t = (e.getAttribute("aria-label") || e.textContent || "")
            .trim()
            .slice(0, 30);
          out.push(`${t} (${Math.round(r.width)}x${Math.round(r.height)})`);
        }
      }
      return out;
    });
    found.forEach((f) => bad.add(f));
  }
  await ctx.close();
  expect([...bad]).toEqual([]);
});

test.describe("nothing overflows sideways at any phone width", () => {
  for (const v of PHONES.slice(0, 3)) {
    test(`${v.width}px`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: v.width, height: v.height },
      });
      const page = await ctx.newPage();
      await page.goto("/");
      await page.waitForTimeout(1200);
      const total = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      );
      let worst = 0;
      for (let i = 0; i <= 12; i++) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round((total * i) / 12));
        await page.waitForTimeout(100);
        worst = Math.max(
          worst,
          await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          ),
        );
      }
      await ctx.close();
      expect(worst).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("the bar control survives the whole journey", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test("stays on screen and keeps naming the current screen", async ({ page }) => {
    await page.goto("/?touch");
    await page.waitForTimeout(1300);
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
    });
    const total = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    const seen = new Set<string>();
    for (let i = 4; i <= 20; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((total * i) / 20));
      await page.waitForTimeout(110);
      const r = await page.evaluate(() => {
        const c = document.querySelector<HTMLElement>('[aria-controls="hud-menu"]');
        if (!c) return null;
        const b = c.getBoundingClientRect();
        return {
          offscreen: b.left < -1 || b.right > window.innerWidth + 1,
          label: (c.textContent || "").replace(/[^A-Z]/g, ""),
        };
      });
      expect(r).not.toBeNull();
      expect(r!.offscreen).toBe(false);
      seen.add(r!.label);
    }
    // It tracks the journey rather than showing one fixed label.
    expect(seen.size).toBeGreaterThan(1);
  });
});
