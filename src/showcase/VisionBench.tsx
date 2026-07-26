import { useState } from "react";
import type { ModelResult, VisionBench as VisionBenchData } from "../content/types";
import { ALLOW, DENY, INK, INK_2, INK_3, ModuleHead, Panel, PanelHead } from "./detailUi";

interface VisionBenchProps {
  bench: VisionBenchData;
  accent: string;
}

/**
 * Frame proportions follow the field imagery itself rather than a tidy
 * panorama, because the shape of the input is what decides how it gets cut up.
 */
const FRAME = { w: 420, h: 280 };
const TILE = 160;

/**
 * Six overlapping crops in a grid. A frame this shape is not covered by a
 * single row of tiles, so drawing one would flatter the method.
 */
const TILES = [0, 120].flatMap((y) => [0, 130, 260].map((x) => ({ x, y, w: TILE, h: TILE })));

/**
 * Real plants in the field art, found by locating its bright blooms rather than
 * placed by eye, so every box sits on something that is actually there.
 * `big` marks the open blooms: the only ones large enough to survive being
 * squeezed into a single model input. The buds and shoots are what one pass
 * loses, and five of the twelve straddle a seam so the duplicates are real too.
 */
const SPROUTS = [
  { x: 77, y: 81, big: true },
  { x: 132, y: 83, big: true },
  { x: 150, y: 116, big: true },
  { x: 181, y: 76, big: true },
  { x: 184, y: 183, big: true },
  { x: 235, y: 139, big: true },
  { x: 301, y: 122, big: true },
  { x: 88, y: 157, big: true },
  { x: 60, y: 256, big: true },
  { x: 100, y: 20 },
  { x: 119, y: 42 },
  { x: 213, y: 27 },
  { x: 276, y: 11 },
  { x: 297, y: 56 },
  { x: 298, y: 31 },
  { x: 281, y: 173 },
  { x: 233, y: 260 },
  { x: 323, y: 241 },
];

/** A plant sits in an overlap when more than one crop contains it. */
function tilesCovering(x: number, y: number) {
  return TILES.filter((t) => x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h);
}

/**
 * The tiled-inference method as a four-step diagram, plus the like-for-like
 * model study.
 *
 * The method is spatial, so it is drawn rather than described: the whole point
 * is what happens to a small object when a large photograph is squeezed, and
 * what the overlap between crops costs you before it is cleaned up.
 */
