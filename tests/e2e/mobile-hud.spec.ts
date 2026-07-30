import { test, expect } from "@playwright/test";

/**
 * The HUD nav placed four items at fixed centres `gap` apart, with `gap`
 * floored at 100px. That makes the group about 426px wide whatever the screen
 * is, so on every phone width the first item ran off the left edge, the last
 * off the right, adjacent items overlapped by 19-31px, and the player chip and
 * the language key printed straight through the ones at the ends.
 *
 * Narrow (and any touch device) now gets a real row instead.
 */

const NAV = /PROJECTS|ABOUT|SKILLS|CONTACT/;

const readNav = () =>
  ({
    async run(page: import("@playwright/test").Page) {
      return page.evaluate(() => {
        const items = [...document.querySelectorAll("button")]
          .filter((b) => /PROJECTS|ABOUT|SKILLS|CONTACT/.test(b.textContent || ""))
          .map((b) => {
            const r = b.getBoundingClientRect();
            return {
              t: (b.textContent || "").trim(),
              l: r.left,
              r: r.right,
              w: r.width,
              h: r.height,
            };
          });
        const chrome = ["Back to title", "Language"].map((name) => {
          const el = document.querySelector<HTMLElement>(`[aria-label="${name}"]`);
          const r = el?.getBoundingClientRect();
          return r ? { name, l: r.left, r: r.right, w: r.width, h: r.height } : null;
        });
        return { items, chrome: chrome.filter(Boolean) as { name: string; l: number; r: number; w: number; h: number }[] };
      });
    },
  }).run;

/** Park where the HUD bar has fully formed. */
async function toHud(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.waitForTimeout(1200);
  const total = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.3));
  await page.waitForTimeout(600);
}

const WIDTHS = [
  { name: "smallest phone", width: 320, height: 568 },
  { name: "common phone", width: 390, height: 844 },
  { name: "large phone", width: 430, height: 932 },
  { name: "landscape phone", width: 844, height: 390 },
  { name: "narrow window", width: 759, height: 900 },
];

for (const v of WIDTHS) {
  test.describe(`hud at ${v.name} (${v.width}x${v.height})`, () => {
    test.use({ viewport: { width: v.width, height: v.height }, hasTouch: true });

    test("every nav item is on screen, clear of its neighbours and of the chrome", async ({
      page,
    }) => {
      await toHud(page);
      const { items, chrome } = await readNav()(page);
      expect(items).toHaveLength(4);

      for (const it of items) {
        expect(it.l, `${it.t} left edge`).toBeGreaterThanOrEqual(-1);
        expect(it.r, `${it.t} right edge`).toBeLessThanOrEqual(v.width + 1);
      }
      for (let i = 0; i < items.length - 1; i++) {
        expect(
          items[i + 1].l,
          `${items[i].t} overlaps ${items[i + 1].t}`,
        ).toBeGreaterThanOrEqual(items[i].r - 1);
      }
      const chip = chrome.find((c) => c.name === "Back to title")!;
      const key = chrome.find((c) => c.name === "Language")!;
      for (const it of items) {
        expect(it.l, `${it.t} over the player chip`).toBeGreaterThanOrEqual(chip.r - 1);
        expect(it.r, `${it.t} over the language key`).toBeLessThanOrEqual(key.l + 1);
      }
    });

    test("nav items and bar controls are full touch targets", async ({ page }) => {
      await toHud(page);
      const { items, chrome } = await readNav()(page);
      for (const it of items) {
        expect(Math.round(it.h), `${it.t} height`).toBeGreaterThanOrEqual(44);
        expect(Math.round(it.w), `${it.t} width`).toBeGreaterThanOrEqual(44);
      }
      for (const c of chrome) {
        expect(Math.round(c.h), `${c.name} height`).toBeGreaterThanOrEqual(44);
        expect(Math.round(c.w), `${c.name} width`).toBeGreaterThanOrEqual(44);
      }
    });

    test("tapping a nav item goes to that screen", async ({ page }) => {
      await toHud(page);
      await page.getByRole("button", { name: /CONTACT/ }).tap();
      await page.waitForTimeout(1400);
      const atContact = await page.evaluate(() => {
        const el = document.getElementById("contact");
        return el ? el.getBoundingClientRect().top <= window.innerHeight * 0.5 : false;
      });
      expect(atContact).toBe(true);
    });
  });
}

test.describe("hud on a desktop window", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("keeps the spaced menu, the player name and the coin", async ({ page }) => {
    await toHud(page);
    const { items } = await readNav()(page);
    expect(items).toHaveLength(4);
    // The numeral prefixes are part of the wide treatment.
    expect(items.some((i) => /^01/.test(i.t))).toBe(true);
    // Scoped to the player chip: the hero title carries the same words.
    await expect(
      page.getByRole("button", { name: "Back to title" }),
    ).toContainText("ZACK ALATRASH");
    for (const it of items) {
      expect(it.l).toBeGreaterThanOrEqual(-1);
      expect(it.r).toBeLessThanOrEqual(1281);
    }
  });
});

test.describe("the scroll cue keeps clear of the help button", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("cue text and the help button do not overlap", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1400);
    const r = await page.evaluate(() => {
      const cue = document.querySelector(".cue-txt");
      const fab = document.querySelector('[aria-label*="Ask about"]');
      if (!cue || !fab) return null;
      const a = cue.getBoundingClientRect();
      const b = fab.getBoundingClientRect();
      return { overlap: !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom) };
    });
    expect(r).not.toBeNull();
    expect(r!.overlap).toBe(false);
  });
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
      for (const e of document.querySelectorAll("button,a,input,textarea,[role=button]")) {
        const cs = getComputedStyle(e);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        if (parseFloat(cs.opacity) < 0.05 || cs.pointerEvents === "none") continue;
        const r = e.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        if (r.bottom <= 0 || r.top >= window.innerHeight) continue;
        if (r.width < 44 || r.height < 44) {
          const t = (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 30);
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
  for (const v of WIDTHS.slice(0, 3)) {
    test(`${v.width}px`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height } });
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

test.describe("nav labels stay readable", () => {
  test.use({ viewport: { width: 320, height: 568 }, hasTouch: true });
  test("no nav label falls below 10px even at the smallest width", async ({ page }) => {
    await toHud(page);
    const sizes = await page.evaluate(() =>
      [...document.querySelectorAll("button")]
        .filter((b) => /PROJECTS|ABOUT|SKILLS|CONTACT/.test(b.textContent || ""))
        .map((b) => parseFloat(getComputedStyle(b).fontSize)),
    );
    expect(sizes).toHaveLength(4);
    for (const s of sizes) expect(s).toBeGreaterThanOrEqual(10);
  });
});

test.describe("nav is present through the whole journey", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test("all four items stay on screen at every scroll depth", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1300);
    const total = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    for (let i = 3; i <= 20; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((total * i) / 20));
      await page.waitForTimeout(110);
      const bad = await page.evaluate(() =>
        [...document.querySelectorAll("button")]
          .filter((b) => /PROJECTS|ABOUT|SKILLS|CONTACT/.test(b.textContent || ""))
          .filter((b) => {
            const r = b.getBoundingClientRect();
            return r.left < -1 || r.right > window.innerWidth + 1;
          })
          .map((b) => (b.textContent || "").trim()),
      );
      expect(bad, `at ${Math.round((total * i) / 20)}px`).toEqual([]);
    }
  });
});

// Keeps the linter honest about the unused regex if the file is trimmed later.
void NAV;
