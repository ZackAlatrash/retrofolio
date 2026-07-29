import { test, expect } from "@playwright/test";

/**
 * The About beat had two mobile faults.
 *
 * The card's grid collapses to one column on a phone, so its natural height
 * went from 831px to 2300px. It was scaled to fit with a 0.55 floor, which was
 * not enough: it rendered 1265px tall inside a 844px pinned stage with no
 * scroll container, cut off 210px at the top and 210px at the bottom, and the
 * prose that survived was 7.2px.
 *
 * And the handheld's screen was placed by percentages of the layer while the
 * lap art was `object-fit: cover`, so on portrait the overlay landed at 26% of
 * the real screen's width, in the middle of it. That rect is also the camera's
 * zoom target.
 */

/** Parked where the card has resolved inside the handheld. */
const CARD = "/?seq=0.65";
/** Parked mid-boot, where the handheld's screen is lit. */
const BOOT = "/?seq=0.50";

const PHONES = [
  { name: "small", width: 320, height: 568 },
  { name: "common", width: 390, height: 844 },
  { name: "large", width: 430, height: 932 },
  { name: "tablet", width: 768, height: 1024 },
];

for (const p of PHONES) {
  test.describe(`about card at ${p.name} (${p.width}x${p.height})`, () => {
    test.use({ viewport: { width: p.width, height: p.height } });

    test("every part of the card can be reached", async ({ page }) => {
      await page.goto(CARD);
      await page.waitForTimeout(700);

      const result = await page.evaluate(() => {
        const hdr = [...document.querySelectorAll("div")].find(
          (d) =>
            d.children.length === 0 &&
            (d.textContent || "").trim() === "// PLAYER 01 · ABOUT",
        );
        if (!hdr) return null;
        const container = hdr.parentElement!.parentElement!.parentElement!;
        const leaves = [...container.querySelectorAll("*")].filter(
          (e) => e.children.length === 0 && (e.textContent || "").trim().length > 2,
        );
        const seen = new Set<number>();
        const max = container.scrollHeight - container.clientHeight;
        // The test is whether the start of every block can be brought into
        // view, not whether it fits on one screen: on a 320px phone the profile
        // paragraph alone is 786px tall and never could.
        const sweep = () =>
          leaves.forEach((e, i) => {
            const r = e.getBoundingClientRect();
            if (r.top >= 0 && r.top < window.innerHeight) seen.add(i);
          });
        for (let y = 0; y <= max; y += 100) {
          container.scrollTop = y;
          sweep();
        }
        container.scrollTop = max;
        sweep();
        container.scrollTop = 0;
        return { total: leaves.length, reached: seen.size };
      });

      expect(result).not.toBeNull();
      expect(result!.total).toBeGreaterThan(10);
      expect(result!.reached).toBe(result!.total);
    });

    test("the prose stays readable rather than being squeezed", async ({ page }) => {
      await page.goto(CARD);
      await page.waitForTimeout(700);

      const px = await page.evaluate(() => {
        const hdr = [...document.querySelectorAll("div")].find(
          (d) =>
            d.children.length === 0 &&
            (d.textContent || "").trim() === "// PLAYER 01 · ABOUT",
        )!;
        const wrap = hdr.parentElement!.parentElement!;
        const m = /scale\(([\d.]+)\)/.exec(wrap.style.transform || "");
        const scale = m ? parseFloat(m[1]) : 1;
        const prose = [...document.querySelectorAll("*")].find(
          (e) =>
            e.children.length === 0 &&
            (e.textContent || "").trim().startsWith("I'm an AI/LLM"),
        )!;
        return parseFloat(getComputedStyle(prose).fontSize) * scale;
      });

      // It used to render at 7.2px on a 390px phone.
      expect(px).toBeGreaterThanOrEqual(12);
    });
  });
}

for (const p of PHONES.slice(0, 3)) {
  test.describe(`handheld screen at ${p.name}`, () => {
    test.use({ viewport: { width: p.width, height: p.height } });

    test("the screen overlay sits on the screen in the artwork", async ({ page }) => {
      await page.goto(BOOT);
      await page.waitForTimeout(700);

      const m = await page.evaluate(() => {
        const img = document.querySelector<HTMLImageElement>('img[src*="lap.webp"]');
        if (!img) return null;
        const artBox = img.parentElement!;
        const overlay = artBox.children[1] as HTMLElement;
        // The measured screen rect, as a percentage of the source art.
        const L = { left: 37.94, top: 34.24, width: 24.06, height: 29.17 };
        const a = artBox.getBoundingClientRect();
        const o = overlay.getBoundingClientRect();
        return {
          artAspectOk: Math.abs(a.width / a.height - 1376 / 768) < 0.01,
          dLeft: Math.abs(o.left - (a.left + (L.left / 100) * a.width)),
          dWidth: Math.abs(o.width - (L.width / 100) * a.width),
          dTop: Math.abs(o.top - (a.top + (L.top / 100) * a.height)),
          dHeight: Math.abs(o.height - (L.height / 100) * a.height),
        };
      });

      expect(m).not.toBeNull();
      // The art must be laid out in a box of its own aspect, or the percentages
      // and the picture disagree the moment it crops.
      expect(m!.artAspectOk).toBe(true);
      expect(m!.dLeft).toBeLessThan(1.5);
      expect(m!.dWidth).toBeLessThan(1.5);
      expect(m!.dTop).toBeLessThan(1.5);
      expect(m!.dHeight).toBeLessThan(1.5);
    });
  });
}

test.describe("about on a desktop window", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("still scales to fit rather than scrolling", async ({ page }) => {
    await page.goto(CARD);
    await page.waitForTimeout(700);

    const r = await page.evaluate(() => {
      const hdr = [...document.querySelectorAll("div")].find(
        (d) =>
          d.children.length === 0 &&
          (d.textContent || "").trim() === "// PLAYER 01 · ABOUT",
      )!;
      const wrap = hdr.parentElement!.parentElement!;
      const container = wrap.parentElement!;
      const rect = wrap.getBoundingClientRect();
      return {
        scrolls: container.scrollHeight > container.clientHeight,
        cut:
          Math.max(0, -rect.top) + Math.max(0, rect.bottom - window.innerHeight),
      };
    });

    expect(r.scrolls).toBe(false);
    expect(r.cut).toBe(0);
  });
});
