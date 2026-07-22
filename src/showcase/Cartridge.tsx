import {
  labelUrl,
  shellUrl,
  statusColor,
  type ShowcaseEntry,
} from "./showcaseData";

// Where the cream label sits within the (square) cartridge image, as a % of the
// image box. Tuned to the shell art; adjust here if the art changes.
const LABEL = { left: "16.2%", top: "23.7%", width: "63.9%", height: "46%" };

interface CartridgeProps {
  entry: ShowcaseEntry;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

/**
 * One cartridge standing in a recessed rack slot. The lower edge tucks behind
 * the slot's front lip (which carries the name plaque); hover/selection lifts
 * the cartridge out of the slot.
 */
export function Cartridge({ entry, selected, onSelect, onOpen }: CartridgeProps) {
  const { project } = entry;
  return (
    <button
      onMouseEnter={() => onSelect(entry.id)}
      onFocus={() => onSelect(entry.id)}
      onClick={() => onOpen(entry.id)}
      aria-label={`${project.name}: ${entry.genre}`}
      className="rack-slot"
      style={{
        position: "relative",
        background: "linear-gradient(180deg, #0b0c16 0%, #12131f 100%)",
        border: "1px solid #05060c",
        borderRadius: 5,
        boxShadow: selected
          ? "inset 0 10px 22px rgba(0,0,0,0.65), 0 0 14px rgba(122,162,247,0.22), 0 0 0 1px #3b4160"
          : "inset 0 10px 22px rgba(0,0,0,0.65), inset 0 -4px 10px rgba(0,0,0,0.4)",
        padding: "10px 8px 0",
        cursor: "pointer",
        overflow: "visible",
      }}
    >
      {/* cartridge (lifts on hover/select) */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          aspectRatio: "716 / 592",
          marginBottom: 10,
          transform: selected ? "translateY(-12px)" : "none",
          transition: "transform 0.16s ease",
          filter: selected
            ? "drop-shadow(0 10px 16px rgba(0,0,0,0.6)) brightness(1.08)"
            : "drop-shadow(0 4px 8px rgba(0,0,0,0.45))",
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

      {/* front lip with name plaque */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -1,
          right: -1,
          bottom: -1,
          height: 26,
          zIndex: 2,
          borderRadius: "0 0 5px 5px",
          background: "linear-gradient(180deg, #2b2d3d 0%, #1d1f2d 100%)",
          borderTop: "2px solid #0b0c14",
          border: "1px solid #05060c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          padding: "0 5px",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: statusColor(project),
            flex: "none",
            boxShadow: `0 0 5px ${statusColor(project)}`,
          }}
        />
        <span
          className="font-mono"
          style={{
            fontSize: 7.5,
            letterSpacing: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: selected ? "var(--term-fg)" : "#8a8fa8",
          }}
        >
          {entry.plaque}
        </span>
      </div>
    </button>
  );
}
