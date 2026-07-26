/**
 * Shared furniture for the detail screen's signature modules.
 *
 * The ink values are checked against the panel background for WCAG AA by
 * tests/system-map.test.tsx. They live here so three modules cannot drift into
 * three slightly different greys.
 */

export const PIXEL = '"Press Start 2P", ui-monospace, monospace';

/** Primary text. */
export const INK = "#eef0fa";
/** Body copy. */
export const INK_2 = "#b9c0dd";
/** Supporting detail. Still AA at 12px. */
export const INK_3 = "#98a1c6";

/** The background these inks are measured against. */
export const PANEL_BG = "#212845";

/**
 * Allowed and refused are semantic, so they never take the cartridge accent:
 * a red-shelled project would otherwise paint "granted" and "denied" the same
 * colour. Both clear AA against the panel background.
 */
export const ALLOW = "#8fd6a4";
export const DENY = "#f0918c";

export function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid #2b3152",
        borderRadius: 10,
        padding: "13px 14px",
        background: "rgba(20,25,44,0.6)",
      }}
    >
      {children}
    </div>
  );
}

export function PanelHead({
  accent,
  title,
  children,
}: {
  accent: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontFamily: PIXEL, fontSize: 10, color: accent }}>{title}</span>
      <span className="font-mono" style={{ fontSize: 12, color: INK_3, flex: 1 }}>
        {children}
      </span>
    </div>
  );
}

/** The module's own heading, above its panels. */
export function ModuleHead({
  accent,
  title,
  claim,
}: {
  accent: string;
  title: string;
  claim: string;
}) {
  return (
    <div>
      <span style={{ fontFamily: PIXEL, fontSize: 10, color: accent, letterSpacing: 0.5 }}>
        {title}
      </span>
      <p
        className="font-mono"
        style={{ fontSize: 12.5, color: INK_2, lineHeight: 1.7, margin: "9px 0 0" }}
      >
        {claim}
      </p>
    </div>
  );
}
