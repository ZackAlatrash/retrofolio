import { useSettings } from "./settings";

/** A full-screen scanline + vignette overlay, toggled by the CRT control. */
export function CrtOverlay() {
  const { crt } = useSettings();
  if (!crt) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        pointerEvents: "none",
        backgroundImage:
          "repeating-linear-gradient(rgba(0,0,0,0.16) 0 1px, transparent 1px 3px)",
        mixBlendMode: "multiply",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 62%, rgba(0,0,0,0.55))",
        }}
      />
    </div>
  );
}
