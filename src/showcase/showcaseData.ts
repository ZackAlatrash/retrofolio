import { getProject } from "../content/projects";
import type { Project } from "../content/types";

export type ShellColor = "grey" | "indigo" | "purple" | "green" | "red";

export interface ShowcaseEntry {
  id: string;
  /** Short display title for the CRT (pixel font friendly). */
  title: string;
  /** Extra-short name for the rack plaque. */
  plaque: string;
  shell: ShellColor;
  genre: string;
  headline: string;
  project: Project;
}

// The 7 projects we have cartridge art for so far, flagship-first.
const RAW: Omit<ShowcaseEntry, "project">[] = [
  { id: "omnipotence", title: "OMNIPOTENCE", plaque: "OMNIPOTENCE", shell: "purple", genre: "CODE-AWARE RAG ENGINE", headline: "7,200 LOC · deployed company-wide" },
  { id: "recomp-tracker", title: "RECOMP TRACKER", plaque: "RECOMP", shell: "green", genre: "ANDROID · AI COACH", headline: "65k LOC · 1,300 tests · beta" },
  { id: "consented-cart", title: "CONSENTED CART", plaque: "CONSENTED", shell: "red", genre: "SHOPIFY · GDPR", headline: "12.3k LOC · 16 entities" },
  { id: "lex-ai", title: "LEX-AI", plaque: "LEX-AI", shell: "indigo", genre: "RAG · NUMPY VECTOR DB", headline: "87 docs · 0.55 evidence gate" },
  { id: "tulipvision", title: "TULIPVISION", plaque: "TULIPVISION", shell: "green", genre: "YOLO · AZURE", headline: "0.86 mAP · university-adopted" },
  { id: "locked-in", title: "LOCKED IN", plaque: "LOCKED IN", shell: "grey", genre: "iOS · POLICY ENGINE", headline: "4 clean layers · pure Swift" },
  { id: "kukis", title: "KUKIS", plaque: "KUKIS", shell: "red", genre: "REACT · LIVE SITE", headline: "96-frame scroll hero · live" },
];

export const showcase: ShowcaseEntry[] = RAW.map((e) => {
  const project = getProject(e.id);
  if (!project) throw new Error(`showcase: unknown project ${e.id}`);
  return { ...e, project };
});

const base = import.meta.env.BASE_URL;
export const shellUrl = (c: ShellColor) => `${base}game/cartridges/${c}.webp`;
export const labelUrl = (id: string) => `${base}game/labels/${id}.webp`;
export const tvUrl = `${base}game/tv.webp`;
export const consoleUrl = `${base}game/console.webp`;
export const roomUrl = `${base}game/room.webp`;

/** Solid accent hex per shell colour (for the detail screen skin). */
export const shellHex: Record<ShellColor, string> = {
  grey: "#9aa0b8",
  indigo: "#7d8cc9",
  purple: "#a98fdb",
  green: "#84b98e",
  red: "#cf7d7d",
};

/** Status dot colour for the shelf. */
export function statusColor(project: Project): string {
  const s = project.status[0];
  if (s === "deployed" || s === "live") return "var(--term-green)";
  if (s === "beta") return "var(--term-amber)";
  if (s === "adopted") return "var(--term-accent)";
  return "var(--term-cite)";
}
