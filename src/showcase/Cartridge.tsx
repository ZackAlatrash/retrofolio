import {
  labelUrl,
  shellUrl,
  statusColor,
  type ShowcaseEntry,
} from "./showcaseData";

// Where the cream label sits within the (square) cartridge image, as a % of the
// image box. Tuned to the shell art; adjust here if the art changes.
const LABEL = { left: "26.5%", top: "35%", width: "47%", height: "28%" };

interface CartridgeProps {
  entry: ShowcaseEntry;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

export function Cartridge({ entry, selected, onSelect, onOpen }: CartridgeProps) {
  const { project } = entry;
  return (
    <button
      onMouseEnter={() => onSelect(entry.id)}
      onFocus={() => onSelect(entry.id)}
      onClick={() => onOpen(entry.id)}
      aria-label={`${project.name}: ${entry.genre}`}
      className="cartridge"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          transform: selected ? "translateY(-8px)" : "none",
          filter: selected ? "drop-shadow(0 8px 14px rgba(0,0,0,0.5))" : "none",
          transition: "transform 0.15s ease, filter 0.15s ease",
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
          }}
        />
        {selected && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: LABEL.left,
              top: LABEL.top,
              width: LABEL.width,
              height: LABEL.height,
              boxShadow: "inset 0 0 0 2px var(--term-green)",
            }}
          />
        )}
      </div>
      <span
        className="font-mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          letterSpacing: 0.3,
          color: selected ? "var(--term-fg)" : "var(--term-dim)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: statusColor(project),
            flex: "none",
          }}
        />
        {project.name}
      </span>
    </button>
  );
}
