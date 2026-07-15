import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { TerminalLayer } from "../src/terminal/TerminalLayer";

function setReducedMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function renderLayer() {
  return render(
    <ThemeProvider>
      <TerminalLayer />
    </ThemeProvider>,
  );
}

function openPalette() {
  fireEvent.keyDown(document, { key: "k", metaKey: true });
}

function submitCommand(value: string) {
  const input = screen.getByRole("textbox") as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
  const form = input.closest("form");
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
}

beforeEach(() => {
  setReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CommandPalette open/close", () => {
  it("opens on a simulated Cmd/Ctrl-K", () => {
    renderLayer();
    expect(screen.queryByRole("dialog")).toBeNull();
    openPalette();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("also opens on the backtick key", () => {
    renderLayer();
    fireEvent.keyDown(document, { key: "`" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    renderLayer();
    openPalette();
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("running commands applies the right effect", () => {
  it("scrolls to the target section for a navigation command", () => {
    const getById = vi.spyOn(document, "getElementById");
    renderLayer();
    openPalette();
    submitCommand("skills");
    expect(getById).toHaveBeenCalledWith("skills");
  });

  it("dispatches zk:ask with the question for `ask`", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");
    renderLayer();
    openPalette();
    submitCommand('ask "does he know AWS?"');

    const askCall = dispatch.mock.calls.find(
      ([ev]) => ev instanceof Event && ev.type === "zk:ask",
    );
    expect(askCall).toBeTruthy();
    const event = askCall![0] as CustomEvent<{ question?: string }>;
    expect(event.detail.question).toBe("does he know AWS?");
  });

  it("switches theme via the theme command", () => {
    renderLayer();
    openPalette();
    submitCommand("theme dracula");
    // Theme is applied to :root as CSS custom properties by the ThemeProvider.
    expect(
      document.documentElement.style.getPropertyValue("--term-bg"),
    ).toBe("#282a36");
  });
});
