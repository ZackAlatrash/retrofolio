import { useState } from "react";
import { useTheme } from "../theme/useTheme";

/**
 * A compact, always-visible theme switcher for visitors who will not open the
 * command palette. Docked top-right; expands to the palette list on click.
 */
export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const current = themes.find((t) => t.name === theme);

  return (
    <div
      style={{
        position: "fixed",
        top: 14,
        right: 14,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Change color theme"
        className="font-mono"
        style={{
          fontSize: 12,
          padding: "5px 11px",
          borderRadius: 8,
          cursor: "pointer",
          background: "color-mix(in srgb, var(--term-bg) 80%, transparent)",
          color: "var(--term-accent)",
          border: "1px solid var(--term-dim)",
          backdropFilter: "blur(6px)",
        }}
      >
        theme: {current?.label ?? theme}
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Themes"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 6,
            borderRadius: 10,
            background: "var(--term-bg)",
            border: "1px solid var(--term-dim)",
          }}
        >
          {themes.map((t) => (
            <button
              key={t.name}
              role="option"
              aria-selected={theme === t.name}
              onClick={() => {
                setTheme(t.name);
                setOpen(false);
              }}
              className="font-mono"
              style={{
                fontSize: 12,
                textAlign: "right",
                padding: "4px 10px",
                borderRadius: 6,
                cursor: "pointer",
                background: "transparent",
                color:
                  theme === t.name ? "var(--term-accent)" : "var(--term-fg)",
                border: "1px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