export function VisionBench({ bench, accent }: VisionBenchProps) {
  const [step, setStep] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ModuleHead accent={accent} title="★ TILED INFERENCE" claim={bench.claim} />

      <Panel>
        <PanelHead accent={accent} title="THE METHOD">
          step {step + 1} of {bench.tiling.steps.length}
        </PanelHead>

        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "12px 0 11px" }}>
          {bench.tiling.steps.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setStep(i)}
              aria-pressed={step === i}
              className="font-mono coach-chip"
              style={{
                fontSize: 12,
                padding: "6px 11px",
                borderRadius: 7,
                cursor: "pointer",
                color: step === i ? INK : INK_2,
                background: step === i ? `${accent}26` : "rgba(34,41,71,0.95)",
                borderStyle: "solid",
                borderWidth: 1,
                borderBottomWidth: 2,
                borderColor: step === i ? accent : "#737ebb",
              }}
            >
              {String(i + 1).padStart(2, "0")} {s.label}
            </button>
          ))}
        </div>

        <TileDiagram step={step} accent={accent} image={bench.tiling.image} />

        <p
          className="font-mono"
          style={{ fontSize: 12.5, color: INK_2, lineHeight: 1.7, margin: "11px 0 0" }}
        >
          {bench.tiling.steps[step].detail}
        </p>
        <p
          className="font-mono"
          style={{ fontSize: 11.5, color: INK_3, lineHeight: 1.6, margin: "8px 0 0" }}
        >
          {bench.tiling.note}
        </p>
      </Panel>

      <Panel>
        <PanelHead accent={accent} title="FOUR ARCHITECTURES, ONE DATASET">
          scored the same way
        </PanelHead>
        <div style={{ margin: "12px 0 0" }}>
          {bench.models.map((m) => (
            <ModelRow key={m.name} model={m} accent={accent} />
          ))}
        </div>
        <p
          className="font-mono"
          style={{ fontSize: 12, color: INK_3, lineHeight: 1.7, margin: "11px 0 0" }}
        >
          {bench.protocol}
        </p>
      </Panel>

      <Panel>
        <PanelHead accent={accent} title="WHAT SHIPPED AROUND IT">
          the models were the team's, the platform was mine
        </PanelHead>
        <ul style={{ listStyle: "none", margin: "11px 0 0", padding: 0 }}>
          {bench.shipped.map((item, i) => (
            <li
              key={item.label}
              style={{ padding: "9px 0", borderTop: i === 0 ? "none" : "1px solid #2b3152" }}
            >
              <div className="font-mono" style={{ fontSize: 12.5, color: INK }}>
                {item.label}
              </div>
              <div
                className="font-mono"
                style={{ fontSize: 12, color: INK_2, lineHeight: 1.65, marginTop: 3 }}
              >
                {item.detail}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function TileDiagram({
  step,
  accent,
  image,
}: {
  step: number;
  accent: string;
  image?: string;
}) {
  const showTiles = step >= 1;
  const showBoxes = step >= 2;
  const merged = step >= 3;

  return (
    <svg
      viewBox={`0 0 ${FRAME.w} ${FRAME.h}`}
      role="img"
      aria-label={
        [
          "The whole frame shrunk to fit one model input, with only the open blooms still detectable",
          "The frame cut into six overlapping crops, three across and two down",
          "Every plant detected, with duplicates where the crops overlap",
          "Duplicates merged, one box per plant",
        ][step]
      }
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        borderRadius: 8,
        border: "1px solid #3a4166",
        background: "rgba(12,16,30,0.75)",
      }}
    >
      {/* The flat field is always underneath, so a missing asset degrades to
          the plain diagram rather than a blank rectangle. */}
      <rect x={0} y={0} width={FRAME.w} height={FRAME.h} fill="rgba(30,40,60,0.35)" />
      {image && (
        <>
          <image
            href={`${import.meta.env.BASE_URL}${image}`}
            x={0}
            y={0}
            width={FRAME.w}
            height={FRAME.h}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            style={{ imageRendering: "pixelated" }}
          />
          {/* the overlay has to stay legible over the art */}
          <rect x={0} y={0} width={FRAME.w} height={FRAME.h} fill="rgba(8,11,22,0.42)" />
        </>
      )}

      {/* step 0: everything squeezed into one model input */}
      {step === 0 && (
        <rect
          x={FRAME.w / 2 - 74}
          y={FRAME.h / 2 - 74}
          width={148}
          height={148}
          fill="none"
          stroke={accent}
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
      )}

      {showTiles &&
        TILES.map((t, i) => (
          <rect
            key={i}
            x={t.x}
            y={t.y}
            width={t.w}
            height={t.h}
            fill={`${accent}0e`}
            stroke={accent}
            strokeWidth={1.2}
            strokeDasharray="5 4"
          />
        ))}

      {SPROUTS.map((s, i) => {
        const covering = tilesCovering(s.x, s.y);
        const duplicated = showBoxes && !merged && covering.length > 1;
        // Before tiling, only the large sprouts survive the downscale.
        const found = step === 0 ? !!s.big : showBoxes;
        const r = s.big ? 5 : 3.4;

        return (
          <g key={i}>
            {/* Without the field art the plants need stand-ins. With it, they
                are already there and a dot would only cover one up. */}
            {!image && (
              <circle
                cx={s.x}
                cy={s.y}
                r={r}
                fill={INK_3}
                opacity={step === 0 && !s.big ? 0.3 : 0.85}
              />
            )}
            {found && !duplicated && (
              <rect
                x={s.x - r - 5}
                y={s.y - r - 5}
                width={(r + 5) * 2}
                height={(r + 5) * 2}
                fill="none"
                stroke={ALLOW}
                strokeWidth={1.4}
                rx={2}
              />
            )}
            {duplicated && (
              <>
                <rect
                  x={s.x - r - 7}
                  y={s.y - r - 7}
                  width={(r + 6) * 2}
                  height={(r + 6) * 2}
                  fill="none"
                  stroke={DENY}
                  strokeWidth={1.4}
                  rx={2}
                />
                <rect
                  x={s.x - r - 2}
                  y={s.y - r - 2}
                  width={(r + 6) * 2}
                  height={(r + 6) * 2}
                  fill="none"
                  stroke={DENY}
                  strokeWidth={1.4}
                  rx={2}
                />
              </>
            )}
            {step === 0 && !s.big && (
              <text
                x={s.x}
                y={s.y - 9}
                fill={DENY}
                fontSize={9}
                textAnchor="middle"
                fontFamily="monospace"
              >
                missed
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function ModelRow({ model, accent }: { model: ModelResult; accent: string }) {
  const scored = typeof model.map50 === "number";
  return (
    <div
      data-model={model.name}
      style={{
        padding: "9px 0",
        borderTop: "1px solid #2b3152",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span className="font-mono" style={{ fontSize: 12.5, color: INK }}>
          {model.name}
        </span>
        {model.mine && (
          <span
            className="font-mono"
            style={{
              fontSize: 10.5,
              padding: "1px 7px",
              borderRadius: 5,
              color: accent,
              background: `${accent}1f`,
              border: `1px solid ${accent}66`,
            }}
          >
            MY TRACK
          </span>
        )}
        <span className="font-mono" style={{ marginLeft: "auto", fontSize: 12.5, color: INK }}>
          {scored ? model.map50!.toFixed(2) : "not scored"}
        </span>
      </div>

      {scored && (
        <div
          style={{
            height: 7,
            borderRadius: 4,
            background: "rgba(255,255,255,0.07)",
            margin: "7px 0 5px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${model.map50! * 100}%`,
              height: "100%",
              background: model.mine ? accent : "#7984bd",
            }}
          />
        </div>
      )}

      <div className="font-mono" style={{ fontSize: 11.5, color: INK_3, lineHeight: 1.6 }}>
        {scored && typeof model.precision === "number" && (
          <span style={{ marginRight: 10 }}>
            precision {model.precision.toFixed(2)} · recall {model.recall!.toFixed(2)}
          </span>
        )}
        {model.note}
      </div>
    </div>
  );
}
