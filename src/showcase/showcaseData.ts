import { getProject } from "../content/projects";
import type { Project } from "../content/types";

export type ShellColor = "grey" | "indigo" | "purple" | "green" | "red";

export interface ShowcaseEntry {
  id: string;
  shell: ShellColor;
  genre: string;
  headline: string;
  project: Project;
}

// The 7 projects we have cartridge art for so far, flagship-first.
const RAW: Omit<ShowcaseEntry, "project">[] = [
  { id: "omnipotence", shell: "purple", genre: "CODE-AWARE RAG ENGINE", headline: "7,200 LOC · deployed company-wide" },
  { id: "recomp-tracker", shell: "green", genre: "ANDROID · AI COACH", headline: "65k LOC · 1,300 tests · beta" },
  { id: "consented-cart", shell: "red", genre: "SHOPIFY · GDPR", headline: "12.3k LOC · 16 entities" },
  { id: "lex-ai", shell: "indigo", genre: "RAG · NUMPY VECTOR DB", headline: "87 docs · 0.55 evidence gate" },
  { id: "tulipvision", shell: "green", genre: "YOLO · AZURE", headline: "0.86 mAP · university-adopted" },
  { id: "locked-in", shell: "grey", genre: "iOS · POLICY ENGINE", headline: "4 clean layers · pure Swift" },
  { id: "kukis", shell: "red", genre: "REACT · LIVE SITE", headline: "96-frame scroll hero · live" },
];

export const showcase: ShowcaseEntry[] = RAW.map((e) => {
  const project = getProject(e.id);
  if (!project) throw new Error(`showcase: unknown project ${e.id}`);
  return { ...e, project };
});

const base = import.meta.env.BASE_URL;
export const shellUrl = (c: ShellColor) => `${base}game/cartridges/${c}.webp`;
export const labelUrl = (id: string) => `${base}game/labels/${id}.webp`;
export const crtUrl = `${base}game/crt.webp`;
export const consoleUrl = `${base}game/console.webp`;

/** Status dot colour for the shelf. */
export function statusColor(project: Project): string {
  const s = project.status[0];
  if (s === "deployed" || s === "live") return "var(--term-green)";
  if (s === "beta") return "var(--term-amber)";
  if (s === "adopted") return "var(--term-accent)";
  return "var(--term-cite)";
}
