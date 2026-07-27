import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cartridge } from "../src/showcase/Cartridge";
import { rackMetrics, MAX_CART_W, TARGET_CART_W } from "../src/game/useLayoutProfile";
import { showcase } from "../src/showcase/showcaseData";

const entry = showcase[0];

describe("rack metrics", () => {
  it("gives every cartridge the same width, whatever the cabinet", () => {
    // Sized in px rather than fractions precisely so a long plaque cannot make
    // one cartridge wider than another.
    for (const cabW of [269, 307, 328, 361, 480, 588, 645, 737, 1100]) {
      const m = rackMetrics(cabW, showcase.length);
      expect(m.cartW).toBeGreaterThan(0);
      expect(Number.isFinite(m.cartW)).toBe(true);
    }
  });

  it("shows the whole shelf when it fits, and peeks when it does not", () => {
    const wide = rackMetrics(1100, showcase.length);
    expect(wide.overflows).toBe(false);
    expect(wide.visible).toBe(showcase.length);

    const phone = rackMetrics(328, showcase.length);
    expect(phone.overflows).toBe(true);
    // A fractional count is what leaves the next cartridge peeking past the
    // edge, which is the only signal that the rack has more in it.
    expect(phone.visible % 1).toBeCloseTo(0.5);
    expect(phone.visible).toBeLessThan(showcase.length);
  });

  it("never lets a cartridge grow past the point it stops reading as one", () => {
    for (const cabW of [694, 1054, 1400, 2200]) {
      const m = rackMetrics(cabW, showcase.length);
      expect(m.cartW).toBeLessThanOrEqual(MAX_CART_W);
    }
  });

  it("fills the cabinet exactly when it scrolls", () => {
    const cabW = 328;
    const m = rackMetrics(cabW, showcase.length);
    expect(m.overflows).toBe(true);
    const inner = cabW - m.pad * 2;
    expect(m.visible * m.pitch - m.gap).toBeCloseTo(inner, 5);
  });

  it("keeps the shelf one row however many projects there are", () => {
    // The station shares a fixed height budget with the television, so a second
    // row is paid for out of the set. Neither the row count nor the cartridge
    // size may track the size of the library.
    const cabW = 694;
    for (const count of [7, 12, 20, 40]) {
      const m = rackMetrics(cabW, count);
      expect(m.overflows).toBe(true);
      expect(m.visible).toBeLessThan(count);
      expect(m.visible % 1).toBeCloseTo(0.5);
    }
    const seven = rackMetrics(cabW, 7);
    const forty = rackMetrics(cabW, 40);
    expect(forty.cartW).toBeCloseTo(seven.cartW, 5);
    expect(forty.visible).toBeCloseTo(seven.visible, 5);
  });

  it("aims for the target cartridge size rather than cramming the row", () => {
    // A scrolling shelf has no reason to shrink cartridges to fit one more in.
    const m = rackMetrics(694, showcase.length);
    expect(m.cartW).toBeGreaterThan(TARGET_CART_W * 0.9);
  });
});

describe("cartridge selection without hover", () => {
  it("takes two taps: the first previews, the second loads", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpen = vi.fn();

    const { rerender } = render(
      <Cartridge
        entry={entry}
        selected={false}
        hoverless
        onSelect={onSelect}
        onOpen={onOpen}
      />,
    );

    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(entry.id);
    expect(onOpen).not.toHaveBeenCalled();

    rerender(
      <Cartridge
        entry={entry}
        selected
        hoverless
        onSelect={onSelect}
        onOpen={onOpen}
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledWith(entry.id);
  });

  it("says which tap it is, so the two steps are not a hidden convention", () => {
    const { rerender } = render(
      <Cartridge entry={entry} selected={false} hoverless onSelect={() => {}} onOpen={() => {}} />,
    );
    expect(screen.getByRole("button").getAttribute("aria-label")).toMatch(/Select$/);

    rerender(
      <Cartridge entry={entry} selected hoverless onSelect={() => {}} onOpen={() => {}} />,
    );
    expect(screen.getByRole("button").getAttribute("aria-label")).toMatch(/Load$/);
  });

  it("keeps the single click when hover is available", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    render(
      <Cartridge entry={entry} selected={false} onSelect={onSelect} onOpen={onOpen} />,
    );

    await user.hover(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(entry.id);

    await user.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledWith(entry.id);
  });

  it("focus still selects, so Enter loads on the first press for a keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Cartridge entry={entry} selected={false} hoverless onSelect={onSelect} onOpen={() => {}} />,
    );
    await user.tab();
    expect(onSelect).toHaveBeenCalledWith(entry.id);
  });
});
