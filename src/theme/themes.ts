export interface ThemeTokens {
  bg: string;
  fg: string;
  dim: string;
  accent: string;
  green: string;
  amber: string;
  red: string;
  cite: string;
  selection: string;
}

export type ThemeName =
  | "tokyo-night"
  | "dracula"
  | "gruvbox"
  | "nord"
  | "catppuccin"
  | "paper";

export interface Theme {
  name: ThemeName;
  label: string;
  mode: "dark" | "light";
  tokens: ThemeTokens;
}

export const DEFAULT_THEME: ThemeName = "tokyo-night";
export const THEME_STORAGE_KEY = "zk.theme";

export const themes: Record<ThemeName, Theme> = {
  "tokyo-night": {
    name: "tokyo-night",
    label: "tokyo night",
    mode: "dark",
    tokens: {
      bg: "#1a1b26",
      fg: "#a9b1d6",
      dim: "#565f89",
      accent: "#7aa2f7",
      green: "#9ece6a",
      amber: "#e0af68",
      red: "#f7768e",
      cite: "#bb9af7",
      selection: "#33467c",
    },
  },
  dracula: {
    name: "dracula",
    label: "dracula",
    mode: "dark",
    tokens: {
      bg: "#282a36",
      fg: "#f8f8f2",
      dim: "#6272a4",
      accent: "#bd93f9",
      green: "#50fa7b",
      amber: "#f1fa8c",
      red: "#ff5555",
      cite: "#ff79c6",
      selection: "#44475a",
    },
  },
  gruvbox: {
    name: "gruvbox",
    label: "gruvbox",
    mode: "dark",
    tokens: {
      bg: "#282828",
      fg: "#ebdbb2",
      dim: "#928374",
      accent: "#83a598",
      green: "#b8bb26",
      amber: "#fabd2f",
      red: "#fb4934",
      cite: "#d3869b",
      selection: "#3c3836",
    },
  },
  nord: {
    name: "nord",
    label: "nord",
    mode: "dark",
    tokens: {
      bg: "#2e3440",
      fg: "#d8dee9",
      dim: "#4c566a",
      accent: "#88c0d0",
      green: "#a3be8c",
      amber: "#ebcb8b",
      red: "#bf616a",
      cite: "#b48ead",
      selection: "#434c5e",
    },
  },
  catppuccin: {
    name: "catppuccin",
    label: "catppuccin",
    mode: "dark",
    tokens: {
      bg: "#1e1e2e",
      fg: "#cdd6f4",
      dim: "#6c7086",
      accent: "#89b4fa",
      green: "#a6e3a1",
      amber: "#f9e2af",
      red: "#f38ba8",
      cite: "#cba6f7",
      selection: "#45475a",
    },
  },
  paper: {
    name: "paper",
    label: "paper",
    mode: "light",
    tokens: {
      bg: "#f6f5ee",
      fg: "#33322c",
      dim: "#8a887e",
      accent: "#1d6fa5",
      green: "#3b6d11",
      amber: "#a5670b",
      red: "#b3261e",
      cite: "#6a3fb0",
      selection: "#d8d5c4",
    },
  },
};

export const themeList: Theme[] = Object.values(themes);

/** Writes a theme's tokens as CSS custom properties on the target element. */
export function applyTheme(
  name: ThemeName,
  target: HTMLElement = document.documentElement,
): void {
  const theme = themes[name];
  if (!theme) return;
  const t = theme.tokens;
  target.style.setProperty("--term-bg", t.bg);
  target.style.setProperty("--term-fg", t.fg);
  target.style.setProperty("--term-dim", t.dim);
  target.style.setProperty("--term-accent", t.accent);
  target.style.setProperty("--term-green", t.green);
  target.style.setProperty("--term-amber", t.amber);
  target.style.setProperty("--term-red", t.red);
  target.style.setProperty("--term-cite", t.cite);
  target.style.setProperty("--term-selection", t.selection);
  target.style.colorScheme = theme.mode;
}

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && value in themes;
}
