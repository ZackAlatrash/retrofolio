import { describe, it, expect, beforeEach } from "vitest";
import {
  applyTheme,
  DEFAULT_THEME,
  isThemeName,
  themes,
  themeList,
  type ThemeTokens,
} from "../src/theme/themes";

const REQUIRED_NAMES = [
  "tokyo-night",
  "dracula",
  "gruvbox",
  "nord",
  "catppuccin",
  "paper",
];

const TOKEN_KEYS: (keyof ThemeTokens)[] = [
  "bg",
  "fg",
  "dim",
  "accent",
  "green",
  "amber",
  "red",
  "cite",
  "selection",
];

describe("themes", () => {
  it("defines the six launch palettes", () => {
    expect(Object.keys(themes).sort()).toEqual([...REQUIRED_NAMES].sort());
    expect(themeList).toHaveLength(6);
  });

  it("every theme defines all nine tokens as hex values", () => {
    for (const theme of themeList) {
      for (const key of TOKEN_KEYS) {
        expect(theme.tokens[key], `${theme.name}.${key}`).toMatch(
          /^#[0-9a-fA-F]{6}$/,
        );
      }
    }
  });

  it("defaults to tokyo-night", () => {
    expect(DEFAULT_THEME).toBe("tokyo-night");
  });

  it("paper is the only light theme", () => {
    const light = themeList.filter((t) => t.mode === "light");
    expect(light.map((t) => t.name)).toEqual(["paper"]);
  });

  it("isThemeName guards correctly", () => {
    expect(isThemeName("dracula")).toBe(true);
    expect(isThemeName("nope")).toBe(false);
    expect(isThemeName(42)).toBe(false);
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
  });

  it("writes CSS custom properties for the chosen theme", () => {
    applyTheme("dracula");
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--term-bg")).toBe("#282a36");
    expect(root.style.getPropertyValue("--term-accent")).toBe("#bd93f9");
    expect(root.style.colorScheme).toBe("dark");
  });

  it("sets light color-scheme for paper", () => {
    applyTheme("paper");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.style.getPropertyValue("--term-bg")).toBe(
      "#f6f5ee",
    );
  });
});
