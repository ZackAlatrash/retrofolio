import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  DEFAULT_THEME,
  isThemeName,
  themeList,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemeName,
} from "./themes";

export interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
  themes: Theme[];
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeName(stored)) return stored;
  } catch {
    /* localStorage may be unavailable; fall through to default */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore persistence failures */
    }
  }, [theme]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeState(name);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, themes: themeList }),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
