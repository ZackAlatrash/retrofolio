import {
  labelUrl,
  shellUrl,
  statusColor,
  type ShowcaseEntry,
} from "./showcaseData";

// Where the cream label sits within the trimmed cartridge image (percentages).
const LABEL = { left: "16.2%", top: "23.7%", width: "63.9%", height: "46%" };

interface CartridgeProps {
  entry: ShowcaseEntry;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

/**
 * One cartridge standing on the open shelf ledge: no recessed box, just the
 * cart with a soft contact shadow and a small name tag beneath. Hover/selection
 * lifts and enlarges it.
 */
export function Cartridge({ entry, selected, onSelect, onOpen }: CartridgeProps) {
  const { project } = entry;
  const dot = statusColor(project);
  return (
    <button
      onMouseEnter={() => onSelect(entry.id)}
      onFocus={() => onSelect(entry.id)}
      onClick={() => onOpen(entry.id)}
      aria-label={`${project.name}: ${entry.genre}`}
      style={{
        position: "relative",
        width: "100%",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* the cart */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "716 / 592",
          transform: selected ? "translateY(-14px) scale(1.1)" : "none",
          transformOrigin: "bottom center",
          transition: "transform 0.18s ease, filter 0.18s ease",
          filter: selected
            ? "drop-shadow(0 16px 20px rgba(0,0,0,0.65)) brightness(1.1)"
            : "drop-shadow(0 6px 8px rgba(0,0,0,0.5))",
          zIndex: selected ? 2 : 1,
        }}
      >
        <img
          src={shellUrl(entry.shell)}
          alt=""
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
        <img
          src={labelUrl(entry.id)}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            left: LABEL.left,
            top: LABEL.top,
            width: LABEL.width,
            height: LABEL.height,
            objectFit: "cover",
            borderRadius: 2,
          }}
        />
      </div>

      {/* contact shadow on the ledge */}
      <div
        aria-hidden="true"
        style={{
          width: "72%",
          height: 10,
          marginTop: -5,
          borderRadius: "50%",
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.55), transparent 70%)",
          opacity: selected ? 0.35 : 0.7,
          transition: "opacity 0.18s ease",
        }}
      />

      {/* name tag */}
      <span
        className="font-mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          marginTop: 5,
          padding: "3px 8px",
          borderRadius: 4,
          fontSize: 8.5,
          letterSpacing: 0.3,
          whiteSpace: "nowrap",
          background: selected ? "rgba(122,162,247,0.16)" : "rgba(0,0,0,0.28)",
          color: selected ? "var(--term-fg)" : "#9298b4",
          transition: "background 0.18s ease, color 0.18s ease",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: dot,
            boxShadow: `0 0 5px ${dot}`,
            flex: "none",
          }}
        />
        {entry.plaque}
      </span>
    </button>
  );
}
