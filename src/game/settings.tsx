import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "nl";

interface Settings {
  lang: Lang;
  setLang: (l: Lang) => void;
  crt: boolean;
  toggleCrt: () => void;
  sound: boolean;
  toggleSound: () => void;
}

const SettingsContext = createContext<Settings | null>(null);

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}
function readLang(): Lang {
  try {
    return localStorage.getItem("zk.lang") === "nl" ? "nl" : "en";
  } catch {
    return "en";
  }
}
function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);
  const [crt, setCrt] = useState<boolean>(() => readBool("zk.crt", false));
  const [sound, setSound] = useState<boolean>(() => readBool("zk.sound", false));

  useEffect(() => persist("zk.lang", lang), [lang]);
  useEffect(() => persist("zk.crt", crt ? "1" : "0"), [crt]);
  useEffect(() => persist("zk.sound", sound ? "1" : "0"), [sound]);

  const value = useMemo<Settings>(
    () => ({
      lang,
      setLang: setLangState,
      crt,
      toggleCrt: () => setCrt((v) => !v),
      sound,
      toggleSound: () => setSound((v) => !v),
    }),
    [lang, crt, sound],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

/** Convenience for language-aware copy: pick(lang, { en, nl }). */
export function pick(lang: Lang, copy: { en: string; nl: string }): string {
  return copy[lang] ?? copy.en;
}
