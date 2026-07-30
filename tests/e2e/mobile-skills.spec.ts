import { test, expect } from "@playwright/test";

/**
 * The skills screen is a set of absolutely-positioned lanes sized for a wide
 * frame: a legend rail, a proof panel, a sky-chart minimap, a languages bar, a
 * stage badge and a SKY/LIST toggle. On a phone they landed on top of each
 * other, and the sky itself renders about six screens wide because it is scaled
 * to the frame height.
 *
 * On portrait the sky is not offered at all. The constellation reveal still
 * shows it (the list only mounts once the reveal is nearly done), and the list
 * carries the content.
 */

const SKILLS = "/?mock=skills";

const PHONES = [
  { name: "small", width: 320, height: 568 },
  { name: "common", width: 390, height: 844 },
  { name: "large", width: 430, height: 932 },
];

for (const p of PHONES) {
  test.describe(`skills at ${p.name} (${p.width}x${p.height})`, () => {
    test.use({ viewport: { width: p.width, height: p.height } });

    test("shows the list only, with no sky and no toggle", async ({ page }) => {
      await page.goto(SKILLS);
      await page.waitForTimeout(600);

      const r = await page.evaluate(() => ({
        toggle: !!document.querySelector("button[aria-pressed]"),
        sky: !!document.querySelector('svg[viewBox^="0 0 2040"]'),
      }));

      expect(r.toggle).toBe(false);
      // Not merely hidden: a 2040-unit starfield is not built at all.
      expect(r.sky).toBe(false);
    });

    test("no chrome prints over anything else", async ({ page }) => {
      await page.goto(SKILLS);
      await page.waitForTimeout(600);

      const collisions = await page.evaluate(() => {
        const blocks = [...document.querySelectorAll("div,button,ul,ol")].filter((e) => {
          const cs = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          return (
            (cs.position === "absolute" || cs.position === "fixed") &&
            cs.pointerEvents !== "none" &&
            r.width > 60 &&
            r.height > 20
          );
        });
        const hits: string[] = [];
        for (let i = 0; i < blocks.length; i++) {
          for (let j = i + 1; j < blocks.length; j++) {
            const a = blocks[i];
            const b = blocks[j];
            if (a.contains(b) || b.contains(a)) continue;
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
            const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
            if (ox > 18 && oy > 10) {
              hits.push(
                `${(a.textContent || "").trim().slice(0, 20)} | ${(b.textContent || "").trim().slice(0, 20)}`,
              );
            }
          }
        }
        return hits;
      });

      expect(collisions).toEqual([]);
    });

    test("every skill can be reached, and the languages sit at the end", async ({
      page,
    }) => {
      await page.goto(SKILLS);
      await page.waitForTimeout(600);

      const r = await page.evaluate(() => {
        const scroller = [...document.querySelectorAll("div")].find(
          (d) =>
            getComputedStyle(d).overflowY === "auto" && d.scrollHeight > d.clientHeight,
        );
        if (!scroller) return null;
        const leaves = [...scroller.querySelectorAll("*")].filter(
          (e) => e.children.length === 0 && (e.textContent || "").trim().length > 2,
        );
        const seen = new Set<number>();
        const max = scroller.scrollHeight - scroller.clientHeight;
        const sweep = () =>
          leaves.forEach((e, i) => {
            const b = e.getBoundingClientRect();
            if (b.top >= 0 && b.top < window.innerHeight) seen.add(i);
          });
        for (let y = 0; y <= max; y += 120) {
          scroller.scrollTop = y;
          sweep();
        }
        scroller.scrollTop = max;
        sweep();
        scroller.scrollTop = 0;
        return {
          total: leaves.length,
          reached: seen.size,
          languages: leaves.some((e) => (e.textContent || "").trim() === "LANGUAGES"),
        };
      });

      expect(r).not.toBeNull();
      expect(r!.total).toBeGreaterThan(50);
      expect(r!.reached).toBe(r!.total);
      // It used to be a fixed bar over the list; now it is the end of it.
      expect(r!.languages).toBe(true);
    });

    test("nothing overflows sideways", async ({ page }) => {
      await page.goto(SKILLS);
      await page.waitForTimeout(600);
      const r = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth - window.innerWidth,
        offscreen: [...document.querySelectorAll("*")].filter((e) => {
          const b = e.getBoundingClientRect();
          return b.width > 0 && (b.right > window.innerWidth + 1 || b.left < -1);
        }).length,
      }));
      expect(r.doc).toBeLessThanOrEqual(0);
      // The 316px grid floor used to overflow a 320px phone by 36px.
      expect(r.offscreen).toBe(0);
    });
  });
}

test.describe("the constellation reveal still happens on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the sky is what the reveal shows, before the list takes over", async ({
    page,
  }) => {
    // Mid-reveal: the list has not mounted yet.
    await page.goto("/?seq=0.86");
    await page.waitForTimeout(700);
    expect(await page.locator('svg[viewBox^="0 0 2040"]').count()).toBe(1);

    // Settled: the list carries the content.
    await page.goto("/?seq=0.93");
    await page.waitForTimeout(700);
    expect(await page.locator('svg[viewBox^="0 0 2040"]').count()).toBe(0);
    await expect(page.getByText("AI · RAG SYSTEMS").first()).toBeVisible();
  });
});

test.describe("skills on a desktop window", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("keeps the sky and the toggle", async ({ page }) => {
    await page.goto(SKILLS);
    await page.waitForTimeout(600);
    expect(await page.locator('svg[viewBox^="0 0 2040"]').count()).toBe(1);
    expect(await page.locator("button[aria-pressed]").count()).toBe(2);
  });
});
